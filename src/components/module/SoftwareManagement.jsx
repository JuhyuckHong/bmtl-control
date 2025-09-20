import React from 'react';
import PropTypes from 'prop-types';

/**
 * 소프트웨어 관리 컴포넌트
 * @param {Object} props
 * @param {Object} props.status - 모듈 상태 데이터
 * @param {Function} props.onSwVersionRequest - SW 버전 요청 핸들러
 * @param {Function} props.onSwUpdate - SW 업데이트 핸들러
 * @param {Function} props.onSwRollback - SW 롤백 핸들러
 * @param {boolean} props.isEnabled - 컨트롤 활성화 여부
 */
const SoftwareManagement = ({
    status,
    onSwVersionRequest,
    onSwUpdate,
    onSwRollback,
    isEnabled
}) => {
    return (
        <div className="sw-stack">
            <div className="sw-version">{status?.swVersion || "-"}</div>
            <button
                className="btn sw-version-refresh"
                onClick={onSwVersionRequest}
                disabled={!isEnabled}
                title="SW 버전 새로고침"
            >
                🔄
            </button>
            <button
                className="btn sw-update"
                onClick={onSwUpdate}
                disabled={!isEnabled}
                title="소프트웨어 업데이트 요청"
            >
                업데이트
            </button>
            <button
                className="btn sw-rollback"
                onClick={onSwRollback}
                disabled={!isEnabled}
                title="이전 버전으로 롤백"
            >
                롤백
            </button>
        </div>
    );
};

SoftwareManagement.propTypes = {
    status: PropTypes.shape({
        swVersion: PropTypes.string,
    }),
    onSwVersionRequest: PropTypes.func.isRequired,
    onSwUpdate: PropTypes.func.isRequired,
    onSwRollback: PropTypes.func.isRequired,
    isEnabled: PropTypes.bool.isRequired,
};

export default React.memo(SoftwareManagement);