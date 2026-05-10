// 음절 목록 — "나는로봇이아닙니다" 9글자
const SYLLABLES = ['나', '는', '로', '봇', '이', '아', '닙', '니', '다'];

// 사용 가능한 폰트 세트
const FONT_SETS = ['001', '002', '003'];

// 음절 등장 간격 (ms)
const VISUAL_INTERVAL = 400;
const TTS_INTERVAL = 100;

let voices = [];
let isAnimating = false;
let isStarted = false;
let animationTimers = [];

// ─── TTS 목소리 로드 ──────────────────────────────────────────────────────────

function loadVoices() {
    voices = window.speechSynthesis.getVoices();
}

window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices(); // 일부 브라우저는 즉시 사용 가능

// ko-KR 우선, 없으면 전체 목록에서 랜덤 선택
function getRandomVoice() {
    const koVoices = voices.filter(v => v.lang === 'ko-KR' || v.lang.startsWith('ko'));
    if (koVoices.length > 0) {
        return koVoices[Math.floor(Math.random() * koVoices.length)];
    }
    if (voices.length > 0) {
        return voices[Math.floor(Math.random() * voices.length)];
    }
    return null;
}

// 음절 하나를 랜덤 목소리/피치/속도로 읽기
function speakSyllable(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';

    const voice = getRandomVoice();
    if (voice) utterance.voice = voice;

    utterance.pitch = 0.7 + Math.random() * 0.7; 
    utterance.rate  = 0.7 + Math.random() * 0.7; 

    window.speechSynthesis.speak(utterance);
}

// ─── DOM 구성 ─────────────────────────────────────────────────────────────────

// 음절 이미지 요소를 새로 생성 (폰트 세트 랜덤 적용)
function buildSyllables() {
    const container = document.getElementById('syllable-container');
    container.innerHTML = '';

    SYLLABLES.forEach((syllable, index) => {
        const fontSet   = FONT_SETS[Math.floor(Math.random() * FONT_SETS.length)];
        const numStr    = String(index + 1).padStart(2, '0');
        const img       = document.createElement('img');

        img.src             = `asset/prototype-text/${fontSet}-${numStr}.png`;
        img.alt             = syllable;
        img.className       = 'syllable';
        img.dataset.syllable = syllable;
        img.onerror         = () => console.error(`이미지 로드 실패: ${img.src}`);

        container.appendChild(img);
    });
}

// ─── 애니메이션 ───────────────────────────────────────────────────────────────

function runAnimation() {
    isAnimating = true;
    const syllableEls = document.querySelectorAll('.syllable');

    syllableEls.forEach((el, index) => {

        const visualTimer = setTimeout(() => {
            el.classList.add('visible');
        }, index * VISUAL_INTERVAL);

        const ttsTimer = setTimeout(() => {
            speakSyllable(el.dataset.syllable);
        }, index * TTS_INTERVAL);

        animationTimers.push(visualTimer, ttsTimer);

        if (index === syllableEls.length - 1) {
            const endTimer = setTimeout(() => {
                isAnimating = false;
            }, index * TTS_INTERVAL + 500);
            animationTimers.push(endTimer);
        }
    });
}

// ─── 초기화 / 재시작 ──────────────────────────────────────────────────────────

function reset() {
    // 진행 중인 타이머와 TTS 취소
    animationTimers.forEach(t => clearTimeout(t));
    animationTimers = [];
    window.speechSynthesis.cancel();
    isAnimating = false;

    // 음절 요소 재생성 (폰트/TTS 랜덤 재적용)
    buildSyllables();

    // 레이아웃 반영 후 애니메이션 시작
    requestAnimationFrame(runAnimation);
}

// ─── 인터랙션 ─────────────────────────────────────────────────────────────────

function handleInteraction() {
    if (isAnimating) return;

    if (!isStarted) {
        // 첫 탭: 오버레이 제거 후 시작
        document.getElementById('start-overlay').style.display = 'none';
        isStarted = true;
        reset();
        return;
    }

    // 이후 탭: 처음부터 재생
    reset();
}

// touchend에 preventDefault → 뒤따라오는 click 이벤트 중복 방지
document.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleInteraction();
}, { passive: false });

document.addEventListener('click', handleInteraction);

// ─── 초기 실행 ────────────────────────────────────────────────────────────────

// 페이지 로드 시 음절을 숨겨진 상태로 미리 구성
buildSyllables();

// 후면 카메라 실행
navigator.mediaDevices.getUserMedia({
    video: {
        facingMode: "environment",
        width: { ideal: 1280 },
        height: { ideal: 720 }
    }
})
.then(stream => {
    const video = document.getElementById('camera');
    video.srcObject = stream;
})
.catch(err => {
    console.log("카메라 접근 불가:", err);
    document.body.style.background = '#000';
});
