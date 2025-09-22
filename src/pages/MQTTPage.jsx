import React from 'react'
import { MessageLog } from '../components/MessageLog'

export const MQTTPage = ({
  messages,
  subscribedTopics,
  publish,
  clearMessages,
  publishTopic,
  setPublishTopic,
  publishPayload,
  setPublishPayload,
  publishQos,
  setPublishQos,
}) => {
  return (
    <div className='mqtt-page'>
      <div className='mqtt-connected-layout'>
        <div className='mqtt-publish-panel'>
          <div className='publish-form'>
            <div className='publish-row'>
              <input
                type='text'
                placeholder='Topic (e.g., device/command)'
                value={publishTopic}
                onChange={(e) => setPublishTopic(e.target.value)}
                className='topic-input'
              />
              <select
                value={publishQos}
                onChange={(e) => setPublishQos(e.target.value)}
                className='qos-select'
              >
                <option value='0'>QoS 0</option>
                <option value='1'>QoS 1</option>
                <option value='2'>QoS 2</option>
              </select>
            </div>

            <div className='publish-row'>
              <textarea
                placeholder='Message payload...'
                value={publishPayload}
                onChange={(e) => setPublishPayload(e.target.value)}
                rows='3'
                className='payload-input'
              />
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (publishTopic.trim() && publishPayload.trim()) {
                    publish(publishTopic, publishPayload, publishQos)
                    setPublishPayload('')
                  }
                }}
                className='publish-btn'
                disabled={!publishTopic.trim() || !publishPayload.trim()}
              >
                메시지 전송
              </button>
            </div>

            {subscribedTopics.length > 0 && (
              <div className='subscribed-topics'>
                <div className='topics-header'>
                  현재 구독 중인 토픽 ({subscribedTopics.length})
                </div>
                <div className='topics-list'>
                  {subscribedTopics.map((topic, index) => (
                    <span key={index} className='topic-tag'>
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='mqtt-messages-panel'>
          <MessageLog
            messages={messages}
            onClear={clearMessages}
            isCompact={false}
          />
        </div>
      </div>
    </div>
  )
}
