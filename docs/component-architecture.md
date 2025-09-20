# Component Architecture Documentation

## 개요
BMTL Control System의 컴포넌트 아키텍처는 다음과 같은 원칙에 따라 설계되었습니다:

- **단일 책임 원칙**: 각 컴포넌트는 하나의 명확한 책임만 가집니다
- **재사용성**: 작은 컴포넌트로 분리하여 재사용 가능하도록 구성
- **성능 최적화**: React.memo와 PropTypes를 활용한 최적화
- **타입 안정성**: PropTypes를 통한 런타임 타입 검증

## 디렉토리 구조

```
src/
├── components/
│   ├── module/              # 모듈 관련 컴포넌트들
│   │   ├── ModuleStatusDisplay.jsx     # 모듈 상태 표시
│   │   ├── CaptureInfoDisplay.jsx      # 촬영 정보 표시
│   │   ├── ModuleControlButtons.jsx    # 모듈 제어 버튼들
│   │   └── SoftwareManagement.jsx      # SW 관리 컴포넌트
│   ├── CameraModuleRow.jsx  # 메인 모듈 행 컴포넌트
│   ├── MessageLog.jsx       # MQTT 메시지 로그
│   ├── LoginForm.jsx        # 로그인 폼
│   ├── DarkModeToggle.jsx   # 다크모드 토글
│   └── SiteNameModal.jsx    # 사이트명 변경 모달
├── hooks/
│   ├── useCameraStatus.jsx         # 기존 카메라 상태 훅
│   ├── useCameraStatusRefactored.jsx  # 리팩토링된 카메라 상태 훅
│   ├── useModuleState.jsx          # 모듈 상태 관리 훅
│   ├── useMqttCommands.jsx         # MQTT 명령어 훅
│   └── useMQTT.jsx                 # MQTT 연결 관리 훅
├── utils/
│   └── moduleUtils.js       # 모듈 관련 유틸리티 함수들
├── constants/
│   ├── mqttTopics.js        # MQTT 토픽 상수들
│   └── cameraOptions.js     # 카메라 옵션 상수들
└── pages/
    ├── ModuleControl.jsx    # 모듈 제어 페이지
    ├── MQTTPage.jsx        # MQTT 페이지
    └── ApiDocsPage.jsx     # API 문서 페이지
```

## 컴포넌트 분리 전략

### 1. ModuleStatusDisplay
- **목적**: 모듈의 기본 상태 정보 표시
- **책임**: 연결 상태, 사이트명, 스토리지, 온도, 배터리 정보 표시
- **최적화**: useMemo를 활용한 계산 값 메모이제이션

### 2. CaptureInfoDisplay
- **목적**: 촬영 관련 정보 표시
- **책임**: 카메라 전원 상태, 촬영 진행률, 실패 횟수, 마지막 촬영/부팅 시간
- **특징**: 시간 포맷팅 함수 내장

### 3. ModuleControlButtons
- **목적**: 모듈 제어 버튼들
- **책임**: 재부팅, 와이퍼, 카메라 전원 제어
- **특징**: 단순한 버튼 컴포넌트로 최대한 가볍게 구성

### 4. SoftwareManagement
- **목적**: 소프트웨어 관리 기능
- **책임**: SW 버전 표시, 업데이트, 롤백 기능
- **특징**: SW 관련 작업들을 독립적으로 처리

## 커스텀 훅 분리

### 1. useModuleState
- **목적**: 모듈 상태 데이터 관리
- **기능**:
  - 모듈 상태/설정/옵션 업데이트
  - 연결 상태 모니터링
  - 모듈 데이터 초기화

### 2. useMqttCommands
- **목적**: MQTT 명령어 전송 관리
- **기능**:
  - 모든 MQTT 명령어 전송 함수들
  - 에러 핸들링 및 로깅
  - 토픽 생성 자동화

### 3. useCameraStatusRefactored
- **목적**: 통합 카메라 상태 관리
- **기능**:
  - useModuleState와 useMqttCommands 조합
  - MQTT 메시지 처리
  - 기존 인터페이스 호환성 유지

## 성능 최적화

### React.memo 활용
```jsx
export default React.memo(ComponentName, (prevProps, nextProps) => {
  // 커스텀 비교 로직
  return prevProps.someKey === nextProps.someKey;
});
```

### PropTypes를 통한 타입 검증
```jsx
ComponentName.propTypes = {
  status: PropTypes.shape({
    isConnected: PropTypes.bool,
    // ... 기타 프로퍼티들
  }),
  onAction: PropTypes.func.isRequired,
};
```

## 유틸리티 함수들

### moduleUtils.js
- `hasStatusDiff()`: 상태 변경 감지
- `formatModuleId()`: 모듈 ID 포맷팅
- `createMqttTopic()`: MQTT 토픽 생성
- `debugLog()`: 개발 환경 로깅

### 상수 관리
- `mqttTopics.js`: MQTT 토픽 상수들
- `cameraOptions.js`: 카메라 설정 옵션들

## 마이그레이션 가이드

기존 코드에서 리팩토링된 구조로 마이그레이션할 때:

1. **기존 useCameraStatus 사용**:
   ```jsx
   const { moduleStatuses, sendCommand } = useCameraStatus(client, topics, recordPublish);
   ```

2. **리팩토링된 구조 사용**:
   ```jsx
   const { moduleStatuses, sendCommand } = useCameraStatusRefactored(client, topics, recordPublish);
   ```

3. **컴포넌트 분리 적용**:
   ```jsx
   // 기존
   <CameraModuleRow {...props} />

   // 리팩토링 후
   <CameraModuleRow {...props}>
     <ModuleStatusDisplay status={status} onSiteNameChange={handleSiteNameChange} />
     <CaptureInfoDisplay status={status} onCameraPowerStatus={handleCameraPowerStatus} />
     {/* ... 기타 컴포넌트들 */}
   </CameraModuleRow>
   ```

## 테스팅 전략

1. **단위 테스트**: 각 유틸리티 함수와 커스텀 훅
2. **컴포넌트 테스트**: React Testing Library 사용
3. **통합 테스트**: MQTT 연결 및 상태 관리
4. **PropTypes 검증**: 개발 환경에서 자동 타입 체크