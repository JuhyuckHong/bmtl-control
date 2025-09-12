import React, { useState } from 'react';
import { CameraModuleRow } from '../components/CameraModuleRow';
import { useCameraStatus } from '../hooks/useCameraStatus';

export const ModuleControl = ({ mqttClient, subscribedTopics, filter, setFilter, searchTerm, setSearchTerm, onGlobalCommand }) => {
  const { moduleStatuses, moduleSettings, sendCommand, requestSettings } = useCameraStatus(
    mqttClient, 
    subscribedTopics
  );
  

  const getFilteredModules = () => {
    const modules = [];
    for (let i = 1; i <= 99; i++) {
      const status = moduleStatuses[i] || { isConnected: null };
      
      if (filter === 'online' && !status.isConnected) continue;
      if (filter === 'offline' && status.isConnected !== false) continue;
      
      if (searchTerm && !i.toString().includes(searchTerm)) continue;
      
      modules.push({
        id: i,
        status,
        settings: moduleSettings[i]
      });
    }
    return modules;
  };

  const handleCommand = (moduleId, command, data) => {
    sendCommand(moduleId, command, data);
  };

  const handleLoadSettings = (moduleId) => {
    requestSettings(moduleId);
  };

  const handleGlobalCommand = (command) => {
    const connectedModules = Object.keys(moduleStatuses).filter(
      id => moduleStatuses[id].isConnected
    );
    
    connectedModules.forEach(moduleId => {
      sendCommand(parseInt(moduleId), command, {});
    });
  };

  // 상위 컴포넌트에서 사용할 수 있도록 전역 커맨드 핸들러와 상태 카운트 전달
  React.useEffect(() => {
    if (onGlobalCommand) {
      onGlobalCommand(handleGlobalCommand, getStatusCounts());
    }
  }, [moduleStatuses, onGlobalCommand]);

  const getStatusCounts = () => {
    const counts = { online: 0, offline: 0, unknown: 0 };
    for (let i = 1; i <= 99; i++) {
      const status = moduleStatuses[i]?.isConnected;
      if (status === true) counts.online++;
      else if (status === false) counts.offline++;
      else counts.unknown++;
    }
    return counts;
  };

  const statusCounts = getStatusCounts();
  const filteredModules = getFilteredModules();

  if (!mqttClient?.connected) {
    return (
      <div className="module-control">
        <div className="connection-warning">
          <h2>MQTT 연결 필요</h2>
          <p>모듈 제어를 위해 MQTT 서버에 연결해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="module-control">

      <div className="modules-table">
        <div className="modules-table-header">
          <div>ID</div>
          <div>상태</div>
          <div>현장 이름</div>
          <div>용량</div>
          <div>촬영진행</div>
          <div>누락</div>
          <div>마지막 촬영</div>
          <div>마지막 부팅</div>
          <div>재부팅</div>
          <div>촬영간격</div>
          <div>이미지크기</div>
          <div>품질</div>
          <div>ISO</div>
          <div>포맷</div>
          <div>조리개</div>
          <div>설정</div>
        </div>
        
        <div className="modules-table-body">
          {filteredModules.length === 0 ? (
            <div className="no-modules">
              <p>표시할 모듈이 없습니다.</p>
            </div>
          ) : (
            filteredModules.map(({ id, status, settings }) => (
              <CameraModuleRow
                key={id}
                moduleId={id}
                status={status}
                availableSettings={settings}
                onCommand={handleCommand}
                onLoadSettings={handleLoadSettings}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};