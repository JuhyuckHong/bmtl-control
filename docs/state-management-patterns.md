# State Management Patterns

## 개요
BMTL Control System의 상태 관리는 다음과 같은 패턴과 원칙을 따릅니다.

## 상태 관리 아키텍처

### 1. 상태 분류

#### **로컬 컴포넌트 상태**
- 단일 컴포넌트 내부에서만 사용되는 상태
- `useState` 사용
```jsx
const [isExpanded, setIsExpanded] = useState(false);
```

#### **공유 상태 (그룹화)**
- 관련된 상태들을 객체로 그룹화
- 불필요한 리렌더링 방지
```jsx
const [controlState, setControlState] = useState({
    filter: "all",
    searchTerm: "",
    statusCounts: { online: 0, offline: 0, unknown: 0 }
});
```

#### **전역 상태**
- Context API 사용 (예: ThemeContext)
- 애플리케이션 전반에서 필요한 상태

### 2. 상태 업데이트 패턴

#### **불변성 유지**
```jsx
// ✅ 올바른 방법
setControlState(prev => ({
    ...prev,
    filter: newValue
}));

// ❌ 잘못된 방법
controlState.filter = newValue;
setControlState(controlState);
```

#### **함수형 업데이트**
```jsx
// 이전 상태에 의존하는 경우
setCount(prev => prev + 1);
```

#### **배치 업데이트**
```jsx
// 관련된 상태들을 한 번에 업데이트
setControlState(prev => ({
    ...prev,
    globalCommandHandler: commandHandler,
    statusCounts: counts
}));
```

### 3. 비동기 상태 관리

#### **로딩 상태 패턴**
```jsx
const {
    startLoading,
    stopLoading,
    errorLoading,
    isLoading
} = useLoadingState();

// 비동기 작업 래핑
const handleAsyncAction = async () => {
    try {
        startLoading('action-key', '작업 중...');
        const result = await asyncOperation();
        stopLoading('action-key', result);
    } catch (error) {
        errorLoading('action-key', error);
    }
};
```

#### **에러 상태 관리**
```jsx
const [error, setError] = useState(null);

// 에러 처리 패턴
try {
    await riskyOperation();
    setError(null); // 성공 시 에러 초기화
} catch (err) {
    setError(err.message);
}
```

### 4. 커스텀 훅 패턴

#### **상태 캡슐화**
```jsx
// 관련 상태와 로직을 훅으로 캡슐화
const useModuleState = () => {
    const [moduleStatuses, setModuleStatuses] = useState({});

    const updateModuleStatus = useCallback((id, data) => {
        setModuleStatuses(prev => ({
            ...prev,
            [id]: { ...prev[id], ...data }
        }));
    }, []);

    return { moduleStatuses, updateModuleStatus };
};
```

#### **상태 조합**
```jsx
// 여러 상태 훅을 조합
const useCameraControl = () => {
    const moduleState = useModuleState();
    const commands = useMqttCommands();
    const loading = useLoadingState();

    return { ...moduleState, ...commands, ...loading };
};
```

### 5. 성능 최적화 패턴

#### **메모이제이션**
```jsx
// 계산 비용이 높은 값들
const filteredModules = useMemo(() => {
    return modules.filter(module =>
        module.status === filter &&
        module.name.includes(searchTerm)
    );
}, [modules, filter, searchTerm]);

// 이벤트 핸들러
const handleClick = useCallback((id) => {
    onModuleSelect(id);
}, [onModuleSelect]);
```

#### **선택적 리렌더링**
```jsx
// React.memo로 불필요한 리렌더링 방지
export default React.memo(Component, (prevProps, nextProps) => {
    return prevProps.data === nextProps.data;
});
```

### 6. 에러 경계 패턴

#### **계층적 에러 처리**
```jsx
// 애플리케이션 레벨
<ErrorBoundary fallback={AppErrorFallback}>
    <App />
</ErrorBoundary>

// 피처 레벨
<ErrorBoundary fallback={FeatureErrorFallback}>
    <FeatureComponent />
</ErrorBoundary>

// 컴포넌트 레벨
<ErrorBoundary fallback={ComponentErrorFallback}>
    <ComponentContent />
</ErrorBoundary>
```

### 7. 상태 동기화 패턴

#### **MQTT 상태 동기화**
```jsx
useEffect(() => {
    if (!mqttClient?.connected) return;

    const handleMessage = (topic, payload) => {
        const data = JSON.parse(payload.toString());
        const moduleId = extractModuleId(topic);

        updateModuleStatus(moduleId, {
            ...data,
            isConnected: true,
            lastUpdated: new Date()
        });
    };

    mqttClient.on('message', handleMessage);
    return () => mqttClient.off('message', handleMessage);
}, [mqttClient, updateModuleStatus]);
```

#### **연결 상태 모니터링**
```jsx
useEffect(() => {
    const interval = setInterval(() => {
        const now = new Date();
        const timeout = 5 * 60 * 1000; // 5분

        updateConnectionStatus(timeout);
    }, 30000); // 30초마다 확인

    return () => clearInterval(interval);
}, [updateConnectionStatus]);
```

## 모범 사례

### ✅ Do's

1. **상태를 논리적으로 그룹화**
   - 관련된 상태들을 객체로 묶어서 관리
   - 불필요한 리렌더링 방지

2. **불변성 유지**
   - 상태 업데이트 시 항상 새 객체/배열 생성
   - 깊은 복사가 필요한 경우 적절한 라이브러리 사용

3. **에러 처리**
   - 모든 비동기 작업에 에러 처리 포함
   - 사용자에게 친화적인 에러 메시지 제공

4. **로딩 상태 관리**
   - 사용자에게 진행 상황 표시
   - 타임아웃 처리 포함

5. **성능 최적화**
   - 적절한 메모이제이션 사용
   - 불필요한 렌더링 방지

### ❌ Don'ts

1. **상태 직접 변경 금지**
   ```jsx
   // ❌ 잘못된 방법
   state.property = newValue;
   ```

2. **과도한 전역 상태 사용 금지**
   - 정말 필요한 경우에만 전역 상태 사용

3. **동기화되지 않은 상태**
   - 같은 데이터를 여러 곳에서 관리하지 않기

4. **에러 무시**
   - 모든 에러는 적절히 처리하거나 로깅

## 테스팅 전략

### 상태 훅 테스트
```jsx
test('should update state correctly', () => {
    const { result } = renderHook(() => useModuleState());

    act(() => {
        result.current.updateModuleStatus('module-1', {
            status: 'online'
        });
    });

    expect(result.current.moduleStatuses['module-1'].status)
        .toBe('online');
});
```

### 비동기 상태 테스트
```jsx
test('should handle async loading', async () => {
    const { result } = renderHook(() => useLoadingState());

    await act(async () => {
        await result.current.withLoading('test',
            Promise.resolve('success')
        );
    });

    expect(result.current.getLoadingState('test').result)
        .toBe('success');
});
```

## 마이그레이션 가이드

기존 상태 관리에서 새로운 패턴으로 마이그레이션할 때:

1. **점진적 마이그레이션**
   - 한 번에 모든 것을 바꾸지 말고 점진적으로 개선

2. **호환성 유지**
   - 기존 인터페이스를 유지하면서 내부 구현만 변경

3. **테스트 작성**
   - 마이그레이션 전후로 동작이 같은지 확인

이 패턴들을 따라하면 유지보수하기 쉽고 확장 가능한 상태 관리 구조를 만들 수 있습니다.