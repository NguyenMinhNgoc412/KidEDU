export type AppMode = 'child' | 'parent';

export type AppView =
  | 'onboarding'
  | 'child-home'
  | 'categories'
  | 'words'
  | 'lesson'
  | 'communication'
  | 'parent-dashboard'
  | 'parent-profile'
  | 'parent-videos'
  | 'parent-settings'
  | 'report';

export type CommunicationLevel =
  | 'no_words'
  | 'single_words'
  | 'two_word_phrases'
  | 'short_sentences';

export type LearningGoal =
  | 'imitate_sounds'
  | 'first_words'
  | 'request_needs'
  | 'daily_communication'
  | 'social_greeting';

export type ChildProfile = {
  id: string;
  nickname: string;
  birthYear?: number;
  communicationLevel: CommunicationLevel;
  primaryGoal: LearningGoal;
  dailyGoalMinutes: 5 | 10 | 15;
  createdAt: string;
  updatedAt: string;
};

export type AppSettings = {
  repeatCount: 1 | 2 | 3 | 4 | 5;
  slowPlaybackRate: 0.5 | 0.75;
  normalPlaybackRate: 1;
  preferParentVideo: boolean;
  dailySessionLimitMinutes: number;
};

export type Category = {
  id: string;
  slug: string;
  nameVi: string;
  shortName: string;
  color: string;
  accent: string;
  sortOrder: number;
};

export type WordItem = {
  id: string;
  categoryId: string;
  slug: string;
  textVi: string;
  phraseVi?: string;
  phoneticHint: string;
  wordType: 'sound' | 'single_word' | 'phrase_2_words' | 'short_sentence' | 'pecs_card';
  goalType:
    | 'imitate_sound'
    | 'first_word'
    | 'request_need'
    | 'label_object'
    | 'social_greeting'
    | 'emotion_expression';
  difficultyLevel: 1 | 2 | 3;
  imageUrl: string;
  systemVideoUrl?: string;
  sortOrder: number;
};

export type CommunicationCard = {
  id: string;
  textVi: string;
  phraseVi: string;
  imageUrl: string;
  intentType:
    | 'request_food'
    | 'request_drink'
    | 'request_help'
    | 'request_toilet'
    | 'request_break'
    | 'social_greeting';
};

export type MediaSource =
  | 'system_default'
  | 'cached_system_video'
  | 'local_parent_video'
  | 'cloud_parent_video'
  | 'none';

export type LearningEventType =
  | 'session_started'
  | 'session_ended'
  | 'category_selected'
  | 'word_viewed'
  | 'word_completed'
  | 'word_skipped'
  | 'system_video_played'
  | 'parent_video_played'
  | 'repeat_completed'
  | 'parent_marked_easy'
  | 'parent_marked_needs_help'
  | 'quick_comm_card_tapped';

export type LearningEvent = {
  id: string;
  childId: string;
  sessionId?: string;
  eventType: LearningEventType;
  wordId?: string;
  categoryId?: string;
  mediaSource?: MediaSource;
  parentMediaId?: string;
  result?: 'success' | 'failed' | 'partial' | 'skipped' | 'unknown';
  timestamp: string;
  payload?: Record<string, unknown>;
};

export type ParentVideoMetadata = {
  id: string;
  childId: string;
  wordId: string;
  clientLocalMediaId: string;
  originalFilename: string;
  mimeType: string;
  fileSize: number;
  durationSeconds?: number;
  syncStatus: 'local_only' | 'pending_cloud_backup' | 'uploading' | 'synced' | 'failed' | 'deleted';
  createdAt: string;
  updatedAt: string;
};

export type PersistedState = {
  childProfile?: ChildProfile;
  settings: AppSettings;
  learningEvents: LearningEvent[];
  parentVideos: ParentVideoMetadata[];
};

export type WordProgress = {
  wordId: string;
  exposureCount: number;
  practiceCount: number;
  successCount: number;
  needsHelpCount: number;
  systemVideoPlayCount: number;
  parentVideoPlayCount: number;
  lastPracticedAt?: string;
  status: 'not_started' | 'seen' | 'practicing' | 'familiar' | 'needs_help' | 'mastered';
  masteryScore: number;
};
