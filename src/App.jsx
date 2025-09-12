import React, { useState } from "react";
import { ModuleControl } from "./pages/ModuleControl";
import { MQTTPage } from "./pages/MQTTPage";
import { useMQTT } from "./hooks/useMQTT";
import "./App.css";

function App() {
    const { isConnected, isConnecting, status, messages, subscribedTopics, connect, disconnect, subscribe, publish, clearMessages, client } = useMQTT();

    const [currentPage, setCurrentPage] = useState("mqtt"); // 'control' or 'mqtt'
    const [filter, setFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusCounts, setStatusCounts] = useState({ online: 0, offline: 0, unknown: 0 });
    const [globalCommandHandler, setGlobalCommandHandler] = useState(null);

    // MQTT Control states
    const [publishTopic, setPublishTopic] = useState("device/command");
    const [publishPayload, setPublishPayload] = useState("");
    const [publishQos, setPublishQos] = useState("0");
    const [subscribeTopic, setSubscribeTopic] = useState("device/status");

    const togglePage = () => {
        setCurrentPage(currentPage === "control" ? "mqtt" : "control");
    };

    const handleGlobalCommand = (command) => {
        if (globalCommandHandler) {
            if (command === "reboot" && !confirm("모든 연결된 모듈을 재부팅하시겠습니까?")) {
                return;
            }
            globalCommandHandler(command);
        }
    };

    const onModuleControlReady = (commandHandler, counts) => {
        setGlobalCommandHandler(() => commandHandler);
        setStatusCounts(counts);
    };

    const handlePublish = (e) => {
        e.preventDefault();
        if (publishTopic.trim() && publishPayload.trim()) {
            publish(publishTopic, publishPayload, publishQos);
            setPublishPayload("");
        }
    };

    const handleSubscribe = (e) => {
        e.preventDefault();
        if (subscribeTopic.trim()) {
            subscribe(subscribeTopic);
        }
    };

    // Auto switch to control page when successfully connected (only when connection state changes)
    React.useEffect(() => {
        if (isConnected) {
            setCurrentPage("control");
        }
    }, [isConnected]);

    return (
        <div className="App">
            <div className="app-header">
                <div className="header-title">
                    <h1>{!isConnected ? "빌드모션 제어판" : currentPage === "control" ? "모듈 제어" : "메시지 제어"}</h1>
                    {isConnected && currentPage === "control" && (
                        <div className="status-summary">
                            <span className="status-item">
                                <div className="status-dot status-online"></div>
                                {statusCounts.online}
                            </span>
                            <span className="status-item">
                                <div className="status-dot status-offline"></div>
                                {statusCounts.offline}
                            </span>
                            <span className="status-item">
                                <div className="status-dot status-unknown"></div>
                                {statusCounts.unknown}
                            </span>
                        </div>
                    )}
                </div>

                {isConnected && currentPage === "control" && (
                    <>
                        <div className="filter-controls">
                            <label htmlFor="filter-select">필터</label>
                            <select id="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
                                <option value="all">전체</option>
                                <option value="online">온라인</option>
                                <option value="offline">오프라인</option>
                            </select>
                        </div>

                        <div className="search-controls">
                            <label htmlFor="search-input">검색</label>
                            <input id="search-input" type="text" placeholder="모듈 번호" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>

                        <button onClick={() => handleGlobalCommand("status_request")} className="subscribe-btn-header">
                            전체 상태 요청
                        </button>
                        <button onClick={() => handleGlobalCommand("reboot")} className="disconnect-btn-header">
                            전체 재부팅
                        </button>
                    </>
                )}

                {isConnected && currentPage === "mqtt" && (
                    <div className="mqtt-header-controls">
                        <div className="mqtt-quick-actions">
                            <input type="text" placeholder="Subscribe topic" value={subscribeTopic} onChange={(e) => setSubscribeTopic(e.target.value)} className="subscribe-input-header" />
                            <button onClick={handleSubscribe} className="subscribe-btn-header" disabled={!subscribeTopic.trim()}>
                                📥 구독
                            </button>
                        </div>

                        <button onClick={disconnect} className="disconnect-btn-header">
                            ⚡ 연결해제
                        </button>
                    </div>
                )}

                <div className="header-controls">
                    {isConnected && (
                        <button className="toggle-btn" onClick={togglePage} title={currentPage === "control" ? "MQTT Settings" : "Control Panel"}>
                            {currentPage === "control" ? "💬" : "🚥"}
                        </button>
                    )}
                </div>
            </div>

            <main className="app-main">
                {!isConnected ? (
                    <MQTTPage
                        isConnected={isConnected}
                        isConnecting={isConnecting}
                        status={status}
                        messages={messages}
                        subscribedTopics={subscribedTopics}
                        connect={connect}
                        disconnect={disconnect}
                        subscribe={subscribe}
                        publish={publish}
                        clearMessages={clearMessages}
                        publishTopic={publishTopic}
                        setPublishTopic={setPublishTopic}
                        publishPayload={publishPayload}
                        setPublishPayload={setPublishPayload}
                        publishQos={publishQos}
                        setPublishQos={setPublishQos}
                    />
                ) : currentPage === "control" ? (
                    <ModuleControl
                        mqttClient={client}
                        subscribedTopics={subscribedTopics}
                        filter={filter}
                        setFilter={setFilter}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        onGlobalCommand={onModuleControlReady}
                    />
                ) : (
                    <MQTTPage
                        isConnected={isConnected}
                        isConnecting={isConnecting}
                        status={status}
                        messages={messages}
                        subscribedTopics={subscribedTopics}
                        connect={connect}
                        disconnect={disconnect}
                        subscribe={subscribe}
                        publish={publish}
                        clearMessages={clearMessages}
                        publishTopic={publishTopic}
                        setPublishTopic={setPublishTopic}
                        publishPayload={publishPayload}
                        setPublishPayload={setPublishPayload}
                        publishQos={publishQos}
                        setPublishQos={setPublishQos}
                    />
                )}
            </main>
        </div>
    );
}

export default App;
