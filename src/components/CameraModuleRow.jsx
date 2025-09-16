import React, { useState } from "react";

export const CameraModuleRow = ({ moduleId, status, onCommand, onLoadSettings, availableSettings, isDummy, initialSettings, gridTemplateColumns }) => {
    const [settings, setSettings] = useState(
        initialSettings || {
            startTime: "08:00",
            endTime: "18:00",
            captureInterval: "10",
            imageSize: "1920x1080",
            quality: "높음",
            iso: "400",
            format: "JPG",
            aperture: "f/2.8",
        }
    );

    const handleSettingChange = (key, value) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleReboot = () => {
        onCommand(moduleId, "reboot", {});
    };

    const handleWiper = () => {
        onCommand(moduleId, "wiper", {});
    };

    const handleCameraPower = () => {
        onCommand(moduleId, "camera-on-off", {});
    };

    const handleApplySettings = () => {
        onCommand(moduleId, "configure", settings);
    };

    // isDummy나 연결된 상태인지 확인
    const isEnabled = isDummy || status?.isConnected;

    const handleLoadSettings = () => {
        onLoadSettings(moduleId);
    };

    const handleLoadOptions = () => {
        onCommand(moduleId, "options_request", {});
    };

    const getStatusClass = (isConnected) => {
        if (isConnected === null) return "status-unknown";
        return isConnected ? "status-online" : "status-offline";
    };

    const formatDateTime = (timestamp) => {
        if (!timestamp) return "없음";
        const date = new Date(timestamp);
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hour = date.getHours().toString().padStart(2, "0");
        const minute = date.getMinutes().toString().padStart(2, "0");
        const second = date.getSeconds().toString().padStart(2, "0");

        return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
    };

    const formatTime = (timeString) => {
        if (!timeString) return "";
        // 24시간 형식 HH:MM으로 표시
        const [hours, minutes] = timeString.split(":");
        const hour24 = parseInt(hours, 10);
        const formattedHour = hour24.toString().padStart(2, "0");
        return `${formattedHour}:${minutes}`;
    };

    const getCaptureProgress = () => {
        const totalToday = status?.todayTotalCaptures || 0;
        const captured = status?.todayCapturedCount || 0;
        return `${captured}/${totalToday}`;
    };

    const getMissedCaptures = () => {
        return status?.missedCaptures || 0;
    };

    const getCapacityInfo = () => {
        const capacity = status?.remainingCapacity;
        if (capacity === null || capacity === undefined) {
            return { percentage: 0, display: "--", isWarning: false };
        }

        const percentage = parseFloat(capacity);
        const isWarning = percentage >= 90;

        return {
            percentage,
            display: `${percentage}%`,
            isWarning,
        };
    };

    return (
        <div className={`camera-module-row ${!status?.isConnected ? "disconnected" : ""}`}>
            <div className="camera-module-fixed">
                <span className="module-id">{moduleId.toString().padStart(2, "0")}</span>
                <div className={`status-dot ${getStatusClass(status?.isConnected)}`}></div>
                <span className="site-name" title={status?.siteName || "미설정"}>
                    {status?.siteName || "미설정"}
                </span>
            </div>

            <div className="camera-module-scrollable" style={{ gridTemplateColumns }}>
                <div className="capacity-container">
                    <div className={`capacity-progress ${getCapacityInfo().isWarning ? "warning" : ""}`}>
                        <div className="capacity-progress-bar" style={{ width: `${getCapacityInfo().percentage}%` }}></div>
                        <span className="capacity-text">{getCapacityInfo().display}</span>
                    </div>
                </div>
                <span className="capture-progress">{getCaptureProgress()}</span>
                <span className="missed-captures">{getMissedCaptures()}</span>
                <div className="last-capture">{formatDateTime(status?.lastCaptureTime)}</div>
                <div className="last-boot">{formatDateTime(status?.lastBootTime)}</div>

                <div className="control-buttons">
                    <button className="btn reboot" onClick={handleReboot} disabled={!isEnabled} title="카메라 재부팅" style={{ fontSize: "0.6rem", padding: "0.1rem", flex: 1, margin: "0 0.1rem" }}>
                        재부팅
                    </button>
                    <button className="btn wiper" onClick={handleWiper} disabled={!isEnabled} title="와이퍼 30초 동작" style={{ fontSize: "0.6rem", padding: "0.1rem", flex: 1, margin: "0 0.1rem" }}>
                        와이퍼
                    </button>
                    <button
                        className="btn camera-power"
                        onClick={handleCameraPower}
                        disabled={!isEnabled}
                        title="카메라 전원 On/Off"
                        style={{ fontSize: "0.6rem", padding: "0.1rem", flex: 1, margin: "0 0.1rem" }}
                    >
                        전원
                    </button>
                </div>

                <div className="time-picker-container">
                    <select
                        value={settings.startTime?.split(":")[0] || "08"}
                        onChange={(e) => {
                            const minute = settings.startTime?.split(":")[1] || "00";
                            handleSettingChange("startTime", `${e.target.value}:${minute}`);
                        }}
                        disabled={!isEnabled}
                        className="hour-select"
                        title="시작 시간"
                    >
                        {Array.from({ length: 24 }, (_, hour) => (
                            <option key={hour} value={hour.toString().padStart(2, "0")}>
                                {hour.toString().padStart(2, "0")}
                            </option>
                        ))}
                    </select>
                    <span className="time-separator">:</span>
                    <select
                        value={settings.startTime?.split(":")[1] || "00"}
                        onChange={(e) => {
                            const hour = settings.startTime?.split(":")[0] || "08";
                            handleSettingChange("startTime", `${hour}:${e.target.value}`);
                        }}
                        disabled={!isEnabled}
                        className="minute-select"
                        title="시작 분"
                    >
                        {Array.from({ length: 60 }, (_, minute) => (
                            <option key={minute} value={minute.toString().padStart(2, "0")}>
                                {minute.toString().padStart(2, "0")}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="time-picker-container">
                    <select
                        value={settings.endTime?.split(":")[0] || "18"}
                        onChange={(e) => {
                            const minute = settings.endTime?.split(":")[1] || "00";
                            handleSettingChange("endTime", `${e.target.value}:${minute}`);
                        }}
                        disabled={!isEnabled}
                        className="hour-select"
                        title="종료 시간"
                    >
                        {Array.from({ length: 24 }, (_, hour) => (
                            <option key={hour} value={hour.toString().padStart(2, "0")}>
                                {hour.toString().padStart(2, "0")}
                            </option>
                        ))}
                    </select>
                    <span className="time-separator">:</span>
                    <select
                        value={settings.endTime?.split(":")[1] || "00"}
                        onChange={(e) => {
                            const hour = settings.endTime?.split(":")[0] || "18";
                            handleSettingChange("endTime", `${hour}:${e.target.value}`);
                        }}
                        disabled={!isEnabled}
                        className="minute-select"
                        title="종료 분"
                    >
                        {Array.from({ length: 60 }, (_, minute) => (
                            <option key={minute} value={minute.toString().padStart(2, "0")}>
                                {minute.toString().padStart(2, "0")}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="interval-container">
                    <input
                        type="number"
                        min="1"
                        max="60"
                        value={settings.captureInterval || "10"}
                        onChange={(e) => handleSettingChange("captureInterval", e.target.value)}
                        disabled={!isEnabled}
                        className="interval-input"
                        title="촬영 간격 (분)"
                    />
                    <span className="interval-unit">분</span>
                </div>

                <select value={settings.imageSize} onChange={(e) => handleSettingChange("imageSize", e.target.value)} disabled={!isEnabled} title="이미지 크기">
                    <option value="640x480">640x480</option>
                    <option value="1280x720">1280x720</option>
                    <option value="1920x1080">1920x1080</option>
                    <option value="2560x1440">2560x1440</option>
                    <option value="3840x2160">3840x2160</option>
                </select>

                <select value={settings.quality} onChange={(e) => handleSettingChange("quality", e.target.value)} disabled={!isEnabled} title="이미지 품질">
                    <option value="최고">최고</option>
                    <option value="높음">높음</option>
                    <option value="보통">보통</option>
                    <option value="낮음">낮음</option>
                </select>

                <select value={settings.iso} onChange={(e) => handleSettingChange("iso", e.target.value)} disabled={!isEnabled} title="ISO">
                    <option value="100">100</option>
                    <option value="200">200</option>
                    <option value="400">400</option>
                    <option value="800">800</option>
                    <option value="1600">1600</option>
                    <option value="3200">3200</option>
                    <option value="6400">6400</option>
                </select>

                <select value={settings.format} onChange={(e) => handleSettingChange("format", e.target.value)} disabled={!isEnabled} title="이미지 포맷">
                    <option value="JPG">JPG</option>
                    <option value="RAW">RAW</option>
                    <option value="JPG+RAW">JPG+RAW</option>
                </select>

                <select value={settings.aperture} onChange={(e) => handleSettingChange("aperture", e.target.value)} disabled={!isEnabled} title="조리개">
                    <option value="f/1.4">1.4</option>
                    <option value="f/2.0">2.0</option>
                    <option value="f/2.8">2.8</option>
                    <option value="f/4.0">4.0</option>
                    <option value="f/5.6">5.6</option>
                    <option value="f/8.0">8.0</option>
                    <option value="f/11">11</option>
                    <option value="f/16">16</option>
                </select>

                <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: "100px" }}>
                    <div style={{ display: "flex", gap: "2px" }}>
                        <button
                            className="btn load"
                            onClick={handleLoadSettings}
                            disabled={!isEnabled}
                            title="현재 설정 불러오기"
                            style={{ fontSize: "0.6rem", padding: "0.1rem", flex: 1, margin: "0 0.1rem" }}
                        >
                            현재 설정
                        </button>
                        <button
                            className="btn load"
                            onClick={handleLoadOptions}
                            disabled={!isEnabled}
                            title="사용 가능한 옵션 불러오기"
                            style={{ fontSize: "0.6rem", padding: "0.1rem", flex: 1, margin: "0 0.1rem" }}
                        >
                            옵션 로드
                        </button>

                        <button
                            className="btn apply"
                            onClick={handleApplySettings}
                            disabled={!isEnabled}
                            title="변경 적용"
                            style={{ fontSize: "0.6rem", padding: "0.1rem", flex: 1, margin: "0 0.1rem" }}
                        >
                            변경 적용
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
