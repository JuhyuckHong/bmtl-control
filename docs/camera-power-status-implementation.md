# 카메라 전원 상태 확인 기능 구현 가이드

## 개요
카메라 모듈의 전원 상태를 실시간으로 확인할 수 있는 기능을 추가했습니다. 이 문서는 디바이스 측에서 구현해야 할 사항들을 정리합니다.

## 프론트엔드 변경사항 (완료)

### 1. UI 컴포넌트
- **위치**: 촬영 현황 컬럼의 첫 번째 항목
- **표시**: 카메라 전원 상태 (전원켜짐/전원꺼짐/오류/확인중)
- **색상**:
  - 전원켜짐: 초록색
  - 전원꺼짐/오류: 빨간색
  - 확인중: 회색 이탤릭

### 2. MQTT 토픽 추가
- **구독 토픽**: `bmtl/response/camera-power-status/+`
- **요청 토픽**: `bmtl/request/camera-power-status/{moduleId}`

## 디바이스 구현 요구사항

### 1. MQTT 토픽 구독
디바이스는 다음 토픽을 구독해야 합니다:
```
bmtl/request/camera-power-status/{moduleId}
```

예시:
- `bmtl/request/camera-power-status/01`
- `bmtl/request/camera-power-status/02`

### 2. 요청 메시지 처리
**요청 페이로드**:
```json
{}
```
- 빈 JSON 객체로 요청이 들어옵니다.

### 3. 카메라 전원 상태 확인 로직
디바이스에서 구현해야 할 카메라 상태 확인 방법:

#### 방법 1: 카메라 디바이스 파일 확인
```bash
# USB 카메라 확인
ls /dev/video* 2>/dev/null
# 또는
v4l2-ctl --list-devices 2>/dev/null
```

#### 방법 2: 카메라 프로세스 확인
```bash
# 카메라 사용 중인 프로세스 확인
lsof /dev/video0 2>/dev/null
# 또는
fuser /dev/video0 2>/dev/null
```

#### 방법 3: 실제 카메라 테스트
```bash
# 간단한 카메라 테스트 (예시)
ffmpeg -f v4l2 -i /dev/video0 -frames:v 1 -f null - 2>/dev/null
```

### 4. 응답 메시지 발송
카메라 상태 확인 후 다음 토픽으로 응답:
```
bmtl/response/camera-power-status/{moduleId}
```

**응답 페이로드 형식**:
```json
{
    "success": true,
    "power_status": "on",
    "message": "Camera is available and functioning",
    "timestamp": "2024-01-01T12:00:00Z"
}
```

**power_status 값**:
- `"on"`: 카메라가 정상적으로 동작 중
- `"off"`: 카메라가 연결되지 않았거나 비활성화됨
- `"error"`: 카메라는 연결되어 있지만 오류 상태

### 5. 응답 페이로드 상세 예시

#### 성공 - 카메라 정상
```json
{
    "success": true,
    "power_status": "on",
    "message": "Camera device /dev/video0 is available",
    "camera_device": "/dev/video0",
    "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 성공 - 카메라 꺼짐
```json
{
    "success": true,
    "power_status": "off",
    "message": "No camera device found",
    "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 성공 - 카메라 오류
```json
{
    "success": true,
    "power_status": "error",
    "message": "Camera device exists but not accessible",
    "camera_device": "/dev/video0",
    "error_details": "Permission denied",
    "timestamp": "2024-01-01T12:00:00Z"
}
```

#### 실패 - 확인 불가
```json
{
    "success": false,
    "power_status": "unknown",
    "message": "Failed to check camera status",
    "error": "System error occurred",
    "timestamp": "2024-01-01T12:00:00Z"
}
```

### 6. 구현 권장사항

#### 타임아웃 설정
- 카메라 상태 확인은 최대 5초 내에 완료
- 타임아웃 시 `"error"` 상태로 응답

#### 캐싱
- 카메라 상태를 30초 동안 캐시하여 연속 요청 시 성능 최적화
- 캐시된 결과가 있으면 즉시 응답

#### 로깅
- 카메라 상태 확인 요청과 결과를 로그에 기록
- 오류 발생 시 상세한 오류 정보 로깅

### 7. Python 구현 예시 (참고용)

```python
import json
import subprocess
import os
from datetime import datetime

def check_camera_power_status():
    """카메라 전원 상태 확인"""
    try:
        # 방법 1: /dev/video* 파일 확인
        video_devices = [f for f in os.listdir('/dev') if f.startswith('video')]

        if not video_devices:
            return {
                "success": True,
                "power_status": "off",
                "message": "No camera device found",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }

        # 방법 2: 첫 번째 카메라 디바이스 접근 테스트
        camera_device = f"/dev/{video_devices[0]}"

        # v4l2-ctl로 카메라 접근 테스트
        result = subprocess.run(
            ['v4l2-ctl', '--device', camera_device, '--list-formats-ext'],
            capture_output=True,
            timeout=5
        )

        if result.returncode == 0:
            return {
                "success": True,
                "power_status": "on",
                "message": f"Camera device {camera_device} is available",
                "camera_device": camera_device,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        else:
            return {
                "success": True,
                "power_status": "error",
                "message": f"Camera device {camera_device} exists but not accessible",
                "camera_device": camera_device,
                "error_details": result.stderr.decode(),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }

    except subprocess.TimeoutExpired:
        return {
            "success": True,
            "power_status": "error",
            "message": "Camera status check timed out",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        return {
            "success": False,
            "power_status": "unknown",
            "message": "Failed to check camera status",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

def handle_camera_power_status_request(module_id):
    """카메라 전원 상태 요청 처리"""
    status = check_camera_power_status()

    # MQTT로 응답 발송
    topic = f"bmtl/response/camera-power-status/{module_id:02d}"
    payload = json.dumps(status)

    # mqtt_client.publish(topic, payload, qos=2)
    print(f"Publishing to {topic}: {payload}")

    return status
```

### 8. 테스트 시나리오

#### 테스트 케이스 1: 정상 카메라
1. 카메라가 정상적으로 연결된 상태
2. 요청 전송
3. `power_status: "on"` 응답 확인

#### 테스트 케이스 2: 카메라 미연결
1. 카메라를 물리적으로 분리
2. 요청 전송
3. `power_status: "off"` 응답 확인

#### 테스트 케이스 3: 카메라 오류
1. 카메라가 연결되어 있지만 다른 프로세스가 사용 중
2. 요청 전송
3. `power_status: "error"` 응답 확인

### 9. 주의사항

- 카메라 상태 확인 중 시스템 리소스 과다 사용 방지
- 동시에 여러 요청이 들어올 경우 큐잉 처리
- 카메라 디바이스 접근 권한 확인
- 시스템별 카메라 디바이스 경로 차이 고려 (`/dev/video*` vs `/dev/camera*`)

## 사용법

프론트엔드에서 카메라 전원 상태를 확인하려면:

1. **개별 모듈**: 해당 모듈의 제어 버튼에서 카메라 상태 확인 기능 추가 예정
2. **전체 모듈**: 글로벌 명령으로 모든 모듈의 카메라 상태를 한 번에 확인하는 기능 추가 예정

현재는 디바이스에서 상태 응답을 받으면 촬영 현황 컬럼에 자동으로 표시됩니다.