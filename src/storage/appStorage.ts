import type { AppSettings, PersistedState } from '../types';

const STORAGE_KEY = 'kidedu.web.state.v1';

export const defaultSettings: AppSettings = {
  repeatCount: 3,
  slowPlaybackRate: 0.75,
  normalPlaybackRate: 1,
  preferParentVideo: true,
  dailySessionLimitMinutes: 10
};

export const defaultState: PersistedState = {
  settings: defaultSettings,
  learningEvents: [],
  parentVideos: []
};

export function loadPersistedState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      ...defaultState,
      ...parsed,
      settings: {
        ...defaultSettings,
        ...parsed.settings
      },
      learningEvents: parsed.learningEvents ?? [],
      parentVideos: parsed.parentVideos ?? []
    };
  } catch {
    return defaultState;
  }
}

export function savePersistedState(state: PersistedState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
