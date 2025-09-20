import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SiteNameModal } from "./SiteNameModal";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => hour.toString().padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, minute) => minute.toString().padStart(2, "0"));
const INTERVAL_OPTIONS = Array.from({ length: 60 }, (_, index) => (index + 1).toString().padStart(2, "0"));
const DEFAULT_SETTINGS = {
    startTime: "08:00",
    endTime: "18:00",
    captureInterval: "10",
    imageSize: "1920x1080",
    quality: "보통",
    iso: "400",
    format: "JPG",
    aperture: "f/2.8",
};

/**
 * Camera Module Row Component
 * @param {Object} props - Component props
 * @param {number} props.moduleId - Module ID number
 * @param {string} props.moduleDisplayId - Formatted module identifier for UI
 * @param {Object} props.status - Module status object
 * @param {Function} props.onCommand - Command handler function
 * @param {Function} props.onLoadSettings - Load settings handler function
 * @param {boolean} props.isDummy - Whether this is a dummy module
 * @param {Object} props.initialSettings - Initial settings object
 */

const areSettingsEqual = (a = {}, b = {}) => {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
        return false;
    }

    return aKeys.every((key) => a[key] === b[key]);
};

const CameraModuleRowComponent = ({ moduleId, moduleDisplayId, status, onCommand, onLoadSettings, isDummy, initialSettings }) => {
    const [settings, setSettings] = useState(initialSettings || DEFAULT_SETTINGS);
    useEffect(() => {
        const nextSettings = initialSettings || DEFAULT_SETTINGS;
        setSettings((prev) => (areSettingsEqual(prev, nextSettings) ? prev : nextSettings));
    }, [initialSettings]);

    const [isSiteNameModalOpen, setIsSiteNameModalOpen] = useState(false);
    const handleSettingChange = useCallback((key, value) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const handleTimeChange = useCallback((timeKey, component, value) => {
        setSettings((prev) => {
            const currentTime = prev[timeKey] || "08:00";
            const [currentHour, currentMinute] = currentTime.split(":");

            const newHour = component === "hour" ? value : currentHour;
            const newMinute = component === "minute" ? value : currentMinute;

            return {
                ...prev,
                [timeKey]: `${newHour}:${newMinute}`,
            };
        });
    }, []);

    const handleReboot = useCallback(() => {
        onCommand(moduleId, "reboot", {});
    }, [onCommand, moduleId]);

    const handleWiper = useCallback(() => {
        onCommand(moduleId, "wiper", {});
    }, [onCommand, moduleId]);

    const handleCameraPower = useCallback(() => {
        onCommand(moduleId, "camera-on-off", {});
    }, [onCommand, moduleId]);

    const handleCameraPowerStatus = useCallback(() => {
        onCommand(moduleId, "camera-power-status", {});
    }, [onCommand, moduleId]);

    const handleApplySettings = useCallback(() => {
        onCommand(moduleId, "configure", settings);
    }, [onCommand, moduleId, settings]);

    // 개발 환경에서는 연결 상태와 무관하게 제어 가능하도록 유지
    const isEnabled = status?.isConnected || isDummy;

    const handleLoadSettings = useCallback(() => {
        onLoadSettings(moduleId);
    }, [onLoadSettings, moduleId]);

    const handleLoadOptions = useCallback(() => {
        onCommand(moduleId, "options_request", {});
    }, [onCommand, moduleId]);

    const handleSiteNameChange = useCallback(() => {
        setIsSiteNameModalOpen(true);
    }, []);

    const handleSiteNameSubmit = useCallback(
        (newSiteName) => {
            onCommand(moduleId, "sitename", { sitename: newSiteName });
            setIsSiteNameModalOpen(false);
        },
        [onCommand, moduleId]
    );

    const handleSwUpdate = useCallback(() => {
        onCommand(moduleId, "sw-update", {});
    }, [onCommand, moduleId]);

    const handleSwRollback = useCallback(() => {
        onCommand(moduleId, "sw-rollback", {});
    }, [onCommand, moduleId]);

    const handleSwVersionRequest = useCallback(() => {
        onCommand(moduleId, "sw-version", {});
    }, [onCommand, moduleId]);

    const getStatusClass = useCallback((isConnected) => {
        if (isConnected === null || isConnected === undefined) {
            return "status-unknown";
        }
        return isConnected ? "status-online" : "status-offline";
    }, []);

    const formatDateTime = useCallback((timestamp) => {
        if (!timestamp) {
            return "없음";
        }

        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
            return "없음";
        }

        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hour = date.getHours().toString().padStart(2, "0");
        const minute = date.getMinutes().toString().padStart(2, "0");
        const second = date.getSeconds().toString().padStart(2, "0");

        return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
    }, []);

    const captureProgress = useMemo(() => {
        const totalToday = Number(status?.todayTotalCaptures) || 0;
        const captured = Number(status?.todayCapturedCount) || 0;
        return `${captured}/${totalToday}`;
    }, [status?.todayTotalCaptures, status?.todayCapturedCount]);

    const missedCaptures = useMemo(() => {
        const missed = Number(status?.missedCaptures);
        return Number.isNaN(missed) ? 0 : missed;
    }, [status?.missedCaptures]);

    const storageInfo = useMemo(() => {
        const usage = Number(status?.storageUsed);
        if (Number.isNaN(usage)) {
            return { percentage: 0, display: "--", isWarning: false };
        }

        // Check if the value is likely in MB (> 100) or percentage (≤ 100)
        if (usage > 100) {
            // Assume it's in MB, display as MB
            return {
                percentage: 0, // Can't calculate percentage without total capacity
                display: `${usage.toFixed(1)}MB`,
                isWarning: usage >= 8000, // Warning if > 8GB
            };
        } else {
            // Assume it's already in percentage
            const clamped = Math.max(0, Math.min(usage, 100));
            return {
                percentage: clamped,
                display: `${clamped.toFixed(1)}%`,
                isWarning: clamped >= 80,
            };
        }
    }, [status?.storageUsed]);

    const temperatureInfo = useMemo(() => {
        const value = Number(status?.temperature);
        if (Number.isNaN(value)) {
            return { display: "없음", isWarning: false };
        }

        return {
            display: `${value.toFixed(1)}°C`,
            isWarning: value >= 50,
        };
    }, [status?.temperature]);

    const batteryInfo = useMemo(() => {
        const value = Number(status?.battery_level);
        if (Number.isNaN(value)) {
            return { display: "--", isWarning: false };
        }

        return {
            display: `${value}%`,
            isWarning: value <= 20,
        };
    }, [status?.battery_level]);

    return (
        <div className={`camera-module-row ${status?.isConnected === false ? "disconnected" : ""}`}>
            <span className="module-id">{moduleDisplayId || moduleId.toString().padStart(2, "0")}</span>
            <div className={`status-dot ${getStatusClass(status?.isConnected)}`}></div>
            <span className="site-name clickable" title={`현장 이름 ${status?.siteName || "미지정"} (클릭하여 수정)`} onClick={handleSiteNameChange}>
                {status?.siteName || "미지정"}
            </span>
            <div className="capacity-container">
                <div className={`capacity-donut ${storageInfo.isWarning ? "warning" : ""}`}>
                    <svg width="50" height="50" viewBox="0 0 50 50" className="donut-chart">
                        <defs>
                            <linearGradient id={`storageGradient-${moduleId}`} x1="0%" y1="0%" x2="0%" y2="100%" gradientUnits="objectBoundingBox">
                                <stop offset="0%" stopColor="#22c55e" />
                                <stop offset="50%" stopColor="#eab308" />
                                <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                        </defs>
                        {/* 전체 원 아웃라인 */}
                        <circle cx="25" cy="25" r="22" fill="transparent" stroke="var(--border-strong)" strokeWidth="1" />
                        {/* 배경 원 */}
                        <circle cx="25" cy="25" r="18" fill="transparent" stroke="var(--border)" strokeWidth="8" />
                        {/* 진행률 원 - 10단계 색상 그라디언트 */}
                        <circle
                            cx="25"
                            cy="25"
                            r="18"
                            fill="transparent"
                            stroke={
                                storageInfo.percentage <= 10 ? "#16a34a" :
                                storageInfo.percentage <= 20 ? "#22c55e" :
                                storageInfo.percentage <= 30 ? "#65a30d" :
                                storageInfo.percentage <= 40 ? "#84cc16" :
                                storageInfo.percentage <= 50 ? "#ca8a04" :
                                storageInfo.percentage <= 60 ? "#eab308" :
                                storageInfo.percentage <= 70 ? "#f59e0b" :
                                storageInfo.percentage <= 80 ? "#f97316" :
                                storageInfo.percentage <= 90 ? "#ea580c" : "#ef4444"
                            }
                            strokeWidth="8"
                            strokeDasharray={`${Math.min(storageInfo.percentage, 100) * 1.131} ${113.1 - Math.min(storageInfo.percentage, 100) * 1.131}`}
                            strokeDashoffset="0"
                            transform="rotate(-90 25 25)"
                        />
                    </svg>
                    <span className="donut-text">{Math.round(storageInfo.percentage)}%</span>
                </div>
            </div>
            <div className="device-status-stack">
                <div className="capture-info-item">
                    <span className="info-label">온도</span>
                    <span className={`temperature ${temperatureInfo.isWarning ? "warning" : ""}`}>{temperatureInfo.display}</span>
                </div>
                <div className="capture-info-item">
                    <span className="info-label">배터리</span>
                    <span className={`battery ${batteryInfo.isWarning ? "warning" : ""}`}>{batteryInfo.display}</span>
                </div>
                <div className="capture-info-item">
                    <span className="info-label">
                        마지막
                        <br />
                        부팅
                    </span>
                    <span className="last-boot-time">{formatDateTime(status?.lastBootTime)}</span>
                </div>
            </div>
            <div className="capture-info-stack">
                <div className="capture-info-item camera-status-item">
                    <span className="info-label">카메라 상태</span>
                    <button
                        className={`btn camera-status-button ${status?.cameraPowerStatus || "unknown"}`}
                        onClick={handleCameraPowerStatus}
                        disabled={!isEnabled || status?.cameraPowerStatus === "checking"}
                        title={
                            status?.cameraPowerStatus === "on"
                                ? "카메라 전원 켜져있음 (클릭하여 재확인)"
                                : status?.cameraPowerStatus === "off"
                                ? "카메라 전원 꺼져있음 (클릭하여 재확인)"
                                : status?.cameraPowerStatus === "error"
                                ? "카메라 오류 상태 (클릭하여 재확인)"
                                : status?.cameraPowerStatus === "checking"
                                ? "상태 확인 중..."
                                : "카메라 상태를 확인하려면 클릭하세요"
                        }
                    >
                        {status?.cameraPowerStatus === "on"
                            ? "정상"
                            : status?.cameraPowerStatus === "off"
                            ? "전원꺼짐"
                            : status?.cameraPowerStatus === "error"
                            ? "오류"
                            : status?.cameraPowerStatus === "checking"
                            ? "확인중..."
                            : "카메라 확인"}
                    </button>
                </div>
                <div className="capture-info-item">
                    <span className="info-label">촬영</span>
                    <span className="capture-progress">{captureProgress}</span>
                </div>
                <div className="capture-info-item">
                    <span className="info-label">
                        마지막
                        <br />
                        촬영
                    </span>
                    <span className="last-capture-time">{formatDateTime(status?.lastCaptureTime)}</span>
                </div>
                <div className="capture-info-item">
                    <span className="info-label">실패</span>
                    <span className="missed-captures">{missedCaptures}</span>
                </div>
            </div>

            <div className="time-settings-stack">
                <div className="setting-group">
                    <span className="setting-label">시작</span>
                    <div className="time-select-container">
                        <select
                            value={(settings.startTime || "08:00").split(":")[0]}
                            onChange={(e) => handleTimeChange("startTime", "hour", e.target.value)}
                            disabled={!isEnabled}
                            title="시작 시간 (시)"
                            className="time-select"
                        >
                            {HOUR_OPTIONS.map((hour) => (
                                <option key={`start-hour-${hour}`} value={hour}>
                                    {hour}
                                </option>
                            ))}
                        </select>
                        <span className="time-unit">시</span>
                    </div>
                </div>

                <div className="setting-group">
                    <span className="setting-label"></span>
                    <div className="time-select-container">
                        <select
                            value={(settings.startTime || "08:00").split(":")[1]}
                            onChange={(e) => handleTimeChange("startTime", "minute", e.target.value)}
                            disabled={!isEnabled}
                            title="시작 시간 (분)"
                            className="time-select"
                        >
                            {MINUTE_OPTIONS.map((minute) => (
                                <option key={`start-minute-${minute}`} value={minute}>
                                    {minute}
                                </option>
                            ))}
                        </select>
                        <span className="time-unit">분</span>
                    </div>
                </div>

                <div className="setting-group">
                    <span className="setting-label">종료</span>
                    <div className="time-select-container">
                        <select
                            value={(settings.endTime || "18:00").split(":")[0]}
                            onChange={(e) => handleTimeChange("endTime", "hour", e.target.value)}
                            disabled={!isEnabled}
                            title="종료 시간 (시)"
                            className="time-select"
                        >
                            {HOUR_OPTIONS.map((hour) => (
                                <option key={`end-hour-${hour}`} value={hour}>
                                    {hour}
                                </option>
                            ))}
                        </select>
                        <span className="time-unit">시</span>
                    </div>
                </div>

                <div className="setting-group">
                    <span className="setting-label"></span>
                    <div className="time-select-container">
                        <select
                            value={(settings.endTime || "18:00").split(":")[1]}
                            onChange={(e) => handleTimeChange("endTime", "minute", e.target.value)}
                            disabled={!isEnabled}
                            title="종료 시간 (분)"
                            className="time-select"
                        >
                            {MINUTE_OPTIONS.map((minute) => (
                                <option key={`end-minute-${minute}`} value={minute}>
                                    {minute}
                                </option>
                            ))}
                        </select>
                        <span className="time-unit">분</span>
                    </div>
                </div>

                <div className="setting-group">
                    <span className="setting-label">간격</span>
                    <div className="time-select-container">
                        <select
                            value={settings.captureInterval || "10"}
                            onChange={(e) => handleSettingChange("captureInterval", e.target.value)}
                            disabled={!isEnabled}
                            title="촬영 간격 (분)"
                            className="time-select"
                        >
                            {INTERVAL_OPTIONS.map((interval) => (
                                <option key={`interval-${interval}`} value={interval}>
                                    {interval}
                                </option>
                            ))}
                        </select>
                        <span className="time-unit">분</span>
                    </div>
                </div>
            </div>

            <div className="control-buttons">
                <button className="btn reboot" onClick={handleReboot} disabled={!isEnabled} title="모듈 재부팅">
                    재부팅
                </button>
                <button className="btn wiper" onClick={handleWiper} disabled={!isEnabled} title="와이퍼 30초 작동">
                    와이퍼
                </button>
                <button className="btn camera-power" onClick={handleCameraPower} disabled={!isEnabled} title="카메라 전원 토글">
                    카메라 전원
                </button>
            </div>

            <div className="sw-stack">
                <div className="sw-version">{status?.swVersion || "-"}</div>
                <button className="btn sw-version-refresh" onClick={handleSwVersionRequest} disabled={!isEnabled} title="SW 버전 새로고침">
                    🔄
                </button>
                <button className="btn sw-update" onClick={handleSwUpdate} disabled={!isEnabled} title="소프트웨어 업데이트 요청">
                    업데이트
                </button>
                <button className="btn sw-rollback" onClick={handleSwRollback} disabled={!isEnabled} title="이전 버전으로 롤백">
                    롤백
                </button>
            </div>

            <div className="camera-settings-stack">
                <div className="setting-group">
                    <span className="setting-label">Size</span>
                    <select value={settings.imageSize} onChange={(e) => handleSettingChange("imageSize", e.target.value)} disabled={!isEnabled} title="이미지 해상도">
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
                    <select value={settings.iso} onChange={(e) => handleSettingChange("iso", e.target.value)} disabled={!isEnabled} title="ISO 감도">
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
                    <select value={settings.format} onChange={(e) => handleSettingChange("format", e.target.value)} disabled={!isEnabled} title="이미지 포맷">
                        <option value="JPG">JPG</option>
                        <option value="RAW">RAW</option>
                        <option value="JPG+RAW">JPG+RAW</option>
                    </select>
                </div>

                <div className="setting-group">
                    <span className="setting-label">Aperture</span>
                    <select value={settings.aperture} onChange={(e) => handleSettingChange("aperture", e.target.value)} disabled={!isEnabled} title="조리개 값">
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
                    <button className="btn apply" onClick={handleApplySettings} disabled={!isEnabled} title="변경 사항 적용">
                        변경 적용
                    </button>
                </div>
            </div>

            <SiteNameModal isOpen={isSiteNameModalOpen} onClose={() => setIsSiteNameModalOpen(false)} onSubmit={handleSiteNameSubmit} currentSiteName={status?.siteName} moduleId={moduleId} />
        </div>
    );
};

// React.memo로 렌더링 최적화
export const CameraModuleRow = React.memo(CameraModuleRowComponent);
