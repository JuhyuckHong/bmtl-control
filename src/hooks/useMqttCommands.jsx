import { useCallback } from 'react';
import { MQTT_QOS, TOPIC_PREFIXES } from '../constants/mqttTopics';
import { createMqttTopic, debugLog } from '../utils/moduleUtils';

/**
 * MQTT 명령어 전송을 위한 커스텀 훅
 * @param {Object} mqttClient - MQTT 클라이언트 인스턴스
 * @param {Function} recordPublish - 발행 기록 함수
 * @returns {Object} 명령어 전송 함수들
 */
export const useMqttCommands = (mqttClient, recordPublish) => {

    /**
     * 일반적인 MQTT 명령어 전송
     */
    const sendCommand = useCallback((topic, payload, qos = MQTT_QOS.EXACTLY_ONCE) => {
        if (!mqttClient?.connected) {
            console.warn('MQTT client is not connected');
            return;
        }

        const payloadString = JSON.stringify(payload);

        mqttClient.publish(topic, payloadString, { qos }, (err) => {
            if (err) {
                console.error(`❌ [MQTT Publish] Failed to send command:`, err);
                console.error(`📡 Topic: ${topic}`);
                console.error(`📦 Payload: ${payloadString}`);
            } else {
                debugLog(`🚀 [MQTT Publish] Command sent successfully`);
                debugLog(`📡 Topic: ${topic}`);
                debugLog(`📦 Payload: ${payloadString}`);

                if (recordPublish) {
                    recordPublish(topic, payloadString, qos);
                }
            }
        });
    }, [mqttClient, recordPublish]);

    /**
     * 개별 모듈 재부팅
     */
    const sendRebootCommand = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'reboot', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 전체 재부팅
     */
    const sendGlobalRebootCommand = useCallback(() => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'reboot/all');
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 모듈 설정 변경
     */
    const sendConfigureCommand = useCallback((moduleId, settings) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.SET, 'settings', moduleId);
        sendCommand(topic, settings);
    }, [sendCommand]);

    /**
     * 와이퍼 명령
     */
    const sendWiperCommand = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'wiper', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 카메라 전원 토글
     */
    const sendCameraPowerCommand = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'camera-on-off', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 카메라 전원 상태 확인
     */
    const sendCameraPowerStatusCommand = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'camera-power-status', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 사이트명 변경
     */
    const sendSiteNameCommand = useCallback((moduleId, siteName) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.SET, 'sitename', moduleId);
        sendCommand(topic, { sitename: siteName });
    }, [sendCommand]);

    /**
     * SW 업데이트
     */
    const sendSwUpdateCommand = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'sw-update', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * SW 버전 요청
     */
    const sendSwVersionCommand = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'sw-version', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * SW 롤백
     */
    const sendSwRollbackCommand = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'sw-rollback', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 개별 설정 요청
     */
    const requestSettings = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'settings', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 개별 옵션 요청
     */
    const requestOptions = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'options', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 전체 옵션 요청
     */
    const requestAllOptions = useCallback(() => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'options/all');
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 상태 요청
     */
    const requestStatus = useCallback((moduleId) => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'status', moduleId);
        sendCommand(topic, {});
    }, [sendCommand]);

    /**
     * 전체 상태 요청
     */
    const requestAllStatus = useCallback(() => {
        const topic = createMqttTopic(TOPIC_PREFIXES.REQUEST, 'status/all');
        sendCommand(topic, {});
    }, [sendCommand]);

    return {
        sendCommand,
        sendRebootCommand,
        sendGlobalRebootCommand,
        sendConfigureCommand,
        sendWiperCommand,
        sendCameraPowerCommand,
        sendCameraPowerStatusCommand,
        sendSiteNameCommand,
        sendSwUpdateCommand,
        sendSwVersionCommand,
        sendSwRollbackCommand,
        requestSettings,
        requestOptions,
        requestAllOptions,
        requestStatus,
        requestAllStatus
    };
};