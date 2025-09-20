import React, { useState, useEffect, useCallback } from "react";

const LoginFormComponent = ({ onConnect, isConnecting, isConnected, status }) => {
    const [config, setConfig] = useState({
        broker: import.meta.env.VITE_MQTT_BROKER_HOST || "broker.hivemq.com",
        port: parseInt(import.meta.env.VITE_MQTT_BROKER_PORT) || 8000,
        username: "",
        password: "",
    });

    const [error, setError] = useState(null);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        setError(null);
        onConnect(config);
    }, [config, onConnect]);

    const handleInputChange = useCallback((field, value) => {
        setError(null);
        setConfig((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    useEffect(() => {
        const isError = !isConnecting && !isConnected && status && (status.includes("Error") || status.includes("failed"));
        if (isError) {
            setError("로그인에 실패했습니다.");
        }
    }, [isConnecting, isConnected, status]);

    return (
        <div className="login-form">
            <h2>로그인</h2>
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                    <label htmlFor="username">사용자명:</label>
                    <input
                        type="text"
                        id="username"
                        value={config.username}
                        onChange={(e) => handleInputChange("username", e.target.value)}
                        disabled={isConnected}
                        placeholder="사용자명 입력"
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">비밀번호:</label>
                    <input
                        type="password"
                        id="password"
                        value={config.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        disabled={isConnected}
                        placeholder="비밀번호 입력"
                        required
                    />
                </div>

                <div className="login-actions">
                    <button type="submit" disabled={isConnecting || isConnected} className="global-btn">
                        {isConnecting ? "연결 중..." : "로그인"}
                    </button>
                    {error && <p className="error-message">{error}</p>}
                </div>
            </form>
        </div>
    );
};

// props가 실제로 변경되었을 때만 리렌더링
export const LoginForm = React.memo(LoginFormComponent);
