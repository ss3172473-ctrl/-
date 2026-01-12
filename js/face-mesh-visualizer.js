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
    draw(canvasElement) {
        if (!this.lastResults || !this.lastResults.multiFaceLandmarks || this.lastResults.multiFaceLandmarks.length === 0) {
            return;
        }

        const landmarks = this.lastResults.multiFaceLandmarks[0];
        const width = canvasElement.width;
        const height = canvasElement.height;

        // 시간 기반 애니메이션 값
        const time = performance.now() / 1000;
        const flowOffset = (time * 2) % 10; // 흐르는 효과용

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
            this.lipsPath
        ];

        allPaths.forEach(path => {
            if (!path || path.length < 2) return;

            // Gradient 생성 (Electric Cyan + Transparent ends)
            // 패스의 시작점과 끝점을 기준으로 그라데이션 생성 시도? 
            // 복잡한 패스라 선형 그라데이션은 어렵고, StrokeStyle을 글로우로 설정하자.

            // 1. 기본 글로우 효과 (화이트 골드/사이언)
            this.ctx.shadowBlur = 4;
            this.ctx.shadowColor = '#00FBFF'; // Cyan Glow
            this.ctx.strokeStyle = `rgba(0, 251, 255, 0.4)`; // Base Cyan with low opacity
            this.ctx.lineWidth = 1.5; // 배경용 약간 두꺼운 선 (블러 효과)

            this.drawPath(path, landmarks, width, height);

            // 2. 중심의 얇은 선 (선명함) - 미세 두께 0.5pt
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = '#FFFFFF'; // 중심은 흰색에 가까움
            this.ctx.lineWidth = 0.5;
            this.drawPath(path, landmarks, width, height);

            // 3. 흐르는 파티클 효과 (Flowing Effect)
            // 패스 위를 움직이는 하이라이트 점들
            this.drawFlowingEffect(path, landmarks, width, height, time);
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

    drawFlowingEffect(path, landmarks, width, height, time) {
        // 패스 전체 길이를 따라 점이 이동하는 효과
        // 간단하게 패스 포인트 인덱스를 시간으로 나눈 나머지로 하이라이트

        const pathLength = path.length;
        const speed = 8; // 이동 속도
        const activeIndex = (time * speed) % pathLength;

        // 보간된 위치를 찾으면 더 부드럽겠지만, 성능상 인덱스 근처 점들을 밝게 처리
        const idx = Math.floor(activeIndex);
        const nextIdx = (idx + 1) % pathLength;
        const progress = activeIndex - idx;

        const currentPt = landmarks[path[idx]];
        const nextPt = landmarks[path[nextIdx]];

        if (currentPt && nextPt) {
            const x = (currentPt.x + (nextPt.x - currentPt.x) * progress) * width;
            const y = (currentPt.y + (nextPt.y - currentPt.y) * progress) * height;

            // 빛나는 입자 그리기
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#00FBFF';
            this.ctx.shadowColor = '#00FBFF';
            this.ctx.shadowBlur = 8;
            this.ctx.fill();
        }
    }
}

export { FaceMeshVisualizer };
