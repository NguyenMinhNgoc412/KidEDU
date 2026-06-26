const CHILD_PROFILE_ID = 'child_profile_phase0_demo';
const SESSION_ID = `session_${Date.now()}`;
const DB_NAME = 'kidedu_phase0';
const DB_VERSION = 1;
const CUSTOM_VIDEO_STORE = 'custom_videos';
const STORAGE_KEY = 'kidedu_phase0_state';

const DEFAULT_PLAYBACK_CONFIG = {
  repeatCount: 3,
  normalSpeed: 1,
  slowSpeed: 0.6,
  pauseDurationMs: 1500,
};

const category = {
  id: 'first_words',
  name: 'Từ đầu tiên',
  description: 'Nhóm từ ngắn, gần gũi, dễ quan sát khẩu hình.',
  icon: '👄',
};

const words = [
  {
    id: 'ba',
    text: 'Ba',
    illustration: '👨',
    group: 'Âm môi/gia đình',
    mouthHint: 'Môi khép rồi bật ra cho /b/, miệng mở /a/.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/ba.mp4',
  },
  {
    id: 'me',
    text: 'Mẹ',
    illustration: '👩',
    group: 'Âm môi/gia đình',
    mouthHint: 'Môi khép /m/, mở ngang nhẹ /e/.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/me.mp4',
  },
  {
    id: 'be',
    text: 'Bé',
    illustration: '🧒',
    group: 'Âm môi',
    mouthHint: '/b/ rõ, miệng mở vừa cho /e/.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/be.mp4',
  },
  {
    id: 'ong',
    text: 'Ông',
    illustration: '👴',
    group: 'Gia đình',
    mouthHint: 'Miệng mở tròn cho âm /ô/, kết thúc nhẹ với /ng/.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/ong.mp4',
  },
  {
    id: 'ba_noi',
    text: 'Bà',
    illustration: '👵',
    group: 'Gia đình',
    mouthHint: 'Môi khép rồi bật ra cho /b/, mở miệng cho /a/ với thanh huyền.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/ba-noi.mp4',
  },
  {
    id: 'anh',
    text: 'Anh',
    illustration: '👦',
    group: 'Gia đình',
    mouthHint: 'Miệng mở vừa, âm ngắn rõ và kết thúc nhẹ.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/anh.mp4',
  },
  {
    id: 'chi',
    text: 'Chị',
    illustration: '👧',
    group: 'Gia đình',
    mouthHint: 'Miệng kéo ngang nhẹ cho /i/, phát âm chậm để bé nhìn rõ.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/chi.mp4',
  },
  {
    id: 'bu',
    text: 'Bú',
    illustration: '🍼',
    group: 'Âm môi/nhu cầu',
    mouthHint: '/b/ rồi môi tròn /u/.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/bu.mp4',
  },
  {
    id: 'an',
    text: 'Ăn',
    illustration: '🥣',
    group: 'Nhu cầu',
    mouthHint: 'Miệng mở vừa, âm ngắn rõ.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/an.mp4',
  },
  {
    id: 'uong',
    text: 'Uống',
    illustration: '🥤',
    group: 'Nhu cầu',
    mouthHint: 'Môi tròn, kéo dài vừa.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/uong.mp4',
  },
  {
    id: 'di',
    text: 'Đi',
    illustration: '🚶',
    group: 'Hành động',
    mouthHint: 'Miệng kéo ngang nhẹ.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/di.mp4',
  },
  {
    id: 'ngu',
    text: 'Ngủ',
    illustration: '🛏️',
    group: 'Sinh hoạt',
    mouthHint: 'Môi tròn /u/.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/ngu.mp4',
  },
  {
    id: 'bong',
    text: 'Bóng',
    illustration: '⚽',
    group: 'Đồ vật',
    mouthHint: 'Âm /b/ đầu rõ, có thanh sắc.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/bong.mp4',
  },
  {
    id: 'meo',
    text: 'Mèo',
    illustration: '🐱',
    group: 'Động vật',
    mouthHint: '/m/ đầu rõ, hình minh họa dễ hiểu.',
    hasRealMouthVideo: false,
    defaultAvatarVideo: 'assets/videos/meo.mp4',
  },
];

const topics = [
  {
    id: 'first_words',
    title: 'Từ đầu tiên',
    description: 'Nhóm từ ngắn, gần gũi, dễ quan sát khẩu hình.',
    icon: '💡',
    tone: 'green',
    words: ['ba', 'me', 'be', 'ong', 'ba_noi', 'anh', 'chi', 'bu', 'an', 'uong', 'di', 'ngu', 'bong', 'meo'],
  },
  {
    id: 'family',
    title: 'Gia đình',
    description: 'Từ thân thuộc trong gia đình.',
    icon: '💞',
    tone: 'blue',
    words: ['ba', 'me', 'ong', 'ba_noi', 'anh', 'chi'],
  },
  {
    id: 'food',
    title: 'Đồ ăn',
    description: 'Từ về ăn uống và nhu cầu hằng ngày.',
    icon: '🍓',
    tone: 'yellow',
    words: ['an', 'uong', 'bu'],
  },
  {
    id: 'animals',
    title: 'Động vật',
    description: 'Từ về con vật quen thuộc.',
    icon: '🐶',
    tone: 'cream',
    words: ['meo'],
  },
  {
    id: 'actions',
    title: 'Hành động',
    description: 'Từ mô tả hành động đơn giản.',
    icon: '🚪',
    tone: 'active',
    words: ['di', 'ngu'],
  },
  {
    id: 'objects',
    title: 'Đồ vật',
    description: 'Từ về đồ vật gần bé.',
    icon: '🖼️',
    tone: 'green',
    words: ['bong'],
  },
  {
    id: 'colors',
    title: 'Màu sắc',
    description: 'Nhóm màu sắc sẽ được bổ sung nội dung.',
    icon: '🎨',
    tone: 'yellow',
    words: [],
  },
];

const app = document.querySelector('#app');

let state = loadState();
let holdTimer = null;
let holdFrame = null;
let holdCompleted = false;
let playbackAbort = null;
let activeObjectUrl = null;

function createProgressForWord(wordId) {
  return {
    childProfileId: CHILD_PROFILE_ID,
    wordId,
    viewCount: 0,
    practiceCount: 0,
    latestStatus: 'not_started',
    lastPracticedAt: null,
  };
}

function defaultState() {
  const progress = {};
  for (const word of words) {
    progress[word.id] = createProgressForWord(word.id);
  }
  return {
    activeArea: 'child',
    childScreen: 'category',
    selectedTopicId: topics[0].id,
    navVisible: false,
    selectedWordId: words[0].id,
    playback: {
      state: 'idle',
      roundIndex: 0,
      totalRounds: DEFAULT_PLAYBACK_CONFIG.repeatCount,
      sourceType: 'default_remote',
      usedCustomVideo: false,
      error: null,
      isPlaying: false,
    },
    config: {
      ...DEFAULT_PLAYBACK_CONFIG,
      sensoryFriendlyMode: true,
      autoNextWord: false,
      uiSound: false,
    },
    progress,
    events: [],
    customVideos: {},
    activeNotice: '',
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return defaultState();
    const fresh = defaultState();
    return {
      ...fresh,
      ...saved,
      config: { ...fresh.config, ...(saved.config || {}) },
      progress: { ...fresh.progress, ...(saved.progress || {}) },
      playback: fresh.playback,
      navVisible: false,
      activeNotice: '',
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  const toSave = {
    ...state,
    playback: defaultState().playback,
    navVisible: false,
    activeNotice: '',
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

function setState(patch) {
  state = { ...state, ...patch };
  saveState();
  render();
}

function getWord(wordId = state.selectedWordId) {
  return words.find((word) => word.id === wordId) || words[0];
}

function getProgress(wordId) {
  if (!state.progress[wordId]) {
    state.progress[wordId] = createProgressForWord(wordId);
    saveState();
  }
  return state.progress[wordId];
}

function findWordById(wordId) {
  return words.find((word) => word.id === wordId) || null;
}

function getTopic(topicId = state.selectedTopicId) {
  return topics.find((topic) => topic.id === topicId) || topics[0];
}

function normalizeVocabularyItem(item) {
  const itemId = typeof item === 'string' ? item : item.id;
  const source = typeof item === 'string' ? {} : item;
  const word = findWordById(itemId);
  return {
    id: itemId,
    label: source.label || word?.text || itemId,
    imageUrl: source.imageUrl || word?.imageUrl || '',
    illustration: source.illustration || word?.illustration || '',
    learned: Boolean(source.learned || source.completed || source.isLearned),
    locked: Boolean(source.locked),
    canOpenLearning: Boolean(word && !source.locked),
  };
}

function getTopicVocabulary(topic = getTopic()) {
  return (topic.words || []).map((item) => normalizeVocabularyItem(item));
}

function isVocabularyLearned(item) {
  if (item.learned || item.completed || item.isLearned) return true;
  const progress = getProgress(item.id);
  return Boolean(progress && progress.latestStatus !== 'not_started');
}

function makeId(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function statusLabel(status) {
  return {
    not_started: 'Chưa học',
    viewed: 'Đã học',
    imitated: 'Bắt chước',
    review_needed: 'Cần ôn',
  }[status];
}

function formatSeconds(ms) {
  const seconds = ms / 1000;
  return `${Number.isInteger(seconds) ? seconds : seconds.toFixed(1)}s`;
}

function playbackChipLabel() {
  const { playback } = state;
  if (playback.state === 'playing_normal') return `Lần ${playback.roundIndex}/3 · Bình thường`;
  if (playback.state === 'playing_slow') return `Lần ${playback.roundIndex}/3 · Chậm`;
  if (playback.state === 'pause_between_repeats') return 'Nghỉ một chút';
  if (playback.state === 'completed') return 'Đã phát xong';
  if (playback.state === 'loading_video') return 'Đang chuẩn bị';
  return 'Lần 1/3 · Bình thường';
}

function settingPercent(value, min, max) {
  return Math.round(((value - min) / (max - min)) * 100);
}

function appendEvent(eventName, wordId, payload = {}) {
  state.events.push({
    eventId: makeId('evt'),
    eventName,
    eventVersion: 1,
    childProfileId: CHILD_PROFILE_ID,
    wordId,
    sessionId: SESSION_ID,
    clientTimestamp: new Date().toISOString(),
    payload,
  });
  saveState();
}

function updateProgress(wordId, updater) {
  const current = getProgress(wordId);
  state.progress[wordId] = updater({ ...current });
  saveState();
}

function openWord(wordId) {
  cleanupPlayback();
  updateProgress(wordId, (progress) => ({
    ...progress,
    viewCount: progress.viewCount + 1,
    lastPracticedAt: new Date().toISOString(),
  }));
  appendEvent('word_opened', wordId, { source: 'word_list' });
  state.selectedWordId = wordId;
  state.childScreen = 'learning';
  state.activeArea = 'child';
  state.navVisible = false;
  state.playback = {
    ...defaultState().playback,
    totalRounds: state.config.repeatCount,
  };
  saveState();
  render();
}

function openChild(screen = 'category') {
  cleanupPlayback();
  setState({ activeArea: 'child', childScreen: screen, navVisible: false });
}

function openTopicVocabulary(topicId) {
  cleanupPlayback();
  const topic = getTopic(topicId);
  state.selectedTopicId = topic.id;
  state.childScreen = 'word-list';
  state.activeArea = 'child';
  state.navVisible = false;
  saveState();
  render();
}

function openParent() {
  cleanupPlayback();
  setState({ activeArea: 'parent', navVisible: false });
}

function openSettings() {
  cleanupPlayback();
  setState({ activeArea: 'settings', navVisible: false });
}

function showNav() {
  setState({ navVisible: true });
}

function hideNav() {
  if (state.navVisible) setState({ navVisible: false });
}

function completeHold(target, button) {
  holdCompleted = true;
  cancelHold(false);
  button.style.setProperty('--hold-progress', '1');
  if (target === 'parent') openParent();
  if (target === 'settings') openSettings();
}

function startHold(target, button, event = null) {
  cancelHold();
  holdCompleted = false;
  const start = performance.now();
  const duration = 1000;
  button.style.setProperty('--hold-progress', '0');
  if (event?.pointerId !== undefined && button.setPointerCapture) {
    button.setPointerCapture(event.pointerId);
  }

  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    button.style.setProperty('--hold-progress', String(progress));
    if (progress >= 1) return;
    holdFrame = requestAnimationFrame(tick);
  };

  holdTimer = window.setTimeout(() => completeHold(target, button), duration);
  holdFrame = requestAnimationFrame(tick);
}

function cancelHold(reset = true) {
  if (holdTimer) window.clearTimeout(holdTimer);
  if (holdFrame) cancelAnimationFrame(holdFrame);
  holdTimer = null;
  holdFrame = null;
  if (reset) {
    document
      .querySelectorAll('[data-hold-target]')
      .forEach((button) => button.style.setProperty('--hold-progress', '0'));
  }
}

function cleanupPlayback() {
  if (playbackAbort) playbackAbort.abort();
  playbackAbort = null;
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
  const video = document.querySelector('#learning-video');
  if (video) {
    video.pause();
    video.removeAttribute('src');
    video.load();
  }
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        window.clearTimeout(id);
        reject(new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

function once(target, eventName, signal) {
  return new Promise((resolve, reject) => {
    const onEvent = () => resolve();
    const onAbort = () => {
      target.removeEventListener(eventName, onEvent);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    target.addEventListener(eventName, onEvent, { once: true });
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function getDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CUSTOM_VIDEO_STORE)) {
        db.createObjectStore(CUSTOM_VIDEO_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(storeName, value) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(storeName, id) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function idbDelete(storeName, id) {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function resolveVideoSource(word) {
  const custom = state.customVideos[word.id];
  if (custom?.isActive) {
    const stored = await idbGet(CUSTOM_VIDEO_STORE, custom.id);
    if (stored?.blob) {
      activeObjectUrl = URL.createObjectURL(stored.blob);
      return {
        uri: activeObjectUrl,
        sourceType: 'custom_local',
        usedCustomVideo: true,
        hasPlayableVideo: true,
      };
    }
    state.customVideos[word.id] = { ...custom, isActive: false, missing: true };
    saveState();
  }

  return {
    uri: word.defaultAvatarVideo,
    sourceType: 'default_remote',
    usedCustomVideo: false,
    hasPlayableVideo: false,
  };
}

async function playVideoRound(video, speed, signal) {
  video.playbackRate = speed;
  video.muted = false;
  video.volume = 1;
  video.currentTime = 0;
  await video.play();
  await once(video, 'ended', signal);
}

async function playFallbackRound(signal) {
  await wait(1700, signal);
}

async function startPlaybackSequence() {
  cleanupPlayback();
  hideNav();

  const word = getWord();
  const controller = new AbortController();
  playbackAbort = controller;
  const signal = controller.signal;
  const source = await resolveVideoSource(word);
  const speeds = [];

  updateProgress(word.id, (progress) => ({
    ...progress,
    latestStatus:
      progress.latestStatus === 'not_started' ? 'viewed' : progress.latestStatus,
    lastPracticedAt: new Date().toISOString(),
  }));

  state.playback = {
    state: 'loading_video',
    roundIndex: 0,
    totalRounds: state.config.repeatCount,
    sourceType: source.sourceType,
    usedCustomVideo: source.usedCustomVideo,
    error: null,
    isPlaying: true,
  };
  saveState();
  render();

  appendEvent('play_sequence_started', word.id, {
    repeat_count: state.config.repeatCount,
    normal_speed: state.config.normalSpeed,
    slow_speed: state.config.slowSpeed,
    used_custom_video: source.usedCustomVideo,
  });

  try {
    for (let index = 1; index <= state.config.repeatCount; index += 1) {
      const speed = index === 1 ? state.config.normalSpeed : state.config.slowSpeed;
      speeds.push(speed);
      state.playback = {
        ...state.playback,
        state: index === 1 ? 'playing_normal' : 'playing_slow',
        roundIndex: index,
        isPlaying: true,
      };
      saveState();
      render();

      const activeVideo = document.querySelector('#learning-video');
      if (activeVideo && source.hasPlayableVideo) {
        activeVideo.src = source.uri;
        activeVideo.load();
        await once(activeVideo, 'loadeddata', signal);
        await playVideoRound(activeVideo, speed, signal);
      } else {
        await playFallbackRound(signal);
      }

      if (index < state.config.repeatCount) {
        state.playback = {
          ...state.playback,
          state: 'pause_between_repeats',
          isPlaying: false,
        };
        saveState();
        render();
        await wait(state.config.pauseDurationMs, signal);
      }
    }

    state.playback = { ...state.playback, state: 'completed', isPlaying: false };
    updateProgress(word.id, (progress) => ({
      ...progress,
      practiceCount: progress.practiceCount + 1,
      latestStatus:
        progress.latestStatus === 'not_started' ? 'viewed' : progress.latestStatus,
      lastPracticedAt: new Date().toISOString(),
    }));
    appendEvent('play_sequence_completed', word.id, {
      repeat_count: state.config.repeatCount,
      speeds,
      used_custom_video: source.usedCustomVideo,
      completed: true,
    });
    saveState();
    render();
  } catch (error) {
    if (error.name !== 'AbortError') {
      state.playback = {
        ...state.playback,
        state: 'video_error',
        error: 'Video chưa phát được. Có thể dùng fallback ảnh + chữ.',
        isPlaying: false,
      };
      saveState();
      render();
    }
  }
}

function markWord(wordId, status) {
  updateProgress(wordId, (progress) => ({
    ...progress,
    latestStatus: status,
    lastPracticedAt: new Date().toISOString(),
  }));
  appendEvent('word_status_marked', wordId, { status });
  render();
}

async function saveCustomVideo(wordId, file) {
  if (!file) return;
  if (!file.type.startsWith('video/')) {
    setState({ activeNotice: 'File được chọn chưa phải video.' });
    return;
  }
  if (file.size > 50 * 1024 * 1024) {
    setState({ activeNotice: 'Video hơi nặng. Hãy chọn video dưới 50 MB.' });
    return;
  }

  const id = `${CHILD_PROFILE_ID}_${wordId}`;
  const now = new Date().toISOString();
  await idbPut(CUSTOM_VIDEO_STORE, {
    id,
    blob: file,
    fileName: file.name,
    mimeType: file.type,
    fileSizeBytes: file.size,
    updatedAt: now,
  });

  state.customVideos[wordId] = {
    id,
    childProfileId: CHILD_PROFILE_ID,
    wordId,
    localFilePath: `indexeddb://${DB_NAME}/${CUSTOM_VIDEO_STORE}/${id}`,
    fileName: file.name,
    fileSizeBytes: file.size,
    mimeType: file.type,
    isActive: true,
    syncStatus: 'local_only',
    createdAt: state.customVideos[wordId]?.createdAt || now,
    updatedAt: now,
  };
  appendEvent('custom_video_saved_local', wordId, {
    file_size_bytes: file.size,
    mime_type: file.type,
  });
  setState({
    activeNotice:
      'Đã lưu video trong ứng dụng. Xóa video gốc trong thư viện sẽ không làm mất video này.',
  });
}

async function deleteCustomVideo(wordId) {
  const custom = state.customVideos[wordId];
  if (!custom) return;
  await idbDelete(CUSTOM_VIDEO_STORE, custom.id);
  delete state.customVideos[wordId];
  appendEvent('custom_video_deleted_local', wordId, { reason: 'parent_deleted' });
  setState({ activeNotice: 'Đã xóa video thay thế. App sẽ dùng video mặc định.' });
}

function updateConfig(key, value) {
  state.config = { ...state.config, [key]: value };
  saveState();
  render();
}

function playbackBadge() {
  const { playback } = state;
  if (playback.state === 'playing_normal') {
    return `Lần ${playback.roundIndex}/${playback.totalRounds} · thường`;
  }
  if (playback.state === 'playing_slow') {
    return `Lần ${playback.roundIndex}/${playback.totalRounds} · chậm`;
  }
  if (playback.state === 'pause_between_repeats') return 'Nghỉ một chút...';
  if (playback.state === 'completed') return 'Đã phát xong';
  if (playback.state === 'loading_video') return 'Đang chuẩn bị video';
  if (playback.state === 'video_error') return 'Video lỗi';
  return 'Sẵn sàng';
}

function renderTopbar(title, backAction = null) {
  return `
    <header class="topbar">
      ${
        backAction
          ? `<button class="icon-btn" data-action="${backAction}" aria-label="Quay lại">↩️</button>`
          : '<span></span>'
      }
      <h1 class="title">${title}</h1>
      <button class="parent-icon" data-hold-target="parent" aria-label="Giữ để mở phụ huynh">👨‍👩‍👧<small>giữ 1s</small></button>
    </header>
  `;
}

function renderCategoryScreen() {
  return `
    <section class="screen home-screen">
      <header class="home-header">
        <div class="home-brand">
          <span class="home-logo" aria-hidden="true">☘</span>
          <strong>KidEDU</strong>
        </div>
        <button class="home-search" type="button" aria-label="Tìm kiếm">⌕</button>
      </header>
      <div class="home-title-block">
        <p>KHÁM PHÁ</p>
        <h1>Chọn một chủ đề</h1>
      </div>
      <div class="topic-grid">
        ${topics
          .map(
            (topic) => {
              const vocabulary = getTopicVocabulary(topic);
              return `
              <button
                class="topic-card topic-${topic.tone}"
                type="button"
                data-action="open-word-list"
                data-topic-id="${topic.id}"
              >
                <span class="topic-icon">${topic.icon}</span>
                <strong>${topic.title}</strong>
                <small>${vocabulary.length ? `${vocabulary.length} từ học` : 'Sắp có nội dung'}</small>
              </button>
            `;
            },
          )
          .join('')}
      </div>
    </section>
  `;
}

function renderTopicVocabularyHeader(topic) {
  return `
    <header class="topic-vocab-header">
      <button class="topic-vocab-back" data-action="open-category" aria-label="Quay lại chủ đề">‹</button>
      <h1>${topic.title}</h1>
      <span class="topic-vocab-spacer" aria-hidden="true"></span>
    </header>
  `;
}

function renderLearnedIndicator(isLearned, locked = false) {
  if (locked) {
    return `<span class="learned-indicator is-locked" aria-hidden="true">⌕</span>`;
  }
  return `
    <span class="learned-indicator ${isLearned ? 'is-learned' : 'is-unlearned'}" aria-hidden="true">
      ${isLearned ? '★' : '☆'}
    </span>
  `;
}

function renderVocabularyImage(item) {
  if (item.imageUrl) {
    return `
      <span class="vocab-image">
        <img src="${item.imageUrl}" alt="" loading="lazy" />
      </span>
    `;
  }
  return `
    <span class="vocab-image vocab-fallback-image" aria-hidden="true">
      <span>${item.illustration || item.label.slice(0, 1)}</span>
    </span>
  `;
}

function renderVocabularyCard(item) {
  const learned = isVocabularyLearned(item);
  const statusText = item.locked ? 'đang khóa' : learned ? 'đã học' : 'chưa học';
  const disabled = item.locked || !item.canOpenLearning;
  return `
    <button
      class="vocab-card ${learned ? 'is-learned' : ''} ${item.locked ? 'is-locked' : ''}"
      type="button"
      ${disabled ? 'disabled' : `data-action="open-learning" data-word-id="${item.id}"`}
      aria-label="${item.label}, ${statusText}"
    >
      ${renderLearnedIndicator(learned, item.locked)}
      ${renderVocabularyImage(item)}
      <strong>${item.label}</strong>
    </button>
  `;
}

function renderVocabularyGrid(items) {
  return `
    <div class="vocab-grid">
      ${items.map((item) => renderVocabularyCard(item)).join('')}
    </div>
  `;
}

function renderWordList() {
  const topic = getTopic();
  const vocabulary = getTopicVocabulary(topic);
  return `
    <section class="screen topic-vocab-screen">
      ${renderTopicVocabularyHeader(topic)}
      ${
        vocabulary.length
          ? renderVocabularyGrid(vocabulary)
          : `<div class="vocab-empty-state">
              <strong>Chủ đề này sắp có từ mới</strong>
              <p>Phụ huynh có thể quay lại chủ đề khác để bé tiếp tục luyện tập.</p>
            </div>`
      }
    </section>
  `;
}

function renderLearningScreen() {
  const word = getWord();
  const progress = getProgress(word.id);
  const custom = state.customVideos[word.id];
  const hasCustom = Boolean(custom?.isActive);
  const isPlaying = state.playback.isPlaying;

  return `
    <section class="screen child-learning-screen">
      <header class="child-learning-header">
        <button class="child-back-btn" data-action="open-word-list" aria-label="Quay lại">‹</button>
        <span class="learning-round-chip">♬ ${playbackChipLabel()}</span>
      </header>
      <div class="child-learning-layout">
        <div class="mouth-focus-stage ${hasCustom ? 'with-video' : ''}">
          <video id="learning-video" playsinline></video>
          <div class="mouth-reference ${isPlaying ? 'speaking' : ''}" aria-hidden="true">
            <img src="assets/images/mouth-focus.svg" alt="" />
          </div>
        </div>

        <div class="child-word-focus">
          <span class="child-avatar">${word.illustration}</span>
          <strong>${word.text.toUpperCase()}</strong>
          <span class="status-badge">Trạng thái: ${statusLabel(progress.latestStatus)}</span>
        </div>

        <div class="child-learning-actions">
          <button class="primary-btn child-play-btn" data-action="play-sequence" ${isPlaying ? 'disabled' : ''}>
            ▶ ${state.playback.state === 'completed' ? 'PHÁT LẠI' : 'PHÁT'}
          </button>
          <button class="secondary-btn child-next-btn" data-action="next-word">TỪ TIẾP THEO ›</button>
        </div>
      </div>
    </section>
  `;
}

function renderChildArea() {
  if (state.childScreen === 'word-list') return renderWordList();
  if (state.childScreen === 'learning') return renderLearningScreen();
  return renderCategoryScreen();
}

function getLearnedWords() {
  return words.filter((word) => getProgress(word.id).latestStatus !== 'not_started');
}

function getReviewWords() {
  return words.filter((word) => getProgress(word.id).latestStatus === 'review_needed');
}

function resultLabel(status) {
  return {
    not_started: 'Chưa học',
    viewed: 'Nhìn',
    imitated: 'Bắt chước',
    review_needed: 'Cần ôn',
  }[status];
}

function statusTone(status) {
  return {
    not_started: 'neutral',
    viewed: 'positive',
    imitated: 'positive',
    review_needed: 'review',
  }[status];
}

function getFeaturedResultWords() {
  const activeWords = words.filter((word) => getProgress(word.id).latestStatus !== 'not_started');
  const reviewWords = words.filter((word) => getProgress(word.id).latestStatus === 'review_needed');
  const combined = [...reviewWords, ...activeWords, ...words];
  const unique = [];

  for (const word of combined) {
    if (!unique.some((item) => item.id === word.id)) unique.push(word);
    if (unique.length === 2) break;
  }

  return unique;
}

function renderParentHeader() {
  return `
    <header class="parent-header">
      <div class="parent-header-main">
        <span class="parent-brand-mark" aria-hidden="true">☘</span>
        <div>
          <p class="parent-kicker">PHỤ HUYNH</p>
          <p class="parent-child-name">Bé An</p>
        </div>
      </div>
      <button class="parent-header-action" type="button" aria-label="Thông báo">🔔</button>
    </header>
  `;
}

function renderDailyProgressCard(learnedCount, reviewCount) {
  const percent = Math.min(100, Math.round((learnedCount / Math.max(words.length, 1)) * 100));
  return `
    <section class="daily-progress-card" aria-label="Tiến độ hôm nay">
      <p class="progress-label">Tiến độ hôm nay</p>
      <div class="progress-main">
        <strong>${learnedCount} từ</strong>
        <span>·</span>
        <strong>${reviewCount} từ cần ôn</strong>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span style="width: ${Math.max(percent, learnedCount ? 12 : 5)}%"></span>
      </div>
      <p class="progress-note">Bé đang làm rất tốt! Chỉ còn một chút nữa là đạt mục tiêu ngày.</p>
    </section>
  `;
}

function renderSectionHeader(title, actionText = '') {
  const actionMarkup = actionText.startsWith('+')
    ? `<button class="section-action" type="button" data-action="pick-custom-video">${actionText}</button>`
    : `<span class="section-action" aria-hidden="true">${actionText}</span>`;
  return `
    <div class="section-header">
      <h2>${title}</h2>
      ${actionText ? actionMarkup : ''}
    </div>
  `;
}

function renderQuickResultCard(word, index) {
  const progress = getProgress(word.id);
  const status = progress.latestStatus;
  const timeText = index === 0 ? '10 phút trước' : 'Hôm qua';
  return `
    <article class="quick-result-card">
      <span class="result-icon result-icon-${statusTone(status)}" aria-hidden="true">${word.illustration}</span>
      <div class="result-content">
        <div class="result-title-row">
          <strong>${word.text}</strong>
          <span>${timeText}</span>
        </div>
        <div class="status-pills" aria-label="Trạng thái học">
          <span class="status-pill ${status === 'viewed' ? 'active' : ''}">Nhìn</span>
          <span class="status-pill ${status === 'imitated' ? 'active' : ''}">Bắt chước</span>
          <span class="status-pill ${status === 'review_needed' ? 'review' : ''}">${resultLabel(status)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderQuickMarkControls(selectedForMark) {
  return `
    <div class="quick-mark-controls">
      <label class="field-label">
        <span>Chọn từ</span>
        <select id="quick-mark-word">
          ${words
            .map(
              (word) =>
                `<option value="${word.id}" ${
                  word.id === selectedForMark ? 'selected' : ''
                }>${word.illustration} ${word.text} · ${statusLabel(
                  getProgress(word.id).latestStatus,
                )}</option>`,
            )
            .join('')}
        </select>
      </label>
      <label class="field-label">
        <span>Đánh giá</span>
        <select id="quick-mark-status">
          <option value="viewed">👀 Bé đã nhìn</option>
          <option value="imitated">🗣️ Bé bắt chước</option>
          <option value="review_needed">🔁 Cần ôn lại</option>
        </select>
      </label>
      <button class="primary-btn parent-save-btn" data-action="apply-quick-mark">Lưu đánh giá</button>
    </div>
  `;
}

function renderParentVideoCard(selectedCustomWord, selectedCustom) {
  return `
    <section class="parent-video-card">
      <div class="video-card-top">
        <div class="video-thumb" aria-hidden="true">
          <span>👤</span>
        </div>
        <div class="video-status">
          <strong>${selectedCustom?.fileName ? 'Đã dùng video bố/mẹ' : '3 từ đang dùng video bố/mẹ'}</strong>
          <p>${selectedCustom?.fileName || 'Video giúp bé làm quen với giọng nói thân thuộc hơn.'}</p>
        </div>
      </div>
      <div class="video-controls">
        <label class="field-label">
          <span>Chọn từ</span>
          <select id="custom-video-word">
            ${words
              .map(
                (word) =>
                  `<option value="${word.id}" ${
                    word.id === selectedCustomWord ? 'selected' : ''
                  }>${word.text}</option>`,
              )
              .join('')}
          </select>
        </label>
        <label class="file-picker parent-file-picker">
          <input class="file-input" id="custom-video-file" type="file" accept="video/*" />
          <span>📁 Chọn video</span>
        </label>
        <p class="file-name" id="custom-video-file-name">${
          selectedCustom?.fileName ? `Đang dùng: ${selectedCustom.fileName}` : 'Chưa chọn video mới'
        }</p>
        <div class="button-row parent-video-actions">
          <button class="secondary-btn" data-action="save-custom-video">Lưu video</button>
          <button class="danger-btn" data-action="delete-custom-video">Xóa video</button>
        </div>
      </div>
    </section>
  `;
}

function renderParentTipCard() {
  return `
    <section class="parent-tip-card">
      <span class="tip-icon" aria-hidden="true">💬</span>
      <div>
        <h3>Mẹo nhỏ cho bố mẹ</h3>
        <p>Cho bé nhìn miệng trước khi phát âm. Hãy kiên nhẫn để bé phản hồi trong 5-10 giây.</p>
      </div>
    </section>
  `;
}

function renderParentStatsGrid(learnedCount) {
  return `
    <section class="parent-stats-grid" aria-label="Thống kê nhanh">
      <div class="stat-card">
        <strong>${Math.max(1, learnedCount)}</strong>
        <span>Ngày liên tiếp</span>
      </div>
      <div class="stat-card">
        <strong>${learnedCount}</strong>
        <span>Từ đã học</span>
      </div>
    </section>
  `;
}

function renderParentMode() {
  const learnedWords = getLearnedWords();
  const reviewWords = getReviewWords();
  const selectedForMark = words.some((word) => word.id === state.selectedWordId)
    ? state.selectedWordId
    : words[0]?.id;
  const selectedCustomWord = state.selectedWordId;
  const selectedCustom = state.customVideos[selectedCustomWord];

  return `
    <section class="screen parent-dashboard">
      ${renderParentHeader()}
      ${state.activeNotice ? `<p class="notice parent-notice">${state.activeNotice}</p>` : ''}
      ${renderDailyProgressCard(learnedWords.length, reviewWords.length)}

      ${renderSectionHeader('Xem nhanh kết quả', 'Xem tất cả')}
      <div class="quick-result-list">
        ${getFeaturedResultWords()
          .map((word, index) => renderQuickResultCard(word, index))
          .join('')}
      </div>

      <section class="parent-card quick-mark-card">
        <h3>Đánh dấu nhanh</h3>
        <p>Chọn bất kỳ từ nào rồi lưu đánh giá của phụ huynh.</p>
        ${renderQuickMarkControls(selectedForMark)}
      </section>

      ${renderSectionHeader('Video bố mẹ quay', '+ Thêm mới')}
      ${renderParentVideoCard(selectedCustomWord, selectedCustom)}
      ${renderParentTipCard()}
      ${renderParentStatsGrid(learnedWords.length)}
    </section>
  `;
}

function renderSummaryRow(word) {
  const progress = getProgress(word.id);
  return `
    <div class="summary-row">
      <strong>${word.text}</strong>
      <span class="subtitle">${statusLabel(progress.latestStatus)}</span>
      <div class="mark-actions">
        <button class="${progress.latestStatus === 'viewed' ? 'selected' : ''}" data-action="mark-word" data-word-id="${word.id}" data-status="viewed">Nhìn</button>
        <button class="${progress.latestStatus === 'imitated' ? 'selected' : ''}" data-action="mark-word" data-word-id="${word.id}" data-status="imitated">Bắt chước</button>
        <button class="${progress.latestStatus === 'review_needed' ? 'selected' : ''}" data-action="mark-word" data-word-id="${word.id}" data-status="review_needed">Ôn</button>
      </div>
    </div>
  `;
}

function renderSettingsHeader() {
  return `
    <header class="settings-header">
      <div class="settings-title">
        <span class="settings-logo" aria-hidden="true">☘</span>
        <h1>CÀI ĐẶT</h1>
      </div>
      <button class="settings-help" type="button" aria-label="Trợ giúp">?</button>
    </header>
  `;
}

function renderRangeSetting({ label, key, min, max, step = 1, value, display }) {
  return `
    <label class="settings-range-row">
      <span>${label}</span>
      <strong>${display}</strong>
      <input
        data-setting="${key}"
        type="range"
        min="${min}"
        max="${max}"
        step="${step}"
        value="${value}"
        style="--range-fill: ${settingPercent(Number(value), Number(min), Number(max))}%"
      />
    </label>
  `;
}

function renderToggleSetting({ label, helper, key, checked, disabled = false }) {
  return `
    <label class="settings-toggle-row ${disabled ? 'is-muted' : ''}">
      <span>
        <strong>${label}</strong>
        ${helper ? `<small>${helper}</small>` : ''}
      </span>
      <input data-setting="${key}" type="checkbox" ${checked ? 'checked' : ''} ${
        disabled ? 'disabled' : ''
      } />
    </label>
  `;
}

function renderSettings() {
  return `
    <section class="screen settings-screen">
      ${renderSettingsHeader()}
      <section class="settings-section">
        <h2>ĐIỀU KHIỂN HỌC TẬP</h2>
        <div class="settings-card">
          ${renderRangeSetting({
            label: 'Số lần phát',
            key: 'repeatCount',
            min: 1,
            max: 5,
            value: state.config.repeatCount,
            display: state.config.repeatCount,
          })}
          ${renderRangeSetting({
            label: 'Tốc độ chậm',
            key: 'slowSpeed',
            min: 0.5,
            max: 0.75,
            step: 0.05,
            value: state.config.slowSpeed,
            display: `${state.config.slowSpeed}x`,
          })}
          ${renderRangeSetting({
            label: 'Nghỉ giữa lượt',
            key: 'pauseDurationMs',
            min: 800,
            max: 2500,
            step: 100,
            value: state.config.pauseDurationMs,
            display: formatSeconds(state.config.pauseDurationMs),
          })}
          ${renderToggleSetting({
            label: 'Tự chuyển từ',
            key: 'autoNextWord',
            checked: Boolean(state.config.autoNextWord),
          })}
        </div>
      </section>
      <section class="settings-section">
        <h2>CẢM GIÁC & TRẺ TRONG</h2>
        <div class="settings-card">
          ${renderToggleSetting({
            label: 'Chế độ ít kích thích',
            helper: 'Giảm hiệu ứng và âm thanh hệ thống',
            key: 'sensoryFriendlyMode',
            checked: state.config.sensoryFriendlyMode,
          })}
          ${renderToggleSetting({
            label: 'Âm thanh ứng dụng',
            key: 'uiSound',
            checked: Boolean(state.config.uiSound),
            disabled: true,
          })}
        </div>
      </section>
      <section class="settings-section">
        <h2>QUẢN LÝ DỮ LIỆU</h2>
        <div class="settings-card data-card">
          <div class="storage-row">
            <span class="storage-icon" aria-hidden="true">▤</span>
            <div>
              <strong>Dung lượng video</strong>
              <small>Đã dùng 1.2GB / 5.0GB</small>
              <span class="storage-bar"><i></i></span>
            </div>
            <button type="button">DỌN DẸP</button>
          </div>
          <button class="settings-link-row" type="button">Tải về video mới <span>›</span></button>
          <button class="settings-link-row" type="button">Cài đặt nhắc nhở <span>›</span></button>
        </div>
      </section>
      <button class="reset-data-btn" type="button">⟳ XÓA TẤT CẢ VÀ LÀM MỚI</button>
    </section>
  `;
}

function renderHiddenNav() {
  const navVisible =
    state.navVisible || state.activeArea !== 'child' || state.childScreen === 'category';
  return `
    <button class="hidden-nav-handle" data-action="show-nav" aria-label="Vuốt hoặc bấm để mở điều hướng"></button>
    <nav class="hidden-nav ${navVisible ? 'visible' : ''}" aria-label="Điều hướng ẩn">
      <button class="nav-tab ${state.activeArea === 'child' ? 'active' : ''}" data-action="open-child">
        📖 Học
      </button>
      <button class="nav-tab ${state.activeArea === 'parent' ? 'active' : ''}" data-hold-target="parent">
        👨‍👩‍👧 Phụ huynh<span class="hold-progress"></span>
      </button>
      <button class="nav-tab ${state.activeArea === 'settings' ? 'active' : ''}" data-hold-target="settings">
        ⚙️ Cài đặt<span class="hold-progress"></span>
      </button>
    </nav>
  `;
}

function render() {
  const content =
    state.activeArea === 'parent'
      ? renderParentMode()
      : state.activeArea === 'settings'
        ? renderSettings()
        : renderChildArea();
  app.className = `app-shell area-${state.activeArea} child-${state.childScreen}`;
  app.innerHTML = `${content}${renderHiddenNav()}`;
  wireEvents();
}

function nextWord() {
  const index = words.findIndex((word) => word.id === state.selectedWordId);
  const next = words[(index + 1) % words.length];
  openWord(next.id);
}

function wireEvents() {
  app.querySelectorAll('[data-action]').forEach((element) => {
    element.addEventListener('click', async () => {
      const action = element.dataset.action;
      if (action === 'show-nav') showNav();
      if (action === 'open-child') openChild(state.childScreen);
      if (action === 'open-category') openChild('category');
      if (action === 'open-word-list') {
        if (element.dataset.topicId) openTopicVocabulary(element.dataset.topicId);
        else openChild('word-list');
      }
      if (action === 'open-learning') openWord(element.dataset.wordId);
      if (action === 'play-sequence') startPlaybackSequence();
      if (action === 'next-word') nextWord();
      if (action === 'mark-word') markWord(element.dataset.wordId, element.dataset.status);
      if (action === 'apply-quick-mark') {
        const wordId = document.querySelector('#quick-mark-word')?.value;
        const status = document.querySelector('#quick-mark-status')?.value;
        if (wordId && status) markWord(wordId, status);
      }
      if (action === 'pick-custom-video') {
        document.querySelector('#custom-video-file')?.click();
      }
      if (action === 'save-custom-video') {
        const wordId = document.querySelector('#custom-video-word')?.value;
        const file = document.querySelector('#custom-video-file')?.files?.[0];
        await saveCustomVideo(wordId, file);
      }
      if (action === 'delete-custom-video') {
        const wordId = document.querySelector('#custom-video-word')?.value;
        if (confirm('Xóa video thay thế cho từ này? App sẽ dùng lại video mặc định.')) {
          await deleteCustomVideo(wordId);
        }
      }
    });
  });

  app.querySelectorAll('[data-hold-target]').forEach((button) => {
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      startHold(button.dataset.holdTarget, button, event);
    });
    button.addEventListener('pointerup', () => {
      if (!holdCompleted) cancelHold();
    });
    button.addEventListener('pointercancel', () => cancelHold());
  });

  app.querySelectorAll('[data-setting]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.dataset.setting;
      if (input.type === 'checkbox') {
        updateConfig(key, input.checked);
        return;
      }
      if (key === 'sensoryFriendlyMode') {
        updateConfig(key, input.value === 'true');
        return;
      }
      updateConfig(key, Number(input.value));
    });
  });

  const customFile = document.querySelector('#custom-video-file');
  customFile?.addEventListener('change', () => {
    const fileName = customFile.files?.[0]?.name || 'Chưa chọn video mới';
    const target = document.querySelector('#custom-video-file-name');
    if (target) target.textContent = fileName;
  });

  const customWordSelect = document.querySelector('#custom-video-word');
  customWordSelect?.addEventListener('change', () => {
    const target = document.querySelector('#custom-video-file-name');
    const custom = state.customVideos[customWordSelect.value];
    if (target) {
      target.textContent = custom?.fileName
        ? `Đang dùng: ${custom.fileName}`
        : 'Chưa chọn video mới';
    }
  });
}

window.addEventListener('pagehide', cleanupPlayback);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cleanupPlayback();
});

render();
