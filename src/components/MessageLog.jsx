import React, { useState, useEffect, useRef } from 'react';

export const MessageLog = ({ messages, onClear, isCompact = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef(null);
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

  // 자동 스크롤 처리
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const formatCompactTime = (date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const truncatePayload = (payload, maxLength = 50) => {
    if (payload.length <= maxLength) return payload;
    return payload.substring(0, maxLength) + '...';
  };

  return (
    <div className={`message-log ${isCompact ? 'compact' : ''}`}>
      <div className="log-header">
        <h3>
          {isCompact && (
            <button 
              className="collapse-btn"
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={isCollapsed ? '펼치기' : '접기'}
            >
              {isCollapsed ? '▶' : '▼'}
            </button>
          )}
          메시지 로그 ({messages.length})
        </h3>
        <div className="log-controls">
          {isCompact && !isCollapsed && (
            <button 
              className={`auto-scroll-btn ${autoScroll ? 'active' : ''}`}
              onClick={() => setAutoScroll(!autoScroll)}
              title="자동 스크롤"
            >
              📜
            </button>
          )}
          <button onClick={onClear} className="clear-btn">
            🗑️
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className={`messages-container ${isCompact ? 'compact' : ''}`}>
          {messages.length === 0 ? (
            <div className="no-messages">메시지가 없습니다.</div>
          ) : (
            <>
              {messages.slice(-100).map((message, index) => (
                <div key={index} className={`message ${getMessageClass(message.type)} ${isCompact ? 'compact' : ''}`}>
                  {isCompact ? (
                    <div className="message-compact">
                      <span className="message-time-compact">{formatCompactTime(message.timestamp)}</span>
                      <span className={`message-type-badge ${message.type}`}>{message.type[0].toUpperCase()}</span>
                      <span className="message-topic-compact">{message.topic}</span>
                      <span className="message-payload-compact" title={message.payload}>
                        {truncatePayload(message.payload)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="message-header">
                        <span className="message-time">{formatTime(message.timestamp)}</span>
                        <span className="message-topic">[{message.topic}]</span>
                        <span className="message-type">({message.type})</span>
                      </div>
                      <div className="message-payload">{message.payload}</div>
                    </>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      )}
    </div>
  );
};