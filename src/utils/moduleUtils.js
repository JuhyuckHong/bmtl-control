/**
 * Module Utility Functions
 * 모듈 상태 및 데이터 처리 관련 유틸리티 함수들
 */

/**
 * 기존 모듈과 새로운 상태 데이터 간의 차이점 확인
 * @param {Object} existingModule - 기존 모듈 데이터
 * @param {Object} statusData - 새로운 상태 데이터
 * @returns {boolean} 차이점이 있으면 true
 */
export const hasStatusDiff = (existingModule, statusData = {}) => {
    if (!existingModule) {
        return true;
    }

    return Object.entries(statusData).some(([key, value]) => existingModule[key] !== value);
};

/**
 * 모듈 ID를 2자리 문자열로 포맷팅
 * @param {number|string} moduleId - 모듈 ID
 * @returns {string} 2자리로 패딩된 문자열 (예: "01", "12")
 */
export const formatModuleId = (moduleId) => {
    return moduleId.toString().padStart(2, "0");
};

/**
 * MQTT 토픽 생성 헬퍼
 * @param {string} prefix - 토픽 접두어
 * @param {string} command - 명령어
 * @param {number|string} moduleId - 모듈 ID (선택사항)
 * @returns {string} 완성된 MQTT 토픽
 */
export const createMqttTopic = (prefix, command, moduleId = null) => {
    if (moduleId !== null) {
        return `${prefix}/${command}/${formatModuleId(moduleId)}`;
    }
    return `${prefix}/${command}`;
};

/**
 * 개발 환경에서만 로그 출력
 * @param {...any} args - 로그 인자들
 */
export const debugLog = (...args) => {
    if (process.env.NODE_ENV === "development") {
        window.console.log(...args);
    }
};