import React, { useMemo } from 'react';

export const ApiDocsPage = () => {
  const mqttEndpoints = [
    // 발행 메시지 (Publish)
    {
      type: 'Publish',
      topic: 'bmtl/request/settings/all',
      description: '전체 설정 불러오기 요청',
      qos: '1',
      payload: {
        command: 'get_settings',
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/settings/01',
      description: '개별 모듈 현재설정 불러오기 요청',
      qos: '1',
      payload: {
        command: 'get_settings',
        module_id: 'camera_01',
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Publish',
      topic: 'bmtl/request/status',
      description: '전체 상태 요청',
      qos: '1',
      payload: {
        command: 'get_status',
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Publish',
      topic: 'bmtl/set/settings/01',
      description: '개별 모듈 설정 변경',
      qos: '2',
      payload: {
        command: 'set_settings',
        module_id: 'camera_01',
        settings: {
          start_time: '08:00',
          end_time: '18:00',
          capture_interval: 10,
          image_size: '1920x1080',
          quality: '높음',
          iso: '400',
          format: 'JPG',
          aperture: 'f/2.8'
        },
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Publish',
      topic: 'bmtl/system/global/reboot',
      description: '전체 재부팅 명령',
      qos: '1',
      payload: {
        command: 'reboot_all',
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Publish',
      topic: 'bmtl/camera/+/reboot',
      description: '개별 모듈 재부팅',
      qos: '1',
      payload: {
        command: 'reboot',
        module_id: 'camera_01',
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    // 구독 메시지 (Subscribe)
    {
      type: 'Subscribe',
      topic: 'bmtl/status/health/+',
      description: '디바이스 헬스 상태 수신',
      qos: '0-1',
      payload: {
        module_id: 'camera_01',
        status: 'online/offline',
        battery_level: 85,
        storage_used: 45.2,
        last_capture_time: '2024-01-01T12:30:00Z',
        last_boot_time: '2024-01-01T08:15:00Z',
        site_name: '현장명',
        today_total_captures: 100,
        today_captured_count: 85,
        missed_captures: 3,
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/settings/all',
      description: '전체 설정 응답 수신',
      qos: '1',
      payload: {
        response_type: 'all_settings',
        modules: {
          'camera_01': {
            start_time: '08:00',
            end_time: '18:00',
            capture_interval: 10,
            image_size: '1920x1080',
            quality: '높음',
            iso: '400',
            format: 'JPG',
            aperture: 'f/2.8'
          }
        },
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/settings/+',
      description: '개별 설정 응답 수신',
      qos: '1',
      payload: {
        response_type: 'settings',
        module_id: 'camera_01',
        settings: {
          start_time: '08:00',
          end_time: '18:00',
          capture_interval: 10,
          image_size: '1920x1080',
          quality: '높음',
          iso: '400',
          format: 'JPG',
          aperture: 'f/2.8'
        },
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/status',
      description: '전체 상태 응답 수신',
      qos: '1',
      payload: {
        response_type: 'status',
        system_status: 'normal',
        connected_modules: ['camera_01', 'camera_02'],
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/response/set/settings/+',
      description: '설정 변경 응답 수신',
      qos: '1',
      payload: {
        response_type: 'set_settings_result',
        module_id: 'camera_01',
        success: true,
        message: 'Settings applied successfully',
        applied_settings: {
          start_time: '08:00',
          end_time: '18:00',
          capture_interval: 10
        },
        timestamp: '2024-01-01T00:00:00Z'
      }
    },
    {
      type: 'Subscribe',
      topic: 'bmtl/camera/+/reboot/response',
      description: '재부팅 응답 수신',
      qos: '1',
      payload: {
        response_type: 'reboot_result',
        module_id: 'camera_01',
        success: true,
        message: 'Reboot initiated successfully',
        timestamp: '2024-01-01T00:00:00Z'
      }
    }
  ];

  const connectionInfo = useMemo(() => ({
    broker: import.meta.env.VITE_MQTT_BROKER_HOST || 'broker.hivemq.com',
    port: import.meta.env.VITE_MQTT_BROKER_PORT || '8884',
    protocol: import.meta.env.VITE_MQTT_BROKER_PROTOCOL || 'wss',
    path: '/mqtt'
  }), []);

  return (
    <div className="api-docs-page">
      <div className="docs-header">
        <h1>📚 MQTT API 명세서</h1>
        <p>BMTL Control System의 MQTT 통신 프로토콜 문서</p>
      </div>


      {/* QoS Levels */}
      <section className="qos-section">
        <h2>📊 QoS 레벨</h2>
        <div className="qos-table">
          <div className="qos-row header">
            <div>Level</div>
            <div>설명</div>
            <div>사용 케이스</div>
          </div>
          <div className="qos-row">
            <div><code>0</code></div>
            <div>At most once (최대 1회 전송)</div>
            <div>센서 데이터, 실시간 모니터링</div>
          </div>
          <div className="qos-row">
            <div><code>1</code></div>
            <div>At least once (최소 1회 전송)</div>
            <div>중요한 상태 알림</div>
          </div>
          <div className="qos-row">
            <div><code>2</code></div>
            <div>Exactly once (정확히 1회 전송)</div>
            <div>중요한 제어 명령, 설정 변경</div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="endpoints-section">
        <h2>📡 MQTT 토픽 & 메시지</h2>
        <div className="endpoints-tiles">
          {mqttEndpoints.map((endpoint, index) => (
            <div key={index} className="endpoint-card">
              <div className="endpoint-header">
                <span className={`method ${endpoint.type.toLowerCase()}`}>
                  {endpoint.type.toUpperCase()}
                </span>
                <code className="topic">{endpoint.topic}</code>
              </div>

              <div className="endpoint-details">
                <div className="description">
                  <strong>설명:</strong> {endpoint.description}
                </div>

                <div className="qos-info">
                  <strong>QoS:</strong> <code>{endpoint.qos}</code>
                </div>

                <div className="payload-section">
                  <strong>페이로드 예시:</strong>
                  <pre className="payload-code">
                    {JSON.stringify(endpoint.payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Topic Patterns */}
      <section className="patterns-section">
        <h2>🎯 토픽 패턴</h2>
        <div className="pattern-list">
          <div className="pattern-item">
            <code>bmtl/status/health/+</code>
            <span>모든 카메라 모듈의 헬스 상태</span>
          </div>
          <div className="pattern-item">
            <code>bmtl/request/settings/+</code>
            <span>설정 요청 (all 또는 모듈번호)</span>
          </div>
          <div className="pattern-item">
            <code>bmtl/response/settings/+</code>
            <span>설정 응답 (all 또는 모듈번호)</span>
          </div>
          <div className="pattern-item">
            <code>bmtl/set/settings/+</code>
            <span>설정 변경 요청</span>
          </div>
          <div className="pattern-item">
            <code>bmtl/response/set/settings/+</code>
            <span>설정 변경 응답</span>
          </div>
          <div className="pattern-item">
            <code>bmtl/request/status</code>
            <span>전체 상태 요청</span>
          </div>
          <div className="pattern-item">
            <code>bmtl/response/status</code>
            <span>전체 상태 응답</span>
          </div>
        </div>
      </section>

      {/* Error Codes */}
      <section className="errors-section">
        <h2>⚠️ 에러 코드</h2>
        <div className="error-table">
          <div className="error-row header">
            <div>코드</div>
            <div>설명</div>
            <div>해결방법</div>
          </div>
          <div className="error-row">
            <div><code>CONN_ERR</code></div>
            <div>브로커 연결 실패</div>
            <div>브로커 주소와 포트 확인</div>
          </div>
          <div className="error-row">
            <div><code>AUTH_ERR</code></div>
            <div>인증 실패</div>
            <div>사용자명/비밀번호 확인</div>
          </div>
          <div className="error-row">
            <div><code>SUB_ERR</code></div>
            <div>구독 실패</div>
            <div>토픽 권한 확인</div>
          </div>
          <div className="error-row">
            <div><code>PUB_ERR</code></div>
            <div>발행 실패</div>
            <div>페이로드 크기 및 형식 확인</div>
          </div>
        </div>
      </section>
    </div>
  );
};