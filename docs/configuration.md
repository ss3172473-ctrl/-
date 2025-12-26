# 설정값 가이드

모든 설정은 `js/config.js` 파일에서 관리됩니다.

---

## PeerJS 설정

```javascript
peer: {
  host: '0.peerjs.com',  // PeerJS 서버 주소
  port: 443,              // 포트
  secure: true,           // HTTPS 사용
  debug: 1                // 디버그 레벨 (0~3)
}
```

| 항목 | 설명 | 기본값 |
|------|------|--------|
| `host` | PeerJS 서버 주소 | `0.peerjs.com` (공식 무료) |
| `port` | 서버 포트 | `443` |
| `secure` | HTTPS 사용 여부 | `true` |
| `debug` | 디버그 로그 레벨 | `1` |

---

## 상태 전송 설정

```javascript
statusInterval: 1500,    // 상태 전송 간격 (ms)
awayThreshold: 30,       // 자리비움 판단 시간 (초)
```

| 항목 | 설명 | 기본값 |
|------|------|--------|
| `statusInterval` | 학생→교사 상태 전송 주기 | `1500ms` (1.5초) |
| `awayThreshold` | 자리비움으로 판단하는 시간 | `30초` |

---

## 알림 설정

```javascript
alerts: {
  awayWarning: 60,      // 경고 알림 (초)
  awayCritical: 180     // 심각 알림 (초)
}
```

| 항목 | 설명 | 기본값 |
|------|------|--------|
| `awayWarning` | 자리비움 경고 시간 | `60초` (1분) |
| `awayCritical` | 자리비움 심각 시간 | `180초` (3분) |

---

## 포즈 분석 설정

```javascript
pose: {
  minConfidence: 0.5,   // 최소 신뢰도
  standingRatio: 0.6,   // 서있음 판단 비율
  sittingRatio: 0.4     // 앉음 판단 비율
}
```

| 항목 | 설명 | 기본값 |
|------|------|--------|
| `minConfidence` | MediaPipe 최소 신뢰도 | `0.5` |
| `standingRatio` | 서있음 판단 상체/하체 비율 | `0.6` |
| `sittingRatio` | 앉음 판단 상체/하체 비율 | `0.4` |

---

## 집중도 분석 설정

```javascript
focus: {
  headDownThreshold: 0.15,     // 고개 숙임 판단
  gazeDeviationThreshold: 0.2, // 시선 이탈 판단
  updateInterval: 1000,        // 업데이트 간격 (ms)
  historyLength: 300,          // 히스토리 길이 (초)
  weights: {
    headPosition: 0.4,         // 고개 위치 가중치
    gazeDirection: 0.4,        // 시선 방향 가중치
    presence: 0.2              // 존재 여부 가중치
  }
}
```

| 항목 | 설명 | 기본값 |
|------|------|--------|
| `headDownThreshold` | 고개 숙임 판단 (코-어깨 거리 비율) | `0.15` |
| `gazeDeviationThreshold` | 시선 이탈 판단 (눈 위치 편차) | `0.2` |
| `updateInterval` | 집중도 업데이트 주기 | `1000ms` |
| `historyLength` | 집중도 히스토리 보관 | `300초` (5분) |

### 가중치

| 요소 | 가중치 | 설명 |
|------|--------|------|
| `headPosition` | 40% | 고개 위치 |
| `gazeDirection` | 40% | 시선 방향 |
| `presence` | 20% | 존재 여부 |

---

## 출석 관리 설정

```javascript
attendance: {
  storageType: 'localStorage', // 저장 방식
  autoCheckIn: true,           // 자동 출석 체크
  lateThreshold: 10 * 60 * 1000 // 지각 기준 (ms)
}
```

| 항목 | 설명 | 기본값 |
|------|------|--------|
| `storageType` | 데이터 저장 방식 | `localStorage` |
| `autoCheckIn` | 접속 시 자동 출석 | `true` |
| `lateThreshold` | 지각 판단 시간 | `10분` |

---

## 수업 시간 설정

```javascript
classTime: {
  lessonDuration: 50,    // 수업 시간 (분)
  breakDuration: 10,     // 쉬는 시간 (분)
  autoStart: true,       // 자동 시작
  notifyBeforeBreak: 1,  // 쉬는 시간 전 알림 (분)
  notifyBeforeLesson: 1  // 수업 시작 전 알림 (분)
}
```

| 항목 | 설명 | 기본값 |
|------|------|--------|
| `lessonDuration` | 수업 시간 | `50분` |
| `breakDuration` | 쉬는 시간 | `10분` |
| `autoStart` | 서버 시작 시 자동 수업 시작 | `true` |
| `notifyBeforeBreak` | 쉬는 시간 N분 전 알림 | `1분` |
| `notifyBeforeLesson` | 수업 시작 N분 전 알림 | `1분` |

---

## API 설정 (백엔드 연동 시)

```javascript
api: {
  enabled: false,
  baseUrl: 'http://localhost:3000/api',
  endpoints: {
    status: '/status',
    history: '/history',
    alerts: '/alerts',
    attendance: '/attendance'
  }
}
```

현재는 `enabled: false`로 비활성화되어 있습니다.
백엔드 서버 구축 후 `enabled: true`로 변경하면 API 연동이 활성화됩니다.

---

## 상수 정의

### 상태 코드

```javascript
const STATUS = {
  STANDING: 'standing',
  SITTING: 'sitting',
  AWAY: 'away',
  UNKNOWN: 'unknown',
  NO_RESPONSE: 'no_response',
  DISCONNECTED: 'disconnected',
  HAND_RAISED: 'hand_raised'
};
```

### 집중도 레벨

```javascript
const FOCUS_LEVEL = {
  HIGH: 'high',       // 80% 이상
  MEDIUM: 'medium',   // 50-80%
  LOW: 'low',         // 30-50%
  VERY_LOW: 'very_low' // 30% 미만
};
```

### 수업 모드

```javascript
const CLASS_MODE = {
  LESSON: 'lesson',     // 수업 중
  BREAK: 'break',       // 쉬는 시간
  STOPPED: 'stopped'    // 정지
};
```
