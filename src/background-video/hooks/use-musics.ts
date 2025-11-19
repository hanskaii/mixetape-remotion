import { ALL_FORMATS, Input, UrlSource } from "mediabunny";
import { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender, useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { MusicSchema } from "../constants";

export const musicsSchema = z.object({
  musics: z.array(MusicSchema),
});

export const useMusics = (props: z.infer<typeof musicsSchema>) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [musicDurations, setMusicDurations] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load audio durations using mediabunny (Optimized)
  useEffect(() => {
    const handle = delayRender();

    const fetchDurations = async () => {
      try {
        const durations = await Promise.all(
          props.musics.map(async (music) => {
            let input;
            try {
              // Inisialisasi Input MediaBunny
              input = new Input({
                source: new UrlSource(music.url),
                formats: ALL_FORMATS, // Mendukung MP4, MP3, WAV, dll.
              });

              // computeDuration() mengembalikan durasi dalam detik
              const duration = await input.computeDuration();

              return duration ?? 30;
            } catch (error) {
              console.error(`Error parsing ${music.url}:`, error);
              return 30; // fallback jika gagal load
            } finally {
              // Selalu bersihkan resource
              if (input) {
                input.dispose();
              }
            }
          })
        );

        console.log('Audio durations loaded:', durations);
        setMusicDurations(durations);
        setIsLoading(false);
        continueRender(handle);
      } catch (error) {
        console.error("Error loading audio durations:", error);
        // Fallback global jika Promise.all gagal (seharusnya jarang terjadi karena try/catch internal)
        const fallbackDurations = props.musics.map(() => 30);
        setMusicDurations(fallbackDurations);
        setIsLoading(false);
        continueRender(handle);
      }
    };

    fetchDurations();

  }, [props.musics]);

  // Memoize validation
  const isValid = useMemo(() => {
    try {
      musicsSchema.parse(props);
      return true;
    } catch (error) {
      console.error("Invalid musics props:", error);
      return false;
    }
  }, [props]);

  // Memoize music sequences data
  const sequences = useMemo(() => {
    if (isLoading || musicDurations.length === 0) return [];

    let startFrame = 0;
    return props.musics.map((music, index) => {
      const durationInFrames = Math.round(musicDurations[index] * fps);
      const sequence = {
        music,
        index,
        startFrame,
        durationInFrames,
        endFrame: startFrame + durationInFrames,
      };
      startFrame += durationInFrames;
      return sequence;
    });
  }, [props.musics, fps, musicDurations, isLoading]);

  // Calculate current track efficiently
  const currentTrackData = useMemo(() => {
    if (sequences.length === 0) {
      return {
        song: props.musics[0],
        index: 0,
        startFrame: 0,
        progress: 0,
      };
    }

    const currentSequence =
      sequences.find(
        (seq) => frame >= seq.startFrame && frame < seq.endFrame,
      ) || sequences[sequences.length - 1];

    if (!currentSequence) {
      return {
        song: props.musics[0],
        index: 0,
        startFrame: 0,
        progress: 0,
      };
    }

    const localFrame = frame - currentSequence.startFrame;
    const progress = (localFrame / currentSequence.durationInFrames) * 100;

    return {
      song: currentSequence.music,
      index: currentSequence.index,
      startFrame: currentSequence.startFrame,
      progress: Math.min(100, Math.max(0, progress)),
    };
  }, [frame, sequences, props.musics]);

  // Total frames
  const totalFrames = useMemo(() => {
    return sequences.reduce((acc, seq) => acc + seq.durationInFrames, 0);
  }, [sequences]);

  return {
    isValid,
    sequences,
    currentTrackData,
    totalFrames,
    currentFrame: frame,
    fps,
    isLoading,
  };
};
