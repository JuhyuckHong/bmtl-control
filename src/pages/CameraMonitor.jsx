import React, { useState } from 'react';
import { CameraModuleRow } from '../components/CameraModuleRow';
import { useCameraStatus } from '../hooks/useCameraStatus';

export const CameraMonitor = ({ mqttClient, subscribedTopics }) => {
  const { moduleStatuses, moduleSettings, sendCommand, requestSettings } = useCameraStatus(
    mqttClient, 
    subscribedTopics
  );
  
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
      <div className="camera-monitor">
        <div className="connection-warning">
          <h2>MQTT 연결 필요</h2>
          <p>카메라 모듈 모니터링을 위해 MQTT 서버에 연결해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-monitor">
      <div className="monitor-header">
        <h1>카메라 모듈 모니터링</h1>
        
        <div className="status-summary">
          <span className="status-count">온라인: {statusCounts.online}</span>
          <span className="status-count">오프라인: {statusCounts.offline}</span>
          <span className="status-count">미확인: {statusCounts.unknown}</span>
        </div>
        
        <div className="global-controls">
          <button 
            onClick={() => handleGlobalCommand('status_request')}
            className="global-btn"
          >
            전체 상태 요청
          </button>
          <button 
            onClick={(e) => {
              if (confirm('모든 연결된 모듈을 재부팅하시겠습니까?')) {
                handleGlobalCommand('reboot');
              }
            }}
            className="global-btn danger"
          >
            전체 재부팅
          </button>
        </div>
      </div>

      <div className="monitor-filters">
        <div className="filter-group">
          <label htmlFor="filter-select">필터</label>
          <select 
            id="filter-select"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">전체</option>
            <option value="online">온라인</option>
            <option value="offline">오프라인</option>
          </select>
        </div>
        
        <div className="search-group">
          <label htmlFor="search-input">검색</label>
          <input
            id="search-input"
            type="text"
            placeholder="모듈 번호"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="results-info">
          {filteredModules.length}개 모듈
        </div>
      </div>

      <div className="modules-container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '35px 25px 50px 70px 45px 120px 120px 50px 80px 100px 60px 60px 60px 55px 70px',
          gap: '0.3rem',
          padding: '0.4rem',
          borderBottom: '2px solid #e0e0e0',
          background: '#f8f9fa',
          fontSize: '0.75rem',
          fontWeight: '500',
          color: '#666',
          textAlign: 'center'
        }}>
          <div>ID</div>
          <div>상태</div>
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
  );
};