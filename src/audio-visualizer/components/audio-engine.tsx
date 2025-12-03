import type React from "react";
import { useMemo } from "react";
import { Html5Audio, interpolate, Sequence } from "remotion";
import { AudioTrack } from "../../types/schema";
import { CROSSFADE_DURATION_FRAMES } from "../constants";

interface AudioEngineProps {
  audioTracks: AudioTrack[];
  trackDurations: number[]; // Duration per track in frames
}

export const AudioEngineResolved: React.FC<AudioEngineProps> = ({ audioTracks, trackDurations }) => {
  const tracks = useMemo(() => {
    let currentStart = 0;
    return audioTracks.map((track, index) => {
      const duration = trackDurations[index];
      const startFrame = currentStart;
      // Overlap tracks by subtracting crossfade duration from the next start time
      currentStart += duration - CROSSFADE_DURATION_FRAMES;
      return { track, startFrame, duration, index };
    });
  }, [audioTracks, trackDurations]);

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
            layout="none" // Important so it doesn't affect visual layout
          >
            <Html5Audio
              src={t.track.url}
              volume={(f) => {
                // f is the frame relative to the start of this Sequence

                // Fade In (except for the first song)
                const fadeIn = isFirst
                  ? 1
                  : interpolate(f, [0, CROSSFADE_DURATION_FRAMES], [0, 1], {
                      extrapolateRight: "clamp",
                    });

                // Fade Out (except for the last song)
                const fadeOut = isLast
                  ? 1
                  : interpolate(f, [t.duration - CROSSFADE_DURATION_FRAMES, t.duration], [1, 0], {
                      extrapolateLeft: "clamp",
                    });

                return fadeIn * fadeOut;
              }}
            />
          </Sequence>
        );
      })}
    </>
  );
};
