/**
 * MQTT Topic Constants
 * BMTL Camera Control System의 MQTT 토픽 정의
 */

export const CAMERA_CONTROL_TOPICS = [
    // 서비스 상태
    "bmtl/status/health/+",

    // 설정 관련
    "bmtl/response/settings/+",
    "bmtl/response/set/settings/+",
    "bmtl/response/options/+",
    "bmtl/response/options/all",

    // 제어 명령 응답
    "bmtl/response/reboot/+",
    "bmtl/response/reboot/all",
    "bmtl/response/wiper/+",
    "bmtl/response/camera-on-off/+",
    "bmtl/response/camera-power-status/+",

    // 관리 명령 응답
    "bmtl/response/set/sitename/+",
    "bmtl/response/sw-update/+",
    "bmtl/response/sw-version/+",
    "bmtl/response/sw-rollback/+",
];

export const MQTT_QOS = {
    AT_MOST_ONCE: 0,
    AT_LEAST_ONCE: 1,
    EXACTLY_ONCE: 2
};

export const TOPIC_PREFIXES = {
    REQUEST: "bmtl/request",
    RESPONSE: "bmtl/response",
    SET: "bmtl/set",
    STATUS: "bmtl/status"
};