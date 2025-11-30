import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import type { Music } from "../constants";

export const getAudioDurationInSeconds = async (
  url: string,
): Promise<number> => {
  let input: Input | null = null;
  try {
    input = new Input({
      source: new UrlSource(url),
      formats: ALL_FORMATS,
    });

    // computeDuration mengembalikan number | undefined
    const duration = await input.computeDuration();
    return duration ?? 30; // Fallback 30 detik
  } catch (err) {
    console.error(`Failed to parse duration for ${url}`, err);
    return 30;
  } finally {
    if (input) {
      input.dispose();
    }
  }
};

export const calculateTotalDuration = async (
  musics: Music[],
  fps: number,
  crossfadeFrames: number,
) => {
  const durations = await Promise.all(
    musics.map((m) =>
      m.durationInSeconds
        ? Promise.resolve(m.durationInSeconds)
        : getAudioDurationInSeconds(m.url),
    ),
  );

  // Total frames = (Sum of all durations) - (Total overlap from crossfades)
  const totalRawSeconds = durations.reduce((a, b) => a + b, 0);
  const totalFramesRaw = Math.ceil(totalRawSeconds * fps);

  // Jika ada 2 lagu, ada 1 crossfade. Jika 3 lagu, 2 crossfade.
  const totalCrossfades = Math.max(0, musics.length - 1);
  const totalDeduction = totalCrossfades * crossfadeFrames;

  return {
    totalDurationInFrames: Math.max(30 * 5, totalFramesRaw - totalDeduction),
    trackDurationsInFrames: durations.map((d) => Math.ceil(d * fps)),
  };
};

export const getTrackSchedule = (
  trackDurations: number[],
  crossfadeFrames: number,
) => {
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
