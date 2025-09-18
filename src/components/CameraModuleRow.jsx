import React, { useState, useMemo } from "react";
import { SiteNameModal } from "./SiteNameModal";

export const CameraModuleRow = ({ moduleId, status, onCommand, onLoadSettings, availableSettings, isDummy, initialSettings, gridTemplateColumns }) => {
    const [settings, setSettings] = useState(
        initialSettings || {
            startTime: "08:00",
            endTime: "18:00",
            captureInterval: "10",
            imageSize: "1920x1080",
            quality: "보통",
            iso: "400",
            format: "JPG",
            aperture: "f/2.8",
        }
    );
    const [isSiteNameModalOpen, setIsSiteNameModalOpen] = useState(false);
    const timeOptions = useMemo(() => {
        return Array.from({ length: 24 * 60 }, (_, index) => {
            const hour = Math.floor(index / 60)
                .toString()
                .padStart(2, "0");
            const minute = (index % 60).toString().padStart(2, "0");
            return `${hour}:${minute}`;
        });
    }, []);

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

    // isDummy인 경우의 상태값도 확인
    const isEnabled = isDummy || status?.isConnected;

    const handleLoadSettings = () => {
        onLoadSettings(moduleId);
    };

    const handleLoadOptions = () => {
        onCommand(moduleId, "options_request", {});
    };

    const handleSiteNameChange = () => {
        setIsSiteNameModalOpen(true);
    };

    const handleSiteNameSubmit = async (newSiteName) => {
        onCommand(moduleId, "sitename", { sitename: newSiteName });
        setIsSiteNameModalOpen(false);
    };

    const handleSwUpdate = () => {
        onCommand(moduleId, "sw-update", {});
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
            <span className="module-id">{moduleId.toString().padStart(2, "0")}</span>
            <div className={`status-dot ${getStatusClass(status?.isConnected)}`}></div>
            <span className="site-name clickable" title={`Site name ${status?.siteName || "Not set"} (click to edit)`} onClick={handleSiteNameChange}>
                {status?.siteName || "Not set"}
            </span>
            <div className="capacity-container">
                <div className={`capacity-progress ${getCapacityInfo().isWarning ? "warning" : ""}`}>
                    <div className="capacity-progress-bar" style={{ width: `${getCapacityInfo().percentage}%` }}></div>
                    <span className="capacity-text">{getCapacityInfo().display}</span>
                </div>
            </div>
            <div className="capture-info-stack">
                <div className="capture-info-item">
                    <span className="info-label">촬영</span>
                    <span className="capture-progress">{getCaptureProgress()}</span>
                </div>
                <div className="capture-info-item">
                    <span className="info-label">실패</span>
                    <span className="missed-captures">{getMissedCaptures()}</span>
                </div>
            </div>
            <div className="last-capture">{formatDateTime(status?.lastCaptureTime)}</div>
            <div className="last-boot">{formatDateTime(status?.lastBootTime)}</div>

            <div className="control-buttons">
                <button className="btn reboot" onClick={handleReboot} disabled={!isEnabled} title="Reboot module">
                    Reboot
                </button>
                <button className="btn wiper" onClick={handleWiper} disabled={!isEnabled} title="Run wiper for 30 seconds">
                    Wiper
                </button>
                <button className="btn camera-power" onClick={handleCameraPower} disabled={!isEnabled} title="Toggle camera power">
                    Camera Power
                </button>
            </div>

            <div className="sw-stack">
                <div className="sw-version">{status?.swVersion || "v1.0.0"}</div>
                <button className="btn sw-update" onClick={handleSwUpdate} disabled={!isEnabled} title="Software update">
                    Update
                </button>
            </div>

            <div className="time-settings-stack">
                <div className="setting-group">
                    <span className="setting-label">Start</span>
                    <select value={settings.startTime || "08:00"} onChange={(e) => handleSettingChange("startTime", e.target.value)} disabled={!isEnabled} title="Start time">
                        {timeOptions.map((time) => (
                            <option key={`start-${time}`} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="setting-group">
                    <span className="setting-label">End</span>
                    <select value={settings.endTime || "18:00"} onChange={(e) => handleSettingChange("endTime", e.target.value)} disabled={!isEnabled} title="End time">
                        {timeOptions.map((time) => (
                            <option key={`end-${time}`} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="setting-group">
                    <span className="setting-label">Interval</span>
                    <div className="interval-container">
                        <input
                            type="number"
                            min="1"
                            max="60"
                            value={settings.captureInterval || "10"}
                            onChange={(e) => handleSettingChange("captureInterval", e.target.value)}
                            disabled={!isEnabled}
                            className="interval-input"
                            title="Capture interval (minutes)"
                        />
                        <span className="interval-unit">min</span>
                    </div>
                </div>
            </div>

            <div className="camera-settings-stack">
                <div className="setting-group">
                    <span className="setting-label">Size</span>
                    <select value={settings.imageSize} onChange={(e) => handleSettingChange("imageSize", e.target.value)} disabled={!isEnabled} title="이미지 크기">
                        <option value="640x480">640x480</option>
                        <option value="1280x720">1280x720</option>
                        <option value="1920x1080">1920x1080</option>
                        <option value="2560x1440">2560x1440</option>
                        <option value="3840x2160">3840x2160</option>
                    </select>
                </div>

                <div className="setting-group">
                    <span className="setting-label">Quality</span>
                    <select value={settings.quality} onChange={(e) => handleSettingChange("quality", e.target.value)} disabled={!isEnabled} title="이미지 품질">
                        <option value="최고">최고</option>
                        <option value="보통">보통</option>
                        <option value="낮음">낮음</option>
                    </select>
                </div>

                <div className="setting-group">
                    <span className="setting-label">ISO</span>
                    <select value={settings.iso} onChange={(e) => handleSettingChange("iso", e.target.value)} disabled={!isEnabled} title="ISO">
                        <option value="100">100</option>
                        <option value="200">200</option>
                        <option value="400">400</option>
                        <option value="800">800</option>
                        <option value="1600">1600</option>
                        <option value="3200">3200</option>
                        <option value="6400">6400</option>
                    </select>
                </div>

                <div className="setting-group">
                    <span className="setting-label">Format</span>
                    <select value={settings.format} onChange={(e) => handleSettingChange("format", e.target.value)} disabled={!isEnabled} title="이미지 형식">
                        <option value="JPG">JPG</option>
                        <option value="RAW">RAW</option>
                        <option value="JPG+RAW">JPG+RAW</option>
                    </select>
                </div>

                <div className="setting-group">
                    <span className="setting-label">Aperture</span>
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
                </div>
            </div>

            <div className="settings-stack">
                <div className="settings-stack-inner">
                    <button className="btn load" onClick={handleLoadSettings} disabled={!isEnabled} title="현재 설정 불러오기">
                        현재 설정
                    </button>
                    <button className="btn load" onClick={handleLoadOptions} disabled={!isEnabled} title="사용 가능한 옵션 불러오기">
                        옵션 로드
                    </button>

                    <button className="btn apply" onClick={handleApplySettings} disabled={!isEnabled} title="변경 적용">
                        변경 적용
                    </button>
                </div>
            </div>

            <SiteNameModal isOpen={isSiteNameModalOpen} onClose={() => setIsSiteNameModalOpen(false)} onSubmit={handleSiteNameSubmit} currentSiteName={status?.siteName} moduleId={moduleId} />
        </div>
    );
};
