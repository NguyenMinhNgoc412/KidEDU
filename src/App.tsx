import { FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { categories, communicationCards, words } from './data/content';
import { buildWordProgress, getPracticeDayCount, getTotalPracticeMinutes } from './features/progress/progress';
import { resolveLessonMedia, type ResolvedLessonMedia } from './features/media/resolveMedia';
import { speakVi } from './features/speech/speech';
import { deleteParentVideoBlob, saveParentVideoBlob } from './storage/localDb';
import { loadPersistedState, savePersistedState } from './storage/appStorage';
import type {
  AppMode,
  AppSettings,
  AppView,
  Category,
  ChildProfile,
  CommunicationCard,
  LearningEvent,
  LearningEventType,
  MediaSource,
  ParentVideoMetadata,
  PersistedState,
  WordItem
} from './types';

function makeId(prefix: string) {
  if ('randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

function getWordsByCategory(categoryId: string) {
  return words
    .filter((word) => word.categoryId === categoryId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

function getFirstUnmasteredWord(progress: Record<string, ReturnType<typeof buildWordProgress>[string]>) {
  return words.find((word) => progress[word.id]?.status !== 'familiar') ?? words[0];
}

const categoryIcons: Record<string, string> = {
  family: '👨‍👩‍👧',
  food: '🥣',
  toys: '🧸',
  animals: '🐾',
  needs: '✨',
  greeting: '👋'
};

const wordIcons: Record<string, string> = {
  me: '💛',
  ba: '💙',
  ong: '🌟',
  an: '🍚',
  'uong-nuoc': '💧',
  sua: '🥛',
  bong: '⚽',
  xe: '🚗',
  cho: '🐶',
  meo: '🐱',
  giup: '🤝',
  nua: '➕',
  chao: '👋'
};

export default function App() {
  const [persisted, setPersisted] = useState<PersistedState>(() => loadPersistedState());
  const [mode, setMode] = useState<AppMode>('child');
  const [view, setView] = useState<AppView>(() => (persisted.childProfile ? 'child-home' : 'onboarding'));
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0].id);
  const [selectedWordId, setSelectedWordId] = useState(words[0].id);

  useEffect(() => {
    savePersistedState(persisted);
  }, [persisted]);

  const child = persisted.childProfile;
  const progress = useMemo(() => buildWordProgress(persisted.learningEvents), [persisted.learningEvents]);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? categories[0];
  const selectedWord = words.find((word) => word.id === selectedWordId) ?? words[0];

  function updatePersisted(next: Partial<PersistedState>) {
    setPersisted((current) => ({
      ...current,
      ...next
    }));
  }

  function recordEvent(event: {
    eventType: LearningEventType;
    wordId?: string;
    categoryId?: string;
    sessionId?: string;
    mediaSource?: MediaSource;
    parentMediaId?: string;
    result?: LearningEvent['result'];
    payload?: Record<string, unknown>;
  }) {
    if (!child) return;

    const learningEvent: LearningEvent = {
      id: makeId('event'),
      childId: child.id,
      timestamp: new Date().toISOString(),
      ...event
    };

    setPersisted((current) => ({
      ...current,
      learningEvents: [...current.learningEvents, learningEvent]
    }));
  }

  function openChildHome() {
    setMode('child');
    setView(child ? 'child-home' : 'onboarding');
  }

  function openParent(viewName: AppView = 'parent-dashboard') {
    setMode('parent');
    setView(viewName);
  }

  function startWord(word: WordItem) {
    setSelectedWordId(word.id);
    recordEvent({ eventType: 'word_viewed', wordId: word.id });
    setView('lesson');
  }

  function startTodayLesson() {
    const word = getFirstUnmasteredWord(progress);
    startWord(word);
  }

  if (!child || view === 'onboarding') {
    return (
      <AppFrame mode="parent">
        <OnboardingScreen
          onCreate={(profile) => {
            updatePersisted({ childProfile: profile });
            setMode('child');
            setView('child-home');
          }}
        />
      </AppFrame>
    );
  }

  return (
    <AppFrame mode={mode}>
      {mode === 'child' && (
        <>
          {view === 'child-home' && (
            <ChildHomeScreen
              child={child}
              onToday={startTodayLesson}
              onCategories={() => setView('categories')}
              onCommunication={() => setView('communication')}
              onParentAccess={() => openParent('parent-dashboard')}
            />
          )}

          {view === 'categories' && (
            <CategoryGridScreen
              onBack={openChildHome}
              onParentAccess={() => openParent('parent-dashboard')}
              onSelect={(category) => {
                setSelectedCategoryId(category.id);
                recordEvent({ eventType: 'category_selected', categoryId: category.id });
                setView('words');
              }}
            />
          )}

          {view === 'words' && (
            <WordGridScreen
              category={selectedCategory}
              progress={progress}
              parentVideos={persisted.parentVideos}
              onBack={() => setView('categories')}
              onParentAccess={() => openParent('parent-dashboard')}
              onSelect={startWord}
            />
          )}

          {view === 'lesson' && (
            <LessonScreen
              word={selectedWord}
              settings={persisted.settings}
              parentVideos={persisted.parentVideos}
              onBack={() => setView('words')}
              onEvent={recordEvent}
              onNext={startTodayLesson}
            />
          )}

          {view === 'communication' && (
            <CommunicationScreen
              onBack={openChildHome}
              onParentAccess={() => openParent('parent-dashboard')}
              onEvent={recordEvent}
            />
          )}
        </>
      )}

      {mode === 'parent' && (
        <>
          <ParentNav activeView={view} onNavigate={setView} onChildMode={openChildHome} />

          {view === 'parent-dashboard' && (
            <ParentDashboardScreen
              child={child}
              events={persisted.learningEvents}
              progress={progress}
              onOpenVideos={() => setView('parent-videos')}
            />
          )}

          {view === 'parent-profile' && (
            <ParentProfileScreen
              child={child}
              onSave={(profile) => updatePersisted({ childProfile: profile })}
            />
          )}

          {view === 'parent-videos' && (
            <ParentVideosScreen
              child={child}
              parentVideos={persisted.parentVideos}
              onChange={(parentVideos) => updatePersisted({ parentVideos })}
            />
          )}

          {view === 'parent-settings' && (
            <ParentSettingsScreen
              settings={persisted.settings}
              onSave={(settings) => updatePersisted({ settings })}
            />
          )}

          {view === 'report' && (
            <ReportScreen child={child} events={persisted.learningEvents} progress={progress} />
          )}
        </>
      )}
    </AppFrame>
  );
}

function AppFrame({ mode, children }: { mode: AppMode; children: ReactNode }) {
  return (
    <div className="page-shell">
      <div className={`app-shell app-shell--${mode}`}>{children}</div>
    </div>
  );
}

function TopBar({
  title,
  onBack,
  onParentAccess
}: {
  title: string;
  onBack?: () => void;
  onParentAccess?: () => void;
}) {
  return (
    <header className="top-bar">
      <div className="top-bar__left">
        {onBack && (
          <button className="icon-button" type="button" onClick={onBack} aria-label="Quay lại">
            ←
          </button>
        )}
        <h1>{title}</h1>
      </div>
      {onParentAccess && <ParentGate onUnlock={onParentAccess} />}
    </header>
  );
}

function OnboardingScreen({ onCreate }: { onCreate: (profile: ChildProfile) => void }) {
  const [nickname, setNickname] = useState('Bé Bông');
  const [birthYear, setBirthYear] = useState('2021');
  const [communicationLevel, setCommunicationLevel] = useState<ChildProfile['communicationLevel']>('single_words');
  const [primaryGoal, setPrimaryGoal] = useState<ChildProfile['primaryGoal']>('request_needs');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<ChildProfile['dailyGoalMinutes']>(10);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const now = new Date().toISOString();
    onCreate({
      id: makeId('child'),
      nickname: nickname.trim() || 'Bé',
      birthYear: Number(birthYear) || undefined,
      communicationLevel,
      primaryGoal,
      dailyGoalMinutes,
      createdAt: now,
      updatedAt: now
    });
  }

  return (
    <main className="screen parent-screen onboarding-screen">
      <div className="section-title">
        <p>KidEDU</p>
        <h1>Tạo hồ sơ đầu tiên</h1>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Tên gọi ở nhà
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={50} />
        </label>

        <label>
          Năm sinh
          <input inputMode="numeric" value={birthYear} onChange={(event) => setBirthYear(event.target.value)} />
        </label>

        <label>
          Mức giao tiếp
          <select
            value={communicationLevel}
            onChange={(event) => setCommunicationLevel(event.target.value as ChildProfile['communicationLevel'])}
          >
            <option value="no_words">Chưa có lời nói</option>
            <option value="single_words">Có từ đơn</option>
            <option value="two_word_phrases">Có cụm 2 từ</option>
            <option value="short_sentences">Có câu ngắn</option>
          </select>
        </label>

        <label>
          Mục tiêu ban đầu
          <select
            value={primaryGoal}
            onChange={(event) => setPrimaryGoal(event.target.value as ChildProfile['primaryGoal'])}
          >
            <option value="imitate_sounds">Bắt chước âm</option>
            <option value="first_words">Từ đầu tiên</option>
            <option value="request_needs">Nhu cầu cơ bản</option>
            <option value="daily_communication">Giao tiếp hằng ngày</option>
            <option value="social_greeting">Chào hỏi</option>
          </select>
        </label>

        <fieldset>
          <legend>Thời lượng mỗi ngày</legend>
          <div className="segmented">
            {[5, 10, 15].map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={dailyGoalMinutes === minutes ? 'is-active' : ''}
                onClick={() => setDailyGoalMinutes(minutes as ChildProfile['dailyGoalMinutes'])}
              >
                {minutes} phút
              </button>
            ))}
          </div>
        </fieldset>

        <button className="primary-button" type="submit">
          Bắt đầu
        </button>
      </form>
    </main>
  );
}

function ChildHomeScreen({
  child,
  onToday,
  onCategories,
  onCommunication,
  onParentAccess
}: {
  child: ChildProfile;
  onToday: () => void;
  onCategories: () => void;
  onCommunication: () => void;
  onParentAccess: () => void;
}) {
  return (
    <main className="screen child-home">
      <header className="child-home__header">
        <div>
          <p>Xin chào</p>
          <h1>{child.nickname}</h1>
        </div>
        <ParentGate onUnlock={onParentAccess} />
      </header>

      <div className="big-action-list">
        <BigChildButton title="Học hôm nay" tone="blue" onClick={onToday} />
        <BigChildButton title="Chọn chủ đề" tone="green" icon="🎈" onClick={onCategories} />
        <BigChildButton title="Con muốn" tone="yellow" icon="💬" onClick={onCommunication} />
      </div>
    </main>
  );
}

function BigChildButton({
  title,
  tone,
  icon = '⭐',
  onClick
}: {
  title: string;
  tone: 'blue' | 'green' | 'yellow';
  icon?: string;
  onClick: () => void;
}) {
  return (
    <button className={`big-child-button big-child-button--${tone}`} type="button" onClick={onClick}>
      <b aria-hidden="true">{icon}</b>
      <span>{title}</span>
    </button>
  );
}

function ParentGate({ onUnlock }: { onUnlock: () => void }) {
  return (
    <button className="parent-gate-button" type="button" onClick={onUnlock} aria-label="Khu vực phụ huynh">
      👨‍👩‍👧 Phụ huynh
    </button>
  );
}

function CategoryGridScreen({
  onBack,
  onParentAccess,
  onSelect
}: {
  onBack: () => void;
  onParentAccess: () => void;
  onSelect: (category: Category) => void;
}) {
  return (
    <main className="screen">
      <TopBar title="Chủ đề" onBack={onBack} onParentAccess={onParentAccess} />
      <div className="category-grid">
        {categories.map((category) => (
          <button
            key={category.id}
            className="category-tile"
            type="button"
            style={{ background: category.color, borderColor: category.accent }}
            onClick={() => onSelect(category)}
          >
            <b aria-hidden="true">{categoryIcons[category.slug] ?? '⭐'}</b>
            <span style={{ color: category.accent }}>{category.shortName}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

function WordGridScreen({
  category,
  progress,
  parentVideos,
  onBack,
  onParentAccess,
  onSelect
}: {
  category: Category;
  progress: Record<string, ReturnType<typeof buildWordProgress>[string]>;
  parentVideos: ParentVideoMetadata[];
  onBack: () => void;
  onParentAccess: () => void;
  onSelect: (word: WordItem) => void;
}) {
  return (
    <main className="screen">
      <TopBar title={category.nameVi} onBack={onBack} onParentAccess={onParentAccess} />
      <div className="word-grid">
        {getWordsByCategory(category.id).map((word) => (
          <button key={word.id} className="word-card" type="button" onClick={() => onSelect(word)}>
            <div className="word-card__image">
              <img src={word.imageUrl} alt={word.textVi} />
              <b aria-hidden="true">{wordIcons[word.slug] ?? '⭐'}</b>
            </div>
            <span>{word.textVi}</span>
            <div className="word-card__badges">
              {parentVideos.some((video) => video.wordId === word.id && video.syncStatus !== 'deleted') && (
                <small>Video nhà</small>
              )}
              {progress[word.id] && <small>{progress[word.id].status === 'needs_help' ? 'Luyện thêm' : 'Đã học'}</small>}
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

function LessonScreen({
  word,
  settings,
  parentVideos,
  onBack,
  onEvent,
  onNext
}: {
  word: WordItem;
  settings: AppSettings;
  parentVideos: ParentVideoMetadata[];
  onBack: () => void;
  onEvent: (event: {
    eventType: LearningEventType;
    wordId?: string;
    sessionId?: string;
    mediaSource?: MediaSource;
    parentMediaId?: string;
    result?: LearningEvent['result'];
    payload?: Record<string, unknown>;
  }) => void;
  onNext: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [media, setMedia] = useState<ResolvedLessonMedia>({ mediaSource: 'none' });
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatIndex, setRepeatIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | undefined;

    resolveLessonMedia(word, parentVideos, settings.preferParentVideo).then((resolved) => {
      if (!active) {
        resolved.cleanup?.();
        return;
      }
      cleanup = resolved.cleanup;
      setMedia(resolved);
    });

    return () => {
      active = false;
      cleanup?.();
    };
  }, [parentVideos, settings.preferParentVideo, word]);

  async function playVideoOnce(rate: number) {
    const video = videoRef.current;
    if (!video || !media.videoUrl) {
      await speakVi(word.textVi, rate);
      return;
    }

    try {
      video.pause();
      video.currentTime = 0;
      video.playbackRate = rate;
      await video.play();
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 7000);
        video.onended = () => {
          window.clearTimeout(timeout);
          resolve();
        };
      });
    } catch {
      await speakVi(word.textVi, rate);
    }
  }

  async function handlePlay() {
    if (isPlaying) return;
    const sessionId = makeId('session');
    const startedAt = Date.now();
    setDone(false);
    setIsPlaying(true);

    onEvent({
      eventType: 'session_started',
      sessionId,
      payload: { sessionType: 'word_practice' }
    });

    for (let index = 1; index <= settings.repeatCount; index += 1) {
      const rate = index === 1 ? settings.normalPlaybackRate : settings.slowPlaybackRate;
      setRepeatIndex(index);

      onEvent({
        eventType: media.mediaSource === 'local_parent_video' ? 'parent_video_played' : 'system_video_played',
        sessionId,
        wordId: word.id,
        mediaSource: media.mediaSource,
        parentMediaId: media.parentMediaId,
        payload: { repeatIndex: index, playbackRate: rate }
      });

      await playVideoOnce(rate);
      await speakVi(word.textVi, rate);

      onEvent({
        eventType: 'repeat_completed',
        sessionId,
        wordId: word.id,
        mediaSource: media.mediaSource,
        payload: { repeatIndex: index }
      });

      if (index < settings.repeatCount) {
        await new Promise((resolve) => window.setTimeout(resolve, 700));
      }
    }

    onEvent({ eventType: 'word_completed', sessionId, wordId: word.id, result: 'success' });
    onEvent({
      eventType: 'session_ended',
      sessionId,
      payload: { durationSeconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)) }
    });

    setIsPlaying(false);
    setRepeatIndex(0);
    setDone(true);
  }

  return (
    <main className="screen lesson-screen">
      <TopBar title={word.textVi} onBack={onBack} />

      <section className="lesson-media">
        <div className="lesson-media__icon" aria-hidden="true">
          {wordIcons[word.slug] ?? '⭐'}
        </div>
        {media.videoUrl ? (
          <video ref={videoRef} src={media.videoUrl} playsInline muted={false} poster={word.imageUrl} />
        ) : (
          <img src={word.imageUrl} alt={word.textVi} />
        )}
      </section>

      <section className="word-focus">
        <img src={word.imageUrl} alt={word.textVi} />
        <div>
          <h2>{word.textVi}</h2>
          <p>{word.phoneticHint}</p>
        </div>
      </section>

      {isPlaying && (
        <div className="lesson-status">
          Lần {repeatIndex}/{settings.repeatCount}
        </div>
      )}

      <button className="play-button" type="button" onClick={handlePlay} disabled={isPlaying}>
        {isPlaying ? 'Đang phát' : done ? 'Nghe lại' : 'Nghe'}
      </button>

      {done && (
        <div className="parent-mark-row">
          <button
            type="button"
            onClick={() => onEvent({ eventType: 'parent_marked_easy', wordId: word.id, result: 'success' })}
          >
            Tốt
          </button>
          <button
            type="button"
            onClick={() =>
              onEvent({ eventType: 'parent_marked_needs_help', wordId: word.id, result: 'partial' })
            }
          >
            Luyện thêm
          </button>
          <button type="button" onClick={onNext}>
            Tiếp theo
          </button>
        </div>
      )}
    </main>
  );
}

function CommunicationScreen({
  onBack,
  onParentAccess,
  onEvent
}: {
  onBack: () => void;
  onParentAccess: () => void;
  onEvent: (event: { eventType: LearningEventType; payload?: Record<string, unknown> }) => void;
}) {
  async function say(card: CommunicationCard) {
    onEvent({
      eventType: 'quick_comm_card_tapped',
      payload: { cardId: card.id, phraseVi: card.phraseVi, intentType: card.intentType }
    });
    await speakVi(card.phraseVi, 0.9);
  }

  return (
    <main className="screen">
      <TopBar title="Con muốn" onBack={onBack} onParentAccess={onParentAccess} />
      <div className="communication-grid">
        {communicationCards.map((card) => (
          <button key={card.id} className="communication-card" type="button" onClick={() => say(card)}>
            <img src={card.imageUrl} alt={card.textVi} />
            <span>{card.textVi}</span>
          </button>
        ))}
      </div>
    </main>
  );
}

function ParentNav({
  activeView,
  onNavigate,
  onChildMode
}: {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  onChildMode: () => void;
}) {
  const items: Array<{ label: string; view: AppView }> = [
    { label: 'Tổng quan', view: 'parent-dashboard' },
    { label: 'Hồ sơ', view: 'parent-profile' },
    { label: 'Video', view: 'parent-videos' },
    { label: 'Cài đặt', view: 'parent-settings' },
    { label: 'Báo cáo', view: 'report' }
  ];

  return (
    <header className="parent-nav">
      <div>
        <p>Parent Mode</p>
        <h1>KidEDU</h1>
      </div>
      <nav>
        {items.map((item) => (
          <button
            key={item.view}
            className={activeView === item.view ? 'is-active' : ''}
            type="button"
            onClick={() => onNavigate(item.view)}
          >
            {item.label}
          </button>
        ))}
        <button type="button" onClick={onChildMode}>
          Child Mode
        </button>
      </nav>
    </header>
  );
}

function ParentDashboardScreen({
  child,
  events,
  progress,
  onOpenVideos
}: {
  child: ChildProfile;
  events: LearningEvent[];
  progress: Record<string, ReturnType<typeof buildWordProgress>[string]>;
  onOpenVideos: () => void;
}) {
  const progressItems = Object.values(progress);
  const needsHelp = progressItems.filter((item) => item.status === 'needs_help');
  const practicedWords = progressItems.filter((item) => item.exposureCount > 0);
  const totalMinutes = getTotalPracticeMinutes(events);

  return (
    <main className="screen parent-screen">
      <div className="section-title">
        <p>{child.nickname}</p>
        <h2>Tổng quan học tập</h2>
      </div>

      <div className="dashboard-grid">
        <MetricCard label="Ngày học" value={getPracticeDayCount(events)} />
        <MetricCard label="Phút học" value={totalMinutes} />
        <MetricCard label="Từ đã luyện" value={practicedWords.length} />
        <MetricCard label="Cần luyện thêm" value={needsHelp.length} />
      </div>

      <button className="upload-cta-card" type="button" onClick={onOpenVideos}>
        <span aria-hidden="true">🎥</span>
        <div>
          <strong>Video phụ huynh</strong>
          <small>Tải video khẩu hình local-first cho từng từ</small>
        </div>
      </button>

      <section className="parent-section">
        <h3>Gợi ý hôm nay</h3>
        <ul className="plain-list">
          <li>Luyện 3-5 phút với các từ nhu cầu cơ bản.</li>
          <li>Ưu tiên video phụ huynh cho từ trẻ ít chú ý.</li>
          <li>Đưa dashboard này cho chuyên gia xem khi cần tư vấn.</li>
        </ul>
      </section>

      <section className="parent-section">
        <h3>Từ gần đây</h3>
        <div className="progress-list">
          {progressItems.length === 0 && <p>Chưa có phiên học nào.</p>}
          {progressItems.slice(0, 6).map((item) => {
            const word = words.find((entry) => entry.id === item.wordId);
            return (
              <div key={item.wordId} className="progress-row">
                <span>{word?.textVi ?? item.wordId}</span>
                <strong>{item.status === 'needs_help' ? 'Cần luyện thêm' : 'Đang luyện'}</strong>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ParentProfileScreen({
  child,
  onSave
}: {
  child: ChildProfile;
  onSave: (profile: ChildProfile) => void;
}) {
  const [nickname, setNickname] = useState(child.nickname);
  const [birthYear, setBirthYear] = useState(String(child.birthYear ?? ''));
  const [communicationLevel, setCommunicationLevel] = useState(child.communicationLevel);
  const [primaryGoal, setPrimaryGoal] = useState(child.primaryGoal);

  return (
    <main className="screen parent-screen">
      <div className="section-title">
        <p>Hồ sơ trẻ</p>
        <h2>{child.nickname}</h2>
      </div>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({
            ...child,
            nickname: nickname.trim() || child.nickname,
            birthYear: Number(birthYear) || undefined,
            communicationLevel,
            primaryGoal,
            updatedAt: new Date().toISOString()
          });
        }}
      >
        <label>
          Tên gọi ở nhà
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <label>
          Năm sinh
          <input value={birthYear} onChange={(event) => setBirthYear(event.target.value)} inputMode="numeric" />
        </label>
        <label>
          Mức giao tiếp
          <select
            value={communicationLevel}
            onChange={(event) => setCommunicationLevel(event.target.value as ChildProfile['communicationLevel'])}
          >
            <option value="no_words">Chưa có lời nói</option>
            <option value="single_words">Có từ đơn</option>
            <option value="two_word_phrases">Có cụm 2 từ</option>
            <option value="short_sentences">Có câu ngắn</option>
          </select>
        </label>
        <label>
          Mục tiêu
          <select value={primaryGoal} onChange={(event) => setPrimaryGoal(event.target.value as ChildProfile['primaryGoal'])}>
            <option value="imitate_sounds">Bắt chước âm</option>
            <option value="first_words">Từ đầu tiên</option>
            <option value="request_needs">Nhu cầu cơ bản</option>
            <option value="daily_communication">Giao tiếp hằng ngày</option>
            <option value="social_greeting">Chào hỏi</option>
          </select>
        </label>
        <button className="primary-button" type="submit">
          Lưu hồ sơ
        </button>
      </form>
    </main>
  );
}

function ParentVideosScreen({
  child,
  parentVideos,
  onChange
}: {
  child: ChildProfile;
  parentVideos: ParentVideoMetadata[];
  onChange: (videos: ParentVideoMetadata[]) => void;
}) {
  const [quickWordId, setQuickWordId] = useState(words[0].id);
  const [uploadStatus, setUploadStatus] = useState<
    { type: 'info' | 'success' | 'error'; message: string } | undefined
  >();

  async function handleFile(word: WordItem, file?: File) {
    if (!file) return;

    if (file.type && !file.type.startsWith('video/')) {
      setUploadStatus({ type: 'error', message: 'File đã chọn không phải video. Vui lòng chọn lại file video.' });
      return;
    }

    const existing = parentVideos.find((video) => video.childId === child.id && video.wordId === word.id);
    const mimeType = file.type || 'video/mp4';
    const now = new Date().toISOString();
    const mediaId = existing?.id ?? makeId('parent-media');

    try {
      setUploadStatus({ type: 'info', message: `Đang lưu video cho từ "${word.textVi}"...` });
      const videoBlob = file.slice(0, file.size, mimeType);
      await saveParentVideoBlob(mediaId, videoBlob);

      const metadata: ParentVideoMetadata = {
        id: mediaId,
        childId: child.id,
        wordId: word.id,
        clientLocalMediaId: mediaId,
        originalFilename: file.name || `${word.slug}.mp4`,
        mimeType,
        fileSize: file.size,
        syncStatus: 'local_only',
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      onChange([
        ...parentVideos.filter((video) => !(video.childId === child.id && video.wordId === word.id)),
        metadata
      ]);
      setUploadStatus({ type: 'success', message: `Đã lưu video cho từ "${word.textVi}" trên thiết bị này.` });
    } catch (error) {
      console.error('Cannot save parent video', error);
      const message =
        error instanceof DOMException && error.name === 'QuotaExceededError'
          ? 'Không lưu được video vì trình duyệt hoặc thiết bị đã hết dung lượng lưu trữ.'
          : 'Không lưu được video. Vui lòng thử video ngắn hơn hoặc kiểm tra quyền lưu trữ của trình duyệt.';
      setUploadStatus({ type: 'error', message });
    }
  }

  async function removeVideo(video: ParentVideoMetadata) {
    const ok = window.confirm('Xóa video local của từ này?');
    if (!ok) return;
    await deleteParentVideoBlob(video.id);
    onChange(parentVideos.filter((item) => item.id !== video.id));
  }

  return (
    <main className="screen parent-screen">
      <div className="section-title">
        <p>Local-first</p>
        <h2>Video phụ huynh</h2>
      </div>

      <section className="video-upload-hero">
        <div className="video-upload-hero__icon" aria-hidden="true">
          🎬
        </div>
        <div>
          <h3>Tải video khẩu hình</h3>
          <p>Video lưu trên thiết bị này trước, không tự động upload cloud.</p>
        </div>
        <select value={quickWordId} onChange={(event) => setQuickWordId(event.target.value)}>
          {words.map((word) => (
            <option key={word.id} value={word.id}>
              {word.textVi}
            </option>
          ))}
        </select>
        <label className="file-button file-button--large">
          Chọn video
          <input
            type="file"
            accept="video/*"
            onChange={(event) => {
              const word = words.find((item) => item.id === quickWordId);
              if (word) void handleFile(word, event.currentTarget.files?.[0]);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </section>

      {uploadStatus && (
        <p className={`upload-status upload-status--${uploadStatus.type}`} role="status">
          {uploadStatus.message}
        </p>
      )}

      <div className="video-list">
        {words.map((word) => {
          const video = parentVideos.find((item) => item.childId === child.id && item.wordId === word.id);
          return (
            <div key={word.id} className="video-row">
              <img src={word.imageUrl} alt={word.textVi} />
              <div>
                <strong>{word.textVi}</strong>
                <span>{video ? `Local only · ${formatDateTime(video.updatedAt)}` : 'Chưa có video'}</span>
              </div>
              <label className="file-button">
                {video ? 'Quay lại' : 'Chọn video'}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(event) => {
                    void handleFile(word, event.currentTarget.files?.[0]);
                    event.currentTarget.value = '';
                  }}
                />
              </label>
              {video && (
                <button className="secondary-button" type="button" onClick={() => removeVideo(video)}>
                  Xóa
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function ParentSettingsScreen({
  settings,
  onSave
}: {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}) {
  const [draft, setDraft] = useState(settings);

  return (
    <main className="screen parent-screen">
      <div className="section-title">
        <p>Cài đặt học</p>
        <h2>Bài học</h2>
      </div>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <label>
          Số lần lặp
          <input
            type="range"
            min="1"
            max="5"
            value={draft.repeatCount}
            onChange={(event) => setDraft({ ...draft, repeatCount: Number(event.target.value) as AppSettings['repeatCount'] })}
          />
          <strong>{draft.repeatCount}</strong>
        </label>

        <label>
          Tốc độ chậm
          <select
            value={draft.slowPlaybackRate}
            onChange={(event) =>
              setDraft({ ...draft, slowPlaybackRate: Number(event.target.value) as AppSettings['slowPlaybackRate'] })
            }
          >
            <option value="0.75">0.75x</option>
            <option value="0.5">0.5x</option>
          </select>
        </label>

        <label className="checkbox-row checkbox-row--stacked">
          <input
            type="checkbox"
            checked={draft.preferParentVideo}
            onChange={(event) => setDraft({ ...draft, preferParentVideo: event.target.checked })}
          />
          <span>
            <strong>Bật video phụ huynh</strong>
            <small>Nếu từ chưa có video phụ huynh, app vẫn tự phát video mẫu.</small>
          </span>
        </label>

        <label>
          Giới hạn phút/ngày
          <input
            type="number"
            min="1"
            max="60"
            value={draft.dailySessionLimitMinutes}
            onChange={(event) => setDraft({ ...draft, dailySessionLimitMinutes: Number(event.target.value) })}
          />
        </label>

        <button className="primary-button" type="submit">
          Lưu cài đặt
        </button>
      </form>
    </main>
  );
}

function ReportScreen({
  child,
  events,
  progress
}: {
  child: ChildProfile;
  events: LearningEvent[];
  progress: Record<string, ReturnType<typeof buildWordProgress>[string]>;
}) {
  const progressItems = Object.values(progress);
  const needsHelp = progressItems.filter((item) => item.status === 'needs_help');

  return (
    <main className="screen parent-screen report-screen">
      <div className="section-title">
        <p>Chế độ xem tư vấn</p>
        <h2>Báo cáo của {child.nickname}</h2>
      </div>
      <section className="report-band">
        <p>Ngày học: {getPracticeDayCount(events)}</p>
        <p>Thời lượng: {getTotalPracticeMinutes(events)} phút</p>
        <p>Từ đã luyện: {progressItems.length}</p>
        <p>Từ cần luyện thêm: {needsHelp.length}</p>
      </section>
      <section className="parent-section">
        <h3>Gợi ý</h3>
        <ul className="plain-list">
          <li>Duy trì phiên học ngắn, đều đặn mỗi ngày.</li>
          <li>Luyện lại nhóm từ nhu cầu cơ bản trong bữa ăn và giờ chơi.</li>
          <li>Ưu tiên dùng video khuôn mặt quen thuộc cho từ khó.</li>
        </ul>
      </section>
    </main>
  );
}
