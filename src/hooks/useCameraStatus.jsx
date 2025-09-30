import { useState, useCallback, useEffect, useRef } from 'react'
import { useToast } from '../contexts/ToastContext'

// 카멜케이스를 스네이크케이스로 변환
const camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

// 스네이크케이스를 카멜케이스로 변환
const snakeToCamel = (str) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

// 객체의 키를 스네이크케이스로 변환
const convertKeysToSnake = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  const converted = {}
  const snakeKeys = new Set()

  // 먼저 이미 스네이크케이스인 키들을 처리
  Object.entries(obj).forEach(([key, value]) => {
    if (key.includes('_')) {
      // 이미 스네이크케이스인 키
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        converted[key] = convertKeysToSnake(value)
      } else {
        converted[key] = value
      }
      snakeKeys.add(key)
    }
  })

  // 그 다음 카멜케이스 키들을 변환 (이미 스네이크케이스로 존재하지 않는 경우만)
  Object.entries(obj).forEach(([key, value]) => {
    if (!key.includes('_')) {
      // 카멜케이스 키
      const snakeKey = camelToSnake(key)
      if (!snakeKeys.has(snakeKey)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          converted[snakeKey] = convertKeysToSnake(value)
        } else {
          converted[snakeKey] = value
        }
      }
    }
  })

  return converted
}

// 객체의 키를 카멜케이스로 변환 (수신 시 사용)
const convertKeysToCamel = (obj) => {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj
  }

  const converted = {}
  Object.entries(obj).forEach(([key, value]) => {
    const camelKey = snakeToCamel(key)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      converted[camelKey] = convertKeysToCamel(value)
    } else {
      converted[camelKey] = value
    }
  })
  return converted
}

const CAMERA_CONTROL_TOPICS = [

  // 서비스 헬스 상태

  'bmtl/status/health/+',

  // 개별 설정 응답

  'bmtl/response/settings/+',

  // 설정 변경 응답

  'bmtl/response/set/settings/+',

  // 재부팅 응답

  'bmtl/response/reboot/+',

  'bmtl/response/reboot/all',

  // 개별 옵션 응답

  'bmtl/response/options/+',

  // 전체 옵션 응답

  'bmtl/response/options/all',

  // 와이퍼 제어 응답

  'bmtl/response/wiper/+',

  // 카메라 전원 제어 응답

  'bmtl/response/camera-on-off/+',

  // 카메라 전원 상태 응답

  'bmtl/response/camera-power-status/+',

  // 사이트명 응답

  'bmtl/response/set/sitename/+',

  // SW 업데이트 응답

  'bmtl/response/sw-update/+',

  // SW 버전 응답

  'bmtl/response/sw-version/+',

  // SW 롤백 응답

  'bmtl/response/sw-rollback/+',

]



const LEGACY_OPTION_KEYS = [
  'supported_resolutions',
  'iso_range',
  'aperture_range',
  'shutterspeed_range',
  'whitebalance_options',
  'supported_formats',
]

const extractOptionsPayload = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  if (payload.options && typeof payload.options === 'object') {
    return payload.options
  }

  const nestedKeys = ['data', 'payload', 'result']
  for (const key of nestedKeys) {
    const nestedCandidate = payload[key]
    if (nestedCandidate && typeof nestedCandidate === 'object') {
      const nested = extractOptionsPayload(nestedCandidate)
      if (nested) {
        return nested
      }
    }
  }

  const hasLegacyKeys = LEGACY_OPTION_KEYS.some((key) => key in payload)
  if (hasLegacyKeys) {
    return payload
  }

  return null
}

const hasStatusDiff = (existingModule, statusData = {}) => {
  if (!existingModule) {
    return true
  }

  return Object.entries(statusData).some(
    ([key, value]) => existingModule[key] !== value
  )
}

export const useCameraStatus = (
  mqttClient,
  subscribedTopics,
  recordPublish
) => {
  const { showToast } = useToast()
  const [moduleStatuses, setModuleStatuses] = useState({})
  const [moduleSettings, setModuleSettings] = useState({})
  const [moduleOptions, setModuleOptions] = useState({})
  const [localSubscribedTopics, setLocalSubscribedTopics] = useState(new Set())
  const autoRequestedSettingsRef = useRef(new Set())
  const moduleSettingsRef = useRef({})
  const isDevelopment = import.meta.env.MODE === 'development'
  const debugLog = (...args) => {
    if (isDevelopment) {
      window.console.log(...args)
    }
  }

  // 모듈 상태 업데이트
  const updateModuleStatus = useCallback((moduleId, statusData = {}) => {
    setModuleStatuses((prev) => {
      const existingModule = prev[moduleId]
      const nextTimestamp = new Date()
      const hasChange = hasStatusDiff(existingModule, statusData)
      const baseModule = existingModule || {}

      const nextModule = hasChange
        ? { ...baseModule, ...statusData, lastUpdated: nextTimestamp }
        : { ...baseModule, lastUpdated: nextTimestamp }

      return {
        ...prev,
        [moduleId]: nextModule,
      }
    })
  }, [])

  // 모듈 설정 업데이트
  const updateModuleSettings = useCallback((moduleId, settingsData) => {
    setModuleSettings((prev) => ({
      ...prev,
      [moduleId]: settingsData,
    }))
  }, [])

  // 모듈 옵션 업데이트
  const updateModuleOptions = useCallback((moduleId, optionsData) => {
    setModuleOptions((prev) => ({
      ...prev,
      [moduleId]: optionsData,
    }))
  }, [])

  // 개별 모듈 재부팅
  const sendRebootCommand = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/request/reboot/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to send reboot command to module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `🔄 [MQTT Publish] Reboot command sent to module ${moduleId}`
          )
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // 개별 모듈 설정 변경
  const sendConfigureCommand = useCallback(
    (moduleId, settings) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/set/settings/${moduleId.toString().padStart(2, '0')}`
      // 설정을 스네이크케이스로 변환
      const snakeSettings = convertKeysToSnake(settings)
      const payload = JSON.stringify(snakeSettings)

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to send configure command to module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `🔧 [MQTT Publish] Configure command sent to module ${moduleId}`
          )
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // 전체 재부팅
  const sendGlobalRebootCommand = useCallback(() => {
    if (!mqttClient?.connected) return

    const topic = 'bmtl/request/reboot/all'
    const payload = JSON.stringify({})

    mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
      if (err) {
        console.error(
          '❌[MQTT Publish] Failed to send global reboot command:',
          err
        )
      } else {
        debugLog('🔄 [MQTT Publish] Global reboot command sent')
        debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
        debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
        if (recordPublish) {
          recordPublish(topic, payload, 2)
        }
      }
    })
  }, [mqttClient])

  // 전체 설정 불러오기
  const requestAllSettings = useCallback(() => {
    if (!mqttClient?.connected) return

    const topic = 'bmtl/request/settings/all'
    const payload = JSON.stringify({})

    mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
      if (err) {
        console.error('Failed to request all settings:', err)
      } else {
        debugLog('All settings request sent', topic, payload)
        if (recordPublish) {
          recordPublish(topic, payload, 2)
        }
      }
    })
  }, [mqttClient])

  // 개별 모듈 옵션 요청
  const requestOptions = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/request/options/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `Failed to request options for module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `Options request sent for module ${moduleId}`,
            topic,
            payload
          )
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // 전체 모듈 옵션 요청
  const requestAllOptions = useCallback(() => {
    if (!mqttClient?.connected) return

    const topic = 'bmtl/request/options/all'
    const payload = JSON.stringify({})

    mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
      if (err) {
        console.error('Failed to request all options:', err)
      } else {
        debugLog('All options request sent', topic, payload)
        if (recordPublish) {
          recordPublish(topic, payload, 2)
        }
      }
    })
  }, [mqttClient])

  // 와이퍼 30초 동작 명령
  const sendWiperCommand = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/request/wiper/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to send wiper command to module ${moduleId}:`,
            err
          )
        } else {
          debugLog(`🧽 [MQTT Publish] Wiper command sent to module ${moduleId}`)
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // 카메라 전원 On/Off 명령
  const sendCameraPowerCommand = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/request/camera-on-off/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to send camera power command to module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `📷 [MQTT Publish] Camera power command sent to module ${moduleId}`
          )
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // 사이트명 변경 명령
  const sendSiteNameCommand = useCallback(
    (moduleId, siteName) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/set/sitename/${moduleId.toString().padStart(2, '0')}`
      // 사이트명 데이터를 스네이크케이스로 변환
      const snakeData = convertKeysToSnake({ siteName: siteName })
      const payload = JSON.stringify(snakeData)

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to send sitename command to module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `🏷️ [MQTT Publish] Sitename command sent to module ${moduleId}`
          )
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // SW 업데이트 명령
  const sendSwUpdateCommand = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/sw-update/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to send SW update command to module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `💾 [MQTT Publish] SW update command sent to module ${moduleId}`
          )
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // SW 롤백 명령
  const sendSwRollbackCommand = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/sw-rollback/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to send SW rollback command to module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `⏪ [MQTT Publish] SW rollback command sent to module ${moduleId}`
          )
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // SW 버전 요청 명령
  const sendSwVersionRequest = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/request/sw-version/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to send SW version request to module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `🔢 [MQTT Publish] SW version request sent to module ${moduleId}`
          )
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // 카메라 전원 상태 확인 요청
  const sendCameraPowerStatusRequest = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/request/camera-power-status/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to send camera power status request to module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `🔋 [MQTT Publish] Camera power status request sent to module ${moduleId}`
          )
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // 개별 모듈 상태 요청
  const requestStatus = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/request/status/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `❌[MQTT Publish] Failed to request status from module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `📊 [MQTT Publish] Status request sent to module ${moduleId}`
          )
          debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
          debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // 전체 모듈 상태 요청
  const requestAllStatus = useCallback(() => {
    if (!mqttClient?.connected) return

    const topic = 'bmtl/request/status/all'
    const payload = JSON.stringify({})

    mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
      if (err) {
        console.error(
          '❌[MQTT Publish] Failed to request status from all modules:',
          err
        )
      } else {
        debugLog('📊 [MQTT Publish] Status request sent to all modules')
        debugLog(`📡 [MQTT Publish] Topic: ${topic}`)
        debugLog(`📦 [MQTT Publish] Payload: ${payload}`)
        if (recordPublish) {
          recordPublish(topic, payload, 2)
        }
      }
    })
  }, [mqttClient])

  // 개별 모듈 설정 요청
  const requestSettings = useCallback(
    (moduleId) => {
      if (!mqttClient?.connected) return

      const topic = `bmtl/request/settings/${moduleId.toString().padStart(2, '0')}`
      const payload = JSON.stringify({})

      mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
        if (err) {
          console.error(
            `Failed to request settings for module ${moduleId}:`,
            err
          )
        } else {
          debugLog(
            `Settings request sent for module ${moduleId}`,
            topic,
            payload
          )
          if (recordPublish) {
            recordPublish(topic, payload, 2)
          }
        }
      })
    },
    [mqttClient]
  )

  // 통합 명령 전송 함수 (기존 호환성)
  const sendCommand = useCallback(
    (moduleId, command, data) => {
      if (moduleId === 'global') {
        // 전체 시스템 명령 처리
        switch (command) {
          case 'reboot':
            sendGlobalRebootCommand()
            break
          case 'status_request':
            requestAllStatus()
            break
          case 'status_request_all':
            requestAllStatus()
            break
          case 'options_request':
            requestAllOptions()
            break
          default:
            console.warn(`Unknown global command: ${command}`)
        }
      } else {
        // 개별 모듈 명령 처리
        switch (command) {
          case 'reboot':
            sendRebootCommand(moduleId)
            break
          case 'configure':
            sendConfigureCommand(moduleId, data)
            break
          case 'status_request':
            requestStatus(moduleId)
            break
          case 'status_request_single':
            requestStatus(moduleId)
            break
          case 'options_request':
            requestOptions(moduleId)
            break
          case 'wiper':
            sendWiperCommand(moduleId)
            break
          case 'camera-on-off':
            sendCameraPowerCommand(moduleId)
            break
          case 'sitename':
            sendSiteNameCommand(moduleId, data.sitename)
            break
          case 'sw-update':
            sendSwUpdateCommand(moduleId)
            break
          case 'sw-rollback':
            sendSwRollbackCommand(moduleId)
            break
          case 'sw-version':
            sendSwVersionRequest(moduleId)
            break
          case 'camera-power-status':
            sendCameraPowerStatusRequest(moduleId)
            break
          default:
            console.warn(`Unknown command: ${command}`)
        }
      }
    },
    [
      sendRebootCommand,
      sendConfigureCommand,
      sendGlobalRebootCommand,
      requestAllSettings,
      requestAllOptions,
      requestSettings,
      requestOptions,
      sendWiperCommand,
      sendCameraPowerCommand,
      sendSiteNameCommand,
      sendSwUpdateCommand,
      sendSwRollbackCommand,
      sendSwVersionRequest,
      sendCameraPowerStatusRequest,
      requestStatus,
      requestAllStatus,
    ]
  )

  // 개별 모듈 설정 요청
  // MQTT 구독 설정은 connect 이벤트에서 처리

  // 메시지 처리
  useEffect(() => {
    if (!mqttClient) return

    const handleMessage = (topic, message) => {
      try {
        const data = JSON.parse(message.toString())
        // 개발 모드에서만 상세 로그 출력
        if (import.meta.env.MODE === 'development') {
          debugLog(`📨 [MQTT Message] Topic: ${topic}`, data)
        }

        // 토픽 파싱
        const topicParts = topic.split('/')

        if (topic.startsWith('bmtl/status/health/')) {
          // 헬스 상태 처리 (메시지를 받으면 온라인으로 간주)
          const moduleIdStr = topicParts[3]
          const moduleId = parseInt(moduleIdStr, 10)
          // 수신된 데이터를 카멜케이스로 변환
          const camelData = convertKeysToCamel(data)

          if (import.meta.env.MODE === 'development') {
            debugLog(
              `💚 [Health Update] Module ${moduleId} - Online, Site: ${camelData.siteName || data.site_name}`
            )
          }

          updateModuleStatus(moduleId, {
            isConnected: true, // 메시지를 받으면 온라인으로 처리
            siteName: camelData.siteName || data.site_name,
            storageUsed: camelData.storageUsed || data.storage_used,
            temperature: camelData.temperature || data.temperature,
            lastCaptureTime: camelData.lastCaptureTime || data.last_capture_time,
            lastBootTime: camelData.lastBootTime || data.last_boot_time,
            todayTotalCaptures: camelData.todayTotalCaptures || data.today_total_captures,
            todayCapturedCount: camelData.todayCapturedCount || data.today_captured_count,
            missedCaptures: camelData.missedCaptures || data.missed_captures,
            swVersion: camelData.version || camelData.swVersion || data.version || data.sw_version || data.swVersion,
          })

          // Health 수신 시, 이번 브로커 연결 동안 아직 설정을 받아오지 않았다면 1회 자동 요청
          try {
            const alreadyRequested = autoRequestedSettingsRef.current.has(moduleId)
            const hasSettings = Boolean(moduleSettingsRef.current[moduleId])
            if (!alreadyRequested && !hasSettings && mqttClient?.connected) {
              const mm = moduleId.toString().padStart(2, '0')
              const requestTopic = `bmtl/request/settings/${mm}`
              const requestPayload = JSON.stringify({})
              mqttClient.publish(requestTopic, requestPayload, { qos: 2 }, (err) => {
                if (!err) {
                  autoRequestedSettingsRef.current.add(moduleId)
                  debugLog('🔄 [Auto Settings Request] Sent for module', mm)
                  if (recordPublish) {
                    recordPublish(requestTopic, requestPayload, 2)
                  }
                }
              })
            }
          } catch {}
        } else if (topic.startsWith('bmtl/response/settings/')) {
          // 설정 응답 처리
          if (false && topicParts[3] === 'all') {
            // 전체 설정 응답
            debugLog(`⚙️ [Settings] All modules settings received`)
            if (data.response_type === 'all_settings') {
              let loadedCount = 0
              Object.entries(data.modules).forEach(([moduleKey, moduleData]) => {
                const moduleId = parseInt(moduleKey.replace('bmotion', ''), 10)
                // 설정 데이터를 카멜케이스로 변환
                const camelModuleData = convertKeysToCamel(moduleData)
                const settings = camelModuleData.settings || camelModuleData
                debugLog(`⚙️ [Settings] Module ${moduleId} settings:`, settings)
                updateModuleSettings(moduleId, settings)
                loadedCount++

                // 카메라 옵션이 함께 오는 경우 처리
                const cameraOptions = camelModuleData.cameraOptions || moduleData.camera_options
                if (cameraOptions) {
                  debugLog(`📋 [Options] Module ${moduleId} camera options from all settings response:`, cameraOptions)
                  updateModuleOptions(moduleId, cameraOptions)
                }
              })

              // 전체 설정 불러오기 성공 토스트
              if (loadedCount > 0) {
                showToast(`전체 모듈 설정을 불러왔습니다 (${loadedCount}개)`, { type: 'success', duration: 2000 })
              }
            }
          } else {
            // 개별 설정 응답
            const moduleIdStr = topicParts[3]
            const moduleId = parseInt(moduleIdStr, 10)
            debugLog(
              `⚙️ [Settings] Module ${moduleId} individual settings received`
            )

            if (data.response_type === 'settings') {
              // 설정 데이터를 카멜케이스로 변환
              const camelData = convertKeysToCamel(data)
              const rawSettings = camelData.settings || data.settings || {}
              const snakeSettings = convertKeysToSnake(rawSettings)
              updateModuleSettings(moduleId, snakeSettings)

              // 개별 설정 불러오기 성공 토스트
              const mm = moduleId.toString().padStart(2, '0')
              showToast(`모듈 ${mm} 설정을 불러왔습니다`, { type: 'success', duration: 2000 })

              // 카메라 옵션이 함께 오는 경우 처리
              const cameraOptions = camelData.cameraOptions || data.camera_options
              if (cameraOptions) {
                debugLog(`📋 [Options] Module ${moduleId} camera options from settings response:`, cameraOptions)
                updateModuleOptions(moduleId, cameraOptions)
              }
            }
          }
        } else if (topic.startsWith('bmtl/response/set/settings/')) {
          // 설정 변경 응답 처리
          const moduleIdStr = topicParts[4]
          const moduleId = parseInt(moduleIdStr, 10)

          debugLog(
            `🔧 [Config Response] Module ${moduleId}:`,
            data.success ? '✅Success' : '❌Failed'
          )
          // 설정 변경 결과 토스트 표시
          try {
            if (data && typeof data.success !== 'undefined') {
              if (data.success) {
                const mm = moduleId.toString().padStart(2, '0')
                showToast(`모듈 ${mm} 설정이 적용되었습니다`, { type: 'success', duration: 3000 })
              } else {
                const reason = data && data.message ? `: ${data.message}` : ''
                showToast(`설정 적용 실패${reason}`, { type: 'error', duration: 4000 })
              }
            }
          } catch (error) {
            console.error('Error showing toast:', error)
          }
        } else if (topic.startsWith('bmtl/response/reboot/')) {
          // 재부팅 응답 처리
          const moduleIdStr = topicParts[3]

          if (moduleIdStr === 'all') {
            debugLog(
              `🔄 [Global Reboot Response]:`,
              data.success ? '✅Success' : '❌Failed'
            )
          } else {
            const moduleId = parseInt(moduleIdStr, 10)
            debugLog(
              `🔄 [Reboot Response] Module ${moduleId}:`,
              data.success ? '✅Success' : '❌Failed'
            )
          }
        } else if (topic.startsWith('bmtl/response/options/')) {
          const moduleIdStr = topicParts[3]

          if (moduleIdStr === 'all') {
            debugLog(`📋 [Options] All modules options received`)

            const modulesPayload =
              (data.response_type === 'all_options' && data.modules && typeof data.modules === 'object' && data.modules) ||
              (data.modules && typeof data.modules === 'object' && data.modules) ||
              null

            if (modulesPayload) {
              Object.entries(modulesPayload).forEach(([moduleKey, rawOptions]) => {
                const moduleId = parseInt(String(moduleKey).replace('bmotion', ''), 10)
                if (Number.isNaN(moduleId)) {
                  debugLog(`📋 [Options] Skipping unrecognized module key`, moduleKey)
                  return
                }

                const optionsPayload = extractOptionsPayload(rawOptions) || rawOptions
                debugLog(`📋 [Options] Module ${moduleId} options:`, optionsPayload)
                updateModuleOptions(moduleId, optionsPayload)
              })
            } else {
              debugLog('📋 [Options] Unable to parse all-modules payload', data)
            }
          } else {
            const moduleId = parseInt(moduleIdStr, 10)
            const optionsPayload = extractOptionsPayload(data)

            debugLog(
              `📋 [Options] Module ${moduleId} options received:`,
              optionsPayload || data
            )

            if (optionsPayload) {
              updateModuleOptions(moduleId, optionsPayload)
            } else if (data.options && typeof data.options === 'object') {
              updateModuleOptions(moduleId, data.options)
            }
          }
        } else if (topic.startsWith('bmtl/response/wiper/')) {
          // 와이퍼 응답 처리
          const moduleIdStr = topicParts[3]
          const moduleId = parseInt(moduleIdStr, 10)
          debugLog(
            `🧽 [Wiper Response] Module ${moduleId}:`,
            data.success ? '✅Success' : '❌Failed'
          )
        } else if (topic.startsWith('bmtl/response/camera-on-off/')) {
          // 카메라 전원 응답 처리
          const moduleIdStr = topicParts[3]
          const moduleId = parseInt(moduleIdStr, 10)
          debugLog(
            `📷 [Camera Power Response] Module ${moduleId}:`,
            data.success ? '✅Success' : '❌Failed',
            `New state: ${data.new_state || 'Unknown'}`
          )
        } else if (topic.startsWith('bmtl/response/camera-power-status/')) {
          // 카메라 전원 상태 확인 응답 처리
          const moduleIdStr = topicParts[3]
          const moduleId = parseInt(moduleIdStr, 10)
          debugLog(
            `🔋 [Camera Power Status Response] Module ${moduleId}:`,
            data.success ? '✅Success' : '❌Failed',
            `Status: ${data.power_status || 'Unknown'}`
          )

          const camelData = convertKeysToCamel(data)
          const powerStatus = camelData.powerStatus || data.power_status

          if (data.success && powerStatus) {
            setModuleStatuses((prev) => ({
              ...prev,
              [moduleId]: {
                ...prev[moduleId],
                cameraPowerStatus: powerStatus, // 'on', 'off', 'error'
              },
            }))
          }
        } else if (topic.startsWith('bmtl/response/set/sitename/')) {
          // 사이트명 변경 응답 처리
          const moduleIdStr = topicParts[4]
          const moduleId = parseInt(moduleIdStr, 10)
          debugLog(
            `🏷️ [Sitename Response] Module ${moduleId}:`,
            data.success ? '✅Success' : '❌Failed',
            `New sitename: ${data.site_name || 'Unknown'}`
          )

          // 해당 모듈 상태 업데이트
          const camelData = convertKeysToCamel(data)
          const siteName = camelData.siteName || data.site_name
          if (data.success && siteName) {
            updateModuleStatus(moduleId, {
              siteName: siteName,
            })
          }
        } else if (topic.startsWith('bmtl/response/sw-update/')) {
          // SW 업데이트 응답 처리 (로그만 출력, 버전 업데이트는 sw-version 토픽에서 처리)
          const moduleIdStr = topicParts[3]
          const moduleId = parseInt(moduleIdStr, 10)
          debugLog(
            `💾 [SW Update Response] Module ${moduleId}:`,
            data.success ? '✅Success' : '❌Failed'
          )
        } else if (topic.startsWith('bmtl/response/sw-version/')) {
          // SW 버전 응답 처리
          const moduleIdStr = topicParts[3]
          const moduleId = parseInt(moduleIdStr, 10)

          // 수신 데이터를 카멜케이스로 변환
          const camelData = convertKeysToCamel(data)

          // 여러 가능한 필드명 확인
          const version =
            camelData.version ||
            camelData.commitHash ||
            camelData.swVersion ||
            data.version ||
            data.commit_hash ||
            data.swVersion ||
            data.sw_version
          debugLog(
            `🔢 [SW Version Response] Module ${moduleId}:`,
            `Version: ${version || 'Unknown'}`,
            'Raw data:',
            data
          )

          // SW 버전 정보 업데이트
          if (version) {
            updateModuleStatus(moduleId, {
              swVersion: version,
            })
          } else {
            console.warn(
              `⚠️ [SW Version] No version field found for module ${moduleId}:`,
              data
            )
          }
        } else if (topic.startsWith('bmtl/response/sw-rollback/')) {
          // SW 롤백 응답 처리
          const moduleIdStr = topicParts[3]
          const moduleId = parseInt(moduleIdStr, 10)
          debugLog(
            `⏪ [SW Rollback Response] Module ${moduleId}:`,
            data.success ? '✅Success' : '❌Failed',
            `Message: ${data.message || 'No message'}`
          )
        } else {
          debugLog(`❓[Unknown Topic] Unhandled topic: ${topic}`)
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error, 'Topic:', topic)
      }
    }

    const handleConnect = () => {
      debugLog('🔗 [MQTT Client] Connected to broker')

      // 카메라 제어 토픽 구독

      debugLog(
        `📡 [MQTT Subscribe] Subscribing to ${CAMERA_CONTROL_TOPICS.length} topics for camera control:`
      )
      CAMERA_CONTROL_TOPICS.forEach((topic, index) => {
        mqttClient.subscribe(topic, (err) => {
          if (!err) {
            setLocalSubscribedTopics((prev) => new Set([...prev, topic]))
            debugLog(
              `✅[MQTT Subscribe] ${index + 1}/${CAMERA_CONTROL_TOPICS.length} - ${topic}`
            )
          } else {
            console.error(
              `❌[MQTT Subscribe] Failed to subscribe to ${topic}:`,
              err
            )
          }
        })
      })
    }

    const handleDisconnect = () => {
      debugLog('🔌 [MQTT Client] Disconnected from broker')
      // 카메라 제어 구독 상태 초기화
      setLocalSubscribedTopics(new Set())
    }

    const handleReconnect = () => {
      debugLog('🔄 [MQTT Client] Reconnecting to broker')
    }

    const handleError = (error) => {
      console.error('❌[MQTT Client] Error:', error)
    }

    const handleOffline = () => {
      debugLog('📴 [MQTT Client] Gone offline')
    }

    const handleClose = () => {
      debugLog('🚪 [MQTT Client] Connection closed')
    }

    mqttClient.on('message', handleMessage)
    mqttClient.on('connect', handleConnect)
    mqttClient.on('disconnect', handleDisconnect)
    mqttClient.on('reconnect', handleReconnect)
    mqttClient.on('error', handleError)
    mqttClient.on('offline', handleOffline)
    mqttClient.on('close', handleClose)

    return () => {
      mqttClient.off('message', handleMessage)
      mqttClient.off('connect', handleConnect)
      mqttClient.off('disconnect', handleDisconnect)
      mqttClient.off('reconnect', handleReconnect)
      mqttClient.off('error', handleError)
      mqttClient.off('offline', handleOffline)
      mqttClient.off('close', handleClose)
    }
  }, [mqttClient, updateModuleStatus, updateModuleSettings])

  // 모듈 카메라 상태 체크 및 구독 상태 로깅 (5분간 응답 없으면 오프라인 처리)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()

      // 개발 모드에서만 상태 로깅
      if (import.meta.env.MODE === 'development') {
        debugLog(
          `📊 [MQTT Status] Subscribed topics: ${localSubscribedTopics.size}`
        )
      }

      setModuleStatuses((prev) => {
        const updated = {}
        let hasChanges = false

        Object.keys(prev).forEach((moduleId) => {
          const module = prev[moduleId]
          const lastUpdated = module.lastUpdated

          if (
            lastUpdated &&
            now - lastUpdated > 5 * 60 * 1000 &&
            module.isConnected !== false
          ) {
            updated[moduleId] = { ...module, isConnected: false }
            hasChanges = true
          } else {
            updated[moduleId] = module
          }
        })

        return hasChanges ? updated : prev
      })
    }, 30000) // 30초마다 체크

    return () => clearInterval(interval)
  }, [localSubscribedTopics]) // moduleStatuses 의존성 제거

  // 브로커 연결 시 자동 설정 자동요청 플래그 초기화
  useEffect(() => {
    if (!mqttClient) return
    const onConnectClear = () => {
      try { autoRequestedSettingsRef.current.clear() } catch {}
    }
    mqttClient.on('connect', onConnectClear)
    return () => {
      mqttClient.off('connect', onConnectClear)
    }
  }, [mqttClient])

  // 최신 moduleSettings를 ref에 동기화하여 메시지 핸들러에서 참조
  useEffect(() => {
    moduleSettingsRef.current = moduleSettings || {}
  }, [moduleSettings])

  return {
    moduleStatuses,
    moduleSettings,
    moduleOptions,
    sendCommand,
    requestSettings,
    requestOptions,
    requestAllOptions,
  }
}
