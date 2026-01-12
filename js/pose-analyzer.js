/**
 * MediaPipe Pose 분석기
 * 학생의 자세를 분석하여 서있음/앉음/자리비움 판단
 */
import { CONFIG, STATUS } from './config.js';
// import { FaceMeshVisualizer } from './face-mesh-visualizer.js';

class PoseAnalyzer {
  constructor() {
    this.pose = null;
    this.camera = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.canvasCtx = null;
    this.onStatusChange = null;
    this.lastStatus = STATUS.UNKNOWN;
    this.noDetectionCount = 0;
    this.isRunning = false;
    this.mediaStream = null; // 카메라 스트림 저장
    this.lastDetectionTime = Date.now(); // 마지막 감지 시간
    this.awayCheckInterval = null; // 자리비움 체크 타이머
    this.focusAnalyzer = null; // 집중도 분석기 연결
    // this.faceMeshVisualizer = null; // 페이스 메쉬 시각화
  }

  async init(videoElement, canvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.canvasCtx = canvasElement.getContext('2d');

    // 먼저 카메라 스트림 직접 획득 (HD 화질 요청)
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });
    this.videoElement.srcObject = this.mediaStream;
    this.videoElement.onloadedmetadata = () => {
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
      this.videoElement.play();
    };
    console.log('[PoseAnalyzer] 카메라 스트림 획득 완료');

    // MediaPipe Pose 초기화
    this.pose = new window.Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      }
    });

    this.pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: CONFIG.pose.minConfidence,
      minTrackingConfidence: CONFIG.pose.minConfidence
    });

    this.pose.onResults((results) => this.onResults(results));

    // Face Mesh Visualizer 초기화 제거
    // this.faceMeshVisualizer = new FaceMeshVisualizer(this.canvasCtx);

    // 카메라 초기화 (window.Camera 제거 - 스트림 충돌 방지)
    // 대신 requestAnimationFrame 루프 사용
  }

  start() {
    this.isRunning = true;
    this.noDetectionCount = 0;
    this.lastStatus = STATUS.UNKNOWN;
    this.lastDetectionTime = Date.now();

    // 커스텀 루프 시작
    this.processVideo();

    // 자리비움 체크 타이머 시작 (5초 후부터, 초기화 시간 확보)
    setTimeout(() => {
      this.awayCheckInterval = setInterval(() => {
        this.checkAwayStatus();
      }, 1000);
    }, 5000);
  }

  stop() {
    this.isRunning = false;
    // window.Camera 관련 코드 제거

    if (this.awayCheckInterval) {
      clearInterval(this.awayCheckInterval);
      this.awayCheckInterval = null;
    }
    // 카메라 스트림 해제
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    // 비디오 소스 해제
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    // 상태 초기화
    this.pose = null;
    this.lastStatus = STATUS.UNKNOWN;
    this.noDetectionCount = 0;
  }

  /**
   * 커스텀 비디오 처리 루프
   * window.Camera 대신 사용하여 스트림 제어권 확보
   */
  async processVideo() {
    if (!this.isRunning || !this.videoElement) return;

    // 비디오 데이터가 준비되었을 때만 처리
    if (this.videoElement.readyState >= 2) {
      try {
        // 1. Pose 분석 (핵심 기능 - 우선 처리)
        await this.pose.send({ image: this.videoElement });

        // 2. Face Mesh 분석 제거
        // if (this.faceMeshVisualizer) { ... }
      } catch (e) {
        console.warn('[PoseAnalyzer] Pose 분석 중 에러 (일시적):', e);
      }
    }

    // 다음 프레임 요청
    if (this.isRunning) {
      requestAnimationFrame(() => this.processVideo());
    }
  }

  /**
   * 마지막 감지 시간을 체크하여 자리비움 판단
   */
  checkAwayStatus() {
    const now = Date.now();
    const timeSinceLastDetection = now - this.lastDetectionTime;

    // 3초 이상 감지가 없으면 자리비움
    if (timeSinceLastDetection > 3000 && this.lastStatus !== STATUS.AWAY) {
      console.log('[PoseAnalyzer] 3초 이상 감지 없음 - 자리비움으로 변경');
      this.lastStatus = STATUS.AWAY;
      if (this.onStatusChange) {
        this.onStatusChange(STATUS.AWAY);
      }
    }
  }


  onResults(results) {
    // 캔버스에 그리기
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);

    // === Premium Focus HUD Visualization ===
    // Face Mesh 대신 Pose Landmark를 활용한 고품질 HUD 렌더링

    // 현재 집중도 점수 가져오기
    const score = this.focusAnalyzer ? (this.focusAnalyzer.focusScore ?? 100) : 100;

    // 랜드마크 데이터가 있을 때만 그리기
    if (results.poseLandmarks) {
      const nose = results.poseLandmarks[0];
      const leftEye = results.poseLandmarks[2];
      const rightEye = results.poseLandmarks[5];
      // 귀 데이터도 활용하여 고개 돌림 시 시각 효과 변형 가능
      // const leftEar = results.poseLandmarks[7];
      // const rightEar = results.poseLandmarks[8];

      if (nose.visibility > 0.5 && leftEye.visibility > 0.5 && rightEye.visibility > 0.5) {
        this.drawFocusHUD(nose, leftEye, rightEye, score);
      }
    }

    let currentStatus = STATUS.UNKNOWN;

    if (results.poseLandmarks) {
      // 주요 랜드마크의 신뢰도 체크
      const nose = results.poseLandmarks[0];
      const leftShoulder = results.poseLandmarks[11];
      const rightShoulder = results.poseLandmarks[12];

      const hasGoodVisibility =
        nose.visibility > 0.5 &&
        leftShoulder.visibility > 0.5 &&
        rightShoulder.visibility > 0.5;

      if (hasGoodVisibility) {
        this.noDetectionCount = 0;
        this.lastDetectionTime = Date.now(); // 감지 시간 업데이트

        // 자세 분석
        currentStatus = this.analyzePosture(results.poseLandmarks);

        // 집중도 분석기에 포즈 데이터 전달
        if (this.focusAnalyzer) {
          this.focusAnalyzer.analyzePoseLandmarks(results.poseLandmarks);
        }
      } else {
        this.noDetectionCount++;
      }
    } else {
      this.noDetectionCount++;
    }

    // 프레임 기반 자리비움 체크 (30프레임 이상 감지 실패)
    if (this.noDetectionCount > 30) {
      currentStatus = STATUS.AWAY;
      // 집중도 분석기에 자리비움 알림
      if (this.focusAnalyzer) {
        this.focusAnalyzer.setAway(true);
      }
    }

    this.canvasCtx.restore();

    // 상태 변경 콜백 (UNKNOWN이 아닐 때만)
    if (currentStatus !== STATUS.UNKNOWN && currentStatus !== this.lastStatus) {
      this.lastStatus = currentStatus;
      if (this.onStatusChange) {
        this.onStatusChange(currentStatus);
      }
    }
  }

  analyzePosture(landmarks) {
    // 주요 랜드마크 인덱스
    const NOSE = 0;
    const LEFT_SHOULDER = 11;
    const RIGHT_SHOULDER = 12;
    const LEFT_WRIST = 15;
    const RIGHT_WRIST = 16;
    const LEFT_HIP = 23;
    const RIGHT_HIP = 24;
    const LEFT_KNEE = 25;
    const RIGHT_KNEE = 26;

    const nose = landmarks[NOSE];
    const leftShoulder = landmarks[LEFT_SHOULDER];
    const rightShoulder = landmarks[RIGHT_SHOULDER];
    const leftWrist = landmarks[LEFT_WRIST];
    const rightWrist = landmarks[RIGHT_WRIST];
    const leftHip = landmarks[LEFT_HIP];
    const rightHip = landmarks[RIGHT_HIP];
    const leftKnee = landmarks[LEFT_KNEE];
    const rightKnee = landmarks[RIGHT_KNEE];

    // 신뢰도 체크
    if (leftShoulder.visibility < CONFIG.pose.minConfidence ||
      rightShoulder.visibility < CONFIG.pose.minConfidence) {
      return STATUS.UNKNOWN;
    }

    // 손들기 감지 (손목이 머리(코) 위에 있으면)
    const leftHandRaised = leftWrist.visibility > 0.5 && leftWrist.y < nose.y - 0.05;
    const rightHandRaised = rightWrist.visibility > 0.5 && rightWrist.y < nose.y - 0.05;

    if (leftHandRaised || rightHandRaised) {
      return STATUS.HAND_RAISED;
    }

    // 어깨 중심점
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) / 2;
    // 엉덩이 중심점
    const hipCenterY = (leftHip.y + rightHip.y) / 2;
    // 무릎 중심점 (보이는 경우)
    const kneeCenterY = (leftKnee.y + rightKnee.y) / 2;

    // 상체 길이 (어깨-엉덩이)
    const torsoLength = hipCenterY - shoulderCenterY;
    // 하체 길이 (엉덩이-무릎)
    const legLength = kneeCenterY - hipCenterY;

    // 비율로 서있음/앉음 판단
    // 서있을 때: 상체와 하체 비율이 비슷하거나 하체가 더 김
    // 앉아있을 때: 상체가 하체보다 상대적으로 김 (무릎이 접혀있음)

    const ratio = torsoLength / (torsoLength + legLength);

    if (ratio < CONFIG.pose.sittingRatio) {
      return STATUS.STANDING;
    } else if (ratio > CONFIG.pose.standingRatio) {
      return STATUS.SITTING;
    }

    // 추가 판단: 코 위치 기반
    // 서있을 때 코가 화면 상단에 위치
    if (nose.y < 0.3) {
      return STATUS.STANDING;
    } else if (nose.y > 0.4) {
      return STATUS.SITTING;
    }

    return STATUS.SITTING; // 기본값
  }

  setOnStatusChange(callback) {
    this.onStatusChange = callback;
  }

  setFocusAnalyzer(focusAnalyzer) {
    this.focusAnalyzer = focusAnalyzer;
  }

  /**
   * 현재 카메라 스트림 반환
   */
  getStream() {
    return this.mediaStream;
  }
  /**
   * Premium Focus HUD Drawing System
   * Draws a high-tech UI overlay around the user's face
   */
  drawFocusHUD(nose, leftEye, rightEye, score) {
    const ctx = this.canvasCtx;
    const width = this.canvasElement.width;
    const height = this.canvasElement.height;

    const x = nose.x * width;
    const y = nose.y * height;

    // Calculate size based on eye distance
    const eyeDist = Math.abs((leftEye.x - rightEye.x) * width);
    // Base radius is responsive to face distance
    const baseRadius = Math.max(eyeDist * 2.5, 60);

    // Determine Theme Color based on Score
    let mainColor, glowColor;
    if (score >= 80) {
      // High Focus: Electric Cyan
      mainColor = '#00FBFF';
      glowColor = 'rgba(0, 251, 255, 0.6)';
    } else if (score >= 50) {
      // Medium Focus: Gold
      mainColor = '#FFD700';
      glowColor = 'rgba(255, 215, 0, 0.6)';
    } else {
      // Low Focus: Warning Red
      mainColor = '#FF0055';
      glowColor = 'rgba(255, 0, 85, 0.6)';
    }

    ctx.save();

    // Animation Time
    const time = Date.now() / 1000;

    // 1. Core Center Dot (Nose)
    ctx.shadowBlur = 15;
    ctx.shadowColor = mainColor;
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    // 2. Inner Rotating Ring (Broken Segments)
    // Rotate slowly
    const rotationSpeed = 0.5;
    const rotation = time * rotationSpeed;

    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Draw 3 segments
    for (let i = 0; i < 3; i++) {
      const start = rotation + (i * (Math.PI * 2 / 3));
      const end = start + (Math.PI / 2); // Quarter circle length
      ctx.arc(x, y, baseRadius, start, end);
      // Don't close path to allow gaps
      ctx.stroke();
      ctx.beginPath(); // Reset for next segment
    }

    // 3. Outer Static Ring (Thin)
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, baseRadius * 1.2, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Focus Score Gauge
    // Arc representing 0-100 score
    const scoreAngle = (score / 100) * Math.PI * 1.5; // Max 270 degrees
    const startAngle = -Math.PI / 2 - (Math.PI * 1.5) / 2; // Start from top-ish, symmetrical
    // Actually let's just make it a circle progress bar
    const gaugeRadius = baseRadius * 1.4;

    // Gauge Background
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, gaugeRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Gauge Value
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // Start from top (-90deg)
    ctx.arc(x, y, gaugeRadius, -Math.PI / 2, -Math.PI / 2 + (score / 100 * Math.PI * 2));
    ctx.stroke();

    // 5. Text Label
    ctx.font = 'bold 14px "Outfit", sans-serif';
    ctx.fillStyle = mainColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Score Text below
    ctx.fillText(`FOCUS ${Math.round(score)}%`, x, y + baseRadius + 30);

    ctx.restore();
  }
}

export { PoseAnalyzer };
