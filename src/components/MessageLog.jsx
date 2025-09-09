import React from 'react';

export const MessageLog = ({ messages, onClear }) => {
  const formatTime = (date) => {
    return date.toLocaleTimeString('ko-KR');
  };

  const getMessageClass = (type) => {
    switch (type) {
      case 'sent':
        return 'message-sent';
      case 'received':
        return 'message-received';
      case 'system':
        return 'message-system';
      default:
        return '';
    }
  };

  return (
    <div className="message-log">
      <div className="log-header">
        <h3>메시지 로그</h3>
        <button onClick={onClear} className="clear-btn">
          클리어
        </button>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">메시지가 없습니다.</div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${getMessageClass(message.type)}`}>
              <div className="message-header">
                <span className="message-time">{formatTime(message.timestamp)}</span>
                <span className="message-topic">[{message.topic}]</span>
                <span className="message-type">({message.type})</span>
              </div>
              <div className="message-payload">{message.payload}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};