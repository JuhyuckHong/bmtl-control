document.addEventListener('DOMContentLoaded', () => {
    const brokerInput = document.getElementById('broker');
    const portInput = document.getElementById('port');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const connectBtn = document.getElementById('connect-btn');
    const disconnectBtn = document.getElementById('disconnect-btn');
    const statusDiv = document.getElementById('status');

    const subTopicInput = document.getElementById('sub-topic');
    const subscribeBtn = document.getElementById('subscribe-btn');
    const subscriptionsList = document.getElementById('subscriptions');

    const pubTopicInput = document.getElementById('pub-topic');
    const pubPayloadInput = document.getElementById('pub-payload');
    const publishBtn = document.getElementById('publish-btn');

    const messagesDiv = document.getElementById('messages');
    const clearMessagesBtn = document.getElementById('clear-messages-btn');

    let client = null;
    const subscribedTopics = new Set();

    function setUIState(isConnected) {
        connectBtn.disabled = isConnected;
        disconnectBtn.disabled = !isConnected;
        subscribeBtn.disabled = !isConnected;
        publishBtn.disabled = !isConnected;

        brokerInput.disabled = isConnected;
        portInput.disabled = isConnected;
        usernameInput.disabled = isConnected;
        passwordInput.disabled = isConnected;
    }

    function updateStatus(message) {
        statusDiv.textContent = `Status: ${message}`;
    }

    function addMessage(topic, payload) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        
        const topicElement = document.createElement('span');
        topicElement.classList.add('topic');
        topicElement.textContent = `[${topic}]`;
        
        const payloadElement = document.createElement('span');
        payloadElement.classList.add('payload');
        payloadElement.textContent = ` ${payload}`;

        messageElement.appendChild(topicElement);
        messageElement.appendChild(payloadElement);
        
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function connect() {
        const brokerUrl = `wss://${brokerInput.value}:${portInput.value}/mqtt`;
        const options = {
            username: usernameInput.value,
            password: passwordInput.value,
            clientId: `gemini_mqtt_client_${Math.random().toString(16).substr(2, 8)}`,
            clean: true,
            connectTimeout: 4000,
        };

        updateStatus('Connecting...');
        client = mqtt.connect(brokerUrl, options);

        client.on('connect', () => {
            updateStatus('Connected');
            setUIState(true);
        });

        client.on('reconnect', () => {
            updateStatus('Reconnecting...');
        });

        client.on('close', () => {
            updateStatus('Disconnected');
            setUIState(false);
            client = null;
        });

        client.on('error', (err) => {
            updateStatus(`Error: ${err.message}`);
            console.error('Connection error:', err);
            client.end();
        });

        client.on('message', (topic, payload) => {
            const payloadString = payload.toString();
            addMessage(topic, payloadString);
        });
    }

    function disconnect() {
        if (client) {
            client.end();
        }
    }

    function subscribe() {
        if (client && client.connected) {
            const topic = subTopicInput.value.trim();
            if (topic && !subscribedTopics.has(topic)) {
                client.subscribe(topic, (err) => {
                    if (!err) {
                        subscribedTopics.add(topic);
                        const li = document.createElement('li');
                        li.textContent = topic;
                        subscriptionsList.appendChild(li);
                        addMessage('System', `Subscribed to ${topic}`);
                    } else {
                        addMessage('System', `Subscription error: ${err.message}`);
                    }
                });
            }
        }
    }

    function publish() {
        if (client && client.connected) {
            const topic = pubTopicInput.value.trim();
            const payload = pubPayloadInput.value;
            if (topic) {
                client.publish(topic, payload, (err) => {
                    if (!err) {
                        addMessage('System', `Published to ${topic}`);
                    } else {
                        addMessage('System', `Publish error: ${err.message}`);
                    }
                });
            }
        }
    }

    connectBtn.addEventListener('click', connect);
    disconnectBtn.addEventListener('click', disconnect);
    subscribeBtn.addEventListener('click', subscribe);
    publishBtn.addEventListener('click', publish);
    clearMessagesBtn.addEventListener('click', () => {
        messagesDiv.innerHTML = '';
    });
});
