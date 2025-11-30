import type React from "react";
import { useMemo } from "react";
import { Html5Audio, interpolate, Sequence } from "remotion";
import { CROSSFADE_DURATION_FRAMES, type Music } from "../constants";

interface AudioEngineProps {
  musics: Music[];
  trackDurations: number[]; // Durasi per track dalam frames
}

export const AudioEngineResolved: React.FC<AudioEngineProps> = ({
  musics,
  trackDurations,
}) => {
  const tracks = useMemo(() => {
    let currentStart = 0;
    return musics.map((music, index) => {
      const duration = trackDurations[index];
      const startFrame = currentStart;
      // Overlap tracks by subtracting crossfade duration from the next start time
      currentStart += duration - CROSSFADE_DURATION_FRAMES;
      return { music, startFrame, duration, index };
    });
  }, [musics, trackDurations]);

  return (
    <>
      {tracks.map((t, i) => {
        const isFirst = i === 0;
        const isLast = i === tracks.length - 1;

        return (
          <Sequence
            key={i}
            from={t.startFrame}
            durationInFrames={t.duration}
            layout="none" // Penting agar tidak mempengaruhi layout visual
          >
            <Html5Audio
              src={t.music.url}
              volume={(f) => {
                // f adalah frame relatif terhadap awal Sequence ini

                // Fade In (kecuali lagu pertama)
                const fadeIn = isFirst
                  ? 1
                  : interpolate(f, [0, CROSSFADE_DURATION_FRAMES], [0, 1], {
                    extrapolateRight: "clamp",
                  });

                // Fade Out (kecuali lagu terakhir)
                const fadeOut = isLast
                  ? 1
                  : interpolate(
                    f,
                    [t.duration - CROSSFADE_DURATION_FRAMES, t.duration],
                    [1, 0],
                    { extrapolateLeft: "clamp" },
                  );

                return fadeIn * fadeOut;
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};
