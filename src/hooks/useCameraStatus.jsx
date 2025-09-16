import { useState, useCallback, useEffect } from "react";

export const useCameraStatus = (mqttClient, subscribedTopics) => {
    const [moduleStatuses, setModuleStatuses] = useState({});
    const [moduleSettings, setModuleSettings] = useState({});
    const [moduleOptions, setModuleOptions] = useState({});
    const [localSubscribedTopics, setLocalSubscribedTopics] = useState(new Set());

    // 모듈 상태 업데이트
    const updateModuleStatus = useCallback((moduleId, statusData) => {
        setModuleStatuses((prev) => ({
            ...prev,
            [moduleId]: {
                ...prev[moduleId],
                ...statusData,
                lastUpdated: new Date(),
            },
        }));
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
                    console.error(`Failed to send reboot command to module ${moduleId}:`, err);
                } else {
                    console.log(`Reboot command sent to module ${moduleId}`, topic, payload);
                    mqttClient.emit("publish", { topic, payload, qos: 2 });
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
                    console.error(`Failed to send configure command to module ${moduleId}:`, err);
                } else {
                    console.log(`Configure command sent to module ${moduleId}:`, settings, topic, payload);
                    mqttClient.emit("publish", { topic, payload, qos: 2 });
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
                console.error("Failed to send global reboot command:", err);
            } else {
                console.log("Global reboot command sent", topic, payload);
                mqttClient.emit("publish", { topic, payload, qos: 2 });
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
                console.log("All settings request sent", topic, payload);
                mqttClient.emit("publish", { topic, payload, qos: 2 });
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
                    console.log(`Options request sent for module ${moduleId}`, topic, payload);
                    mqttClient.emit("publish", { topic, payload, qos: 2 });
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
                console.log("All options request sent", topic, payload);
                mqttClient.emit("publish", { topic, payload, qos: 2 });
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
                    console.error(`Failed to send wiper command to module ${moduleId}:`, err);
                } else {
                    console.log(`Wiper command sent to module ${moduleId}`, topic, payload);
                    mqttClient.emit("publish", { topic, payload, qos: 2 });
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
                    console.error(`Failed to send camera power command to module ${moduleId}:`, err);
                } else {
                    console.log(`Camera power command sent to module ${moduleId}`, topic, payload);
                    mqttClient.emit("publish", { topic, payload, qos: 2 });
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
                    default:
                        console.warn(`Unknown command: ${command}`);
                }
            }
        },
        [sendRebootCommand, sendConfigureCommand, sendGlobalRebootCommand, requestAllSettings, sendWiperCommand, sendCameraPowerCommand]
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
                    console.log(`Settings request sent for module ${moduleId}`, topic, payload);
                    mqttClient.emit("publish", { topic, payload, qos: 2 });
                }
            });
        },
        [mqttClient]
    );

    // 상태 요청
    const requestStatus = useCallback(() => {
        if (!mqttClient?.connected) return;

        const topic = "bmtl/request/status";
        const payload = JSON.stringify({});

        mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
            if (err) {
                console.error("Failed to request status:", err);
            } else {
                console.log("Status request sent", topic, payload);
                mqttClient.emit("publish", { topic, payload, qos: 2 });
            }
        });
    }, [mqttClient]);

    // MQTT 구독 설정 (한 번만 실행)
    useEffect(() => {
        if (!mqttClient?.connected) return;

        const topicsToSubscribe = [
            // 디바이스 헬스 상태
            "bmtl/status/health/+",
            // 전체 설정 응답
            "bmtl/response/settings/all",
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
            "bmtl/response/status",
            // 와이퍼 응답
            "bmtl/response/wiper/+",
            // 카메라 전원 응답
            "bmtl/response/camera-on-off/+",
        ];

        console.log(`📡 [MQTT Subscribe] Subscribing to ${topicsToSubscribe.length} topics for camera control:`);
        topicsToSubscribe.forEach((topic, index) => {
            mqttClient.subscribe(topic, (err) => {
                if (!err) {
                    setLocalSubscribedTopics((prev) => new Set([...prev, topic]));
                    console.log(`✅ [MQTT Subscribe] ${index + 1}/${topicsToSubscribe.length} - ${topic}`);
                } else {
                    console.error(`❌ [MQTT Subscribe] Failed to subscribe to ${topic}:`, err);
                }
            });
        });

        // 컴포넌트 언마운트 시 구독 해제
        return () => {
            topicsToSubscribe.forEach((topic) => {
                mqttClient.unsubscribe(topic);
            });
        };
    }, [mqttClient]);

    // 메시지 처리
    useEffect(() => {
        if (!mqttClient) return;

        const handleMessage = (topic, message) => {
            try {
                const data = JSON.parse(message.toString());
                console.log(`🔔 [MQTT Message] Topic: ${topic}`);
                console.log(`📄 [MQTT Message] Payload:`, data);
                console.log(`📊 [MQTT Message] Raw:`, message.toString());

                // 토픽 파싱
                const topicParts = topic.split("/");

                if (topic.startsWith("bmtl/status/health/")) {
                    // 디바이스 헬스 상태 처리
                    const moduleIdStr = topicParts[3];
                    const moduleId = parseInt(moduleIdStr, 10);
                    console.log(`💚 [Health Update] Module ${moduleId} - Status: ${data.status}, Site: ${data.site_name}`);

                    updateModuleStatus(moduleId, {
                        isConnected: data.status === "online",
                        siteName: data.site_name,
                        remainingCapacity: data.storage_used,
                        lastCaptureTime: data.last_capture_time,
                        lastBootTime: data.last_boot_time,
                        batteryLevel: data.battery_level,
                        todayTotalCaptures: data.today_total_captures,
                        todayCapturedCount: data.today_captured_count,
                        missedCaptures: data.missed_captures,
                    });
                } else if (topic.startsWith("bmtl/response/settings/")) {
                    // 설정 응답 처리
                    if (topicParts[3] === "all") {
                        // 전체 설정 응답
                        console.log(`⚙️ [Settings] All modules settings received`);
                        if (data.response_type === "all_settings") {
                            Object.entries(data.modules).forEach(([moduleKey, settings]) => {
                                const moduleId = parseInt(moduleKey.replace("camera_", ""), 10);
                                console.log(`⚙️ [Settings] Module ${moduleId} settings:`, settings);
                                updateModuleSettings(moduleId, settings);
                            });
                        }
                    } else {
                        // 개별 설정 응답
                        const moduleIdStr = topicParts[3];
                        const moduleId = parseInt(moduleIdStr, 10);
                        console.log(`⚙️ [Settings] Module ${moduleId} individual settings received`);

                        if (data.response_type === "settings") {
                            updateModuleSettings(moduleId, data.settings);
                        }
                    }
                } else if (topic.startsWith("bmtl/response/set/settings/")) {
                    // 설정 변경 응답 처리
                    const moduleIdStr = topicParts[4];
                    const moduleId = parseInt(moduleIdStr, 10);

                    console.log(`🔧 [Config Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed");
                } else if (topic.startsWith("bmtl/response/status")) {
                    // 상태 응답 처리
                    console.log("📈 [Status Response] Global status received:", data);
                } else if (topic.startsWith("bmtl/response/reboot/")) {
                    // 재부팅 응답 처리
                    const moduleIdStr = topicParts[3];

                    if (moduleIdStr === "all") {
                        console.log(`🔄 [Global Reboot Response]:`, data.success ? "✅ Success" : "❌ Failed");
                    } else {
                        const moduleId = parseInt(moduleIdStr, 10);
                        console.log(`🔄 [Reboot Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed");
                    }
                } else if (topic.startsWith("bmtl/response/options/")) {
                    // options 응답 처리
                    const moduleIdStr = topicParts[3];

                    if (moduleIdStr === "all") {
                        // 전체 options 응답
                        console.log(`🔍 [Options] All modules options received`);
                        if (data.response_type === "all_options") {
                            Object.entries(data.modules).forEach(([moduleKey, options]) => {
                                const moduleId = parseInt(moduleKey.replace("camera_", ""), 10);
                                console.log(`🔍 [Options] Module ${moduleId} options:`, options);
                                updateModuleOptions(moduleId, options);
                            });
                        }
                    } else {
                        // 개별 options 응답
                        const moduleId = parseInt(moduleIdStr, 10);
                        console.log(`🔍 [Options] Module ${moduleId} options received:`, data.options);

                        if (data.response_type === "options") {
                            updateModuleOptions(moduleId, data.options);
                        }
                    }
                } else if (topic.startsWith("bmtl/response/wiper/")) {
                    // 와이퍼 응답 처리
                    const moduleIdStr = topicParts[3];
                    const moduleId = parseInt(moduleIdStr, 10);
                    console.log(`🧽 [Wiper Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed");
                } else if (topic.startsWith("bmtl/response/camera-on-off/")) {
                    // 카메라 전원 응답 처리
                    const moduleIdStr = topicParts[3];
                    const moduleId = parseInt(moduleIdStr, 10);
                    console.log(`🔌 [Camera Power Response] Module ${moduleId}:`, data.success ? "✅ Success" : "❌ Failed", `New state: ${data.new_state || 'Unknown'}`);
                } else {
                    console.log(`❓ [Unknown Topic] Unhandled topic: ${topic}`);
                }
            } catch (error) {
                console.error("Error parsing MQTT message:", error, "Topic:", topic);
            }
        };

        mqttClient.on("message", handleMessage);

        return () => {
            mqttClient.off("message", handleMessage);
        };
    }, [mqttClient, updateModuleStatus, updateModuleSettings]);

    // 모듈 연결 상태 체크 (5분간 응답 없으면 오프라인 처리)
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setModuleStatuses((prev) => {
                const updated = { ...prev };
                Object.keys(updated).forEach((moduleId) => {
                    const lastUpdated = updated[moduleId].lastUpdated;
                    if (lastUpdated && now - lastUpdated > 5 * 60 * 1000) {
                        updated[moduleId].isConnected = false;
                    }
                });
                return updated;
            });
        }, 30000); // 30초마다 체크

        return () => clearInterval(interval);
    }, []);

    return {
        moduleStatuses,
        moduleSettings,
        moduleOptions,
        sendCommand,
        requestSettings,
        requestStatus,
        requestOptions,
        requestAllOptions,
    };
};
