import { useState, useCallback, useEffect } from 'react';

export const useCameraStatus = (mqttClient, subscribedTopics) => {
  const [moduleStatuses, setModuleStatuses] = useState({});
  const [moduleSettings, setModuleSettings] = useState({});
  const [moduleCapabilities, setModuleCapabilities] = useState({});
  const subscribedTopicsSet = new Set(subscribedTopics);

  // 모듈 상태 업데이트
  const updateModuleStatus = useCallback((moduleId, statusData) => {
    setModuleStatuses(prev => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        ...statusData,
        lastUpdated: new Date()
      }
    }));
  }, []);

  // 모듈 설정 업데이트
  const updateModuleSettings = useCallback((moduleId, settingsData) => {
    setModuleSettings(prev => ({
      ...prev,
      [moduleId]: settingsData
    }));
  }, []);

  // 모듈 capabilities 업데이트
  const updateModuleCapabilities = useCallback((moduleId, capabilitiesData) => {
    setModuleCapabilities(prev => ({
      ...prev,
      [moduleId]: capabilitiesData
    }));
  }, []);

  // 개별 모듈 재부팅
  const sendRebootCommand = useCallback((moduleId) => {
    if (!mqttClient?.connected) return;

    const topic = `bmtl/camera/${moduleId.toString().padStart(2, '0')}/reboot`;
    const payload = JSON.stringify({
      command: 'reboot',
      module_id: `camera_${moduleId.toString().padStart(2, '0')}`,
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to send reboot command to module ${moduleId}:`, err);
      } else {
        console.log(`Reboot command sent to module ${moduleId}`);
        mqttClient.emit('publish', { topic, payload, qos: 1 });
      }
    });
  }, [mqttClient]);

  // 개별 모듈 설정 변경
  const sendConfigureCommand = useCallback((moduleId, settings) => {
    if (!mqttClient?.connected) return;

    const topic = `bmtl/set/settings/${moduleId.toString().padStart(2, '0')}`;
    const payload = JSON.stringify({
      command: 'set_settings',
      module_id: `camera_${moduleId.toString().padStart(2, '0')}`,
      settings,
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 2 }, (err) => {
      if (err) {
        console.error(`Failed to send configure command to module ${moduleId}:`, err);
      } else {
        console.log(`Configure command sent to module ${moduleId}:`, settings);
        mqttClient.emit('publish', { topic, payload, qos: 2 });
      }
    });
  }, [mqttClient]);

  // 전체 재부팅
  const sendGlobalRebootCommand = useCallback(() => {
    if (!mqttClient?.connected) return;

    const topic = 'bmtl/system/global/reboot';
    const payload = JSON.stringify({
      command: 'reboot_all',
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('Failed to send global reboot command:', err);
      } else {
        console.log('Global reboot command sent');
        mqttClient.emit('publish', { topic, payload, qos: 1 });
      }
    });
  }, [mqttClient]);

  // 전체 설정 불러오기
  const requestAllSettings = useCallback(() => {
    if (!mqttClient?.connected) return;

    const topic = 'bmtl/request/settings/all';
    const payload = JSON.stringify({
      command: 'get_settings',
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('Failed to request all settings:', err);
      } else {
        console.log('All settings request sent');
        mqttClient.emit('publish', { topic, payload, qos: 1 });
      }
    });
  }, [mqttClient]);

  // 개별 모듈 capabilities 요청
  const requestCapabilities = useCallback((moduleId) => {
    if (!mqttClient?.connected) return;

    const topic = `bmtl/camera/${moduleId.toString().padStart(2, '0')}/capabilities/request`;
    const payload = JSON.stringify({
      command: 'get_capabilities',
      module_id: `camera_${moduleId.toString().padStart(2, '0')}`,
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to request capabilities for module ${moduleId}:`, err);
      } else {
        console.log(`Capabilities request sent for module ${moduleId}`);
        mqttClient.emit('publish', { topic, payload, qos: 1 });
      }
    });
  }, [mqttClient]);

  // 전체 모듈 capabilities 요청
  const requestAllCapabilities = useCallback(() => {
    if (!mqttClient?.connected) return;

    const topic = 'bmtl/system/global/capabilities/request';
    const payload = JSON.stringify({
      command: 'get_all_capabilities',
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('Failed to request all capabilities:', err);
      } else {
        console.log('All capabilities request sent');
        mqttClient.emit('publish', { topic, payload, qos: 1 });
      }
    });
  }, [mqttClient]);

  // 통합 명령 전송 함수 (기존 호환성)
  const sendCommand = useCallback((moduleId, command, data) => {
    if (moduleId === 'global') {
      // 전체 시스템 명령 처리
      switch (command) {
        case 'reboot':
          sendGlobalRebootCommand();
          break;
        case 'status_request':
          requestAllSettings();
          break;
        default:
          console.warn(`Unknown global command: ${command}`);
      }
    } else {
      // 개별 모듈 명령 처리
      switch (command) {
        case 'reboot':
          sendRebootCommand(moduleId);
          break;
        case 'configure':
          sendConfigureCommand(moduleId, data);
          break;
        case 'status_request':
          requestSettings(moduleId);
          break;
        default:
          console.warn(`Unknown command: ${command}`);
      }
    }
  }, [sendRebootCommand, sendConfigureCommand, sendGlobalRebootCommand, requestAllSettings]);

  // 개별 모듈 설정 요청
  const requestSettings = useCallback((moduleId) => {
    if (!mqttClient?.connected) return;

    const topic = `bmtl/request/settings/${moduleId.toString().padStart(2, '0')}`;
    const payload = JSON.stringify({
      command: 'get_settings',
      module_id: `camera_${moduleId.toString().padStart(2, '0')}`,
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to request settings for module ${moduleId}:`, err);
      } else {
        console.log(`Settings request sent for module ${moduleId}`);
        mqttClient.emit('publish', { topic, payload, qos: 1 });
      }
    });
  }, [mqttClient]);

  // 상태 요청
  const requestStatus = useCallback(() => {
    if (!mqttClient?.connected) return;

    const topic = 'bmtl/request/status';
    const payload = JSON.stringify({
      command: 'get_status',
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error('Failed to request status:', err);
      } else {
        console.log('Status request sent');
        mqttClient.emit('publish', { topic, payload, qos: 1 });
      }
    });
  }, [mqttClient]);

  // MQTT 구독 설정
  useEffect(() => {
    if (!mqttClient?.connected) return;

    const topicsToSubscribe = [
      // 디바이스 헬스 상태
      'bmtl/status/health/+',
      // 전체 설정 응답
      'bmtl/response/settings/all',
      // 개별 설정 응답
      'bmtl/response/settings/+',
      // 설정 변경 응답
      'bmtl/response/set/settings/+',
      // 재부팅 응답
      'bmtl/camera/+/reboot/response',
      // 개별 capabilities 응답
      'bmtl/camera/+/capabilities/response',
      // 전체 capabilities 응답
      'bmtl/system/global/capabilities/response',
      // 상태 응답
      'bmtl/response/status'
    ];

    topicsToSubscribe.forEach(topic => {
      if (!subscribedTopicsSet.has(topic)) {
        mqttClient.subscribe(topic, (err) => {
          if (!err) {
            subscribedTopicsSet.add(topic);
            console.log(`Subscribed to: ${topic}`);
          } else {
            console.error(`Failed to subscribe to ${topic}:`, err);
          }
        });
      }
    });
  }, [mqttClient, subscribedTopicsSet]);

  // 메시지 처리
  useEffect(() => {
    if (!mqttClient) return;

    const handleMessage = (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log(`Received message on ${topic}:`, data);

        // 토픽 파싱
        const topicParts = topic.split('/');

        if (topic.startsWith('bmtl/status/health/')) {
          // 디바이스 헬스 상태 처리
          const moduleIdStr = topicParts[3];
          const moduleId = parseInt(moduleIdStr, 10);

          updateModuleStatus(moduleId, {
            isConnected: data.status === 'online',
            siteName: data.site_name,
            remainingCapacity: data.storage_used,
            lastCaptureTime: data.last_capture_time,
            lastBootTime: data.last_boot_time,
            batteryLevel: data.battery_level,
            todayTotalCaptures: data.today_total_captures,
            todayCapturedCount: data.today_captured_count,
            missedCaptures: data.missed_captures
          });
        } else if (topic.startsWith('bmtl/response/settings/')) {
          // 설정 응답 처리
          if (topicParts[3] === 'all') {
            // 전체 설정 응답
            if (data.response_type === 'all_settings') {
              Object.entries(data.modules).forEach(([moduleKey, settings]) => {
                const moduleId = parseInt(moduleKey.replace('camera_', ''), 10);
                updateModuleSettings(moduleId, settings);
              });
            }
          } else {
            // 개별 설정 응답
            const moduleIdStr = topicParts[3];
            const moduleId = parseInt(moduleIdStr, 10);

            if (data.response_type === 'settings') {
              updateModuleSettings(moduleId, data.settings);
            }
          }
        } else if (topic.startsWith('bmtl/response/set/settings/')) {
          // 설정 변경 응답 처리
          const moduleIdStr = topicParts[4];
          const moduleId = parseInt(moduleIdStr, 10);

          console.log(`Configure response for module ${moduleId}:`, data.success ? 'Success' : 'Failed');
        } else if (topic.startsWith('bmtl/response/status')) {
          // 상태 응답 처리
          console.log('Status response received:', data);
        } else if (topic.includes('/reboot/response')) {
          // 재부팅 응답 처리
          const moduleIdStr = topicParts[2];
          const moduleId = parseInt(moduleIdStr, 10);

          console.log(`Reboot response for module ${moduleId}:`, data.success ? 'Success' : 'Failed');
        } else if (topic.includes('/capabilities/response')) {
          // 개별 capabilities 응답 처리
          const moduleIdStr = topicParts[2];
          const moduleId = parseInt(moduleIdStr, 10);

          if (data.response_type === 'capabilities') {
            updateModuleCapabilities(moduleId, data.capabilities);
          }
        } else if (topic.includes('/global/capabilities/response')) {
          // 전체 capabilities 응답 처리
          if (data.response_type === 'all_capabilities') {
            Object.entries(data.modules).forEach(([moduleKey, capabilities]) => {
              const moduleId = parseInt(moduleKey.replace('camera_', ''), 10);
              updateModuleCapabilities(moduleId, capabilities);
            });
          }
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error, 'Topic:', topic);
      }
    };

    mqttClient.on('message', handleMessage);

    return () => {
      mqttClient.off('message', handleMessage);
    };
  }, [mqttClient, updateModuleStatus, updateModuleSettings]);

  // 모듈 연결 상태 체크 (5분간 응답 없으면 오프라인 처리)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setModuleStatuses(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(moduleId => {
          const lastUpdated = updated[moduleId].lastUpdated;
          if (lastUpdated && (now - lastUpdated) > 5 * 60 * 1000) {
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
    moduleCapabilities,
    sendCommand,
    requestSettings,
    requestStatus,
    requestCapabilities,
    requestAllCapabilities
  };
};