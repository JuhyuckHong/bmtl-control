1.  전체 설정 응답 방식 차이

-   Control 문서: 각 모듈이 bmtl/status/health/{device_id}로 개별 응답
-   Device 문서: bmtl/response/settings/all로 통합 응답

수정 방안

-   Control: 현재 상태 유지
-   Device: 제어패널 기준에 맞게 수정

2. Software Update 프로토콜 차이

Device 문서:

-   응답에 response_type: "sw_update_result" 포함
-   log_file 경로 포함
-   상태값: "started" | "completed" | "failed"

Control 문서:

-   success: true/false 형태
-   version 필드 기대
-   log_file 필드 없음

수정방안

-   Control: 응답 기대 없음. 업데이트 종료 후 버전 전달받아서 표시만 수행
-   Device: 응답 제공 불필요 상태값 등 필요없음. log_file 경로 불필요

3. 페이로드 구조 차이

SW 버전 정보 (bmtl/response/sw-version/{device_id})

-   Control 문서: {"commit_hash": "9f2a45c"}
-   Device 문서:
    {
    "module_id": "bmotion{device_id}",
    "sw_version": "v1.0.0",
    "commit_hash": "abc123def456",
    "branch": "main",
    "update_time": "2024-01-01T12:00:00.000000",
    "timestamp": "2024-01-01T12:00:00.000000"
    }
-   수정방안: Control 기준으로 수행

헬스체크 페이로드

-   Control 문서:
    {
    "module*id": "camera*{device_id}",
    "site_name": "서울\_1공구",
    "storage_used": 47.2,
    "last_capture_time": "2024-09-19T02:58:12Z",
    "today_total_captures": 120,
    "today_captured_count": 45,
    "missed_captures": 2,
    "sw_version": "v1.2.2"
    }
-   Device 문서:
    {
    "module_id": "bmotion{device_id}",
    "status": "online",
    "cpu_percent": 45.2,
    "memory_percent": 32.1,
    "disk_percent": 78.5,
    "temperature": 42.3,
    "uptime": 3600,
    "timestamp": "2024-01-01T12:00:00.000000"
    }
-   수정방안: 아래와 같이 서로 일치

{
"module_id": "bmotion{device_id}",
"storage_used": 47.2,
"temperature": 42.3,
"last_capture_time": "2024-09-19T02:58:12Z",
"today_total_captures": 120,
"today_captured_count": 45,
"missed_captures": 2,
}

4. 누락된 토픽들

제어패널에는 있지만 디바이스 문서에 없는 것:

-   bmtl/set/sitename/{device_id} / bmtl/response/sitename/{device_id}
-   수정방안: 디바이스에서 sitename 페이로드를 받아서 config.ini 수정 필요

디바이스에는 있지만 제어패널 문서에 없는 것:

-   bmtl/sw-rollback/{device_id} / bmtl/response/sw-rollback/{device_id}
-   수정방안: 제어패널에 sw-rollback 버튼을 update 아래에 구현해둘 것
-   bmtl/request/status / bmtl/response/status
-   수정방안: 상태 요청을 bmtl/request/status/all 이나 bmtl/request/status/{device_id}로 올 때, bmtl/status/health/{device_id}로 상태 전달하도록 디바이스와 제어패널 일치 필요

5. 페이로드 상세 차이

설정 변경 응답

-   제어패널: success, message 필드
-   디바이스: status, message, timestamp, module_id 필드
-   수정방안: 제어패널 기준으로 일치

와이퍼/카메라 제어

-   제어패널: 빈 페이로드 {}로 요청
-   디바이스: action 필드 포함 요청
-   수정방안: 제어패널 기준으로 요청오면 바로 수행하도록 디바이스 수정
