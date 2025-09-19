# BMTL MQTT Protocol Integration Plan

본 문서는 제어패널과 디바이스 간 MQTT 프로토콜 완전 정렬을 위한 통합 수정 계획서입니다.

## 1. 개요

### 1.1 목표

-   제어패널과 디바이스 간 MQTT 통신 프로토콜 100% 정렬
-   일관된 메시지 구조 및 토픽 명명 규칙 적용
-   안정적인 상태 관리 및 에러 처리 구현

### 1.2 현재 정렬 상태

-   **제어패널**: 모든 수정 완료 (95% 정렬)
-   **디바이스**: 수정 필요 (주요 불일치 영역 식별됨)

## 2. 제어패널 수정 사항 (완료)

### 2.1 UI 개선

-   ✅ 시간 설정 UI 분리 및 레이블 추가
-   ✅ 촬영 간격 드롭다운 변경
-   ✅ 폰트 크기 통일
-   ✅ 소프트웨어 버전 테두리 제거

### 2.2 MQTT 기능 확장

-   ✅ SW 롤백 기능 추가
-   ✅ 상태 요청 기능 추가
-   ✅ 헬스체크 페이로드 개선 (temperature 필드 추가)
-   ✅ SW 업데이트 응답 간소화
-   ✅ 버전 정보 분리 처리

### 2.3 API 명세 업데이트

-   ✅ 새로운 토픽 및 페이로드 구조 반영
-   ✅ 예제 메시지 업데이트
-   ✅ 에러 처리 명세 추가

## 3. 디바이스 수정 사항 (필요)

### 3.1 헬스체크 페이로드 확장

#### 현재 구조

```json
{
    "module_id": "bmotion{device_id}",
    "storage_used": 47.2,
    "temperature": 42.3,
    "last_capture_time": "2024-09-19T02:58:12Z",
    "today_total_captures": 120,
    "today_captured_count": 45,
    "missed_captures": 2
}
```

#### 추가 필요 필드

```json
{
    "module_id": "bmotion{device_id}",
    "storage_used": 47.2,
    "temperature": 42.3,
    "last_capture_time": "2024-09-19T02:58:12Z",
    "last_boot_time": "2024-09-18T23:00:00Z", // 추가 필요
    "today_total_captures": 120,
    "today_captured_count": 45,
    "missed_captures": 2,
    "sw_version": "v1.2.2", // 추가 필요
    "site_name": "서울_1공구" // 추가 필요
}
```

### 3.2 새로운 토픽 처리 추가

#### 상태 요청 처리

```python
# 구독 추가 필요
- bmtl/request/status/{device_id}
- bmtl/request/status/all

# 응답: bmtl/status/health/{device_id}로 현재 상태 전송
```

#### SW 롤백 기능

```python
# 구독 추가 필요
- bmtl/sw-rollback/{device_id}

# 응답 필요
Topic: bmtl/response/sw-rollback/{device_id}
Payload: {
  "success": true,
  "message": "Rollback completed successfully"
}
```

#### SW 버전 정보 분리

```python
# 기존 복잡한 구조에서 간소화 필요
Topic: bmtl/response/sw-version/{device_id}
Payload: {
  "commit_hash": "9f2a45c"  # commit_hash만 포함
}
```

### 3.3 모듈 ID 형식 통일

#### 변경 필요사항

```python
# 기존: "camera_{device_id}"
# 변경: "bmotion{device_id}"

# 모든 헬스체크 메시지에서 module_id 형식 변경 필요
```

### 3.4 에러 응답 표준화

#### 모든 응답에 success 필드 추가

```json
// 성공 응답
{
  "success": true,
  "message": "Operation completed successfully",
  // ... 기타 필드
}

// 실패 응답
{
  "success": false,
  "message": "Error description"
}
```

## 4. 구현 우선순위

### Phase 1: 기본 프로토콜 정렬 (높음)

1. **헬스체크 페이로드 확장**

    - `last_boot_time`, `sw_version`, `site_name` 필드 추가
    - `module_id` 형식 변경: `camera_{device_id}` → `bmotion{device_id}`

2. **SW 버전 정보 간소화**
    - `bmtl/response/sw-version/{device_id}` 페이로드를 `commit_hash`만 포함하도록 변경

### Phase 2: 새로운 기능 추가 (중간)

3. **상태 요청 기능**

    - `bmtl/request/status/{device_id}`, `bmtl/request/status/all` 구독 추가
    - 요청 시 `bmtl/status/health/{device_id}`로 응답

4. **SW 롤백 기능**
    - `bmtl/sw-rollback/{device_id}` 구독 추가
    - `bmtl/response/sw-rollback/{device_id}` 응답 구현

### Phase 3: 표준화 및 최적화 (낮음)

5. **에러 응답 표준화**
    - 모든 응답 메시지에 `success` 필드 추가
    - 일관된 에러 메시지 구조 적용

## 5. 테스트 시나리오

### 5.1 헬스체크 테스트

```bash
# 제어패널에서 확인할 항목
- module_id가 "bmotion{device_id}" 형식으로 수신되는지
- last_boot_time, sw_version, site_name 필드가 정상 표시되는지
- temperature 필드가 정상 처리되는지
```

### 5.2 새로운 기능 테스트

```bash
# 상태 요청 테스트
1. 제어패널에서 "상태 조회" 버튼 클릭
2. bmtl/request/status/{device_id} 발행 확인
3. bmtl/status/health/{device_id} 응답 수신 확인

# SW 롤백 테스트
1. 제어패널에서 "롤백" 버튼 클릭
2. bmtl/sw-rollback/{device_id} 발행 확인
3. bmtl/response/sw-rollback/{device_id} 응답 수신 및 성공 메시지 확인
```

### 5.3 프로토콜 정합성 테스트

```bash
# 모든 토픽 및 페이로드 구조 검증
1. 설정 조회/변경 메시지 구조 확인
2. 제어 명령 응답 구조 확인
3. 에러 상황에서의 응답 구조 확인
```

## 6. 배포 계획

### 6.1 단계별 배포

1. **디바이스 펌웨어 업데이트**

    - Phase 1 수정사항 적용
    - 기존 기능 호환성 유지

2. **제어패널 배포**

    - 이미 수정 완료된 상태
    - 디바이스 업데이트 후 전체 기능 활성화

3. **통합 테스트**
    - 전체 시나리오 검증
    - 성능 및 안정성 확인

### 6.2 롤백 계획

-   디바이스 펌웨어 롤백 기능 활용
-   제어패널 이전 버전 복원 절차
-   데이터 무결성 보장 방안

## 7. 모니터링 및 유지보수

### 7.1 모니터링 항목

-   MQTT 메시지 전송/수신 성공률
-   프로토콜 버전 호환성
-   에러 발생 빈도 및 패턴

### 7.2 문서 유지보수

-   API 명세 동기화
-   프로토콜 변경 이력 관리
-   개발자 가이드 업데이트

## 8. 결론

제어패널의 모든 수정이 완료된 상태에서, 디바이스 측의 4가지 주요 영역 수정을 통해 완전한 프로토콜 정렬을 달성할 수 있습니다:

1. **헬스체크 페이로드 확장** (필수)
2. **SW 버전 정보 간소화** (필수)
3. **상태 요청 기능 추가** (권장)
4. **SW 롤백 기능 추가** (권장)

이러한 수정을 통해 안정적이고 일관된 MQTT 통신 환경을 구축할 수 있으며, 향후 기능 확장 시에도 명확한 프로토콜 기준을 제공할 수 있습니다.
