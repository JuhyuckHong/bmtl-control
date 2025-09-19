import { useState, useCallback, useEffect } from "react";

const CAMERA_CONTROL_TOPICS = [
    // 서비스 상태
    "bmtl/status/health/+",
    // 개별 설정 응답
    "bmtl/response/settings/+",
    // 설정 변경 응답
    "bmtl/response/set/settings/+",
    // 재부팅 응답
    "bmtl/response/reboot/+",
    "bmtl/response/reboot/all",
    // 개별 options 응답
    "bmtl/response/options/+",
    // 전체 options 응답
    "bmtl/response/options/all",
    // 상태 응답
    // 와이퍼 응답
    "bmtl/response/wiper/+",
    // 카메라 전원 응답
    "bmtl/response/camera-on-off/+",
    // 사이트명 응답
    "bmtl/response/sitename/+",
    // SW 업데이트 응답
    "bmtl/response/sw-update/+",
    // SW 버전 응답
    "bmtl/response/sw-version/+",
];

const hasStatusDiff = (existingModule, statusData = {}) => {
    if (!existingModule) {
        return true;
    }

    return Object.entries(statusData).some(([key, value]) => existingModule[key] !== value);
};

export const useCameraStatus = (mqttClient, subscribedTopics, recordPublish) => {
    const [moduleStatuses, setModuleStatuses] = useState({});
    const [moduleSettings, setModuleSettings] = useState({});
    const [moduleOptions, setModuleOptions] = useState({});
    const [localSubscribedTopics, setLocalSubscribedTopics] = useState(new Set());
    const isDevelopment = process.env.NODE_ENV === "development";
    const debugLog = (...args) => {
        if (isDevelopment) {
            window.console.log(...args);
        }
    };

    // 모듈 상태 업데이트
    const updateModuleStatus = useCallback((moduleId, statusData = {}) => {
        setModuleStatuses((prev) => {
            const existingModule = prev[moduleId];
            const nextTimestamp = new Date();
            const hasChange = hasStatusDiff(existingModule, statusData);
            const baseModule = existingModule || {};

            const nextModule = hasChange
                ? { ...baseModule, ...statusData, lastUpdated: nextTimestamp }
                : { ...baseModule, lastUpdated: nextTimestamp };

            return {
                ...prev,
                [moduleId]: nextModule,
            };
        });
    }, []);

    // 모듈 설정 업데이트
    const updateModuleSettings = useCallback((moduleId, settingsData) => {
        setModuleSettings((prev) => ({
            ...prev,
            [moduleId]: settingsData,
        }));
    }, []);

    // 모듈 options 업데이트
    const updateModuleOptions = useCallback((moduleId, optionsData) => {
        setModuleOptions((prev) => ({
            ...prev,
            [moduleId]: optionsData,
        }));
    }, []);

    // 개별 모듈 재부팅
    const sendRebootCommand = useCallback(
        (moduleId) => {
            if (!mqttClient?.connected) return;

            const topic = `bmtl/request/reboot/${moduleId.toString().padStart(2, "0")}`;
            const payload = JSON.stringify({});

            mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
                if (err) {
                    console.error(`❌ [MQTT Publish] Failed to send reboot command to module ${moduleId}:`, err);
                } else {
                    debugLog(`🚀 [MQTT Publish] Reboot command sent to module ${moduleId}`);
                    debugLog(`📡 [MQTT Publish] Topic: ${topic}`);
                    debugLog(`📦 [MQTT Publish] Payload: ${payload}`);
                    if (recordPublish) {
                        recordPublish(topic, payload, 2);
                    }
                }
            });
        },
        [mqttClient]
    );

    // 개별 모듈 설정 변경
    const sendConfigureCommand = useCallback(
        (moduleId, settings) => {
            if (!mqttClient?.connected) return;

            const topic = `bmtl/set/settings/${moduleId.toString().padStart(2, "0")}`;
            const payload = JSON.stringify(settings);

            mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
                if (err) {
                    console.error(`❌ [MQTT Publish] Failed to send configure command to module ${moduleId}:`, err);
                } else {
                    debugLog(`🚀 [MQTT Publish] Configure command sent to module ${moduleId}`);
                    debugLog(`📡 [MQTT Publish] Topic: ${topic}`);
                    debugLog(`📦 [MQTT Publish] Payload: ${payload}`);
                    if (recordPublish) {
                        recordPublish(topic, payload, 2);
                    }
                }
            });
        },
        [mqttClient]
    );

    // 전체 재부팅
    const sendGlobalRebootCommand = useCallback(() => {
        if (!mqttClient?.connected) return;

        const topic = "bmtl/request/reboot/all";
        const payload = JSON.stringify({});

        mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
            if (err) {
                console.error("❌ [MQTT Publish] Failed to send global reboot command:", err);
            } else {
                debugLog("🚀 [MQTT Publish] Global reboot command sent");
                debugLog(`📡 [MQTT Publish] Topic: ${topic}`);
                debugLog(`📦 [MQTT Publish] Payload: ${payload}`);
                if (recordPublish) {
                    recordPublish(topic, payload, 2);
                }
            }
        });
    }, [mqttClient]);

    // 전체 설정 불러오기
    const requestAllSettings = useCallback(() => {
        if (!mqttClient?.connected) return;

        const topic = "bmtl/request/settings/all";
        const payload = JSON.stringify({});

        mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
            if (err) {
                console.error("Failed to request all settings:", err);
            } else {
                debugLog("All settings request sent", topic, payload);
                if (recordPublish) {
                    recordPublish(topic, payload, 2);
                }
            }
        });
    }, [mqttClient]);

    // 개별 모듈 options 요청
    const requestOptions = useCallback(
        (moduleId) => {
            if (!mqttClient?.connected) return;

            const topic = `bmtl/request/options/${moduleId.toString().padStart(2, "0")}`;
            const payload = JSON.stringify({});

            mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
                if (err) {
                    console.error(`Failed to request options for module ${moduleId}:`, err);
                } else {
                    debugLog(`Options request sent for module ${moduleId}`, topic, payload);
                    if (recordPublish) {
                        recordPublish(topic, payload, 2);
                    }
                }
            });
        },
        [mqttClient]
    );

    // 전체 모듈 options 요청
    const requestAllOptions = useCallback(() => {
        if (!mqttClient?.connected) return;

        const topic = "bmtl/request/options/all";
        const payload = JSON.stringify({});

        mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
            if (err) {
                console.error("Failed to request all options:", err);
            } else {
                debugLog("All options request sent", topic, payload);
                if (recordPublish) {
                    recordPublish(topic, payload, 2);
                }
            }
        });
    }, [mqttClient]);

    // 와이퍼 30초 동작 명령
    const sendWiperCommand = useCallback(
        (moduleId) => {
            if (!mqttClient?.connected) return;

            const topic = `bmtl/request/wiper/${moduleId.toString().padStart(2, "0")}`;
            const payload = JSON.stringify({});

            mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
                if (err) {
                    console.error(`❌ [MQTT Publish] Failed to send wiper command to module ${moduleId}:`, err);
                } else {
                    debugLog(`🚀 [MQTT Publish] Wiper command sent to module ${moduleId}`);
                    debugLog(`📡 [MQTT Publish] Topic: ${topic}`);
                    debugLog(`📦 [MQTT Publish] Payload: ${payload}`);
                    if (recordPublish) {
                        recordPublish(topic, payload, 2);
                    }
                }
            });
        },
        [mqttClient]
    );

    // 카메라 전원 On/Off 명령
    const sendCameraPowerCommand = useCallback(
        (moduleId) => {
            if (!mqttClient?.connected) return;

            const topic = `bmtl/request/camera-on-off/${moduleId.toString().padStart(2, "0")}`;
            const payload = JSON.stringify({});

            mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
                if (err) {
                    console.error(`❌ [MQTT Publish] Failed to send camera power command to module ${moduleId}:`, err);
                } else {
                    debugLog(`🚀 [MQTT Publish] Camera power command sent to module ${moduleId}`);
                    debugLog(`📡 [MQTT Publish] Topic: ${topic}`);
                    debugLog(`📦 [MQTT Publish] Payload: ${payload}`);
                    if (recordPublish) {
                        recordPublish(topic, payload, 2);
                    }
                }
            });
        },
        [mqttClient]
    );

    // 사이트 이름 변경 명령
    const sendSiteNameCommand = useCallback(
        (moduleId, siteName) => {
            if (!mqttClient?.connected) return;

            const topic = `bmtl/set/sitename/${moduleId.toString().padStart(2, "0")}`;
            const payload = JSON.stringify({ sitename: siteName });

            mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
                if (err) {
                    console.error(`❌ [MQTT Publish] Failed to send sitename command to module ${moduleId}:`, err);
                } else {
                    debugLog(`🚀 [MQTT Publish] Sitename command sent to module ${moduleId}`);
                    debugLog(`📡 [MQTT Publish] Topic: ${topic}`);
                    debugLog(`📦 [MQTT Publish] Payload: ${payload}`);
                    if (recordPublish) {
                        recordPublish(topic, payload, 2);
                    }
                }
            });
        },
        [mqttClient]
    );

    // SW 업데이트 명령
    const sendSwUpdateCommand = useCallback(
        (moduleId) => {
            if (!mqttClient?.connected) return;

            const topic = `bmtl/sw-update/${moduleId.toString().padStart(2, "0")}`;
            const payload = JSON.stringify({});

            mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
                if (err) {
                    console.error(`❌ [MQTT Publish] Failed to send SW update command to module ${moduleId}:`, err);
                } else {
                    debugLog(`🚀 [MQTT Publish] SW update command sent to module ${moduleId}`);
                    debugLog(`📡 [MQTT Publish] Topic: ${topic}`);
                    debugLog(`📦 [MQTT Publish] Payload: ${payload}`);
                    if (recordPublish) {
                        recordPublish(topic, payload, 2);
                    }
                }
            });
        },
        [mqttClient]
    );

    // 개별 모듈 설정 요청
    const requestSettings = useCallback(
        (moduleId) => {
            if (!mqttClient?.connected) return;

            const topic = `bmtl/request/settings/${moduleId.toString().padStart(2, "0")}`;
            const payload = JSON.stringify({});

            mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
                if (err) {
                    console.error(`Failed to request settings for module ${moduleId}:`, err);
                } else {
                    debugLog(`Settings request sent for module ${moduleId}`, topic, payload);
                    if (recordPublish) {
                        recordPublish(topic, payload, 2);
                    }
                }
            });
        },
        [mqttClient]
    );

    // 통합 명령 전송 함수 (기존 호환성)
    const sendCommand = useCallback(
        (moduleId, command, data) => {
            if (moduleId === "global") {
                // 전체 시스템 명령 처리
                switch (command) {
                    case "reboot":
                        sendGlobalRebootCommand();
                        break;
                    case "status_request":
                        requestAllSettings();
                        break;
                    case "options_request":
                        requestAllOptions();
                        break;
                    default:
                        console.warn(`Unknown global command: ${command}`);
                }
            } else {
                // 개별 모듈 명령 처리
                switch (command) {
                    case "reboot":
                        sendRebootCommand(moduleId);
                        break;
                    case "configure":
                        sendConfigureCommand(moduleId, data);
                        break;
                    case "status_request":
                        requestSettings(moduleId);
                        break;
                    case "options_request":
                        requestOptions(moduleId);
                        break;
                    case "wiper":
                        sendWiperCommand(moduleId);
                        break;
                    case "camera-on-off":
                        sendCameraPowerCommand(moduleId);
                        break;
                    case "sitename":
                        sendSiteNameCommand(moduleId, data.sitename);
                        break;
                    case "sw-update":
                        sendSwUpdateCommand(moduleId);
                        break;
                    default:
                        console.warn(`Unknown command: ${command}`);
                }
            }
        },
        [sendRebootCommand, sendConfigureCommand, sendGlobalRebootCommand, requestAllSettings, requestAllOptions, requestSettings, requestOptions, sendWiperCommand, sendCameraPowerCommand, sendSiteNameCommand, sendSwUpdateCommand]
    );

    // 개별 모듈 설정 요청
    // MQTT 구독 설정은 connect 이벤트에서 처리

    // 메시지 처리
    useEffect(() => {
        if (!mqttClient) return;

        const handleMessage = (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                // 개발 모드에서만 상세 로그 출력
                if (process.env.NODE_ENV === 'development') {
                    debugLog(`🔔 [MQTT Message] Topic: ${topic}`, data);
                }

                // 토픽 파싱
                const topicParts = topic.split("/");

                if (topic.startsWith("bmtl/status/health/")) {
                    // 디바이스 헬스 상태 처리 (메시지를 받으면 온라인으로 간주)
                    const moduleIdStr = topicParts[3];
                    const moduleId = parseInt(moduleIdStr, 10);
                    if (process.env.NODE_ENV === 'development') {
                        debugLog(`💚 [Health Update] Module ${moduleId} - Online, Site: ${data.site_name}`);
                    }

                    updateModuleStatus(moduleId, {
                        isConnected: true, // 메시지를 받으면 온라인으로 처리
                        siteName: data.site_name,
                        remainingCapacity: data.storage_used,
                        lastCaptureTime: data.last_capture_time,
                        lastBootTime: data.last_boot_time,
                        todayTotalCaptures: data.today_total_captures,
                        todayCapturedCount: data.today_captured_count,
                        missedCaptures: data.missed_captures,
                        swVersion: data.sw_version || data.swVersion, // SW 버전 정보 추가
                    });
                } else if (topic.startsWith("bmtl/response/settings/")) {
                    // 설정 응답 처리
                    if (topicParts[3] === "all") {
                        // 전체 설정 응답
                        debugLog(`⚙️ [Settings] All modules settings received`);
                        if (data.response_type === "all_settings") {
                            Object.entries(data.modules).forEach(([moduleKey, settings]) => {
                                const moduleId = parseInt(moduleKey.replace("camera_", ""), 10);
                                debugLog(`⚙️ [Settings] Module ${moduleId} settings:`, settings);
                                updateModuleSettings(moduleId, settings);
                            });
                        }
                    } else {
                        // 개별 설정 응답
                        const moduleIdStr = topicParts[3];
                        const moduleId = parseInt(moduleIdStr, 10);
                        debugLog(`⚙️ [Settings] Module ${moduleId} individual settings received`);

                        if (data.response_type === "settings") {
                            updateModuleSettings(moduleId, data.settings);
                        }
                    }
                } else if (topic.startsWith("bmtl/response/set/settings/")) {
                    // 설정 변경 응답 처리
                    const moduleIdStr = topicParts[4];
                    const moduleId = parseInt(moduleIdStr, 10);

                    debugLog(`🔧 [Config Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed");
                } else if (topic.startsWith("bmtl/response/reboot/")) {
                    // 재부팅 응답 처리
                    const moduleIdStr = topicParts[3];

                    if (moduleIdStr === "all") {
                        debugLog(`🔄 [Global Reboot Response]:`, data.success ? "✅ Success" : "❌ Failed");
                    } else {
                        const moduleId = parseInt(moduleIdStr, 10);
                        debugLog(`🔄 [Reboot Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed");
                    }
                } else if (topic.startsWith("bmtl/response/options/")) {
                    // options 응답 처리
                    const moduleIdStr = topicParts[3];

                    if (moduleIdStr === "all") {
                        // 전체 options 응답
                        debugLog(`🔍 [Options] All modules options received`);
                        if (data.response_type === "all_options") {
                            Object.entries(data.modules).forEach(([moduleKey, options]) => {
                                const moduleId = parseInt(moduleKey.replace("camera_", ""), 10);
                                debugLog(`🔍 [Options] Module ${moduleId} options:`, options);
                                updateModuleOptions(moduleId, options);
                            });
                        }
                    } else {
                        // 개별 options 응답
                        const moduleId = parseInt(moduleIdStr, 10);
                        debugLog(`🔍 [Options] Module ${moduleId} options received:`, data.options);

                        if (data.response_type === "options") {
                            updateModuleOptions(moduleId, data.options);
                        }
                    }
                } else if (topic.startsWith("bmtl/response/wiper/")) {
                    // 와이퍼 응답 처리
                    const moduleIdStr = topicParts[3];
                    const moduleId = parseInt(moduleIdStr, 10);
                    debugLog(`🧽 [Wiper Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed");
                } else if (topic.startsWith("bmtl/response/camera-on-off/")) {
                    // 카메라 전원 응답 처리
                    const moduleIdStr = topicParts[3];
                    const moduleId = parseInt(moduleIdStr, 10);
                    debugLog(`🔌 [Camera Power Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed", `New state: ${data.new_state || 'Unknown'}`);
                } else if (topic.startsWith("bmtl/response/sitename/")) {
                    // 사이트 이름 변경 응답 처리
                    const moduleIdStr = topicParts[3];
                    const moduleId = parseInt(moduleIdStr, 10);
                    debugLog(`🏷️ [Sitename Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed", `New sitename: ${data.sitename || 'Unknown'}`);

                    // 성공 시 모듈 상태 업데이트
                    if (data.success && data.sitename) {
                        updateModuleStatus(moduleId, {
                            siteName: data.sitename,
                        });
                    }
                } else if (topic.startsWith("bmtl/response/sw-update/")) {
                    // SW 업데이트 응답 처리
                    const moduleIdStr = topicParts[3];
                    const moduleId = parseInt(moduleIdStr, 10);
                    debugLog(`💿 [SW Update Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed", `Version: ${data.version || 'Unknown'}`);

                    // 성공 시 모듈 상태 업데이트 (새 SW 버전 반영)
                    if (data.success && data.version) {
                        updateModuleStatus(moduleId, {
                            swVersion: data.version,
                        });
                    }
                } else if (topic.startsWith("bmtl/response/sw-version/")) {
                    // SW 버전 응답 처리
                    const moduleIdStr = topicParts[3];
                    const moduleId = parseInt(moduleIdStr, 10);
                    debugLog(`📋 [SW Version Response] Module ${moduleId}:`, `Commit Hash: ${data.commit_hash || 'Unknown'}`);

                    // SW 버전 정보 업데이트
                    if (data.commit_hash) {
                        updateModuleStatus(moduleId, {
                            swVersion: data.commit_hash,
                        });
                    }
                } else {
                    debugLog(`❓ [Unknown Topic] Unhandled topic: ${topic}`);
                }
            } catch (error) {
                console.error("Error parsing MQTT message:", error, "Topic:", topic);
            }
        };

        const handleConnect = () => {
            debugLog("🟢 [MQTT Client] Connected to broker");

            // 연결 시 토픽 구독

            debugLog(`📡 [MQTT Subscribe] Subscribing to ${CAMERA_CONTROL_TOPICS.length} topics for camera control:`);
            CAMERA_CONTROL_TOPICS.forEach((topic, index) => {
                mqttClient.subscribe(topic, (err) => {
                    if (!err) {
                        setLocalSubscribedTopics((prev) => new Set([...prev, topic]));
                        debugLog(`✅ [MQTT Subscribe] ${index + 1}/${CAMERA_CONTROL_TOPICS.length} - ${topic}`);
                    } else {
                        console.error(`❌ [MQTT Subscribe] Failed to subscribe to ${topic}:`, err);
                    }
                });
            });
        };

        const handleDisconnect = () => {
            debugLog("🔴 [MQTT Client] Disconnected from broker");
            // 연결 해제 시 구독 상태 초기화
            setLocalSubscribedTopics(new Set());
        };

        const handleReconnect = () => {
            debugLog("🔄 [MQTT Client] Reconnecting to broker");
        };

        const handleError = (error) => {
            console.error("❌ [MQTT Client] Error:", error);
        };

        const handleOffline = () => {
            debugLog("📴 [MQTT Client] Gone offline");
        };

        const handleClose = () => {
            debugLog("🚪 [MQTT Client] Connection closed");
        };

        mqttClient.on("message", handleMessage);
        mqttClient.on("connect", handleConnect);
        mqttClient.on("disconnect", handleDisconnect);
        mqttClient.on("reconnect", handleReconnect);
        mqttClient.on("error", handleError);
        mqttClient.on("offline", handleOffline);
        mqttClient.on("close", handleClose);

        return () => {
            mqttClient.off("message", handleMessage);
            mqttClient.off("connect", handleConnect);
            mqttClient.off("disconnect", handleDisconnect);
            mqttClient.off("reconnect", handleReconnect);
            mqttClient.off("error", handleError);
            mqttClient.off("offline", handleOffline);
            mqttClient.off("close", handleClose);
        };
    }, [mqttClient, updateModuleStatus, updateModuleSettings]);

    // 모듈 연결 상태 체크 및 구독 상태 로깅 (5분간 응답 없으면 오프라인 처리)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();

            // 개발 모드에서만 상태 로깅
            if (process.env.NODE_ENV === 'development') {
                debugLog(`📊 [MQTT Status] Subscribed topics: ${localSubscribedTopics.size}`);
            }

            setModuleStatuses((prev) => {
                const updated = {};
                let hasChanges = false;

                Object.keys(prev).forEach((moduleId) => {
                    const module = prev[moduleId];
                    const lastUpdated = module.lastUpdated;

                    if (lastUpdated && now - lastUpdated > 5 * 60 * 1000 && module.isConnected !== false) {
                        updated[moduleId] = { ...module, isConnected: false };
                        hasChanges = true;
                    } else {
                        updated[moduleId] = module;
                    }
                });

                return hasChanges ? updated : prev;
            });
        }, 30000); // 30초마다 체크

        return () => clearInterval(interval);
    }, [localSubscribedTopics]); // moduleStatuses 의존성 제거

    return {
        moduleStatuses,
        moduleSettings,
        moduleOptions,
        sendCommand,
        requestSettings,
        requestOptions,
        requestAllOptions,
    };
};
