import React from 'react';
import { LoginForm } from './components/LoginForm';
import { CommandPanel } from './components/CommandPanel';
import { MessageLog } from './components/MessageLog';
import { CameraMonitor } from './pages/CameraMonitor';
import { useMQTT } from './hooks/useMQTT';
import './App.css';

function App() {
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
      <nav className="sidebar">
        <h1>BMTL MQTT</h1>
        
        {!isConnected ? (
          <div className="sidebar-login">
            <LoginForm
              onConnect={connect}
              isConnecting={isConnecting}
              isConnected={isConnected}
              status={status}
            />
          </div>
        ) : (
          <>
            <div className="mqtt-controls">
              <CommandPanel
                onPublish={publish}
                onSubscribe={subscribe}
                onDisconnect={disconnect}
                isConnected={isConnected}
                subscribedTopics={subscribedTopics}
              />
            </div>
            
            <div className="sidebar-messages">
              <MessageLog
                messages={messages}
                onClear={clearMessages}
                isCompact={true}
              />
            </div>
          </>
        )}
      </nav>

      <main className="app-main">
        {!isConnected ? (
          <div className="main-placeholder">
            <div className="placeholder-content">
              <h2>BMTL MQTT Control Panel</h2>
              <p>Please connect to MQTT server to access camera controls</p>
            </div>
          </div>
        ) : (
          <CameraMonitor 
            mqttClient={client}
            subscribedTopics={subscribedTopics}
          />
        )}
      </main>
    </div>
  );
}

export default App;
