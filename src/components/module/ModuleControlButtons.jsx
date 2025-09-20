import React from 'react';
import PropTypes from 'prop-types';

/**
 * 모듈 제어 버튼 컴포넌트
 * @param {Object} props
 * @param {Function} props.onReboot - 재부팅 핸들러
 * @param {Function} props.onWiper - 와이퍼 핸들러
 * @param {Function} props.onCameraPower - 카메라 전원 핸들러
 * @param {boolean} props.isEnabled - 버튼 활성화 여부
 */
const ModuleControlButtons = ({ onReboot, onWiper, onCameraPower, isEnabled }) => {
    return (
        <div className="control-buttons">
            <button
                className="btn reboot"
                onClick={onReboot}
                disabled={!isEnabled}
                title="모듈 재부팅"
            >
                재부팅
            </button>
            <button
                className="btn wiper"
                onClick={onWiper}
                disabled={!isEnabled}
                title="와이퍼 30초 작동"
            >
                와이퍼
            </button>
            <button
                className="btn camera-power"
                onClick={onCameraPower}
                disabled={!isEnabled}
                title="카메라 전원 토글"
            >
                카메라 전원
            </button>
        </div>
    );
};

ModuleControlButtons.propTypes = {
    onReboot: PropTypes.func.isRequired,
    onWiper: PropTypes.func.isRequired,
    onCameraPower: PropTypes.func.isRequired,
    isEnabled: PropTypes.bool.isRequired,
};

export default React.memo(ModuleControlButtons);