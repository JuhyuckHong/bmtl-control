import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * 촬영 정보 표시 컴포넌트
 * @param {Object} props
 * @param {Object} props.status - 모듈 상태 데이터
 * @param {Function} props.onCameraPowerStatus - 카메라 전원 상태 확인 핸들러
 * @param {boolean} props.isEnabled - 컨트롤 활성화 여부
 */
const CaptureInfoDisplay = ({ status, onCameraPowerStatus, isEnabled }) => {
    const captureProgress = useMemo(() => {
        const totalToday = Number(status?.todayTotalCaptures) || 0;
        const captured = Number(status?.todayCapturedCount) || 0;
        return `${captured}/${totalToday}`;
    }, [status?.todayTotalCaptures, status?.todayCapturedCount]);

    const missedCaptures = useMemo(() => {
        const missed = Number(status?.missedCaptures);
        return Number.isNaN(missed) ? 0 : missed;
    }, [status?.missedCaptures]);

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

        return `${year}.${month}.${day} ${hour}:${minute}:${second}`;
    }, []);

    return (
        <>
            <div className="capture-info-stack">
                <div className="capture-info-item camera-status-item">
                    <span className="info-label">카메라</span>
                    <span className={`camera-power-status ${status?.cameraPowerStatus || 'unknown'}`}>
                        {status?.cameraPowerStatus === 'on' ? '전원켜짐' :
                         status?.cameraPowerStatus === 'off' ? '전원꺼짐' :
                         status?.cameraPowerStatus === 'error' ? '오류' : '확인중'}
                    </span>
                    <button
                        className="btn camera-power-status-refresh"
                        onClick={onCameraPowerStatus}
                        disabled={!isEnabled}
                        title="카메라 전원 상태 확인 요청"
                    >
                        상태 확인
                    </button>
                </div>
                <div className="capture-info-item">
                    <span className="info-label">촬영</span>
                    <span className="capture-progress">{captureProgress}</span>
                </div>
                <div className="capture-info-item">
                    <span className="info-label">실패</span>
                    <span className="missed-captures">{missedCaptures}</span>
                </div>
            </div>
            <div className="last-capture">{formatDateTime(status?.lastCaptureTime)}</div>
            <div className="last-boot">{formatDateTime(status?.lastBootTime)}</div>
        </>
    );
};

CaptureInfoDisplay.propTypes = {
    status: PropTypes.shape({
        cameraPowerStatus: PropTypes.oneOf(['on', 'off', 'error', 'unknown']),
        todayTotalCaptures: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        todayCapturedCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        missedCaptures: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        lastCaptureTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
        lastBootTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    }),
    onCameraPowerStatus: PropTypes.func.isRequired,
    isEnabled: PropTypes.bool.isRequired,
};

export default React.memo(CaptureInfoDisplay);