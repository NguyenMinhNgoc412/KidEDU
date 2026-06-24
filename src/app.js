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

const app = document.querySelector('#app');

let state = loadState();
let holdTimer = null;
let holdFrame = null;
let playbackAbort = null;
let activeObjectUrl = null;

function defaultState() {
  const progress = {};
  for (const word of words) {
    progress[word.id] = {
      childProfileId: CHILD_PROFILE_ID,
      wordId: word.id,
      viewCount: 0,
      practiceCount: 0,
      latestStatus: 'not_started',
      lastPracticedAt: null,
    };
  }

  return {
    activeArea: 'child',
    childScreen: 'category',
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
    config: { ...DEFAULT_PLAYBACK_CONFIG, sensoryFriendlyMode: true },
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
    return {
      ...defaultState(),
      ...saved,
      playback: defaultState().playback,
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
  const current = state.progress[wordId] || defaultState().progress[wordId];
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

function startHold(target, button) {
  cancelHold();
  const start = performance.now();
  const duration = 1000;
  button.style.setProperty('--hold-progress', '0');

  const tick = (now) => {
    const progress = Math.min(1, (now - start) / duration);
    button.style.setProperty('--hold-progress', String(progress));
    if (progress >= 1) {
      cancelHold(false);
      if (target === 'parent') openParent();
      if (target === 'settings') openSettings();
      return;
    }
    holdFrame = requestAnimationFrame(tick);
  };

  holdTimer = window.setTimeout(() => {}, duration);
  holdFrame = requestAnimationFrame(tick);
}

function cancelHold(reset = true) {
  if (holdTimer) window.clearTimeout(holdTimer);
  if (holdFrame) cancelAnimationFrame(holdFrame);
  holdTimer = null;
  holdFrame = null;
  if (reset) {
    document
      .querySelectorAll('.nav-tab')
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
    <section class="screen">
      ${renderTopbar('KidEDU')}
      <div class="hero-card">
        <p class="subtitle">Phase 0 · Child Mode</p>
        <button class="category-card" data-action="open-word-list">
          <span class="category-art">${category.icon}</span>
          <span>
            <strong>${category.name}</strong><br />
            <span class="subtitle">${category.description}</span>
          </span>
        </button>
      </div>
      <div class="panel">
        <h2>Gợi ý hôm nay</h2>
        <p class="subtitle">Chọn một từ, xem khẩu hình, nghe và phát lặp chậm.</p>
        <button class="primary-btn" data-action="open-learning" data-word-id="${words[0].id}">
          ▶️ Bắt đầu với “${words[0].text}”
        </button>
      </div>
    </section>
  `;
}

function renderWordList() {
  return `
    <section class="screen">
      ${renderTopbar(category.name, 'open-category')}
      <div class="grid">
        ${words
          .map((word) => {
            const progress = state.progress[word.id];
            return `
              <button class="word-card" data-action="open-learning" data-word-id="${word.id}">
                <span class="word-art">${word.illustration}</span>
                <strong>${word.text}</strong>
                <span class="status-badge">${statusLabel(progress.latestStatus)}</span>
              </button>
            `;
          })
          .join('')}
      </div>
    </section>
  `;
}

function renderLearningScreen() {
  const word = getWord();
  const progress = state.progress[word.id];
  const custom = state.customVideos[word.id];
  const hasCustom = Boolean(custom?.isActive);
  const isPlaying = state.playback.isPlaying;

  return `
    <section class="screen">
      ${renderTopbar(`“${word.text}”`, 'open-word-list')}
      <div class="learning-layout">
        <div class="video-stage ${hasCustom ? 'with-video' : ''}">
          <span class="playback-badge">${playbackBadge()}</span>
          <video id="learning-video" playsinline></video>
          <div class="video-fallback">
            <div class="mouth-demo ${isPlaying ? 'speaking' : ''}" aria-hidden="true"></div>
            <p class="video-note">
              ${
                hasCustom
                  ? 'Đang dùng video phụ huynh local khi phát.'
                  : 'Chưa có video khẩu hình thật trong repo. Hãy bổ sung file media thật hoặc thêm video phụ huynh ở Parent Mode.'
              }
            </p>
          </div>
        </div>

        <div class="learning-word">
          <span class="word-art">${word.illustration}</span>
          <span>
            <span class="word-text">${word.text}</span><br />
            <span class="subtitle">${word.mouthHint}</span>
          </span>
        </div>

        <div class="primary-actions">
          <button class="primary-btn" data-action="play-sequence" ${isPlaying ? 'disabled' : ''}>
            ${state.playback.state === 'completed' ? '↻ Replay' : '▶️ Play'}
          </button>
          <button class="secondary-btn" data-action="next-word">⏭️ Tiếp theo</button>
          <span class="status-badge">Trạng thái: ${statusLabel(progress.latestStatus)}</span>
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

function renderParentMode() {
  const learnedWords = words.filter(
    (word) => state.progress[word.id].latestStatus !== 'not_started',
  );
  const quickMarkWords = words;
  const selectedForMark = quickMarkWords.some((word) => word.id === state.selectedWordId)
    ? state.selectedWordId
    : quickMarkWords[0]?.id;
  const selectedCustomWord = state.selectedWordId;
  const selectedCustom = state.customVideos[selectedCustomWord];
  return `
    <section class="screen">
      ${renderTopbar('Phụ huynh')}
      ${state.activeNotice ? `<p class="notice">${state.activeNotice}</p>` : ''}
      <div class="panel">
        <h2>📌 Phiên hiện tại</h2>
        <p class="subtitle">${learnedWords.length} từ đã mở · ${
          words.filter((word) => state.progress[word.id].latestStatus === 'review_needed').length
        } từ cần ôn</p>
      </div>
      <div class="panel parent-card">
        <h3>✅ Đánh dấu nhanh</h3>
        <p class="subtitle">Chọn bất kỳ từ nào rồi lưu đánh giá của phụ huynh.</p>
        <div class="combo-grid">
          <label class="field-label">
            <span>Chọn từ</span>
            <select id="quick-mark-word" ${quickMarkWords.length ? '' : 'disabled'}>
              ${
                quickMarkWords.length
                  ? quickMarkWords
                      .map(
                        (word) =>
                          `<option value="${word.id}" ${
                            word.id === selectedForMark ? 'selected' : ''
                          }>${word.illustration} ${word.text} · ${statusLabel(
                            state.progress[word.id].latestStatus,
                          )}</option>`,
                      )
                      .join('')
                  : '<option>Chưa có từ đã học</option>'
              }
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
        </div>
        <button class="primary-btn" data-action="apply-quick-mark" ${
          quickMarkWords.length ? '' : 'disabled'
        }>💾 Lưu đánh giá</button>
      </div>
      <div class="panel parent-card">
        <h3>🎥 Video cá nhân hóa</h3>
        <p class="notice">
          Video sẽ được lưu trong ứng dụng để dùng offline. Xóa video trong thư viện điện thoại
          sẽ không làm mất video đã lưu trong app. Nếu gỡ app hoặc xóa dữ liệu app, video có thể bị mất.
        </p>
        <label class="field-label">
          <span>Chọn từ</span>
          <select id="custom-video-word">
            ${words
              .map(
                (word) =>
                  `<option value="${word.id}" ${
                    word.id === state.selectedWordId ? 'selected' : ''
                  }>${word.text}</option>`,
              )
              .join('')}
          </select>
        </label>
        <label class="file-picker">
          <input class="file-input" id="custom-video-file" type="file" accept="video/*" />
          <span>📁 Chọn video</span>
        </label>
        <p class="file-name" id="custom-video-file-name">${
          selectedCustom?.fileName ? `Đang dùng: ${selectedCustom.fileName}` : 'Chưa chọn video mới'
        }</p>
        <div class="button-row">
          <button class="secondary-btn" data-action="save-custom-video">💾 Lưu video</button>
          <button class="danger-btn" data-action="delete-custom-video">🗑️ Xóa video</button>
        </div>
      </div>
      <div class="panel">
        <h3>💡 Gợi ý</h3>
        <p class="subtitle">Cho bé nhìn miệng trước, chưa cần ép bé nói ngay.</p>
      </div>
    </section>
  `;
}

function renderSummaryRow(word) {
  const progress = state.progress[word.id];
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

function renderSettings() {
  return `
    <section class="screen">
      ${renderTopbar('Cài đặt')}
      <div class="panel">
        <h2>🎬 Bài học</h2>
        <label class="settings-row">
          <span>Số lần phát</span>
          <input data-setting="repeatCount" type="number" min="1" max="5" value="${state.config.repeatCount}" />
        </label>
        <label class="settings-row">
          <span>Tốc độ chậm</span>
          <select data-setting="slowSpeed">
            ${[0.5, 0.6, 0.75]
              .map(
                (speed) =>
                  `<option value="${speed}" ${
                    state.config.slowSpeed === speed ? 'selected' : ''
                  }>${speed}x</option>`,
              )
              .join('')}
          </select>
        </label>
        <label class="settings-row">
          <span>Nghỉ giữa lượt</span>
          <select data-setting="pauseDurationMs">
            ${[800, 1500, 2500]
              .map(
                (ms) =>
                  `<option value="${ms}" ${
                    state.config.pauseDurationMs === ms ? 'selected' : ''
                  }>${formatSeconds(ms)}</option>`,
              )
              .join('')}
          </select>
        </label>
      </div>
      <div class="panel">
        <h2>🌿 Ít kích thích</h2>
        <label class="settings-row">
          <span>Chế độ ít kích thích</span>
          <select data-setting="sensoryFriendlyMode">
            <option value="true" ${state.config.sensoryFriendlyMode ? 'selected' : ''}>Bật</option>
            <option value="false" ${!state.config.sensoryFriendlyMode ? 'selected' : ''}>Tắt</option>
          </select>
        </label>
        <p class="notice">Không nhạc nền, animation nhẹ, không popup che miệng avatar.</p>
      </div>
    </section>
  `;
}

function renderHiddenNav() {
  return `
    <button class="hidden-nav-handle" data-action="show-nav" aria-label="Vuốt hoặc bấm để mở điều hướng"></button>
    <nav class="hidden-nav ${state.navVisible ? 'visible' : ''}" aria-label="Điều hướng ẩn">
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
      if (action === 'open-word-list') openChild('word-list');
      if (action === 'open-learning') openWord(element.dataset.wordId);
      if (action === 'play-sequence') startPlaybackSequence();
      if (action === 'next-word') nextWord();
      if (action === 'mark-word') markWord(element.dataset.wordId, element.dataset.status);
      if (action === 'apply-quick-mark') {
        const wordId = document.querySelector('#quick-mark-word')?.value;
        const status = document.querySelector('#quick-mark-status')?.value;
        if (wordId && status) markWord(wordId, status);
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
    button.addEventListener('pointerdown', () => startHold(button.dataset.holdTarget, button));
    button.addEventListener('pointerup', () => cancelHold());
    button.addEventListener('pointerleave', () => cancelHold());
    button.addEventListener('pointercancel', () => cancelHold());
  });

  app.querySelectorAll('[data-setting]').forEach((input) => {
    input.addEventListener('change', () => {
      const key = input.dataset.setting;
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
