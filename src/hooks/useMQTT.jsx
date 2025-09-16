import React, { useState, useCallback, useRef } from 'react';
import mqtt from 'mqtt';

export const useMQTT = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [messages, setMessages] = useState([]);
  const [subscribedTopics] = useState(new Set());
  
  const clientRef = useRef(null);

  const addMessage = useCallback((topic, payload, type = 'received') => {
    const newMessage = {
      topic,
      payload,
      timestamp: new Date(),
      type
    };
    setMessages(prev => [...prev, newMessage]);
  }, []);

  const connect = useCallback(async (config) => {
    if (clientRef.current?.connected) {
      return;
    }

    setIsConnecting(true);
    setStatus('Connecting...');

    const protocol = import.meta.env.VITE_MQTT_BROKER_PROTOCOL || 'wss';
    // HiveMQ Cloud requires /mqtt path for WebSocket connections
    const brokerUrl = `${protocol}://${config.broker}:${config.port}/mqtt`;
    const options = {
      username: config.username,
      password: config.password,
      clientId: `bmtl_mqtt_client_${Math.random().toString(16).substr(2, 8)}`,
      clean: true,
      connectTimeout: 10000,
      keepalive: 30,
      protocolVersion: 4,
    };

    try {
      const client = mqtt.connect(brokerUrl, options);
      clientRef.current = client;

      client.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
        setStatus('Connected');
        addMessage('System', 'Connected to MQTT broker', 'system');
      });

      client.on('reconnect', () => {
        setStatus('Reconnecting...');
        addMessage('System', 'Reconnecting...', 'system');
      });

      client.on('close', () => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatus('Disconnected');
        addMessage('System', 'Disconnected from MQTT broker', 'system');
        clientRef.current = null;
      });

      client.on('error', (err) => {
        setIsConnected(false);
        setIsConnecting(false);
        setStatus(`Error: ${err.message}`);
        addMessage('System', `Connection error: ${err.message}`, 'system');
        client.end();
      });

      client.on('message', (topic, payload) => {
        addMessage(topic, payload.toString(), 'received');
      });

    } catch (error) {
      setIsConnecting(false);
      setStatus(`Connection failed: ${error}`);
      addMessage('System', `Connection failed: ${error}`, 'system');
    }
  }, [addMessage]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end();
      clientRef.current = null;
    }
  }, []);

  const subscribe = useCallback((topic) => {
    if (clientRef.current?.connected && topic.trim()) {
      if (!subscribedTopics.has(topic)) {
        clientRef.current.subscribe(topic, (err) => {
          if (!err) {
            subscribedTopics.add(topic);
            addMessage('System', `Subscribed to ${topic}`, 'system');
          } else {
            addMessage('System', `Subscription error: ${err.message}`, 'system');
          }
        });
      }
    }
  }, [addMessage, subscribedTopics]);

  const publish = useCallback((topic, payload, qos = 0) => {
    if (clientRef.current?.connected && topic.trim()) {
      const options = { qos: parseInt(qos) };
      clientRef.current.publish(topic, payload, options, (err) => {
        if (!err) {
          addMessage(topic, payload, 'sent');
          addMessage('System', `Published to ${topic} (QoS: ${qos})`, 'system');
        } else {
          addMessage('System', `Publish error: ${err.message}`, 'system');
        }
      });
    }
  }, [addMessage]);

  // 외부에서 publish 이벤트를 받아서 메시지 로그에 추가
  React.useEffect(() => {
    if (!clientRef.current) return;

    const handleExternalPublish = (data) => {
      addMessage(data.topic, data.payload, 'sent');
      addMessage('System', `Published to ${data.topic} (QoS: ${data.qos})`, 'system');
    };

    clientRef.current.on('publish', handleExternalPublish);

    return () => {
      if (clientRef.current) {
        clientRef.current.off('publish', handleExternalPublish);
      }
    };
  }, [addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    isConnected,
    isConnecting,
    status,
    messages,
    subscribedTopics: Array.from(subscribedTopics),
    connect,
    disconnect,
    subscribe,
    publish,
    clearMessages,
    client: clientRef.current
  };
};