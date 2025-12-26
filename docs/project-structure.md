# 프로젝트 구조

```
attendFlow/
├── index.html              # 메인 페이지 (역할 선택)
├── teacher.html            # 교사용 대시보드
├── student.html            # 학생용 모니터링 페이지
├── main.py                 # FastAPI 서버 (선택적)
├── requirements.txt        # Python 의존성
│
├── css/
│   └── style.css           # 전역 스타일
│
├── js/
│   ├── config.js           # 전역 설정 및 상수
│   ├── teacher-app.js      # 교사 앱 메인 로직
│   ├── student-app.js      # 학생 앱 메인 로직
│   ├── peer-manager.js     # PeerJS P2P 통신 관리
│   ├── pose-analyzer.js    # MediaPipe 포즈 분석
│   ├── focus-analyzer.js   # 집중도 분석
│   ├── focus-report-manager.js  # 집중도 보고서 관리
│   ├── attendance-manager.js    # 출석 관리
│   ├── screen-capture-manager.js # 화면 캡처 관리
│   │
│   └── managers/           # 교사 앱 모듈
│       ├── student-manager.js    # 학생 상태 관리
│       ├── class-timer-manager.js # 수업 타이머
│       ├── alert-manager.js      # 알림 관리
│       ├── message-manager.js    # 메시지 관리
│       └── ui-renderer.js        # UI 렌더링
│
└── docs/                   # 문서
    ├── focus-calculation.md    # 집중도 계산 방식
    ├── focus-report.md         # 보고서 데이터 정리
    └── ...
```

---

## 핵심 파일 설명

### HTML 파일

| 파일 | 설명 |
|------|------|
| `index.html` | 랜딩 페이지, 교사/학생 역할 선택 |
| `teacher.html` | 교사 대시보드, 학생 모니터링 UI |
| `student.html` | 학생 화면, 카메라 및 상태 표시 |

### 핵심 JavaScript

| 파일 | 설명 |
|------|------|
| `config.js` | 모든 설정값, 상수, 임계값 정의 |
| `peer-manager.js` | WebRTC P2P 연결, 데이터/영상/오디오 전송 |
| `pose-analyzer.js` | MediaPipe Pose로 자세 분석 |
| `focus-analyzer.js` | 집중도 점수 계산 |

### 교사 앱 모듈 (`js/managers/`)

| 파일 | 설명 |
|------|------|
| `student-manager.js` | 학생 목록, 상태 업데이트, 통계 |
| `class-timer-manager.js` | 수업/쉬는시간 타이머 |
| `alert-manager.js` | 자리비움 등 알림 처리 |
| `message-manager.js` | 교사↔학생 메시지 |
| `ui-renderer.js` | 학생 카드, 통계 UI 렌더링 |

---

## 데이터 흐름

```
[학생 브라우저]
    │
    ├─ 카메라 → MediaPipe Pose → 자세 분석
    ├─ 집중도 분석 (고개, 시선, 존재)
    │
    └─ PeerJS DataChannel ──────────────────┐
                                            │
                                            ▼
                                    [교사 브라우저]
                                        │
                                        ├─ 학생 상태 수신
                                        ├─ 대시보드 렌더링
                                        ├─ 알림 처리
                                        └─ 보고서 생성
```

---

## 의존성

### 외부 라이브러리 (CDN)

- **MediaPipe Pose** - 포즈 추정
- **PeerJS** - P2P 통신
- **Chart.js** - 집중도 차트
- **jsPDF** - PDF 보고서 생성
- **Tailwind CSS** - 스타일링

### Python (선택적)

- FastAPI
- Uvicorn
