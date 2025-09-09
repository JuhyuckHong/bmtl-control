import React from 'react';
import { LoginForm } from './components/LoginForm';
import { CommandPanel } from './components/CommandPanel';
import { MessageLog } from './components/MessageLog';
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
    clearMessages
  } = useMQTT();

  return (
    <div className="App">
      <header className="app-header">
        <h1>🔧 BMTL MQTT 제어 패널</h1>
      </header>

      <main className="app-main">
        <div className="left-panel">
          {!isConnected ? (
            <LoginForm
              onConnect={connect}
              isConnecting={isConnecting}
              isConnected={isConnected}
              status={status}
            />
          ) : (
            <CommandPanel
              onPublish={publish}
              onSubscribe={subscribe}
              onDisconnect={disconnect}
              isConnected={isConnected}
              subscribedTopics={subscribedTopics}
            />
          )}
        </div>

        <div className="right-panel">
          <MessageLog
            messages={messages}
            onClear={clearMessages}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
