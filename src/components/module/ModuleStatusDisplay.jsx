import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * 모듈 상태 표시 컴포넌트
 * @param {Object} props
 * @param {Object} props.status - 모듈 상태 데이터
 * @param {string} props.moduleDisplayId - 표시용 모듈 ID
 * @param {number} props.moduleId - 모듈 ID
 * @param {Function} props.onSiteNameChange - 사이트명 변경 핸들러
 */
const ModuleStatusDisplay = ({ status, moduleDisplayId, moduleId, onSiteNameChange }) => {
    const getStatusClass = (isConnected) => {
        if (isConnected === null || isConnected === undefined) {
            return "status-unknown";
        }
        return isConnected ? "status-online" : "status-offline";
    };

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
        <>
            <span className="module-id">{moduleDisplayId || moduleId.toString().padStart(2, "0")}</span>
            <div className={`status-dot ${getStatusClass(status?.isConnected)}`}></div>
            <span
                className="site-name clickable"
                title={`현장 이름 ${status?.siteName || "미지정"} (클릭하여 수정)`}
                onClick={onSiteNameChange}
            >
                {status?.siteName || "미지정"}
            </span>

            <div className="capacity-container">
                <div className={`capacity-donut ${storageInfo.isWarning ? "warning" : ""}`}>
                    <svg width="50" height="50" viewBox="0 0 50 50" className="donut-chart">
                        {/* 전체 원 아웃라인 */}
                        <circle
                            cx="25"
                            cy="25"
                            r="22"
                            fill="transparent"
                            stroke="var(--border-strong)"
                            strokeWidth="1"
                        />
                        {/* 배경 원 */}
                        <circle
                            cx="25"
                            cy="25"
                            r="18"
                            fill="transparent"
                            stroke="var(--border)"
                            strokeWidth="8"
                        />
                        {/* 진행률 원 */}
                        <circle
                            cx="25"
                            cy="25"
                            r="18"
                            fill="transparent"
                            stroke={storageInfo.isWarning ? "var(--error)" : "var(--info)"}
                            strokeWidth="8"
                            strokeDasharray={`${Math.min(storageInfo.percentage, 100) * 1.131} 113.1`}
                            strokeDashoffset="28.275"
                            transform="rotate(-90 25 25)"
                        />
                    </svg>
                    <span className="donut-text">{Math.round(storageInfo.percentage)}%</span>
                </div>
            </div>

            <div className="temp-battery-stack">
                <div className={`temperature ${temperatureInfo.isWarning ? "warning" : ""}`}>
                    {temperatureInfo.display}
                </div>
                <div className={`battery ${batteryInfo.isWarning ? "warning" : ""}`}>
                    {batteryInfo.display}
                </div>
            </div>
        </>
    );
};

ModuleStatusDisplay.propTypes = {
    status: PropTypes.shape({
        isConnected: PropTypes.bool,
        siteName: PropTypes.string,
        storageUsed: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        temperature: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        battery_level: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
    moduleDisplayId: PropTypes.string,
    moduleId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    onSiteNameChange: PropTypes.func.isRequired,
};

export default React.memo(ModuleStatusDisplay);