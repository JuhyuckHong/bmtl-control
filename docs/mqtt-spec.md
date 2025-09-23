# BMTL MQTT 메시지 규격 (Control Server <-> Device)

- 토픽 접두사: bmtl/
- 모듈 ID 표기: 2자리 0-패딩 문자 사용(01, 02, ...). 문서에서는 {MM}로 표기.
- QoS 권장: 서버→디바이스 명령은 QoS 2, 디바이스→서버 응답/상태는 QoS 1(또는 0~1). 모든 메시지는 retain=false.
- 시간/타임스탬프: ISO 8601(YYYY-MM-DDTHH:mm:ssZ) 권장. 로컬 시간을 보낼 경우 반드시 타임존 포함.
- 하트비트/오프라인 판정: 마지막 상태 수신 후 5분 이상 무응답이면 오프라인으로 간주.

## 서버 발행 (Publish)

### bmtl/request/status/all

- 목적: 모든 디바이스의 상태(헬스) 갱신 요청
- QoS: 2, retain: false
- 페이로드: {} (빈 객체)
- 기타 동작/주기: 요청 시점 즉시 응답. 각 디바이스는 bmtl/status/health/{MM}으로 1회 상태 메시지 송신(별도의 주기 보고도 병행 가능)

### bmtl/request/status/{MM}

- 목적: 특정 디바이스 상태(헬스) 갱신 요청
- QoS: 2, retain: false
- 페이로드: {}

### bmtl/request/settings/all

- 목적: 모든 디바이스 설정 조회(개별 응답으로 수신)
- QoS: 2, retain: false
- 페이로드: {}
- 응답: 각 디바이스가 `bmtl/response/settings/{MM}`으로 설정 송신(일괄 응답 주제는 사용하지 않음)
- 비고: 컨트롤 서버가 응답을 수집해 UI에 반영하며, 별도의 관리 게이트웨이는 존재하지 않음.

### bmtl/request/settings/{MM}

- 목적: 특정 디바이스 설정 조회
- QoS: 2, retain: false
- 페이로드: {}

### bmtl/set/settings/{MM}

- 목적: 특정 디바이스 설정 변경
- QoS: 2, retain: false
- 페이로드(카멜케이스, UI와 동일 형식 권장):

```json
{
  "startTime": "08:00",
  "endTime": "18:00",
  "captureInterval": "10",
  "imageSize": "1920x1080",
  "quality": "보통",
  "iso": "400",
  "format": "JPG",
  "aperture": "f/2.8"
}
```

- 기타: 요청 즉시 적용 시도. 성공/실패 응답 1회 송신

### bmtl/request/options/all

- 목적: 모든 디바이스의 지원 옵션(해상도/포맷/범위 등) 조회
- QoS: 2, retain: false
- 페이로드: {}
- 응답: 각 디바이스가 `bmtl/response/options/{MM}`으로 지원 옵션 송신(일괄 응답 주제는 사용하지 않음)
- 비고: 컨트롤 서버가 응답을 취합해 UI에 노출하며, 별도의 관리 게이트웨이는 존재하지 않음.

### bmtl/request/options/{MM}

- 목적: 특정 디바이스의 지원 옵션 조회
- QoS: 2, retain: false
- 페이로드: {}

### bmtl/request/reboot/all

- 목적: 모든 디바이스 재부팅 지시
- QoS: 2, retain: false
- 페이로드(선택, 추적 권장):

```json
{ "request_id": "<uuid>" }
```

- 응답: 디바이스가 선택적으로 bmtl/ack/reboot/{MM} 송신(보장 아님). 완료는 bmtl/event/boot/{MM}(또는 상태 갱신)으로 확인.

### bmtl/request/reboot/{MM}

- 목적: 특정 디바이스 재부팅 지시
- QoS: 2, retain: false
- 페이로드(선택, 추적 권장):

```json
{ "request_id": "<uuid>" }
```

- 응답: 디바이스가 선택적으로 bmtl/ack/reboot/{MM} 송신(보장 아님). 완료는 bmtl/event/boot/{MM}(또는 상태 갱신)으로 확인.

### bmtl/request/wiper/{MM}

- 목적: 와이퍼 동작 지시(기본 30초 동작 가능)
- QoS: 2, retain: false
- 페이로드: {}
  선택 옵션: { "duration_s": 30 } (현재 서버는 보내지 않아도 되며, 디바이스 옵션 사용 가능)

### bmtl/request/camera-on-off/{MM}

- 목적: 카메라 전원 On/Off(또는 토글) 지시
- QoS: 2, retain: false
- 페이로드: {}

### bmtl/request/camera-power-status/{MM}

- 목적: 카메라 전원 상태 조회
- QoS: 2, retain: false
- 페이로드: {}

### bmtl/set/sitename/{MM}

- 목적: 사이트명 변경
- QoS: 2, retain: false
- 페이로드(스네이크케이스):

```json
{ "site_name": "새 사이트명" }
```

### bmtl/sw-update/{MM}

- 목적: 소프트웨어 업데이트 요청
- QoS: 2, retain: false
- 페이로드: {}

### bmtl/sw-rollback/{MM}

- 목적: 소프트웨어 롤백 요청
- QoS: 2, retain: false
- 페이로드: {}

### bmtl/request/sw-version/{MM}

- 목적: 소프트웨어 버전 조회
- QoS: 2, retain: false
- 페이로드: {}

## 디바이스 발행 (Subscribe)

### bmtl/status/health/{MM}

- 목적: 헬스/상태 주기 보고 및 on-demand 응답
- QoS: 0~1, retain: false
- 권장 주기:
  - 주기 보고: 30초 권장(최대 60초 이내). 서버가 5분 무응답이면 오프라인으로 표시
  - on-demand: request/status/* 수신 시 1회 즉시 송신
- 페이로드(스네이크케이스):

```json
{
  "site_name": "현장 이름",
  "storage_used": 45.2,
  "temperature": 42.3,
  "last_capture_time": "2024-01-01T12:30:00Z",
  "last_boot_time": "2024-01-01T08:15:00Z",
  "today_total_captures": 100,
  "today_captured_count": 85,
  "missed_captures": 3,
  "sw_version": "v1.0.0"
}
```

### bmtl/response/settings/{MM}

- 목적: 설정 조회 응답
- QoS: 1, retain: false
- 페이로드(카멜케이스 권장):

```json
{
  "response_type": "settings",
  "settings": {
    "startTime": "08:00",
    "endTime": "18:00",
    "captureInterval": "10",
    "imageSize": "1920x1080",
    "quality": "보통",
    "iso": "400",
    "format": "JPG",
    "aperture": "f/2.8"
  }
}
```

### bmtl/response/set/settings/{MM}

- 목적: 설정 변경 적용 결과
- QoS: 1, retain: false
- 페이로드(예시):

```json
{ "success": true, "message": "Applied", "applied": { "startTime": "08:00" } }
```

- 서버 UI 동작: 응답을 수신하면 상태를 업데이트하고, 적용/실패에 따라 알림(토스트)을 표시.

### bmtl/response/options/{MM}

- 목적: 지원 옵션 응답
- QoS: 1, retain: false
- 페이로드:

```json
{
  "response_type": "options",
  "module_id": "bmotion01",
  "options": {
    "supported_resolutions": ["1920x1080", "1280x720"],
    "supported_formats": ["JPG", "RAW"],
    "iso_range": [100, 6400],
    "aperture_range": ["f/1.4", "f/16"]
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### bmtl/ack/reboot/{MM}

- 목적: 재부팅 접수(ACK). 디바이스가 재부팅 수행 전에 간략히 1회 송신(보장 아님)
- QoS: 1, retain: false
- 페이로드:

```json
{
  "response_type": "reboot_ack",
  "accepted": true,
  "message": "Rebooting soon",
  "request_id": "abc123",
  "eta_ms": 500,
  "timestamp": "..."
}
```

- 비고: 최종 재부팅 완료 여부는 LWT/하트비트 혹은 후속 부팅 이벤트/상태로 판단.

### bmtl/response/reboot/{MM}

- 목적: 개별 디바이스 재부팅 실행 결과(성공/실패 여부)
- QoS: 1, retain: false
- 페이로드:

```json
{
  "response_type": "reboot_result",
  "success": true,
  "message": "Reboot initiated",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

- 비고: `request_id`를 포함할 경우 서버가 요청-응답을 추적 가능.

### bmtl/event/boot/{MM}

- 목적: 부팅 완료 이벤트(재부팅 포함)
- QoS: 1, retain: false
- 페이로드:

```json
{
  "boot_id": "20240101T000000Z-abcdef",
  "boot_time": "2024-01-01T00:00:00Z",
  "reason": "reboot_cmd",
  "last_request_id": "abc123",
  "uptime_s": 0
}
```

- 비고: reason 예시는 power_on, watchdog, reboot_cmd. 서버는 request_id와 상관관계를 확인.

### bmtl/response/wiper/{MM}

- 목적: 와이퍼 동작 결과
- QoS: 1, retain: false
- 페이로드:

```json
{ "response_type": "wiper_result", "success": true, "message": "OK" }
```

### bmtl/response/camera-on-off/{MM}

- 목적: 카메라 전원 토글 결과
- QoS: 1, retain: false
- 페이로드:

```json
{ "success": true, "message": "OK", "new_state": "on" }
```

### bmtl/response/camera-power-status/{MM}

- 목적: 카메라 전원 상태 질의 응답
- QoS: 1, retain: false
- 페이로드:

```json
{ "success": true, "power_status": "on" }
```

### bmtl/response/set/sitename/{MM}

- 목적: 사이트명 변경 결과
- QoS: 1, retain: false
- 페이로드:

```json
{ "success": true, "site_name": "현장 이름", "message": "Updated" }
```

### bmtl/response/sw-update/{MM}

- 목적: SW 업데이트 수행 결과(최종 성공/실패)
- QoS: 1, retain: false
- 페이로드:

```json
{ "success": true, "message": "Update completed", "version": "v1.2.3" }
```

### bmtl/response/sw-rollback/{MM}

- 목적: SW 롤백 수행 결과
- QoS: 1, retain: false
- 페이로드:

```json
{ "success": true, "message": "Rollback completed" }
```

### bmtl/response/sw-version/{MM}

- 목적: SW 버전 정보
- QoS: 1, retain: false
- 페이로드: 단일 키 version 사용(값은 commit hash)

```json
{ "version": "a1b2c3d4" }
```

참고
- UI 표시는 commit hash를 그대로 노출합니다.
- 송신/수신 모두 version 키만 사용합니다. (이전 키인 commit_hash, swVersion, sw_version는 사용하지 않음)

## 구현 세부/권고

- 모듈 ID/주제: {MM}는 2자리 문자 ID. 예: 01. 전체 대상은 all 리터럴 사용.
- 토폴로지: 컨트롤 서버와 디바이스가 직접 MQTT 브로커를 통해 통신하며, 별도의 관리 게이트웨이는 구성되어 있지 않음.
- 응답 포맷: 서버 UI 설정 값은 카멜케이스 사용. 디바이스의 설정 변경 응답/설정 조회 응답에서 카멜케이스로 반환 권장.
- 품질/ISO 값: quality는 "높음/보통/낮음" 또는 정수(1~100) 모두 허용. iso는 "auto" 또는 정수 허용.
- 상태 필드: storage_used는 %, temperature는 섭씨(C). last_* 필드는 ISO 8601 권장.
- 명령/트랜잭션 일관성: 명령 발신 후 결과 응답은 1회 송신. SW 업데이트/롤백 진행 중간 주제는 별도 확장 가능하나 본 스펙 미포함.
- 보안: 인증/권한은 브로커 설정으로 관리. 주제/페이로드에 민감정보 포함 금지.

## UI 정책 & 패턴

- 사용자 조작: 사용자가 제어/설정 요청 시 확인 모달(또는 토스트)로 알리고, 스피너/최근 메시지로 UI 상태를 피드백.
- 요청-응답 규칙(제어형 요청): response/*/{MM} 수신 시 스피너 해제 및 1회 응답으로 완료 처리.
  - 예: response/wiper/{MM}, response/camera-on-off/{MM}, response/set/sitename/{MM}, response/sw-update/{MM}, response/sw-rollback/{MM}.
- 조회 응답: response/settings/{MM}, response/options/{MM}, response/camera-power-status/{MM}, response/sw-version/{MM}는 팝업 없이 화면 데이터만 갱신.
- 알림: 장시간 처리 지연 시 "요청 처리 중" 등 토스트로 안내.
- 재부팅: ack/reboot/{MM}는 선택적 사전 알림(로그/상태 표시용). 최종 완료는 event/boot/{MM} 또는 헬스 상태 갱신으로 확인.
- 추적성: 중요한 제어 요청에는 request_id를 포함하고, 응답의 request_id 또는 last_request_id로 요청-응답을 상호 연계해 중복/경합을 방지.