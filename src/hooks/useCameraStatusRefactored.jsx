import { useEffect, useState } from 'react';
import { useModuleState } from './useModuleState';
import { useMqttCommands } from './useMqttCommands';
import { CAMERA_CONTROL_TOPICS } from '../constants/mqttTopics';
import { debugLog } from '../utils/moduleUtils';

/**
 * 리팩토링된 카메라 상태 관리 훅
 * @param {Object} mqttClient - MQTT 클라이언트
 * @param {Array} subscribedTopics - 구독된 토픽 목록
 * @param {Function} recordPublish - 발행 기록 함수
 * @returns {Object} 모듈 상태와 명령어 함수들
 */
export const useCameraStatusRefactored = (mqttClient, subscribedTopics, recordPublish) => {
    const [localSubscribedTopics, setLocalSubscribedTopics] = useState(new Set());

    // 모듈 상태 관리
    const {
        moduleStatuses,
        moduleSettings,
        moduleOptions,
        updateModuleStatus,
        updateModuleSettings,
        updateModuleOptions,
        updateConnectionStatus
    } = useModuleState();

    // MQTT 명령어 관리
    const commands = useMqttCommands(mqttClient, recordPublish);

    // 통합 명령어 핸들러 (기존 인터페이스 호환성 유지)
    const sendCommand = (moduleId, command, payload = {}) => {
        switch (command) {
            case 'reboot':
                commands.sendRebootCommand(moduleId);
                break;
            case 'configure':
                commands.sendConfigureCommand(moduleId, payload);
                break;
            case 'wiper':
                commands.sendWiperCommand(moduleId);
                break;
            case 'camera-on-off':
                commands.sendCameraPowerCommand(moduleId);
                break;
            case 'camera-power-status':
                commands.sendCameraPowerStatusCommand(moduleId);
                break;
            case 'sitename':
                commands.sendSiteNameCommand(moduleId, payload.sitename);
                break;
            case 'sw-update':
                commands.sendSwUpdateCommand(moduleId);
                break;
            case 'sw-version':
                commands.sendSwVersionCommand(moduleId);
                break;
            case 'sw-rollback':
                commands.sendSwRollbackCommand(moduleId);
                break;
            case 'status_request':
                commands.requestAllStatus();
                break;
            case 'options_request':
                commands.requestAllOptions();
                break;
            default:
                console.warn(`Unknown command: ${command}`);
        }
    };

    // MQTT 메시지 처리
    useEffect(() => {
        if (!mqttClient?.connected) return;

        const handleMessage = (topic, payload) => {
            try {
                const message = payload.toString();
                let data;

                try {
                    data = JSON.parse(message);
                } catch {
                    debugLog(`📦 [MQTT] Non-JSON message received on ${topic}: ${message}`);
                    return;
                }

                debugLog(`📩 [MQTT Message] ${topic}:`, data);

                // 토픽에서 모듈 ID 추출
                const topicParts = topic.split('/');
                const moduleId = topicParts[topicParts.length - 1];

                // 응답 타입에 따른 처리
                if (topic.includes('bmtl/status/health/')) {
                    updateModuleStatus(moduleId, {
                        ...data,
                        isConnected: true,
                        moduleId: parseInt(moduleId)
                    });
                } else if (topic.includes('bmtl/response/settings/')) {
                    updateModuleSettings(moduleId, data);
                } else if (topic.includes('bmtl/response/options/')) {
                    updateModuleOptions(moduleId, data);
                } else if (topic.includes('bmtl/response/sw-version/')) {
                    // SW 버전 응답 처리
                    const version = data.version || data.commit_hash || data.swVersion || data.sw_version;
                    debugLog(`📋 [SW Version Response] Module ${moduleId}:`, `Version: ${version || 'Unknown'}`, 'Raw data:', data);

                    if (version) {
                        updateModuleStatus(moduleId, {
                            swVersion: version,
                            isConnected: true
                        });
                    } else {
                        console.warn(`⚠️ [SW Version] No version field found for module ${moduleId}:`, data);
                    }
                } else if (topic.includes('bmtl/response/')) {
                    // 기타 응답들은 상태 업데이트
                    updateModuleStatus(moduleId, {
                        lastResponse: { topic, data, timestamp: new Date() },
                        isConnected: true
                    });
                }
            } catch (error) {
                console.error('Error processing MQTT message:', error, { topic, payload: payload.toString() });
            }
        };

        const handleConnect = () => {
            debugLog('🟢 [MQTT Client] Connected to broker');

            // 카메라 제어 토픽들 구독
            CAMERA_CONTROL_TOPICS.forEach((topic) => {
                if (!localSubscribedTopics.has(topic)) {
                    mqttClient.subscribe(topic, (err) => {
                        if (!err) {
                            setLocalSubscribedTopics(prev => new Set([...prev, topic]));
                            debugLog(`📥 [MQTT Subscribe] Subscribed to ${topic}`);
                        } else {
                            console.error(`❌ [MQTT Subscribe] Failed to subscribe to ${topic}:`, err);
                        }
                    });
                }
            });
        };

        const handleDisconnect = () => {
            debugLog('🔴 [MQTT Client] Disconnected from broker');
            setLocalSubscribedTopics(new Set());
        };

        const handleError = (error) => {
            console.error('❌ [MQTT Client] Error:', error);
        };

        // 이벤트 리스너 등록
        mqttClient.on('message', handleMessage);
        mqttClient.on('connect', handleConnect);
        mqttClient.on('disconnect', handleDisconnect);
        mqttClient.on('error', handleError);

        // 이미 연결된 경우 구독 처리
        if (mqttClient.connected) {
            handleConnect();
        }

        return () => {
            mqttClient.off('message', handleMessage);
            mqttClient.off('connect', handleConnect);
            mqttClient.off('disconnect', handleDisconnect);
            mqttClient.off('error', handleError);
        };
    }, [mqttClient, localSubscribedTopics, updateModuleStatus, updateModuleSettings, updateModuleOptions]);

    // 연결 상태 모니터링 (5분 타임아웃)
    useEffect(() => {
        const interval = setInterval(() => {
            updateConnectionStatus(5);

            if (process.env.NODE_ENV === 'development') {
                debugLog(`📊 [MQTT Status] Subscribed topics: ${localSubscribedTopics.size}`);
            }
        }, 30000); // 30초마다 체크

        return () => clearInterval(interval);
    }, [updateConnectionStatus, localSubscribedTopics]);

    return {
        moduleStatuses,
        moduleSettings,
        moduleOptions,
        sendCommand,
        requestSettings: commands.requestSettings,
        requestOptions: commands.requestOptions,
        requestAllOptions: commands.requestAllOptions,
    };
};