import React, { useState } from 'react';

export const CommandPanel = ({
  onPublish,
  onSubscribe,
  onDisconnect,
  isConnected,
  subscribedTopics
}) => {
  const [publishTopic, setPublishTopic] = useState('device/command');
  const [publishPayload, setPublishPayload] = useState('');
  const [publishQos, setPublishQos] = useState('0');
  const [subscribeTopic, setSubscribeTopic] = useState('device/status');

  const handlePublish = (e) => {
    e.preventDefault();
    if (publishTopic.trim() && publishPayload.trim()) {
      onPublish(publishTopic, publishPayload, publishQos);
      setPublishPayload('');
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (subscribeTopic.trim()) {
      onSubscribe(subscribeTopic);
    }
  };


  if (!isConnected) {
    return (
      <div className="command-panel disabled">
        <p>MQTT 서버에 연결한 후 명령어를 사용할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="command-panel compact">
      <div className="panel-header-compact">
        <h2>📡 MQTT Control</h2>
        <button onClick={onDisconnect} className="disconnect-btn-compact">
          ⚡ 연결해제
        </button>
      </div>

      {/* 빠른 액션 영역 */}
      <div className="quick-actions">
        <div className="action-row">
          <input
            type="text"
            placeholder="Topic (e.g., device/command)"
            value={publishTopic}
            onChange={(e) => setPublishTopic(e.target.value)}
            className="topic-input"
          />
          <select
            value={publishQos}
            onChange={(e) => setPublishQos(e.target.value)}
            className="qos-select"
          >
            <option value="0">QoS 0</option>
            <option value="1">QoS 1</option>
            <option value="2">QoS 2</option>
          </select>
        </div>
        
        <div className="action-row">
          <textarea
            placeholder="Message payload..."
            value={publishPayload}
            onChange={(e) => setPublishPayload(e.target.value)}
            rows="2"
            className="payload-input"
          />
          <button 
            onClick={handlePublish}
            className="publish-btn-compact"
            disabled={!publishTopic.trim() || !publishPayload.trim()}
          >
            📤 Send
          </button>
        </div>
      </div>

      {/* 구독 영역 */}
      <div className="subscribe-section">
        <div className="subscribe-row">
          <input
            type="text"
            placeholder="Subscribe to topic..."
            value={subscribeTopic}
            onChange={(e) => setSubscribeTopic(e.target.value)}
            className="subscribe-input"
          />
          <button 
            onClick={handleSubscribe}
            className="subscribe-btn-compact"
            disabled={!subscribeTopic.trim()}
          >
            📥 Sub
          </button>
        </div>
        
        {subscribedTopics.length > 0 && (
          <div className="topics-compact">
            <div className="topics-header">📋 Subscribed ({subscribedTopics.length})</div>
            <div className="topics-list">
              {subscribedTopics.map((topic, index) => (
                <span key={index} className="topic-tag">{topic}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};