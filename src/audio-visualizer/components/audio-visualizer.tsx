import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import {
  Canvas,
  Picture, // Kita pake Picture biar bisa gambar manual tapi performa tinggi
  Skia,
  Text as SkiaText,
  useFont,
  vec,
  TileMode,
} from "@shopify/react-native-skia";
import { useMemo } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CROSSFADE_DURATION_FRAMES,
  type Music,
  type VisualizerProps,
} from "../constants";
import { getTrackSchedule } from "../utils/audio";

const FONT_SOURCE = staticFile("fonts/Inter-Bold.ttf");

interface AudioVisualizerProps {
  musics: Music[];
  trackDurations: number[];
  visualizer: VisualizerProps["visualizer"];
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  musics,
  trackDurations,
  visualizer,
}) => {
  const { position, useTitle, title, settings } = visualizer;
  const { fontSize, color } = title;
  const { barWidth, gap, maxBarHeight, barColor, barsToDisplay } = settings;
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const font = useFont(FONT_SOURCE, fontSize);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const audioDatas = musics.map((m) => useAudioData(m.url));

  // Sample rate standar (Optimized)
  const samplesToFetch = 4096;

  const schedule = useMemo(
    () => getTrackSchedule(trackDurations, CROSSFADE_DURATION_FRAMES),
    [trackDurations]
  );

  const currentTitle = useMemo(() => {
    if (!useTitle) return null;
    const currentTrack = schedule.find(s => frame >= s.startFrame && frame < s.endFrame);
    return currentTrack ? musics[currentTrack.index]?.title : null;
  }, [frame, schedule, musics, useTitle]);

  // --- AUDIO PROCESSING (Optimized Math) ---
  const mixedSamples = useMemo(() => {
    const mixed = new Float32Array(samplesToFetch).fill(0);
    for (let index = 0; index < schedule.length; index++) {
      const track = schedule[index];
      const { startFrame, endFrame, duration } = track;
      if (frame < startFrame || frame >= endFrame) continue;
      const audioData = audioDatas[index];
      if (!audioData) continue;
      const trackFrame = frame - startFrame;
      let volume = 1;
      const isFirst = index === 0;
      const isLast = index === schedule.length - 1;
      if (!isFirst && trackFrame < CROSSFADE_DURATION_FRAMES) {
        volume = trackFrame / CROSSFADE_DURATION_FRAMES;
      } else if (!isLast && trackFrame > duration - CROSSFADE_DURATION_FRAMES) {
        volume = 1 - (trackFrame - (duration - CROSSFADE_DURATION_FRAMES)) / CROSSFADE_DURATION_FRAMES;
      }
      if (volume <= 0.01) continue;
      const samples = visualizeAudio({
        fps, frame: trackFrame, audioData, numberOfSamples: samplesToFetch,
      });
      for (let i = 0; i < samplesToFetch; i++) {
        mixed[i] += samples[i] * volume;
      }
    }
    return mixed;
  }, [frame, audioDatas, schedule, fps]);

  const smoothedBars = useMemo(() => {
    const bars = new Float32Array(barsToDisplay);
    const minBinIndex = 2; const maxBinIndex = 120;
    for (let i = 0; i < barsToDisplay; i++) {
      const t = i / barsToDisplay;
      const logStart = t * t * t;
      const logEnd = ((i + 1) / barsToDisplay) ** 3;
      const startSampleIndex = Math.floor(minBinIndex + logStart * (maxBinIndex - minBinIndex));
      const endSampleIndex = Math.floor(minBinIndex + logEnd * (maxBinIndex - minBinIndex));
      let sum = 0; let count = 0;
      const actualEnd = Math.max(startSampleIndex, endSampleIndex);
      for (let j = startSampleIndex; j <= actualEnd && j < samplesToFetch; j++) {
        sum += mixedSamples[j]; count++;
      }
      let value = count > 0 ? sum / count : 0;
      value *= 1 + Math.sin((i / barsToDisplay) * Math.PI);
      value *= (1 + t * 4);
      bars[i] = value;
    }
    const result = new Float32Array(barsToDisplay);
    for(let i = 0; i < barsToDisplay; i++) {
        const prev = bars[i - 1] || bars[i];
        const curr = bars[i];
        const next = bars[i + 1] || bars[i];
        result[i] = (prev + curr + next) / 3;
    }
    return result;
  }, [mixedSamples, barsToDisplay]);

  // --- LAYOUT VARS ---
  const totalWidth = barsToDisplay * barWidth + (barsToDisplay - 1) * gap;
  let startX = (width - totalWidth) / 2;
  if (position === "bottom-left") startX = 100;
  else if (position === "bottom-right") startX = width - totalWidth - 100;
  const bottomY = useTitle ? height - (fontSize + 120) : height - 80;

  // Optimasi Warna
  const isGradient = Array.isArray(barColor);
  const skiaColors = useMemo(() => {
      if (Array.isArray(barColor)) return barColor.map(c => Skia.Color(c));
      return [Skia.Color(barColor as string)];
  }, [barColor]);

  // 🔥 STYLE FIX: PICTURE RECORDER (Imperative) 🔥
  // Kita gambar manual per batang supaya bisa set Gradient Per Batang (Local Gradient)
  const picture = useMemo(() => {
    const recorder = Skia.PictureRecorder();
    const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, width, height));
    const paint = Skia.Paint();
    paint.setAntiAlias(true);

    smoothedBars.forEach((v, i) => {
        const barHeight = Math.sqrt(v) * maxBarHeight;
        if (barHeight <= 1) return;

        const finalHeight = Math.min(maxBarHeight, Math.max(0, barHeight));
        const x = startX + i * (barWidth + gap);
        const y = bottomY - finalHeight;

        // --- INI KUNCINYA: LOCAL GRADIENT PER BATANG ---
        // Kita buat shader yang start/end-nya mengikuti tinggi masing-masing batang
        if (isGradient) {
            const shader = Skia.Shader.MakeLinearGradient(
                vec(x, y),                // Start: Atas Batang
                vec(x, y + finalHeight),  // End: Bawah Batang
                skiaColors,
                null,
                TileMode.Clamp
            );
            paint.setShader(shader);
        } else {
            paint.setColor(skiaColors[0]);
        }

        // Gambar
        const rect = Skia.XYWHRect(x, y, barWidth, finalHeight);
        canvas.drawRRect(Skia.RRectXY(rect, 5, 5), paint); // Radius 5px

        // Reset Shader untuk loop berikutnya
        if (isGradient) paint.setShader(null);
    });

    return recorder.finishRecordingAsPicture();
  }, [smoothedBars, width, height, startX, bottomY, skiaColors, isGradient, barWidth, gap, maxBarHeight]);


  // Text Logic
  let textX = 0;
  let textY = 0;
  if (useTitle && currentTitle && font) {
    const textWidth = font.getTextWidth(currentTitle);
    textY = bottomY + fontSize + 20;
    if (position === "bottom-left") textX = startX;
    else if (position === "bottom-right") textX = startX + totalWidth - textWidth;
    else textX = startX + totalWidth / 2 - textWidth / 2;
  }

  return (
    <AbsoluteFill style={{
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
    }}>
      <Canvas style={{ width, height }}>
        {/* Render Gambar Hasil Rekaman (Super Cepat & Style Sesuai HTML) */}
        <Picture picture={picture} />

        {useTitle && font && currentTitle && (
           <SkiaText
              x={textX}
              y={textY}
              text={currentTitle}
              font={font}
              color={color}
           />
        )}
      </Canvas>
    </AbsoluteFill>
  );
};
