import React, { useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { CommandPanel } from './components/CommandPanel';
import { MessageLog } from './components/MessageLog';
import { CameraMonitor } from './pages/CameraMonitor';
import { useMQTT } from './hooks/useMQTT';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('control');
  const {
    isConnected,
    isConnecting,
    status,
    messages,
    subscribedTopics,
    connect,
    disconnect,
    subscribe,
    publish,
    clearMessages,
    client
  } = useMQTT();

  return (
    <div className="App">
      {!isConnected ? (
        <div className="login-container">
          <LoginForm
            onConnect={connect}
            isConnecting={isConnecting}
            isConnected={isConnected}
            status={status}
          />
        </div>
      ) : (
        <>
          <nav className="sidebar">
            <h1>BMTL MQTT</h1>
            <div className="nav-buttons">
              <button 
                className={currentPage === 'camera' ? 'active' : ''}
                onClick={() => setCurrentPage('camera')}
              >
                Camera Control
              </button>
            </div>
            
            <div className="mqtt-controls">
              <CommandPanel
                onPublish={publish}
                onSubscribe={subscribe}
                onDisconnect={disconnect}
                isConnected={isConnected}
                subscribedTopics={subscribedTopics}
              />
            </div>
          </nav>

          <main className="app-main">
            <CameraMonitor 
              mqttClient={client}
              subscribedTopics={subscribedTopics}
            />
          </main>
        </>
      )}
    </div>
  );
}

export default App;
