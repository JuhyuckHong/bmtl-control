import React, { useState, useCallback, useMemo } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ModuleControl } from './pages/ModuleControl'
import { MQTTPage } from './pages/MQTTPage'
import { ApiDocsPage } from './pages/ApiDocsPage'
import { DarkModeToggle } from './components/DarkModeToggle'
import ErrorBoundary from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import { useMQTT } from './hooks/useMQTT'
import { useLoadingState } from './hooks/useLoadingState'
import './App.css'
import './styles/api-docs.css'
import './styles/toast.css'
import { ToastProvider } from './contexts/ToastContext'
import { ToastContainer } from './components/ToastContainer'

function App() {
  const {
    isConnected,
    isConnecting,
    status,
    messages,
    subscribedTopics,
    connect,
    disconnect,
    subscribe,
    publish,
    recordExternalPublish,
    clearMessages,
    client,
  } = useMQTT()
  const navigate = useNavigate()
  const location = useLocation()

  // 로딩 상태 관리
  const { isLoading } =
    useLoadingState({
      timeout: 30000,
      onTimeout: (key, error) => {
        console.warn(`작업 타임아웃: ${key}`, error)
      },
      onError: (key, error) => {
        console.error(`로딩 에러: ${key}`, error)
      },
    })

  // Control states - 관련된 상태들을 그룹화하여 리렌더링 최적화
  const [controlState, setControlState] = useState({
    filter: 'all',
    searchTerm: '',
    statusCounts: { online: 0, offline: 0, unknown: 0 },
    globalCommandHandler: null,
  })

  // MQTT Control states - MQTT 관련 상태들을 별도 그룹화
  const [mqttState, setMqttState] = useState({
    publishTopic: 'device/command',
    publishPayload: '',
    publishQos: '0',
    subscribeTopic: 'device/status',
  })

  // 현재 페이지 감지 (URL 기반) - useMemo로 최적화
  const currentPage = useMemo(() => {
    const path = location.pathname
    if (path === '/' || path === '/control') return 'control'
    if (path === '/docs') return 'docs'
    if (path === '/mqtt') return 'mqtt'
    return 'control' // 기본값은 control
  }, [location.pathname])

  const togglePage = useCallback(() => {
    const currentPath = location.pathname
    if (currentPath === '/control') {
      navigate('/mqtt')
    } else if (currentPath === '/mqtt') {
      navigate('/docs')
    } else if (currentPath === '/docs') {
      navigate('/control')
    } else {
      // 기본 경로 (/) 에서는 mqtt로
      navigate('/mqtt')
    }
  }, [location.pathname, navigate])

  const handleGlobalCommand = useCallback(
    (command) => {
      if (controlState.globalCommandHandler) {
        if (
          command === 'reboot' &&
          !confirm('모든 연결된 모듈을 재부팅하시겠습니까?')
        ) {
          return
        }
        controlState.globalCommandHandler(command)
      }
    },
    [controlState.globalCommandHandler]
  )

  const onModuleControlReady = useCallback((commandHandler, counts) => {
    setControlState((prev) => ({
      ...prev,
      globalCommandHandler: commandHandler,
      statusCounts: counts,
    }))
  }, [])

  const handleSubscribe = useCallback(
    (e) => {
      e.preventDefault()
      if (mqttState.subscribeTopic.trim()) {
        subscribe(mqttState.subscribeTopic)
      }
    },
    [mqttState.subscribeTopic, subscribe]
  )

  // MQTT 연결 시 control 페이지 유지 (이미 /에서 control로 설정됨)

  return (
    <ToastProvider>
    <ErrorBoundary
      userFriendlyMessage='애플리케이션에서 문제가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요.'
      contactInfo='support@bmtl.co.kr'
    >
      <div className='App'>
        {isLoading('mqtt-publish') && (
          <LoadingSpinner
            overlay
            message='MQTT 메시지 발행 중...'
            variant='primary'
          />
        )}

        <ErrorBoundary
          userFriendlyMessage='헤더 영역에서 문제가 발생했습니다.'
          fallback={(error, errorInfo, retry) => (
            <div
              className='app-header'
              style={{ padding: '1rem', background: 'var(--bg-secondary)' }}
            >
              <div className='header-title'>
                <h1>빌드모션 제어판</h1>
                <button onClick={retry} className='btn btn-secondary'>
                  헤더 다시 로드
                </button>
              </div>
            </div>
          )}
        >
          <div className='app-header'>
            <div className='header-title'>
              <h1>
                {!isConnected
                  ? '빌드모션 제어판'
                  : currentPage === 'control'
                    ? '모듈 제어'
                    : currentPage === 'mqtt'
                      ? '메시지 제어'
                      : 'API 명세서'}
              </h1>
              {isConnected && currentPage === 'control' && (
                <div className='status-summary'>
                  <span className='status-item'>
                    <div className='status-dot status-online'></div>
                    {controlState.statusCounts.online}
                  </span>
                  <span className='status-item'>
                    <div className='status-dot status-offline'></div>
                    {controlState.statusCounts.offline}
                  </span>
                  <span className='status-item'>
                    <div className='status-dot status-unknown'></div>
                    {controlState.statusCounts.unknown}
                  </span>
                </div>
              )}
            </div>

            {isConnected && currentPage === 'control' && (
              <>
                <div className='filter-controls'>
                  <label htmlFor='filter-select'>필터</label>
                  <select
                    id='filter-select'
                    value={controlState.filter}
                    onChange={(e) =>
                      setControlState((prev) => ({
                        ...prev,
                        filter: e.target.value,
                      }))
                    }
                  >
                    <option value='all'>전체</option>
                    <option value='online'>온라인</option>
                    <option value='offline'>오프라인</option>
                  </select>
                </div>

                <div className='search-controls'>
                  <label htmlFor='search-input'>검색</label>
                  <input
                    id='search-input'
                    type='text'
                    placeholder='모듈 번호 또는 현장 이름'
                    value={controlState.searchTerm}
                    onChange={(e) =>
                      setControlState((prev) => ({
                        ...prev,
                        searchTerm: e.target.value,
                      }))
                    }
                  />
                </div>

                <button
                  onClick={() => handleGlobalCommand('status_request')}
                  className='subscribe-btn-header'
                >
                  전체 상태 요청
                </button>
                <button
                  onClick={() => handleGlobalCommand('options_request')}
                  className='subscribe-btn-header'
                >
                  전체 옵션 요청
                </button>
                <button
                  onClick={() => handleGlobalCommand('reboot')}
                  className='disconnect-btn-header'
                >
                  전체 재부팅
                </button>
              </>
            )}

            {isConnected && currentPage === 'mqtt' && (
              <div className='mqtt-header-controls'>
                <div className='mqtt-quick-actions'>
                  <input
                    type='text'
                    placeholder='Subscribe topic'
                    value={mqttState.subscribeTopic}
                    onChange={(e) =>
                      setMqttState((prev) => ({
                        ...prev,
                        subscribeTopic: e.target.value,
                      }))
                    }
                    className='subscribe-input-header'
                  />
                  <button
                    onClick={handleSubscribe}
                    className='subscribe-btn-header'
                    disabled={!mqttState.subscribeTopic.trim()}
                  >
                    📥 구독
                  </button>
                </div>

                <button onClick={disconnect} className='disconnect-btn-header'>
                  ⚡ 연결해제
                </button>
              </div>
            )}

            <div className='header-controls'>
              <DarkModeToggle />
              <button
                className='toggle-btn'
                onClick={togglePage}
                title={
                  currentPage === 'control'
                    ? 'MQTT 페이지로'
                    : currentPage === 'mqtt'
                      ? 'API 문서로'
                      : '모듈 제어로'
                }
              >
                {currentPage === 'control'
                  ? '💬'
                  : currentPage === 'mqtt'
                    ? '📚'
                    : '🚥'}
              </button>
            </div>
          </div>
        </ErrorBoundary>

        <ErrorBoundary
          userFriendlyMessage='페이지 콘텐츠를 로드하는 중 문제가 발생했습니다.'
          fallback={(error, errorInfo, retry) => (
            <main
              className='app-main'
              style={{ padding: '2rem', textAlign: 'center' }}
            >
              <div>
                <h2>⚠️ 페이지 로드 실패</h2>
                <p>페이지를 불러오는 중 문제가 발생했습니다.</p>
                <button onClick={retry} className='btn btn-primary'>
                  다시 시도
                </button>
              </div>
            </main>
          )}
        >
          <main
            className={`app-main ${currentPage === 'docs' ? 'docs-mode' : ''}`}
          >
            {isConnecting && (
              <div style={{ position: 'relative', minHeight: '200px' }}>
                <LoadingSpinner
                  overlay
                  message='MQTT 브로커에 연결 중...'
                  variant='primary'
                  size='large'
                />
              </div>
            )}
            <Routes>
              <Route
                path='/'
                element={
                  <ModuleControl
                    mqttClient={client}
                    subscribedTopics={subscribedTopics}
                    filter={controlState.filter}
                    setFilter={(value) =>
                      setControlState((prev) => ({ ...prev, filter: value }))
                    }
                    searchTerm={controlState.searchTerm}
                    setSearchTerm={(value) =>
                      setControlState((prev) => ({
                        ...prev,
                        searchTerm: value,
                      }))
                    }
                    onGlobalCommand={onModuleControlReady}
                    connect={connect}
                    isConnecting={isConnecting}
                    isConnected={isConnected}
                    status={status}
                    recordPublish={recordExternalPublish}
                  />
                }
              />
              <Route
                path='/mqtt'
                element={
                  <MQTTPage
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    status={status}
                    messages={messages}
                    subscribedTopics={subscribedTopics}
                    connect={connect}
                    disconnect={disconnect}
                    subscribe={subscribe}
                    publish={publish}
                    clearMessages={clearMessages}
                    publishTopic={mqttState.publishTopic}
                    setPublishTopic={(value) =>
                      setMqttState((prev) => ({ ...prev, publishTopic: value }))
                    }
                    publishPayload={mqttState.publishPayload}
                    setPublishPayload={(value) =>
                      setMqttState((prev) => ({
                        ...prev,
                        publishPayload: value,
                      }))
                    }
                    publishQos={mqttState.publishQos}
                    setPublishQos={(value) =>
                      setMqttState((prev) => ({ ...prev, publishQos: value }))
                    }
                  />
                }
              />
              <Route
                path='/control'
                element={
                  <ModuleControl
                    mqttClient={client}
                    subscribedTopics={subscribedTopics}
                    filter={controlState.filter}
                    setFilter={(value) =>
                      setControlState((prev) => ({ ...prev, filter: value }))
                    }
                    searchTerm={controlState.searchTerm}
                    setSearchTerm={(value) =>
                      setControlState((prev) => ({
                        ...prev,
                        searchTerm: value,
                      }))
                    }
                    onGlobalCommand={onModuleControlReady}
                    connect={connect}
                    isConnecting={isConnecting}
                    isConnected={isConnected}
                    status={status}
                    recordPublish={recordExternalPublish}
                  />
                }
              />
              <Route path='/docs' element={<ApiDocsPage />} />
            </Routes>
          </main>
        </ErrorBoundary>
        <ToastContainer />
      </div>
    </ErrorBoundary>
    </ToastProvider>
  )
}

export default App
