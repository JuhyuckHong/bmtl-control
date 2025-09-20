import { useState, useCallback, useRef, useEffect } from 'react'
import mqtt from 'mqtt'

const MAX_MESSAGE_HISTORY = 500
const MQTT_CONFIG_KEY = 'bmtl_mqtt_config'
const SUBSCRIBED_TOPICS_KEY = 'bmtl_subscribed_topics'

export const useMQTT = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [status, setStatus] = useState('Disconnected')
  const [messages, setMessages] = useState([])
  const [subscribedTopics, setSubscribedTopics] = useState([])

  const clientRef = useRef(null)
  const subscribedTopicsRef = useRef(new Set())
  const savedConfigRef = useRef(null)

  // 페이지 로드 시 저장된 설정 복원
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        // 저장된 MQTT 설정 복원
        const savedConfig = localStorage.getItem(MQTT_CONFIG_KEY)
        if (savedConfig) {
          savedConfigRef.current = JSON.parse(savedConfig)
        }

        // 저장된 구독 토픽 복원
        const savedTopics = localStorage.getItem(SUBSCRIBED_TOPICS_KEY)
        if (savedTopics) {
          const topics = JSON.parse(savedTopics)
          subscribedTopicsRef.current = new Set(topics)
          setSubscribedTopics(topics)
        }

        // 저장된 설정이 있으면 자동 재연결
        if (savedConfigRef.current) {
          console.log('자동 재연결 시도 중...')
          // connect 함수를 직접 호출하는 대신 내부 로직 재사용
          const config = savedConfigRef.current
          setIsConnecting(true)
          setStatus('Connecting...')

          const protocol = import.meta.env.VITE_MQTT_BROKER_PROTOCOL || 'wss'
          const brokerUrl = `${protocol}://${config.broker}:${config.port}/mqtt`
          const options = {
            username: config.username,
            password: config.password,
            clientId: `bmtl_mqtt_client_${Math.random().toString(16).substr(2, 8)}`,
            clean: true,
            connectTimeout: 10000,
            keepalive: 30,
            protocolVersion: 4,
          }

          try {
            const client = mqtt.connect(brokerUrl, options)
            clientRef.current = client

            client.on('connect', () => {
              setIsConnected(true)
              setIsConnecting(false)
              setStatus('Connected')
              addMessage('System', 'Connected to MQTT broker', 'system')

              if (subscribedTopicsRef.current.size > 0) {
                subscribedTopicsRef.current.forEach((topic) => {
                  client.subscribe(topic, (err) => {
                    if (err) {
                      addMessage(
                        'System',
                        `Resubscribe error: ${err.message}`,
                        'system'
                      )
                    }
                  })
                })
              }
            })

            client.on('reconnect', () => {
              setStatus('Reconnecting...')
              addMessage('System', 'Reconnecting...', 'system')
            })

            client.on('close', () => {
              setIsConnected(false)
              setIsConnecting(false)
              setStatus('Disconnected')
              addMessage('System', 'Disconnected from MQTT broker', 'system')
              clientRef.current = null
            })

            client.on('error', (err) => {
              setIsConnected(false)
              setIsConnecting(false)
              setStatus(`Error: ${err.message}`)
              addMessage('System', `Connection error: ${err.message}`, 'system')
              client.end()
            })

            client.on('message', (topic, payload) => {
              addMessage(topic, payload.toString(), 'received')
            })
          } catch (error) {
            setIsConnecting(false)
            setStatus(`Connection failed: ${error}`)
            addMessage('System', `Connection failed: ${error}`, 'system')
          }
        }
      } catch (error) {
        console.error('저장된 MQTT 설정 복원 실패:', error)
      }
    }

    loadSavedState()
  }, [])

  const syncSubscribedTopics = useCallback(() => {
    const topics = Array.from(subscribedTopicsRef.current)
    setSubscribedTopics(topics)
    // 구독 토픽을 localStorage에 저장
    localStorage.setItem(SUBSCRIBED_TOPICS_KEY, JSON.stringify(topics))
  }, [])

  const addMessage = useCallback((topic, payload, type = 'received') => {
    const newMessage = {
      topic,
      payload,
      timestamp: new Date(),
      type,
    }

    setMessages((prev) => {
      const next = [...prev, newMessage]
      if (next.length > MAX_MESSAGE_HISTORY) {
        return next.slice(-MAX_MESSAGE_HISTORY)
      }
      return next
    })
  }, [])

  const addSystemMessage = useCallback(
    (payload) => {
      addMessage('System', payload, 'system')
    },
    [addMessage]
  )

  const connect = useCallback(
    async (config) => {
      if (clientRef.current?.connected) {
        return
      }

      setIsConnecting(true)
      setStatus('Connecting...')

      // 연결 설정을 localStorage에 저장
      savedConfigRef.current = config
      localStorage.setItem(MQTT_CONFIG_KEY, JSON.stringify(config))

      const protocol = import.meta.env.VITE_MQTT_BROKER_PROTOCOL || 'wss'
      // HiveMQ Cloud requires /mqtt path for WebSocket connections
      const brokerUrl = `${protocol}://${config.broker}:${config.port}/mqtt`
      const options = {
        username: config.username,
        password: config.password,
        clientId: `bmtl_mqtt_client_${Math.random().toString(16).substr(2, 8)}`,
        clean: true,
        connectTimeout: 10000,
        keepalive: 30,
        protocolVersion: 4,
      }

      try {
        const client = mqtt.connect(brokerUrl, options)
        clientRef.current = client

        client.on('connect', () => {
          setIsConnected(true)
          setIsConnecting(false)
          setStatus('Connected')
          addSystemMessage('Connected to MQTT broker')

          if (subscribedTopicsRef.current.size > 0) {
            subscribedTopicsRef.current.forEach((topic) => {
              client.subscribe(topic, (err) => {
                if (err) {
                  addSystemMessage(`Resubscribe error: ${err.message}`)
                }
              })
            })
          }
        })

        client.on('reconnect', () => {
          setStatus('Reconnecting...')
          addSystemMessage('Reconnecting...')
        })

        client.on('close', () => {
          setIsConnected(false)
          setIsConnecting(false)
          setStatus('Disconnected')
          addSystemMessage('Disconnected from MQTT broker')
          clientRef.current = null
        })

        client.on('error', (err) => {
          setIsConnected(false)
          setIsConnecting(false)
          setStatus(`Error: ${err.message}`)
          addSystemMessage(`Connection error: ${err.message}`)
          client.end()
        })

        client.on('message', (topic, payload) => {
          addMessage(topic, payload.toString(), 'received')
        })

        syncSubscribedTopics()
      } catch (error) {
        setIsConnecting(false)
        setStatus(`Connection failed: ${error}`)
        addSystemMessage(`Connection failed: ${error}`)
      }
    },
    [addMessage, addSystemMessage, syncSubscribedTopics]
  )

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true)
      clientRef.current = null
    }

    // 연결 해제 시 저장된 설정 제거
    savedConfigRef.current = null
    localStorage.removeItem(MQTT_CONFIG_KEY)
    localStorage.removeItem(SUBSCRIBED_TOPICS_KEY)

    subscribedTopicsRef.current.clear()
    syncSubscribedTopics()
    setIsConnected(false)
    setIsConnecting(false)
    setStatus('Disconnected')
    setMessages([])
    addSystemMessage('Disconnected from MQTT broker')
  }, [addSystemMessage, syncSubscribedTopics])

  const subscribe = useCallback(
    (topic) => {
      if (clientRef.current?.connected && topic.trim()) {
        if (!subscribedTopicsRef.current.has(topic)) {
          clientRef.current.subscribe(topic, (err) => {
            if (!err) {
              subscribedTopicsRef.current.add(topic)
              syncSubscribedTopics()
              addSystemMessage(`Subscribed to ${topic}`)
            } else {
              addSystemMessage(`Subscription error: ${err.message}`)
            }
          })
        }
      }
    },
    [addSystemMessage, syncSubscribedTopics]
  )

  const unsubscribe = useCallback(
    (topic) => {
      if (!clientRef.current?.connected) {
        return
      }

      if (subscribedTopicsRef.current.has(topic)) {
        clientRef.current.unsubscribe(topic, (err) => {
          if (!err) {
            subscribedTopicsRef.current.delete(topic)
            syncSubscribedTopics()
            addSystemMessage(`Unsubscribed from ${topic}`)
          } else {
            addSystemMessage(`Unsubscribe error: ${err.message}`)
          }
        })
      }
    },
    [addSystemMessage, syncSubscribedTopics]
  )

  const publish = useCallback(
    (topic, payload, qos = 0) => {
      if (clientRef.current?.connected && topic.trim()) {
        const options = { qos: parseInt(qos) }
        clientRef.current.publish(topic, payload, options, (err) => {
          if (!err) {
            addMessage(topic, payload, 'sent')
            addSystemMessage(`Published to ${topic} (QoS: ${qos})`)
          } else {
            addSystemMessage(`Publish error: ${err.message}`)
          }
        })
      }
    },
    [addMessage, addSystemMessage]
  )

  // ?��??�서 publish ?�벤?��? 받아??메시지 로그??추�?
  const recordExternalPublish = useCallback(
    (topic, payload, qos) => {
      addMessage(topic, payload, 'sent')
      addSystemMessage(`Published to ${topic} (QoS: ${qos})`)
    },
    [addMessage, addSystemMessage]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    isConnected,
    isConnecting,
    status,
    messages,
    subscribedTopics,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    publish,
    recordExternalPublish,
    clearMessages,
    client: clientRef.current,
  }
}
