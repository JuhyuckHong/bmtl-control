import React, { useMemo } from "react";

export const ApiDocsPage = () => {
    const mqttEndpoints = [
        // 발행 메시지 (Publish)
        {
            type: "Publish",
            topic: "bmtl/request/settings/all",
            description: "전체 설정 불러오기 요청 (각 모듈이 bmtl/status/health/{device_id}로 개별 응답)",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/request/settings/01",
            description: "개별 모듈 현재설정 불러오기 요청",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/set/settings/01",
            description: "개별 모듈 설정 변경",
            qos: "2",
            payload: {
                start_time: "08:00",
                end_time: "18:00",
                capture_interval: 10,
                image_size: "1920x1080",
                quality: "높음",
                iso: "400",
                format: "JPG",
                aperture: "f/2.8",
            },
        },
        {
            type: "Publish",
            topic: "bmtl/request/reboot/all",
            description: "전체 재부팅 명령",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/request/reboot/01",
            description: "개별 모듈 재부팅 (01번 모듈 예시)",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/request/options/01",
            description: "개별 모듈 options 요청",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/request/options/all",
            description: "전체 모듈 options 요청",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/request/wiper/01",
            description: "개별 모듈 와이퍼 30초 동작 (01번 모듈 예시)",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/request/camera-on-off/01",
            description: "개별 모듈 카메라 전원 On/Off (01번 모듈 예시)",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/set/sitename/01",
            description: "개별 모듈 사이트 이름 변경 (01번 모듈 예시)",
            qos: "2",
            payload: {
                sitename: "새로운 사이트명",
            },
        },
        {
            type: "Publish",
            topic: "bmtl/sw-update/01",
            description: "개별 모듈 소프트웨어 업데이트 (01번 모듈 예시)",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/sw-rollback/01",
            description: "개별 모듈 소프트웨어 롤백 (01번 모듈 예시)",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/request/status/01",
            description: "개별 모듈 상태 요청 (01번 모듈 예시)",
            qos: "2",
        },
        {
            type: "Publish",
            topic: "bmtl/request/status/all",
            description: "전체 모듈 상태 요청 (각 모듈이 bmtl/status/health/{device_id}로 응답)",
            qos: "2",
        },
        // 구독 메시지 (Subscribe)
        {
            type: "Subscribe",
            topic: "bmtl/status/health/+",
            description: "디바이스 헬스 상태 수신",
            qos: "0-1",
            payload: {
                module_id: "bmotion01",
                storage_used: 45.2,
                temperature: 42.3,
                last_capture_time: "2024-01-01T12:30:00Z",
                last_boot_time: "2024-01-01T08:15:00Z",
                site_name: "현장명",
                today_total_captures: 100,
                today_captured_count: 85,
                missed_captures: 3,
                sw_version: "v1.0.0",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/settings/+",
            description: "개별 설정 응답 수신",
            qos: "1",
            payload: {
                response_type: "settings",
                module_id: "camera_01",
                settings: {
                    start_time: "08:00",
                    end_time: "18:00",
                    capture_interval: 10,
                    image_size: "1920x1080",
                    quality: "높음",
                    iso: "400",
                    format: "JPG",
                    aperture: "f/2.8",
                },
                timestamp: "2024-01-01T00:00:00Z",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/set/settings/+",
            description: "설정 변경 응답 수신",
            qos: "1",
            payload: {
                response_type: "set_settings_result",
                module_id: "camera_01",
                success: true,
                message: "Settings applied successfully",
                applied_settings: {
                    start_time: "08:00",
                    end_time: "18:00",
                    capture_interval: 10,
                },
                timestamp: "2024-01-01T00:00:00Z",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/reboot/01",
            description: "개별 모듈 재부팅 응답 수신 (01번 모듈 예시)",
            qos: "1",
            payload: {
                response_type: "reboot_result",
                module_id: "camera_01",
                success: true,
                message: "Reboot initiated successfully",
                timestamp: "2024-01-01T00:00:00Z",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/reboot/all",
            description: "전체 재부팅 응답 수신",
            qos: "1",
            payload: {
                response_type: "reboot_all_result",
                success: true,
                message: "Global reboot initiated successfully",
                affected_modules: ["camera_01", "camera_02"],
                timestamp: "2024-01-01T00:00:00Z",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/options/+",
            description: "개별 모듈 options 응답 수신",
            qos: "1",
            payload: {
                response_type: "options",
                module_id: "camera_01",
                options: {
                    supported_resolutions: ["1920x1080", "1280x720"],
                    supported_formats: ["JPG", "RAW"],
                    iso_range: [100, 6400],
                    aperture_range: ["f/1.4", "f/16"],
                },
                timestamp: "2024-01-01T00:00:00Z",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/options/all",
            description: "전체 모듈 options 응답 수신",
            qos: "1",
            payload: {
                response_type: "all_options",
                modules: {
                    camera_01: {
                        supported_resolutions: ["1920x1080", "1280x720"],
                        supported_formats: ["JPG", "RAW"],
                        iso_range: [100, 6400],
                        aperture_range: ["f/1.4", "f/16"],
                    },
                },
                timestamp: "2024-01-01T00:00:00Z",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/wiper/+",
            description: "와이퍼 동작 응답 수신",
            qos: "1",
            payload: {
                response_type: "wiper_result",
                module_id: "camera_01",
                success: true,
                message: "Wiper operation completed",
                timestamp: "2024-01-01T00:00:00Z",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/camera-on-off/+",
            description: "카메라 전원 제어 응답 수신",
            qos: "1",
            payload: {
                response_type: "camera_power_result",
                module_id: "camera_01",
                success: true,
                message: "Camera power toggled successfully",
                new_state: "on/off",
                timestamp: "2024-01-01T00:00:00Z",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/sitename/+",
            description: "사이트 이름 변경 응답 수신",
            qos: "1",
            payload: {
                response_type: "sitename_result",
                module_id: "camera_01",
                success: true,
                message: "Sitename changed successfully",
                sitename: "새로운 사이트명",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/sw-update/+",
            description: "소프트웨어 업데이트 응답 수신",
            qos: "1",
            payload: {
                success: true,
                message: "Software update completed successfully",
                version: "v1.2.3",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/sw-version/+",
            description: "소프트웨어 버전 정보 수신",
            qos: "1",
            payload: {
                commit_hash: "a1b2c3d4",
            },
        },
        {
            type: "Subscribe",
            topic: "bmtl/response/sw-rollback/+",
            description: "소프트웨어 롤백 응답 수신",
            qos: "1",
            payload: {
                success: true,
                message: "Rollback completed successfully",
            },
        },
    ];

    const connectionInfo = useMemo(
        () => ({
            broker: import.meta.env.VITE_MQTT_BROKER_HOST || "broker.hivemq.com",
            port: import.meta.env.VITE_MQTT_BROKER_PORT || "8884",
            protocol: import.meta.env.VITE_MQTT_BROKER_PROTOCOL || "wss",
            path: "/mqtt",
        }),
        []
    );

    return (
        <div className="api-docs-page">
            <div className="docs-header">
                <h1>📚 MQTT API 명세서</h1>
                <p>BMTL Control System의 MQTT 통신 프로토콜 문서</p>
            </div>

            {/* Endpoints */}
            <section className="endpoints-section">
                <h2>📡 MQTT 토픽 & 메시지</h2>
                <div className="endpoints-tiles">
                    {mqttEndpoints.map((endpoint, index) => (
                        <div key={index} className="endpoint-card">
                            <div className="endpoint-header">
                                <span className={`method ${endpoint.type.toLowerCase()}`}>{endpoint.type.toUpperCase()}</span>
                                <code className="topic">{endpoint.topic}</code>
                                <span className="qos-badge">QoS {endpoint.qos}</span>
                            </div>

                            <div className="endpoint-details">
                                <div className="description">
                                    <strong>설명:</strong> {endpoint.description}
                                </div>

                                {endpoint.payload && Object.keys(endpoint.payload).length > 0 && (
                                    <div className="payload-section">
                                        <strong>페이로드 예시:</strong>
                                        <pre className="payload-code">{JSON.stringify(endpoint.payload, null, 2)}</pre>
                                    </div>
                                )}
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
                        <span>설정 요청 (all은 헬스체크로 응답, 모듈번호는 개별 응답)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/response/settings/+</code>
                        <span>개별 설정 응답 (모듈번호)</span>
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
                        <code>bmtl/request/options/+</code>
                        <span>개별 모듈 options 요청 (모듈번호 또는 all)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/response/options/+</code>
                        <span>개별 모듈 options 응답 (모듈번호 또는 all)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/request/reboot/+</code>
                        <span>재부팅 요청 (모듈번호 또는 all)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/response/reboot/+</code>
                        <span>재부팅 응답 (모듈번호 또는 all)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/request/wiper/+</code>
                        <span>와이퍼 동작 요청 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/response/wiper/+</code>
                        <span>와이퍼 동작 응답 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/request/camera-on-off/+</code>
                        <span>카메라 전원 제어 요청 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/response/camera-on-off/+</code>
                        <span>카메라 전원 제어 응답 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/set/sitename/+</code>
                        <span>사이트 이름 변경 요청 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/response/sitename/+</code>
                        <span>사이트 이름 변경 응답 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/sw-update/+</code>
                        <span>소프트웨어 업데이트 요청 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/response/sw-update/+</code>
                        <span>소프트웨어 업데이트 응답 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/response/sw-version/+</code>
                        <span>소프트웨어 버전 정보 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/sw-rollback/+</code>
                        <span>소프트웨어 롤백 요청 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/response/sw-rollback/+</code>
                        <span>소프트웨어 롤백 응답 (모듈번호)</span>
                    </div>
                    <div className="pattern-item">
                        <code>bmtl/request/status/+</code>
                        <span>상태 요청 (all 또는 모듈번호, 헬스체크로 응답)</span>
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
                        <div>
                            <code>CONN_ERR</code>
                        </div>
                        <div>브로커 연결 실패</div>
                        <div>브로커 주소와 포트 확인</div>
                    </div>
                    <div className="error-row">
                        <div>
                            <code>AUTH_ERR</code>
                        </div>
                        <div>인증 실패</div>
                        <div>사용자명/비밀번호 확인</div>
                    </div>
                    <div className="error-row">
                        <div>
                            <code>SUB_ERR</code>
                        </div>
                        <div>구독 실패</div>
                        <div>토픽 권한 확인</div>
                    </div>
                    <div className="error-row">
                        <div>
                            <code>PUB_ERR</code>
                        </div>
                        <div>발행 실패</div>
                        <div>페이로드 크기 및 형식 확인</div>
                    </div>
                </div>
            </section>
        </div>
    );
};
