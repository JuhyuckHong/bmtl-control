import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ModuleControl } from "./pages/ModuleControl";
import { MQTTPage } from "./pages/MQTTPage";
import { ApiDocsPage } from "./pages/ApiDocsPage";
import { DarkModeToggle } from "./components/DarkModeToggle";
import { useMQTT } from "./hooks/useMQTT";
import "./App.css";
import "./styles/api-docs.css";

function App() {
    const { isConnected, isConnecting, status, messages, subscribedTopics, connect, disconnect, subscribe, publish, recordExternalPublish, clearMessages, client } = useMQTT();
    const navigate = useNavigate();
    const location = useLocation();

    // Control states - 관련된 상태들을 그룹화하여 리렌더링 최적화
    const [controlState, setControlState] = useState({
        filter: "all",
        searchTerm: "",
        statusCounts: { online: 0, offline: 0, unknown: 0 },
        globalCommandHandler: null
    });

    // MQTT Control states - MQTT 관련 상태들을 별도 그룹화
    const [mqttState, setMqttState] = useState({
        publishTopic: "device/command",
        publishPayload: "",
        publishQos: "0",
        subscribeTopic: "device/status"
    });

    // 현재 페이지 감지 (URL 기반) - useMemo로 최적화
    const currentPage = useMemo(() => {
        const path = location.pathname;
        if (path === "/" || path === "/control") return "control";
        if (path === "/docs") return "docs";
        if (path === "/mqtt") return "mqtt";
        return "control"; // 기본값은 control
    }, [location.pathname]);

    const togglePage = useCallback(() => {
        const currentPath = location.pathname;
        if (currentPath === "/control") {
            navigate("/mqtt");
        } else if (currentPath === "/mqtt") {
            navigate("/docs");
        } else if (currentPath === "/docs") {
            navigate("/control");
        } else {
            // 기본 경로 (/) 에서는 mqtt로
            navigate("/mqtt");
        }
    }, [location.pathname, navigate]);

    const handleGlobalCommand = useCallback((command) => {
        if (controlState.globalCommandHandler) {
            if (command === "reboot" && !confirm("모든 연결된 모듈을 재부팅하시겠습니까?")) {
                return;
            }
            controlState.globalCommandHandler(command);
        }
    }, [controlState.globalCommandHandler]);

    const onModuleControlReady = useCallback((commandHandler, counts) => {
        setControlState(prev => ({
            ...prev,
            globalCommandHandler: commandHandler,
            statusCounts: counts
        }));
    }, []);

    const handlePublish = useCallback((e) => {
        e.preventDefault();
        if (mqttState.publishTopic.trim() && mqttState.publishPayload.trim()) {
            publish(mqttState.publishTopic, mqttState.publishPayload, mqttState.publishQos);
            setMqttState(prev => ({ ...prev, publishPayload: "" }));
        }
    }, [mqttState.publishTopic, mqttState.publishPayload, mqttState.publishQos, publish]);

    const handleSubscribe = useCallback((e) => {
        e.preventDefault();
        if (mqttState.subscribeTopic.trim()) {
            subscribe(mqttState.subscribeTopic);
        }
    }, [mqttState.subscribeTopic, subscribe]);

    // MQTT 연결 시 control 페이지 유지 (이미 /에서 control로 설정됨)

    return (
        <div className="App">
            <div className="app-header">
                <div className="header-title">
                    <h1>
                        {!isConnected
                            ? "빌드모션 제어판"
                            : currentPage === "control"
                                ? "모듈 제어"
                                : currentPage === "mqtt"
                                    ? "메시지 제어"
                                    : "API 명세서"
                        }
                    </h1>
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
                            <input id="search-input" type="text" placeholder="모듈 번호 또는 현장 이름" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>

                        <button onClick={() => handleGlobalCommand("status_request")} className="subscribe-btn-header">
                            전체 상태 요청
                        </button>
                        <button onClick={() => handleGlobalCommand("options_request")} className="subscribe-btn-header">
                            전체 옵션 요청
                        </button>
                        <button onClick={() => handleGlobalCommand("reboot")} className="disconnect-btn-header">
                            전체 재부팅
                        </button>
                    </>
                )}

                {isConnected && currentPage === "mqtt" && (
                    <div className="mqtt-header-controls">
                        <div className="mqtt-quick-actions">
                            <input type="text" placeholder="Subscribe topic" value={mqttState.subscribeTopic} onChange={(e) => setMqttState(prev => ({ ...prev, subscribeTopic: e.target.value }))} className="subscribe-input-header" />
                            <button onClick={handleSubscribe} className="subscribe-btn-header" disabled={!mqttState.subscribeTopic.trim()}>
                                📥 구독
                            </button>
                        </div>

                        <button onClick={disconnect} className="disconnect-btn-header">
                            ⚡ 연결해제
                        </button>
                    </div>
                )}

                <div className="header-controls">
                    <DarkModeToggle />
                    <button className="toggle-btn" onClick={togglePage} title={
                        currentPage === "control" ? "MQTT 페이지로" :
                        currentPage === "mqtt" ? "API 문서로" : "모듈 제어로"
                    }>
                        {currentPage === "control" ? "💬" : currentPage === "mqtt" ? "📚" : "🚥"}
                    </button>
                </div>
            </div>

            <main className={`app-main ${currentPage === "docs" ? "docs-mode" : ""}`}>
                <Routes>
                    <Route
                        path="/"
                        element={
                            <ModuleControl
                                mqttClient={client}
                                subscribedTopics={subscribedTopics}
                                filter={controlState.filter}
                                setFilter={(value) => setControlState(prev => ({ ...prev, filter: value }))}
                                searchTerm={controlState.searchTerm}
                                setSearchTerm={(value) => setControlState(prev => ({ ...prev, searchTerm: value }))}
                                onGlobalCommand={onModuleControlReady}
                                connect={connect}
                                isConnecting={isConnecting}
                                isConnected={isConnected}
                                status={status}
                                recordPublish={recordExternalPublish}
                            />
                        }
                    />
                    <Route
                        path="/mqtt"
                        element={
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
                                publishTopic={mqttState.publishTopic}
                                setPublishTopic={(value) => setMqttState(prev => ({ ...prev, publishTopic: value }))}
                                publishPayload={mqttState.publishPayload}
                                setPublishPayload={(value) => setMqttState(prev => ({ ...prev, publishPayload: value }))}
                                publishQos={mqttState.publishQos}
                                setPublishQos={(value) => setMqttState(prev => ({ ...prev, publishQos: value }))}
                            />
                        }
                    />
                    <Route
                        path="/control"
                        element={
                            <ModuleControl
                                mqttClient={client}
                                subscribedTopics={subscribedTopics}
                                filter={controlState.filter}
                                setFilter={(value) => setControlState(prev => ({ ...prev, filter: value }))}
                                searchTerm={controlState.searchTerm}
                                setSearchTerm={(value) => setControlState(prev => ({ ...prev, searchTerm: value }))}
                                onGlobalCommand={onModuleControlReady}
                                connect={connect}
                                isConnecting={isConnecting}
                                isConnected={isConnected}
                                status={status}
                                recordPublish={recordExternalPublish}
                            />
                        }
                    />
                    <Route path="/docs" element={<ApiDocsPage />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;