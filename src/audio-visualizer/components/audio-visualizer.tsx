import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { useEffect, useMemo, useRef } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import {
  CROSSFADE_DURATION_FRAMES,
  type Music,
  type VisualizerProps,
} from "../constants";
import { getTrackSchedule } from "../utils/audio";

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

  // 1. REF UNTUK CANVAS
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const audioDatas = musics.map((m) => useAudioData(m.url));

  // CONFIGURATION
  // Kita gunakan 2048 agar aman untuk JS calculation tiap frame.
  // 4096 bisa agak berat di calculation meski render canvasnya cepat.
  const samplesToFetch = 4096;

  const schedule = useMemo(
    () => getTrackSchedule(trackDurations, CROSSFADE_DURATION_FRAMES),
    [trackDurations],
  );

  const currentTitle = useMemo(() => {
    if (!useTitle) return null;

    for (let i = schedule.length - 1; i >= 0; i--) {
      const s = schedule[i];
      if (frame >= s.startFrame && frame < s.endFrame) {
        return musics[s.index]?.title;
      }
    }
    return null;
  }, [frame, schedule, musics, useTitle]);

  // --- AUDIO PROCESSING (Sama seperti sebelumnya) ---
  const mixedSamples = useMemo(() => {
    const mixed = new Array(samplesToFetch).fill(0);

    schedule.forEach((track, index) => {
      const { startFrame, endFrame, duration } = track;
      if (frame < startFrame || frame >= endFrame) return;

      const audioData = audioDatas[index];
      if (!audioData) return;

      const trackFrame = frame - startFrame;

      const samples = visualizeAudio({
        fps,
        frame: trackFrame,
        audioData,
        numberOfSamples: samplesToFetch,
      });

      const isFirst = index === 0;
      const isLast = index === schedule.length - 1;

      let volume = 1;
      if (!isFirst && trackFrame < CROSSFADE_DURATION_FRAMES) {
        volume = trackFrame / CROSSFADE_DURATION_FRAMES;
      } else if (!isLast && trackFrame > duration - CROSSFADE_DURATION_FRAMES) {
        volume =
          1 -
          (trackFrame - (duration - CROSSFADE_DURATION_FRAMES)) /
          CROSSFADE_DURATION_FRAMES;
      }

      for (let i = 0; i < samplesToFetch; i++) {
        mixed[i] += samples[i] * volume;
      }
    });
    return mixed;
  }, [frame, audioDatas, schedule, fps]);

  // --- LOGIC MAPPING (Monstercat Style Binning) ---
  const visualBars = useMemo(() => {
    const bars = [];
    const minBinIndex = 2; // ~20-40 Hz (Start Bass)
    const maxBinIndex = 240; // ~3000 Hz (End Mids/Vocal presence)

    for (let i = 0; i < barsToDisplay; i++) {
      const t = i / barsToDisplay;

      // Logarithmic Interpolation (Curve 2.5 untuk fokus Bass)
      const logStart = t ** 2.5;
      const logEnd = ((i + 1) / barsToDisplay) ** 2.5;

      const startSampleIndex = Math.floor(
        minBinIndex + logStart * (maxBinIndex - minBinIndex),
      );
      const endSampleIndex = Math.floor(
        minBinIndex + logEnd * (maxBinIndex - minBinIndex),
      );

      let sum = 0;
      let count = 0;
      const actualEnd = Math.max(startSampleIndex, endSampleIndex);

      for (
        let j = startSampleIndex;
        j <= actualEnd && j < samplesToFetch;
        j++
      ) {
        sum += mixedSamples[j];
        count++;
      }

      let value = count > 0 ? sum / count : 0;

      // Hamming Window Simulation (Smoothing sisi bar)
      const hammingWindow =
        0.54 - 0.46 * Math.cos(2 * Math.PI * (i / (barsToDisplay - 1)));
      value = value * (0.5 + 0.5 * hammingWindow);

      // Equalization (Angkat Highs)
      const eqCurve = 1 + t * 4;
      value *= eqCurve;

      bars.push(value);
    }
    return bars;
  }, [mixedSamples, barsToDisplay]);

  // Neighbor Smoothing 5-point
  const smoothedBars = useMemo(() => {
    return visualBars.map((val, i, arr) => {
      const prev = arr[i - 1] || val;
      const next = arr[i + 1] || val;
      const next2 = arr[i + 2] || val;
      const prev2 = arr[i - 2] || val;
      return (prev2 + prev + val + next + next2) / 5;
    });
  }, [visualBars]);

  // --- 🎨 CANVAS RENDERING EFFECT ---
  // Inilah kunci performa tinggi: Draw pixels, don't update DOM.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Clear Canvas (Wajib setiap frame)
    ctx.clearRect(0, 0, width, height);

    // 2. Setup Style

    // Hitung posisi X awal
    const totalWidth = barsToDisplay * barWidth + (barsToDisplay - 1) * gap;

    let startX = (width - totalWidth) / 2;
    if (position === "bottom-left") {
      startX = 100;
    } else if (position === "bottom-right") {
      startX = width - totalWidth - 100;
    }

    // Posisi Y bawah
    const bottomY = useTitle ? height - (fontSize + 120) : height - 80;

    ctx.fillStyle = barColor;

    // 3. Loop Drawing
    smoothedBars.forEach((v, i) => {
      // Posisi X
      const x = startX + i * (barWidth + gap);

      // Hitung Tinggi Bar
      // Math.pow(v, 0.7) -> Gamma correction agar nilai kecil tetap terlihat
      const barHeight = v ** 0.8 * maxBarHeight;

      // Clamp height (tidak boleh minus, tidak boleh lebih dari max)
      const finalHeight = Math.min(maxBarHeight, Math.max(0, barHeight));

      // Gambar Kotak (Rect)
      if (finalHeight > 0) {
        // ctx.fillRect(x, y, width, height)
        // Karena koordinat Y canvas dimulai dari atas, kita gambar dari:
        // (bottomY - finalHeight) sampai ke bawah
        ctx.fillRect(x, bottomY - finalHeight, barWidth, finalHeight);
      }
    });

    // 4. Draw Title
    if (useTitle && currentTitle) {
      ctx.font = `800 ${fontSize}px sans-serif`;
      ctx.fillStyle = color;

      let textX = startX + totalWidth / 2;
      if (position === "bottom-left") {
        ctx.textAlign = "left";
        textX = startX;
      } else if (position === "bottom-right") {
        ctx.textAlign = "right";
        textX = startX + totalWidth;
      } else {
        ctx.textAlign = "center";
        textX = startX + totalWidth / 2;
      }

      const textY = bottomY + fontSize + 20;
      ctx.fillText(currentTitle, textX, textY);
    }
  }, [
    smoothedBars,
    width,
    height,
    position,
    useTitle,
    currentTitle,
    fontSize,
    color,
    barWidth,
    gap,
    maxBarHeight,
    barColor,
    barsToDisplay,
  ]); // Re-run setiap data bar berubah

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Canvas Element
         Ini jauh lebih ringan daripada me-render 64 <div>
      */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </AbsoluteFill>
  );
};
