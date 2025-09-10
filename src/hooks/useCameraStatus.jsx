import { useState, useCallback, useEffect } from 'react';

export const useCameraStatus = (mqttClient, subscribedTopics) => {
  const [moduleStatuses, setModuleStatuses] = useState({});
  const [moduleSettings, setModuleSettings] = useState({});
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

  // 명령 전송
  const sendCommand = useCallback((moduleId, command, data) => {
    if (!mqttClient?.connected) return;

    const topic = `bmtl/camera/${moduleId.toString().padStart(2, '0')}/command`;
    const payload = JSON.stringify({
      command,
      data,
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`Failed to send command to module ${moduleId}:`, err);
      } else {
        console.log(`Command sent to module ${moduleId}:`, command, data);
      }
    });
  }, [mqttClient]);

  // 설정 요청
  const requestSettings = useCallback((moduleId) => {
    if (!mqttClient?.connected) return;

    const topic = `bmtl/camera/${moduleId.toString().padStart(2, '0')}/config`;
    const payload = JSON.stringify({
      request: 'get_available_settings',
      timestamp: new Date().toISOString()
    });

    mqttClient.publish(topic, payload, { qos: 1 });
  }, [mqttClient]);

  // MQTT 구독 설정
  useEffect(() => {
    if (!mqttClient?.connected) return;

    // 모든 모듈의 상태와 설정 토픽 구독
    for (let i = 1; i <= 99; i++) {
      const moduleId = i.toString().padStart(2, '0');
      const statusTopic = `bmtl/camera/${moduleId}/status`;
      const settingsTopic = `bmtl/camera/${moduleId}/settings`;
      
      if (!subscribedTopicsSet.has(statusTopic)) {
        mqttClient.subscribe(statusTopic, (err) => {
          if (!err) {
            subscribedTopicsSet.add(statusTopic);
          }
        });
      }
      
      if (!subscribedTopicsSet.has(settingsTopic)) {
        mqttClient.subscribe(settingsTopic, (err) => {
          if (!err) {
            subscribedTopicsSet.add(settingsTopic);
          }
        });
      }
    }
  }, [mqttClient, subscribedTopicsSet]);

  // 메시지 처리
  useEffect(() => {
    if (!mqttClient) return;

    const handleMessage = (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // 토픽에서 모듈 ID 추출
        const topicParts = topic.split('/');
        const moduleId = parseInt(topicParts[2]);
        
        if (topic.includes('/status')) {
          updateModuleStatus(moduleId, {
            isConnected: true,
            remainingCapacity: data.remaining_capacity,
            lastCaptureTime: data.last_capture_time,
            lastBootTime: data.last_boot_time,
            currentSettings: data.current_settings,
            todayTotalCaptures: data.today_total_captures,
            todayCapturedCount: data.today_captured_count,
            missedCaptures: data.missed_captures
          });
        } else if (topic.includes('/settings')) {
          updateModuleSettings(moduleId, data.available_settings);
        }
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
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
    sendCommand,
    requestSettings
  };
};