/**
 * Face Mesh Visualizer
 * 얼굴 인식이 되고 있음을 보여주는 시각적 효과 전용 클래스
 * 기능 로직(집중도 분석 등)과는 무관함.
 */
class FaceMeshVisualizer {
    constructor(canvasCtx) {
        this.ctx = canvasCtx;
        this.faceMesh = null;
        this.isReady = false;

        console.log('[FaceMeshVisualizer] Initializing...');
        // Face Mesh 설정
        try {
            this.faceMesh = new window.FaceMesh({
                locateFile: (file) => {
                    // console.log('[FaceMeshVisualizer] Loading file:', file);
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                }
            });
        } catch (e) {
            console.error('[FaceMeshVisualizer] Failed to create FaceMesh instance:', e);
            return;
        }

        this.faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: false, // 리소스 로딩 이슈 방지를 위해 우선 false (홍채 데이터 불필요)
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.faceMesh.onResults((results) => {
            // console.log('[FaceMeshVisualizer] Results received'); 
            this.onResults(results);
        });

        // 마지막 인식 결과 저장용
        this.lastResults = null;
        this.lastDetectTime = 0;

        // 애니메이션 상태
        this.phase = 0; // 0 ~ 2PI

        // 주요 랜드마크 인덱스 (실루엣 위주)
        // MediaPipe Face Mesh 기본 토폴로지 참고
        this.silhouetteIndices = [
            // 턱선 (Jawline) - 대략적인 외곽
            10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
            // 왼쪽 눈썹
            70, 63, 105, 66, 107,
            // 오른쪽 눈썹
            336, 296, 334, 293, 300,
            // 왼쪽 눈
            33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7,
            // 오른쪽 눈
            362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382,
            // 입술 외곽
            61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291
        ];

        // 연결선 정의 (단순 점 연결이 아닌 선으로 그리기 위해 인접 점들을 정의해야 함)
        // 여기서는 간단하게 점들을 순회하며 그리는 것이 아니라, 각 부위별로 연결된 패스를 정의합니다.

        // 1. 턱선 연결 (순서대로 연결되어 있음)
        this.jawPath = [234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454];

        // 2. 왼쪽 눈썹
        this.leftEyebrowPath = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];

        // 3. 오른쪽 눈썹
        this.rightEyebrowPath = [336, 296, 334, 293, 300, 285, 295, 282, 283, 276];

        // 4. 왼쪽 눈
        this.leftEyePath = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7, 33];

        // 5. 오른쪽 눈
        this.rightEyePath = [362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382, 362];

        // 6. 입술
        this.lipsPath = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 61];

        // 7. 콧대 (Nose Bridge) - 복잡도 추가
        this.noseBridgePath = [168, 6, 197, 195, 5, 4];

        // 8. 이마 라인 (Forehead)
        this.foreheadPath = [103, 104, 108, 69, 66, 296, 299, 337, 338];

        // 9. 뺨 라인 (Cheek Lines) - 사이버틱한 느낌 추가
        this.leftCheekPath = [234, 227, 116, 117, 118, 100, 126, 209, 198];
        this.rightCheekPath = [454, 447, 345, 346, 347, 329, 355, 429, 420];
    }

    // 색상 결정 헬퍼
    getThemeColor(score) {
        if (score === undefined || score === null) return '#00FBFF'; // Default Cyan
        if (score >= 80) return '#00FBFF'; // High - Cyan (유지)
        if (score >= 50) return '#FFD700'; // Medium - Gold
        return '#FF0055'; // Low - Neon Red
    }

    // 비디오 프레임 처리
    async send(videoInput) {
        if (this.faceMesh) {
            await this.faceMesh.send({ image: videoInput });
        }
    }

    // 결과 수신 콜백
    onResults(results) {
        this.lastResults = results;
        this.lastDetectTime = performance.now();
    }

    // 캔버스에 그리기 (애니메이션 루프에서 호출)
    draw(canvasElement, score = 100) {
        if (!this.lastResults || !this.lastResults.multiFaceLandmarks || this.lastResults.multiFaceLandmarks.length === 0) {
            return;
        }

        const landmarks = this.lastResults.multiFaceLandmarks[0];
        const width = canvasElement.width;
        const height = canvasElement.height;

        // 점수에 따른 테마 색상 결정
        const themeColor = this.getThemeColor(score);

        // 시간 기반 애니메이션 값
        const time = performance.now() / 1000;

        this.ctx.save();

        // 스타일 설정
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        // 모든 패스 그리기
        const allPaths = [
            this.jawPath,
            this.leftEyebrowPath,
            this.rightEyebrowPath,
            this.leftEyePath,
            this.rightEyePath,
            this.lipsPath,
            this.noseBridgePath,
            this.foreheadPath,
            this.leftCheekPath,
            this.rightCheekPath
        ];

        allPaths.forEach(path => {
            if (!path || path.length < 2) return;

            // 1. 기본 글로우 효과 (블러 처리를 위해 두껍게)
            this.ctx.shadowBlur = 15; // 더 강한 글로우
            this.ctx.shadowColor = themeColor;
            this.ctx.strokeStyle = themeColor;
            this.ctx.globalAlpha = 0.6; // 약간 투명하게
            this.ctx.lineWidth = 4; // 훨씬 두껍게 (4px)

            this.drawPath(path, landmarks, width, height);

            // 2. 중심의 얇은 선 (선명함) - Core Line
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1.0;
            this.ctx.strokeStyle = '#FFFFFF'; // 중심은 흰색
            this.ctx.lineWidth = 1.5; // 중심선도 0.5 -> 1.5로 굵게 변경
            this.drawPath(path, landmarks, width, height);

            // 3. 흐르는 파티클 효과 (Flowing Effect)
            this.drawFlowingEffect(path, landmarks, width, height, time, themeColor);
        });

        this.ctx.restore();
    }

    drawPath(path, landmarks, width, height) {
        this.ctx.beginPath();
        let first = true;
        for (const index of path) {
            const pt = landmarks[index];
            if (!pt) continue;
            const x = pt.x * width;
            const y = pt.y * height;

            if (first) {
                this.ctx.moveTo(x, y);
                first = false;
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.stroke();
    }

    drawFlowingEffect(path, landmarks, width, height, time, color) {
        const pathLength = path.length;
        const speed = 5; // 속도 조절

        // 여러 개의 파티클이 흐르도록
        for (let i = 0; i < 2; i++) {
            const offset = (pathLength / 2) * i;
            const activeIndex = (time * speed + offset) % pathLength;

            const idx = Math.floor(activeIndex);
            const nextIdx = (idx + 1) % pathLength;
            const progress = activeIndex - idx;

            const currentPt = landmarks[path[idx]];
            const nextPt = landmarks[path[nextIdx]];

            if (currentPt && nextPt) {
                const x = (currentPt.x + (nextPt.x - currentPt.x) * progress) * width;
                const y = (currentPt.y + (nextPt.y - currentPt.y) * progress) * height;

                // 빛나는 입자
                this.ctx.beginPath();
                this.ctx.arc(x, y, 3, 0, 2 * Math.PI); // 입자 크기도 2 -> 3
                this.ctx.fillStyle = color; // 테마 색상상
                this.ctx.shadowColor = '#FFFFFF';
                this.ctx.shadowBlur = 10;
                this.ctx.fill();
            }
        }
    }
}

export { FaceMeshVisualizer };
