import { getParentVideoBlob } from '../../storage/localDb';
import type { MediaSource, ParentVideoMetadata, WordItem } from '../../types';

export type ResolvedLessonMedia = {
  mediaSource: MediaSource;
  videoUrl?: string;
  parentMediaId?: string;
  cleanup?: () => void;
};

export async function resolveLessonMedia(
  word: WordItem,
  parentVideos: ParentVideoMetadata[],
  preferParentVideo: boolean
): Promise<ResolvedLessonMedia> {
  if (preferParentVideo) {
    const localMeta = parentVideos.find(
      (video) => video.wordId === word.id && video.syncStatus !== 'deleted'
    );

    if (localMeta) {
      try {
        const blob = await getParentVideoBlob(localMeta.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          return {
            mediaSource: 'local_parent_video',
            videoUrl: url,
            parentMediaId: localMeta.id,
            cleanup: () => URL.revokeObjectURL(url)
          };
        }
      } catch (error) {
        console.warn('Cannot read local parent video, using system video fallback', error);
      }
    }
  }

  if (word.systemVideoUrl) {
    return {
      mediaSource: 'system_default',
      videoUrl: word.systemVideoUrl
    };
  }

  return {
    mediaSource: 'none'
  };
}
