import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AudioTrack } from "../types/schema";

interface UseAudioTracksProps {
  audioTracks: AudioTrack[];
  trackDurations?: number[]; // In frames
}

export const useAudioTracks = ({ audioTracks, trackDurations }: UseAudioTracksProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Validate input
  const isValid = useMemo(() => {
    return audioTracks && audioTracks.length > 0;
  }, [audioTracks]);

  // Generate sequences based on injected durations or fallback
  const sequences = useMemo(() => {
    if (!isValid) return [];

    let startFrame = 0;
    return audioTracks.map((track, index) => {
      // Use injected duration or fallback to 30 seconds
      const durationInFrames = trackDurations?.[index] ?? 30 * fps;

      const sequence = {
        track,
        index,
        startFrame,
        durationInFrames,
        endFrame: startFrame + durationInFrames,
      };

      startFrame += durationInFrames;
      return sequence;
    });
  }, [audioTracks, trackDurations, isValid, fps]);

  // Calculate current track info
  const currentTrackData = useMemo(() => {
    if (sequences.length === 0) {
      return null;
    }

    const currentSequence =
      sequences.find((seq) => frame >= seq.startFrame && frame < seq.endFrame) || sequences[sequences.length - 1]; // Fallback to last track if out of bounds

    if (!currentSequence) return null;

    const localFrame = frame - currentSequence.startFrame;
    const progress = (localFrame / currentSequence.durationInFrames) * 100;

    return {
      track: currentSequence.track,
      index: currentSequence.index,
      startFrame: currentSequence.startFrame,
      durationInFrames: currentSequence.durationInFrames,
      progress: Math.min(100, Math.max(0, progress)),
    };
  }, [frame, sequences]);

  // Total duration
  const totalDurationInFrames = useMemo(() => {
    return sequences.reduce((acc, seq) => acc + seq.durationInFrames, 0);
  }, [sequences]);

  return {
    isValid,
    sequences,
    currentTrackData,
    totalDurationInFrames,
  };
};
