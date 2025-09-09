import React, { useState, useEffect } from 'react';

export const LoginForm = ({
  onConnect,
  isConnecting,
  isConnected,
  status
}) => {
  const hasEnvCredentials = import.meta.env.VITE_MQTT_USERNAME && import.meta.env.VITE_MQTT_PASSWORD;
  
  const [config, setConfig] = useState({
    broker: import.meta.env.VITE_MQTT_BROKER_HOST || 'broker.hivemq.com',
    port: parseInt(import.meta.env.VITE_MQTT_BROKER_PORT) || 8000,
    username: import.meta.env.VITE_MQTT_USERNAME || '',
    password: import.meta.env.VITE_MQTT_PASSWORD || ''
  });

  // Auto-connect if environment variables are set
  useEffect(() => {
    if (hasEnvCredentials && !isConnected && !isConnecting) {
      onConnect(config);
    }
  }, [hasEnvCredentials, isConnected, isConnecting, onConnect, config]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConnect(config);
  };

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="login-form">
      <h2>MQTT 서버 연결</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="broker">브로커 주소:</label>
          <input
            type="text"
            id="broker"
            value={config.broker}
            onChange={(e) => handleInputChange('broker', e.target.value)}
            disabled={isConnected}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="port">포트:</label>
          <input
            type="number"
            id="port"
            value={config.port}
            onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
            disabled={isConnected}
            required
          />
        </div>

        {!hasEnvCredentials && (
          <>
            <div className="form-group">
              <label htmlFor="username">사용자명:</label>
              <input
                type="text"
                id="username"
                value={config.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                disabled={isConnected}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">비밀번호:</label>
              <input
                type="password"
                id="password"
                value={config.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isConnected}
              />
            </div>
          </>
        )}

        {!hasEnvCredentials && (
          <button 
            type="submit" 
            disabled={isConnecting || isConnected}
            className="connect-btn"
          >
            {isConnecting ? '연결 중...' : '연결'}
          </button>
        )}
      </form>

      <div className="status">
        <strong>상태:</strong> {status}
      </div>
    </div>
  );
};