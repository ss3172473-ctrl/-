# 설치 및 배포 가이드

## 로컬 실행

### 요구사항
- Python 3.x 또는 Node.js
- 최신 웹 브라우저 (Chrome 80+, Firefox 75+, Edge 80+)

### 방법 1: Python 서버

```bash
# 프로젝트 폴더로 이동
cd attendFlow

# Python 내장 서버 실행
python -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속

### 방법 2: FastAPI 서버 (권장)

```bash
# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python main.py
```

브라우저에서 `http://localhost:8000` 접속

### 방법 3: Node.js

```bash
npx serve .
```

---

## 배포 방법

### GitHub Pages (무료, 권장)

1. GitHub 레포지토리 생성
2. 코드 업로드 (폴더가 아닌 **파일들만** 업로드)
3. Settings → Pages → Branch를 `main`으로 설정
4. 1~2분 후 `https://username.github.io/repo-name/` 에서 접속

**주의:** 업로드 시 폴더째로 올리면 404 에러 발생

### Netlify (무료)

1. [netlify.com](https://netlify.com) 가입
2. "Add new site" → "Deploy manually"
3. 프로젝트 폴더 드래그 앤 드롭
4. 자동으로 HTTPS URL 생성

### Vercel (무료)

1. [vercel.com](https://vercel.com) 가입
2. GitHub 레포 연결
3. 자동 배포 완료

---

## HTTPS 필수

카메라/화면 공유 기능은 **HTTPS 환경에서만** 작동합니다.

- `localhost`는 예외적으로 HTTP에서도 카메라 접근 가능
- 배포 시 반드시 HTTPS 지원 서비스 사용 (GitHub Pages, Netlify, Vercel 모두 지원)

---

## 환경별 설정

### 포트 변경

```bash
# 환경변수로 포트 지정
PORT=3000 python main.py
```

### PeerJS 서버 변경 (선택)

`js/config.js`에서 수정:

```javascript
peer: {
  host: 'your-peerjs-server.com',
  port: 443,
  secure: true
}
```
