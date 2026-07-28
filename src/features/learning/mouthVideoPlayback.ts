export interface MouthVideoPlaybackPlayer {
  audioMixingMode: string;
  currentTime: number;
  duration: number;
  loop: boolean;
  muted: boolean;
  play(): void;
  playing: boolean;
  replay(): void;
  staysActiveInBackground: boolean;
  timeUpdateEventInterval: number;
  volume: number;
}

export const learningAudioPlayerOptions = {
  keepAudioSessionActive: true,
  updateInterval: 500
} as const;

export const learningVideoProgressUpdateIntervalSeconds = 0.5;
const playbackEndToleranceSeconds = 0.05;

export class MouthVideoPlaybackAttempts {
  private attempted = 0;
  private next = 0;
  private pending = 0;
  private settled = 0;
  private started = 0;

  begin(): number {
    this.cancel();
    this.next += 1;
    this.pending = this.next;
    this.started = 0;
    return this.pending;
  }

  tryStart(): number | null {
    if (this.pending <= 0 || this.pending <= this.attempted || this.settled === this.pending) {
      return null;
    }

    this.attempted = this.pending;
    return this.pending;
  }

  markStarted(): number | null {
    if (!this.isActive()) {
      return null;
    }

    this.started = this.pending;
    return this.pending;
  }

  claimEnd(): number | null {
    if (this.started !== this.pending) {
      return null;
    }

    return this.claimTerminal();
  }

  claimError(): number | null {
    return this.claimTerminal();
  }

  cancel(): void {
    if (this.pending > 0) {
      this.settled = this.pending;
    }
  }

  isActive(attempt = this.pending): boolean {
    return attempt > 0 && this.pending === attempt && this.settled !== attempt;
  }

  resetSource(): void {
    this.pending = 0;
    this.attempted = 0;
    this.started = 0;
    this.settled = 0;
  }

  private claimTerminal(): number | null {
    if (!this.isActive()) {
      return null;
    }

    this.settled = this.pending;
    return this.pending;
  }
}

export function configureMouthVideoPlayer(player: MouthVideoPlaybackPlayer): void {
  player.loop = false;
  player.staysActiveInBackground = false;
  player.audioMixingMode = "doNotMix";
  player.muted = false;
  player.timeUpdateEventInterval = learningVideoProgressUpdateIntervalSeconds;
  player.volume = 1;
}

export function hasMouthVideoReachedEnd(
  player: Pick<MouthVideoPlaybackPlayer, "currentTime" | "duration" | "playing">
): boolean {
  if (!Number.isFinite(player.duration) || player.duration <= 0) {
    return !player.playing;
  }

  return player.currentTime >= Math.max(0, player.duration - playbackEndToleranceSeconds);
}

export function replayMouthVideoFromStart(player: MouthVideoPlaybackPlayer): void {
  try {
    player.currentTime = 0;
    player.play();
    return;
  } catch {
    try {
      player.replay();
    } catch {
      // The video shared object may already be released on native teardown.
    }
  }
}
