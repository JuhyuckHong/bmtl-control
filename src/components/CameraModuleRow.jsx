import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { SiteNameModal } from './SiteNameModal'

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) =>
  hour.toString().padStart(2, '0')
)
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) =>
  minute.toString().padStart(2, '0')
)
const INTERVAL_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  (index + 1).toString().padStart(2, '0')
)
const DEFAULT_SETTINGS = {
  start_time: '08:00',
  end_time: '18:00',
  capture_interval: '10',
  image_size: '1920x1080',
  quality: '보통',
  iso: '400',
  format: 'JPG',
  aperture: 'f/2.8',
}

const CAMERA_OPTION_ORDER = ['resolution', 'iso', 'aperture', 'image_quality', 'focus_mode']

const CAMERA_OPTION_LABELS = {
  'Image Size': '크기',
  'ISO Speed': 'ISO',
  'Exposure Compensation': '노출',
  'Image Quality': '품질',
  'Focus Mode 2': '초점',
}

const extractOptionValues = (options = {}) => {
  const values = {}

  Object.entries(options || {}).forEach(([key, option]) => {
    if (!option || typeof option !== 'object') {
      return
    }

    if (typeof option.current === 'undefined') {
      return
    }

    const rawCurrent = option.current
    let currentValue

    if (rawCurrent !== null && typeof rawCurrent === 'object') {
      if (Object.prototype.hasOwnProperty.call(rawCurrent, 'value')) {
        currentValue = String(rawCurrent.value)
      } else if (Object.prototype.hasOwnProperty.call(rawCurrent, 'label')) {
        currentValue = String(rawCurrent.label)
      } else {
        currentValue = JSON.stringify(rawCurrent)
      }
    } else {
      currentValue = String(rawCurrent)
    }

    values[key] = currentValue

    if (key === 'resolution') {
      values.image_size = currentValue
    } else if (key === 'image_quality') {
      values.quality = currentValue
    }
  })

  return values
}

/**
 * Camera Module Row Component
 * @param {Object} props - Component props
 * @param {number} props.moduleId - Module ID number
 * @param {string} props.moduleDisplayId - Formatted module identifier for UI
 * @param {Object} props.status - Module status object
 * @param {Function} props.onCommand - Command handler function
 * @param {Function} props.onLoadSettings - Load settings handler function
 * @param {boolean} props.isDummy - Whether this is a dummy module
 * @param {Object} props.initialSettings - Initial settings object
 */

const areSettingsEqual = (a = {}, b = {}) => {
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)

  if (aKeys.length !== bKeys.length) {
    return false
  }

  return aKeys.every((key) => a[key] === b[key])
}

const CameraModuleRowComponent = ({
  moduleId,
  moduleDisplayId,
  status,
  onCommand,
  onLoadSettings,
  isDummy,
  initialSettings,
  availableOptions,
}) => {
  const [settings, setSettings] = useState(initialSettings || DEFAULT_SETTINGS)
  useEffect(() => {
    const baseSettings = initialSettings || DEFAULT_SETTINGS
    const optionDefaults = extractOptionValues(availableOptions)
    const nextSettings = {
      ...DEFAULT_SETTINGS,
      ...baseSettings,
      ...optionDefaults,
    }

    setSettings((prev) => {
      // 이미 설정이 있고 사용자가 변경했을 가능성이 있다면, 기존 값을 유지
      if (prev && Object.keys(prev).length > 0) {
        // 운영 시간 설정은 사용자가 변경했을 수 있으므로 기존 값 유지
        const preservedUserSettings = {
          start_time: prev.start_time,
          end_time: prev.end_time,
          capture_interval: prev.capture_interval,
        }

        // 새로운 옵션만 추가하고, 기존 설정은 유지
        return {
          ...nextSettings,
          ...preservedUserSettings,
        }
      }

      return areSettingsEqual(prev, nextSettings) ? prev : nextSettings
    })
  }, [initialSettings, availableOptions])

  const cameraOptionList = useMemo(() => {
    if (!availableOptions) {
      return []
    }

    const normalizeChoice = (choice) => {
      if (choice === null || typeof choice === 'undefined') {
        return ''
      }

      if (typeof choice === 'object') {
        if (Object.prototype.hasOwnProperty.call(choice, 'value')) {
          return String(choice.value)
        }
        if (Object.prototype.hasOwnProperty.call(choice, 'label')) {
          return String(choice.label)
        }
        return JSON.stringify(choice)
      }

      return String(choice)
    }

    const pickChoices = (option) => {
      if (!option) {
        return []
      }

      if (Array.isArray(option)) {
        return option
      }

      const candidates = [option.choices, option.values, option.options]

      for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
          return candidate
        }
        if (candidate && typeof candidate === 'object') {
          return Object.values(candidate)
        }
      }

      return []
    }

    return Object.entries(availableOptions)
      .map(([key, option]) => {
        if (!option || typeof option !== 'object') {
          return null
        }

        const rawChoices = pickChoices(option)
        const choices = Array.from(
          new Set(
            rawChoices
              .map((choice) => normalizeChoice(choice))
              .filter((value) => value && value.length > 0)
          )
        )

        const rawCurrent = option.current
        const currentValue =
          typeof rawCurrent === 'undefined'
            ? undefined
            : normalizeChoice(rawCurrent)

        if (currentValue && !choices.includes(currentValue)) {
          choices.unshift(currentValue)
        }

        const originalLabel =
          typeof option.label === 'string' && option.label.trim().length > 0
            ? option.label.trim()
            : key
        const label = CAMERA_OPTION_LABELS[originalLabel] || originalLabel
        const type =
          typeof option.type === 'string'
            ? option.type.trim().toLowerCase()
            : 'menu'
        const readOnly =
          typeof option.readOnly === 'boolean'
            ? option.readOnly
            : Boolean(option.read_only)

        return {
          key,
          label,
          type,
          readOnly,
          choices,
          current: currentValue,
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        const indexA = CAMERA_OPTION_ORDER.indexOf(a.key)
        const indexB = CAMERA_OPTION_ORDER.indexOf(b.key)
        const safeA = indexA === -1 ? CAMERA_OPTION_ORDER.length : indexA
        const safeB = indexB === -1 ? CAMERA_OPTION_ORDER.length : indexB

        if (safeA === safeB) {
          return a.label.localeCompare(b.label)
        }

        return safeA - safeB
      })
  }, [availableOptions])

  const [isSiteNameModalOpen, setIsSiteNameModalOpen] = useState(false)
  const handleSettingChange = useCallback((key, value) => {
    setSettings((prev) => {
      const next = {
        ...prev,
        [key]: value,
      }

      if (key === 'resolution') {
        next.image_size = value
      } else if (key === 'image_quality') {
        next.quality = value
      }

      return next
    })
  }, [])

  const handleTimeChange = useCallback((timeKey, component, value) => {
    setSettings((prev) => {
      const currentTime = prev[timeKey] || '08:00'
      const [currentHour, currentMinute] = currentTime.split(':')

      const newHour = component === 'hour' ? value : currentHour
      const newMinute = component === 'minute' ? value : currentMinute

      return {
        ...prev,
        [timeKey]: `${newHour}:${newMinute}`,
      }
    })
  }, [])

  const handleReboot = useCallback(() => {
    onCommand(moduleId, 'reboot', {})
  }, [onCommand, moduleId])

  const handleWiper = useCallback(() => {
    onCommand(moduleId, 'wiper', {})
  }, [onCommand, moduleId])

  const handleCameraPower = useCallback(() => {
    onCommand(moduleId, 'camera-on-off', {})
  }, [onCommand, moduleId])

  const handleCameraPowerStatus = useCallback(() => {
    onCommand(moduleId, 'camera-power-status', {})
  }, [onCommand, moduleId])

  const handleApplySettings = useCallback(() => {
    console.log(`🔧 [Apply Settings] Module ${moduleId} - Sending settings:`, settings)
    onCommand(moduleId, 'configure', settings)
  }, [onCommand, moduleId, settings])

  // 개발 환경에서는 연결 상태와 무관하게 제어 가능하도록 유지
  const isEnabled = status?.isConnected || isDummy

  const handleLoadSettings = useCallback(() => {
    onLoadSettings(moduleId)
  }, [onLoadSettings, moduleId])


  const handleSiteNameChange = useCallback(() => {
    setIsSiteNameModalOpen(true)
  }, [])

  const handleSiteNameSubmit = useCallback(
    (newSiteName) => {
      onCommand(moduleId, 'sitename', { sitename: newSiteName })
      setIsSiteNameModalOpen(false)
    },
    [onCommand, moduleId]
  )

  const handleSwUpdate = useCallback(() => {
    onCommand(moduleId, 'sw-update', {})
  }, [onCommand, moduleId])

  const handleSwRollback = useCallback(() => {
    onCommand(moduleId, 'sw-rollback', {})
  }, [onCommand, moduleId])

  const handleSwVersionRequest = useCallback(() => {
    onCommand(moduleId, 'sw-version', {})
  }, [onCommand, moduleId])

  const getStatusClass = useCallback((isConnected) => {
    if (isConnected === null || isConnected === undefined) {
      return 'status-unknown'
    }
    return isConnected ? 'status-online' : 'status-offline'
  }, [])

  const formatDateTime = useCallback((timestamp) => {
    if (!timestamp) {
      return '없음'
    }

    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) {
      return '없음'
    }

    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    const second = date.getSeconds().toString().padStart(2, '0')

    return `${year}/${month}/${day} ${hour}:${minute}:${second}`
  }, [])

  const captureProgress = useMemo(() => {
    const totalToday = Number(status?.todayTotalCaptures) || 0
    const captured = Number(status?.todayCapturedCount) || 0
    return `${captured}/${totalToday}`
  }, [status?.todayTotalCaptures, status?.todayCapturedCount])

  const missedCaptures = useMemo(() => {
    const missed = Number(status?.missedCaptures)
    return Number.isNaN(missed) ? 0 : missed
  }, [status?.missedCaptures])

  const storageInfo = useMemo(() => {
    const usage = Number(status?.storageUsed)
    if (Number.isNaN(usage)) {
      return { percentage: 0, display: '--', isWarning: false }
    }

    // Check if the value is likely in MB (> 100) or percentage (≤ 100)
    if (usage > 100) {
      // Assume it's in MB, display as MB
      return {
        percentage: 0, // Can't calculate percentage without total capacity
        display: `${usage.toFixed(1)}MB`,
        isWarning: usage >= 8000, // Warning if > 8GB
      }
    } else {
      // Assume it's already in percentage
      const clamped = Math.max(0, Math.min(usage, 100))
      return {
        percentage: clamped,
        display: `${clamped.toFixed(1)}%`,
        isWarning: clamped >= 80,
      }
    }
  }, [status?.storageUsed])

  const temperatureInfo = useMemo(() => {
    const value = Number(status?.temperature)
    if (Number.isNaN(value)) {
      return { display: '없음', isWarning: false }
    }

    return {
      display: `${value.toFixed(1)}°C`,
      isWarning: value >= 50,
    }
  }, [status?.temperature])

  return (
    <div
      className={`camera-module-row ${status?.isConnected === false ? 'disconnected' : ''}`}
    >
      <span className='module-id'>
        {moduleDisplayId || moduleId.toString().padStart(2, '0')}
      </span>
      <div
        className={`status-dot ${getStatusClass(status?.isConnected)}`}
      ></div>
      <span
        className='site-name clickable'
        title={`현장 이름 ${status?.siteName || '미지정'} (클릭하여 수정)`}
        onClick={handleSiteNameChange}
      >
        {status?.siteName || '미지정'}
      </span>
      <div className='capacity-container'>
        <div
          className={`capacity-donut ${storageInfo.isWarning ? 'warning' : ''}`}
        >
          <svg
            width='50'
            height='50'
            viewBox='0 0 50 50'
            className='donut-chart'
          >
            <defs>
              <linearGradient
                id={`storageGradient-${moduleId}`}
                x1='0%'
                y1='0%'
                x2='0%'
                y2='100%'
                gradientUnits='objectBoundingBox'
              >
                <stop offset='0%' stopColor='#22c55e' />
                <stop offset='50%' stopColor='#eab308' />
                <stop offset='100%' stopColor='#ef4444' />
              </linearGradient>
            </defs>
            {/* 전체 원 아웃라인 */}
            <circle
              cx='25'
              cy='25'
              r='22'
              fill='transparent'
              stroke='var(--border-strong)'
              strokeWidth='1'
            />
            {/* 배경 원 */}
            <circle
              cx='25'
              cy='25'
              r='18'
              fill='transparent'
              stroke='var(--border)'
              strokeWidth='8'
            />
            {/* 진행률 원 - 10단계 색상 그라디언트 */}
            <circle
              cx='25'
              cy='25'
              r='18'
              fill='transparent'
              stroke={
                storageInfo.percentage <= 10
                  ? '#16a34a'
                  : storageInfo.percentage <= 20
                    ? '#22c55e'
                    : storageInfo.percentage <= 30
                      ? '#65a30d'
                      : storageInfo.percentage <= 40
                        ? '#84cc16'
                        : storageInfo.percentage <= 50
                          ? '#ca8a04'
                          : storageInfo.percentage <= 60
                            ? '#eab308'
                            : storageInfo.percentage <= 70
                              ? '#f59e0b'
                              : storageInfo.percentage <= 80
                                ? '#f97316'
                                : storageInfo.percentage <= 90
                                  ? '#ea580c'
                                  : '#ef4444'
              }
              strokeWidth='8'
              strokeDasharray={`${Math.min(storageInfo.percentage, 100) * 1.131} ${113.1 - Math.min(storageInfo.percentage, 100) * 1.131}`}
              strokeDashoffset='0'
              transform='rotate(-90 25 25)'
            />
          </svg>
          <span className='donut-text'>
            {Math.round(storageInfo.percentage)}%
          </span>
        </div>
      </div>
      <div className='device-status-stack'>
        <div className='capture-info-item'>
          <span className='info-label'>온도</span>
          <span
            className={`temperature ${temperatureInfo.isWarning ? 'warning' : ''}`}
          >
            {temperatureInfo.display}
          </span>
        </div>
        <div className='capture-info-item'>
          <span className='info-label'>
            마지막
            <br />
            부팅
          </span>
          <span className='last-boot-time'>
            {formatDateTime(status?.lastBootTime)}
          </span>
        </div>
      </div>
      <div className='capture-info-stack'>
        <div className='capture-info-item camera-status-item'>
          <span className='info-label'>카메라 상태</span>
          <button
            className={`btn camera-status-button ${status?.cameraPowerStatus || 'unknown'}`}
            onClick={handleCameraPowerStatus}
            disabled={!isEnabled || status?.cameraPowerStatus === 'checking'}
            title={
              status?.cameraPowerStatus === 'on'
                ? '카메라 전원 켜져있음 (클릭하여 재확인)'
                : status?.cameraPowerStatus === 'off'
                  ? '카메라 전원 꺼져있음 (클릭하여 재확인)'
                  : status?.cameraPowerStatus === 'error'
                    ? '카메라 오류 상태 (클릭하여 재확인)'
                    : status?.cameraPowerStatus === 'checking'
                      ? '상태 확인 중...'
                      : '카메라 상태를 확인하려면 클릭하세요'
            }
          >
            {status?.cameraPowerStatus === 'on'
              ? '정상'
              : status?.cameraPowerStatus === 'off'
                ? '전원꺼짐'
                : status?.cameraPowerStatus === 'error'
                  ? '오류'
                  : status?.cameraPowerStatus === 'checking'
                    ? '확인중...'
                    : '카메라 확인'}
          </button>
        </div>
        <div className='capture-info-item'>
          <span className='info-label'>촬영</span>
          <span className='capture-progress'>{captureProgress}</span>
        </div>
        <div className='capture-info-item'>
          <span className='info-label'>
            마지막
            <br />
            촬영
          </span>
          <span className='last-capture-time'>
            {formatDateTime(status?.lastCaptureTime)}
          </span>
        </div>
        <div className='capture-info-item'>
          <span className='info-label'>실패</span>
          <span className='missed-captures'>{missedCaptures}</span>
        </div>
      </div>

      <div className='time-settings-stack'>
        <div className='setting-group'>
          <span className='setting-label'>시작</span>
          <div className='time-select-container'>
            <select
              value={(settings.start_time || '08:00').split(':')[0]}
              onChange={(e) =>
                handleTimeChange('start_time', 'hour', e.target.value)
              }
              disabled={!isEnabled}
              title='시작 시간 (시)'
              className='time-select'
            >
              {HOUR_OPTIONS.map((hour) => (
                <option key={`start-hour-${hour}`} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
            <span className='time-unit'>시</span>
          </div>
        </div>

        <div className='setting-group'>
          <span className='setting-label'></span>
          <div className='time-select-container'>
            <select
              value={(settings.start_time || '08:00').split(':')[1]}
              onChange={(e) =>
                handleTimeChange('start_time', 'minute', e.target.value)
              }
              disabled={!isEnabled}
              title='시작 시간 (분)'
              className='time-select'
            >
              {MINUTE_OPTIONS.map((minute) => (
                <option key={`start-minute-${minute}`} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
            <span className='time-unit'>분</span>
          </div>
        </div>

        <div className='setting-group'>
          <span className='setting-label'>종료</span>
          <div className='time-select-container'>
            <select
              value={(settings.end_time || '18:00').split(':')[0]}
              onChange={(e) =>
                handleTimeChange('end_time', 'hour', e.target.value)
              }
              disabled={!isEnabled}
              title='종료 시간 (시)'
              className='time-select'
            >
              {HOUR_OPTIONS.map((hour) => (
                <option key={`end-hour-${hour}`} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
            <span className='time-unit'>시</span>
          </div>
        </div>

        <div className='setting-group'>
          <span className='setting-label'></span>
          <div className='time-select-container'>
            <select
              value={(settings.end_time || '18:00').split(':')[1]}
              onChange={(e) =>
                handleTimeChange('end_time', 'minute', e.target.value)
              }
              disabled={!isEnabled}
              title='종료 시간 (분)'
              className='time-select'
            >
              {MINUTE_OPTIONS.map((minute) => (
                <option key={`end-minute-${minute}`} value={minute}>
                  {minute}
                </option>
              ))}
            </select>
            <span className='time-unit'>분</span>
          </div>
        </div>

        <div className='setting-group'>
          <span className='setting-label'>간격</span>
          <div className='time-select-container'>
            <select
              value={settings.capture_interval || '10'}
              onChange={(e) =>
                handleSettingChange('capture_interval', e.target.value)
              }
              disabled={!isEnabled}
              title='촬영 간격 (분)'
              className='time-select'
            >
              {INTERVAL_OPTIONS.map((interval) => (
                <option key={`interval-${interval}`} value={interval}>
                  {interval}
                </option>
              ))}
            </select>
            <span className='time-unit'>분</span>
          </div>
        </div>
      </div>

      <div className='control-buttons'>
        <button
          className='btn reboot'
          onClick={handleReboot}
          disabled={!isEnabled}
          title='모듈 재부팅'
        >
          재부팅
        </button>
        <button
          className='btn wiper'
          onClick={handleWiper}
          disabled={!isEnabled}
          title='와이퍼 30초 작동'
        >
          와이퍼
        </button>
        <button
          className='btn camera-power'
          onClick={handleCameraPower}
          disabled={!isEnabled}
          title='카메라 전원 토글'
        >
          카메라 전원
        </button>
      </div>

      <div className='sw-stack'>
        <div className='sw-version'>{status?.swVersion || '-'}</div>
        <button
          className='btn sw-version-refresh'
          onClick={handleSwVersionRequest}
          disabled={!isEnabled}
          title='SW 버전 새로고침'
        >
          SW 버전 불러오기
        </button>
        <button
          className='btn sw-update'
          onClick={handleSwUpdate}
          disabled={!isEnabled}
          title='소프트웨어 업데이트 요청'
        >
          업데이트
        </button>
        <button
          className='btn sw-rollback'
          onClick={handleSwRollback}
          disabled={!isEnabled}
          title='이전 버전으로 롤백'
        >
          롤백
        </button>
      </div>

      <div className='camera-settings-stack'>
        {cameraOptionList.length === 0 ? (
          <div className='setting-group'>
            <span className='setting-label'>Camera Options</span>
            <span>Request camera options from the device.</span>
          </div>
        ) : (
          cameraOptionList.map((option) => {
            const hasSettingValue = Object.prototype.hasOwnProperty.call(
              settings,
              option.key
            )
            let resolvedValue
            if (hasSettingValue) {
              resolvedValue = settings[option.key]
            } else if (typeof option.current !== 'undefined') {
              resolvedValue = option.current
            } else if (option.choices.length > 0) {
              resolvedValue = option.choices[0]
            } else {
              resolvedValue = ''
            }
            const currentValue =
              resolvedValue === undefined ? '' : String(resolvedValue)
            const disabled = !isEnabled || option.readOnly


            return (
              <div className='setting-group' key={option.key}>
                <span className='setting-label'>{option.label}</span>
                <select
                  value={currentValue}
                  onChange={(event) =>
                    handleSettingChange(option.key, event.target.value)
                  }
                  disabled={disabled}
                  title={option.label}
                >
                  {option.choices.map((choice) => {
                    const choiceValue = String(choice)
                    return (
                      <option key={choiceValue} value={choiceValue}>
                        {choiceValue}
                      </option>
                    )
                  })}
                </select>
              </div>
            )
          })
        )}
      </div>

      <div className='settings-stack'>
        <div className='settings-stack-inner'>
          <button
            className='btn load'
            onClick={handleLoadSettings}
            disabled={!isEnabled}
            title='현재 설정 및 카메라 옵션 불러오기'
          >
            현재 설정 불러오기
          </button>
          <button
            className='btn apply'
            onClick={handleApplySettings}
            disabled={!isEnabled}
            title='변경 사항 적용'
          >
            변경 옵션 적용
          </button>
        </div>
      </div>

      <SiteNameModal
        isOpen={isSiteNameModalOpen}
        onClose={() => setIsSiteNameModalOpen(false)}
        onSubmit={handleSiteNameSubmit}
        currentSiteName={status?.siteName}
        moduleId={moduleId}
      />
    </div>
  )
}

// React.memo로 렌더링 최적화
export const CameraModuleRow = React.memo(CameraModuleRowComponent)
