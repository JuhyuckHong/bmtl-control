import React, { useState } from 'react';

export const CameraModuleRow = ({ 
  moduleId, 
  status, 
  onCommand, 
  onLoadSettings,
  availableSettings 
}) => {
  const [settings, setSettings] = useState({
    captureInterval: '10',
    imageSize: '1920x1080',
    quality: '높음',
    iso: '400',
    format: 'JPG',
    aperture: 'f/2.8'
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleReboot = () => {
    onCommand(moduleId, 'reboot', {});
  };

  const handleApplySettings = () => {
    onCommand(moduleId, 'configure', settings);
  };

  const handleLoadSettings = () => {
    onLoadSettings(moduleId);
  };

  const getStatusClass = (isConnected) => {
    if (isConnected === null) return 'status-unknown';
    return isConnected ? 'status-online' : 'status-offline';
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '없음';
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  const getCaptureProgress = () => {
    const totalToday = status?.todayTotalCaptures || 0;
    const captured = status?.todayCapturedCount || 0;
    return `${captured}/${totalToday}`;
  };

  const getMissedCaptures = () => {
    return status?.missedCaptures || 0;
  };

  return (
    <div className="camera-module-row">
      <span className="module-id">{moduleId.toString().padStart(2, '0')}</span>
      <div className={`status-dot ${getStatusClass(status?.isConnected)}`}></div>
      <span className="capacity">{status?.remainingCapacity || '--'}%</span>
      <span className="capture-progress">{getCaptureProgress()}</span>
      <span className="missed-captures">{getMissedCaptures()}</span>
      <span className="last-capture">{formatDateTime(status?.lastCaptureTime)}</span>
      <span className="last-boot">{formatDateTime(status?.lastBootTime)}</span>
      
      <button 
        className="btn reboot"
        onClick={handleReboot}
        disabled={!status?.isConnected}
      >
        재부팅
      </button>
      
      <select 
        value={settings.captureInterval}
        onChange={(e) => handleSettingChange('captureInterval', e.target.value)}
        disabled={!status?.isConnected}
        title="촬영 간격"
      >
        <option value="1">1초</option>
        <option value="5">5초</option>
        <option value="10">10초</option>
        <option value="30">30초</option>
        <option value="60">1분</option>
        <option value="300">5분</option>
        <option value="600">10분</option>
        <option value="1800">30분</option>
        <option value="3600">1시간</option>
      </select>
      
      <select 
        value={settings.imageSize}
        onChange={(e) => handleSettingChange('imageSize', e.target.value)}
        disabled={!status?.isConnected}
        title="이미지 크기"
      >
        <option value="640x480">640x480</option>
        <option value="1280x720">1280x720</option>
        <option value="1920x1080">1920x1080</option>
        <option value="2560x1440">2560x1440</option>
        <option value="3840x2160">3840x2160</option>
      </select>
      
      <select 
        value={settings.quality}
        onChange={(e) => handleSettingChange('quality', e.target.value)}
        disabled={!status?.isConnected}
        title="이미지 품질"
      >
        <option value="최고">최고</option>
        <option value="높음">높음</option>
        <option value="보통">보통</option>
        <option value="낮음">낮음</option>
      </select>
      
      <select 
        value={settings.iso}
        onChange={(e) => handleSettingChange('iso', e.target.value)}
        disabled={!status?.isConnected}
        title="ISO"
      >
        <option value="100">100</option>
        <option value="200">200</option>
        <option value="400">400</option>
        <option value="800">800</option>
        <option value="1600">1600</option>
        <option value="3200">3200</option>
        <option value="6400">6400</option>
      </select>
      
      <select 
        value={settings.format}
        onChange={(e) => handleSettingChange('format', e.target.value)}
        disabled={!status?.isConnected}
        title="이미지 포맷"
      >
        <option value="JPG">JPG</option>
        <option value="RAW">RAW</option>
        <option value="JPG+RAW">JPG+RAW</option>
      </select>
      
      <select 
        value={settings.aperture}
        onChange={(e) => handleSettingChange('aperture', e.target.value)}
        disabled={!status?.isConnected}
        title="조리개"
      >
        <option value="f/1.4">1.4</option>
        <option value="f/2.0">2.0</option>
        <option value="f/2.8">2.8</option>
        <option value="f/4.0">4.0</option>
        <option value="f/5.6">5.6</option>
        <option value="f/8.0">8.0</option>
        <option value="f/11">11</option>
        <option value="f/16">16</option>
      </select>
      
      <div style={{ display: 'flex', gap: '2px' }}>
        <button 
          className="btn load"
          onClick={handleLoadSettings}
          disabled={!status?.isConnected}
          title="현재 설정 불러오기"
          style={{ fontSize: '0.65rem', padding: '0.15rem', flex: 1 }}
        >
          현재설정
        </button>
        
        <button 
          className="btn apply"
          onClick={handleApplySettings}
          disabled={!status?.isConnected}
          title="변경 적용"
          style={{ fontSize: '0.65rem', padding: '0.15rem', flex: 1 }}
        >
          변경적용
        </button>
      </div>
    </div>
  );
};