let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | undefined;
let cachedVietnameseVoice: SpeechSynthesisVoice | undefined;

function getVoicesWhenReady(): Promise<SpeechSynthesisVoice[]> {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) return Promise.resolve(voices);

  if (!voicesReadyPromise) {
    voicesReadyPromise = new Promise((resolve) => {
      const finish = () => {
        window.speechSynthesis.removeEventListener('voiceschanged', finish);
        resolve(window.speechSynthesis.getVoices());
      };

      window.speechSynthesis.addEventListener('voiceschanged', finish);
      window.setTimeout(finish, 700);
    });
  }

  return voicesReadyPromise;
}

function scoreVietnameseVoice(voice: SpeechSynthesisVoice) {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  let score = 0;

  if (lang === 'vi-vn') score += 120;
  else if (lang.startsWith('vi')) score += 90;
  else return -1;

  if (name.includes('natural')) score += 40;
  if (name.includes('neural')) score += 36;
  if (name.includes('hoaimy') || name.includes('hoài my')) score += 30;
  if (name.includes('namminh') || name.includes('nam minh')) score += 26;
  if (name.includes('microsoft')) score += 20;
  if (name.includes('google')) score += 18;
  if (name.includes('apple')) score += 14;
  if (name.includes('female') || name.includes('nữ')) score += 6;
  if (!voice.localService) score += 4;

  return score;
}

async function getBestVietnameseVoice() {
  if (cachedVietnameseVoice) return cachedVietnameseVoice;

  const voices = await getVoicesWhenReady();
  cachedVietnameseVoice = voices
    .filter((voice) => scoreVietnameseVoice(voice) >= 0)
    .sort((a, b) => scoreVietnameseVoice(b) - scoreVietnameseVoice(a))[0];

  return cachedVietnameseVoice;
}

function clampSpeechRate(rate: number) {
  return Math.min(1, Math.max(0.65, rate));
}

export function speakVi(text: string, rate = 0.86): Promise<void> {
  if (!('speechSynthesis' in window)) {
    return new Promise((resolve) => window.setTimeout(resolve, 600));
  }

  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = clampSpeechRate(rate);
    utterance.pitch = 1.04;
    utterance.volume = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    void getBestVietnameseVoice().then((voice) => {
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
      window.speechSynthesis.speak(utterance);
    });
  });
}
