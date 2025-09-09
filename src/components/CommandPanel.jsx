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
    <div className="command-panel">
      <div className="panel-header">
        <h2>제어 패널</h2>
        <button onClick={onDisconnect} className="disconnect-btn">
          연결 해제
        </button>
      </div>

      {/* 메시지 전송 */}
      <div className="custom-command">
        <h3>메시지 전송</h3>
        <form onSubmit={handlePublish}>
          <div className="form-group">
            <label htmlFor="pub-topic">토픽:</label>
            <input
              type="text"
              id="pub-topic"
              value={publishTopic}
              onChange={(e) => setPublishTopic(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pub-payload">메시지:</label>
            <textarea
              id="pub-payload"
              value={publishPayload}
              onChange={(e) => setPublishPayload(e.target.value)}
              rows="3"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="pub-qos">QoS 레벨:</label>
            <select
              id="pub-qos"
              value={publishQos}
              onChange={(e) => setPublishQos(e.target.value)}
            >
              <option value="0">0 - At most once (최대 1회)</option>
              <option value="1">1 - At least once (최소 1회)</option>
              <option value="2">2 - Exactly once (정확히 1회)</option>
            </select>
          </div>
          <button type="submit" className="publish-btn">
            전송
          </button>
        </form>
      </div>

      {/* 구독 관리 */}
      <div className="subscription">
        <h3>토픽 구독</h3>
        <form onSubmit={handleSubscribe}>
          <div className="form-group">
            <label htmlFor="sub-topic">구독할 토픽:</label>
            <input
              type="text"
              id="sub-topic"
              value={subscribeTopic}
              onChange={(e) => setSubscribeTopic(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="subscribe-btn">
            구독
          </button>
        </form>

        {subscribedTopics.length > 0 && (
          <div className="subscribed-topics">
            <h4>구독 중인 토픽:</h4>
            <ul>
              {subscribedTopics.map((topic, index) => (
                <li key={index}>{topic}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};