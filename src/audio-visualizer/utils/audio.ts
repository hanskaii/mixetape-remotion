import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import type { AudioTrack } from "../../types/schema";

export const getAudioDurationInSeconds = async (url: string): Promise<number> => {
  let input: Input | null = null;
  try {
    input = new Input({
      source: new UrlSource(url),
      formats: ALL_FORMATS,
    });

    // computeDuration mengembalikan number | undefined
    const duration = await input.computeDuration();
    return duration ?? 30; // Fallback 30 seconds
  } catch (err) {
    console.error(`Failed to parse duration for ${url}`, err);
    return 30;
  } finally {
    if (input) {
      input.dispose();
    }
  }
};

export const calculateTotalDuration = async (audioTracks: AudioTrack[], fps: number, crossfadeFrames: number) => {
  const durations = await Promise.all(
    audioTracks.map((track) =>
      track.durationInSeconds ? Promise.resolve(track.durationInSeconds) : getAudioDurationInSeconds(track.url),
    ),
  );

  // Total frames = (Sum of all durations) - (Total overlap from crossfades)
  const totalRawSeconds = durations.reduce((a, b) => a + b, 0);
  const totalFramesRaw = Math.ceil(totalRawSeconds * fps);

  // If there are 2 songs, 1 crossfade. If 3 songs, 2 crossfades.
  const totalCrossfades = Math.max(0, audioTracks.length - 1);
  const totalDeduction = totalCrossfades * crossfadeFrames;

  return {
    totalDurationInFrames: Math.max(30 * 5, totalFramesRaw - totalDeduction),
    trackDurationsInFrames: durations.map((d) => Math.ceil(d * fps)),
  };
};

export const getTrackSchedule = (trackDurations: number[], crossfadeFrames: number) => {
  let currentStart = 0;
  return trackDurations.map((duration, index) => {
    const startFrame = currentStart;
    // Overlap tracks by subtracting crossfade duration from the next start time
    currentStart += duration - crossfadeFrames;
    return {
      index,
      startFrame,
      endFrame: startFrame + duration,
      duration,
    };
  });
};
