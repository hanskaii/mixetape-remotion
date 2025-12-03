import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { Canvas, Picture, Skia } from "@shopify/react-native-skia";
import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { AudioTrack } from "../../types/schema";
import { AudioVisualizerProps, CROSSFADE_DURATION_FRAMES } from "../constants";
import { getTrackSchedule } from "../utils/audio";

interface ComponentProps {
  audioTracks: AudioTrack[];
  trackDurations: number[];
  visualizer: AudioVisualizerProps["visualizer"];
}

export const AudioVisualizer: React.FC<ComponentProps> = ({ audioTracks, trackDurations, visualizer }) => {
  // Destructure config
  const { position, barWidth, gap, maxHeight, color, barsToDisplay } = visualizer;

  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Load audio data for all tracks
  // Note: audioTracks length must remain constant during render
  const audioDatas = audioTracks.map((track) => useAudioData(track.url));

  const schedule = useMemo(() => getTrackSchedule(trackDurations, CROSSFADE_DURATION_FRAMES), [trackDurations]);

  // Configuration
  const samplesToFetch = 4096;

  // Mix audio samples based on crossfades
  const mixedSamples = useMemo(() => {
    const mixed = new Float32Array(samplesToFetch).fill(0);

    for (let index = 0; index < schedule.length; index++) {
      const track = schedule[index];
      const { startFrame, endFrame, duration } = track;

      // Skip if track is not playing at current frame
      if (frame < startFrame || frame >= endFrame) continue;

      const audioData = audioDatas[index];
      if (!audioData) continue;

      const trackFrame = frame - startFrame;
      let volume = 1;

      // Calculate crossfade volume
      const isFirst = index === 0;
      const isLast = index === schedule.length - 1;

      if (!isFirst && trackFrame < CROSSFADE_DURATION_FRAMES) {
        // Fade in
        volume = trackFrame / CROSSFADE_DURATION_FRAMES;
      } else if (!isLast && trackFrame > duration - CROSSFADE_DURATION_FRAMES) {
        // Fade out
        volume = 1 - (trackFrame - (duration - CROSSFADE_DURATION_FRAMES)) / CROSSFADE_DURATION_FRAMES;
      }

      if (volume <= 0.01) continue;

      const samples = visualizeAudio({
        fps,
        frame: trackFrame,
        audioData,
        numberOfSamples: samplesToFetch,
      });

      for (let i = 0; i < samplesToFetch; i++) {
        mixed[i] += samples[i] * volume;
      }
    }

    return mixed;
  }, [frame, audioDatas, schedule, fps]);

  // Process samples into bars
  const smoothedBars = useMemo(() => {
    const bars = new Float32Array(barsToDisplay);
    const minBinIndex = 2;
    const maxBinIndex = 120; // Focus on bass/mids

    for (let i = 0; i < barsToDisplay; i++) {
      const t = i / barsToDisplay;
      // Logarithmic scaling for frequency mapping
      const logStart = t * t * t;
      const logEnd = ((i + 1) / barsToDisplay) ** 3;

      const startSampleIndex = Math.floor(minBinIndex + logStart * (maxBinIndex - minBinIndex));
      const endSampleIndex = Math.floor(minBinIndex + logEnd * (maxBinIndex - minBinIndex));

      let sum = 0;
      let count = 0;
      const actualEnd = Math.max(startSampleIndex, endSampleIndex);

      for (let j = startSampleIndex; j <= actualEnd && j < samplesToFetch; j++) {
        sum += mixedSamples[j];
        count++;
      }

      let value = count > 0 ? sum / count : 0;

      // Shaping
      value *= 1 + Math.sin((i / barsToDisplay) * Math.PI); // boost mids
      value *= 1 + t * 4; // boost highs slightly

      bars[i] = value;
    }

    // Smooth bars (3-point moving average)
    const result = new Float32Array(barsToDisplay);
    for (let i = 0; i < barsToDisplay; i++) {
      const prev = bars[i - 1] || bars[i];
      const curr = bars[i];
      const next = bars[i + 1] || bars[i];
      result[i] = (prev + curr + next) / 3;
    }

    return result;
  }, [mixedSamples, barsToDisplay]);

  // Layout calculation
  const totalBarWidth = barsToDisplay * barWidth + (barsToDisplay - 1) * gap;

  let startX = (width - totalBarWidth) / 2;
  if (position === "bottom-left") startX = 100;
  else if (position === "bottom-right") startX = width - totalBarWidth - 100;

  const bottomY = height - 80;

  // Drawing
  const skiaColor = useMemo(() => Skia.Color(color), [color]);

  const picture = useMemo(() => {
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setColor(skiaColor);

    smoothedBars.forEach((v, i) => {
      const h = Math.sqrt(v) * maxHeight;
      if (h <= 1) return;

      const finalHeight = Math.min(maxHeight, Math.max(0, h));
      const x = startX + i * (barWidth + gap);
      const y = bottomY - finalHeight;

      const rect = Skia.XYWHRect(x, y, barWidth, finalHeight);
      canvas.drawRRect(Skia.RRectXY(rect, 4, 4), paint);
    });

    return recorder.finishRecordingAsPicture();
  }, [smoothedBars, width, height, startX, bottomY, skiaColor, barWidth, gap, maxHeight]);

  return (
    <AbsoluteFill>
      <Canvas style={{ width, height }}>
        <Picture picture={picture} />
      </Canvas>
    </AbsoluteFill>
  );
};
