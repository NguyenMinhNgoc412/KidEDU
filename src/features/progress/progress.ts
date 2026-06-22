import type { LearningEvent, WordProgress } from '../../types';

const initialProgress = (wordId: string): WordProgress => ({
  wordId,
  exposureCount: 0,
  practiceCount: 0,
  successCount: 0,
  needsHelpCount: 0,
  systemVideoPlayCount: 0,
  parentVideoPlayCount: 0,
  status: 'not_started',
  masteryScore: 0
});

export function buildWordProgress(events: LearningEvent[]): Record<string, WordProgress> {
  const progress: Record<string, WordProgress> = {};

  for (const event of events) {
    if (!event.wordId) continue;
    const item = progress[event.wordId] ?? initialProgress(event.wordId);

    if (event.eventType === 'word_viewed') {
      item.exposureCount += 1;
    }

    if (event.eventType === 'system_video_played') {
      item.exposureCount += 1;
      item.systemVideoPlayCount += 1;
    }

    if (event.eventType === 'parent_video_played') {
      item.exposureCount += 1;
      item.parentVideoPlayCount += 1;
    }

    if (event.eventType === 'word_completed') {
      item.practiceCount += 1;
    }

    if (event.eventType === 'parent_marked_easy') {
      item.practiceCount += 1;
      item.successCount += 1;
    }

    if (event.eventType === 'parent_marked_needs_help') {
      item.practiceCount += 1;
      item.needsHelpCount += 1;
    }

    item.lastPracticedAt = event.timestamp;
    item.masteryScore = Math.max(
      0,
      Math.min(
        100,
        item.successCount * 2 +
          item.parentVideoPlayCount * 0.5 +
          item.systemVideoPlayCount * 0.25 -
          item.needsHelpCount
      )
    );

    if (item.needsHelpCount > 0 && item.successCount < item.needsHelpCount + 2) {
      item.status = 'needs_help';
    } else if (item.masteryScore > 10 && item.successCount >= 3) {
      item.status = 'familiar';
    } else if (item.practiceCount > 0) {
      item.status = 'practicing';
    } else if (item.exposureCount > 0) {
      item.status = 'seen';
    }

    progress[event.wordId] = item;
  }

  return progress;
}

export function getPracticeDayCount(events: LearningEvent[]) {
  return new Set(events.map((event) => new Date(event.timestamp).toDateString())).size;
}

export function getTotalPracticeMinutes(events: LearningEvent[]) {
  const completed = events.filter((event) => event.eventType === 'session_ended');
  const seconds = completed.reduce((sum, event) => {
    const duration = Number(event.payload?.durationSeconds ?? 0);
    return sum + duration;
  }, 0);
  return Math.round(seconds / 60);
}
