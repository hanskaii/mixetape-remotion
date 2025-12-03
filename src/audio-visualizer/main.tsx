import { AbsoluteFill } from "remotion";
import { useAudioTracks } from "../hooks/use-audio-tracks";
import { AudioEngineResolved } from "./components/audio-engine";
import { AudioVisualizer } from "./components/audio-visualizer";
import { BackgroundLayer } from "./components/background-layer";
import type { AudioVisualizerProps } from "./constants";

export type CompositionProps = AudioVisualizerProps & { trackDurations?: number[] };

export const MainComposition: React.FC<CompositionProps> = ({
  audioTracks,
  backgroundUrl,
  seed,
  title,
  trackDurations,
  visualizer,
}) => {
  const { isValid } = useAudioTracks({ audioTracks, trackDurations });

  if (!isValid) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: "white", fontFamily: "sans-serif" }}>No audio tracks provided.</div>
      </AbsoluteFill>
    );
  }

  const safeTrackDurations = trackDurations ?? [];

  return (
    <AbsoluteFill>
      {/* 1. Audio Playback Engine */}
      <AudioEngineResolved audioTracks={audioTracks} trackDurations={safeTrackDurations} />

      {/* 2. Visuals */}
      <BackgroundLayer url={backgroundUrl} seed={seed} />

      {/* 3. Text Overlay */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        {title && (
          <h1
            style={{
              fontFamily: "sans-serif",
              fontSize: 80,
              color: "white",
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
              textShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
          >
            {title}
          </h1>
        )}
      </AbsoluteFill>

      {/* 4. Visualizer Bars */}
      <AudioVisualizer audioTracks={audioTracks} trackDurations={safeTrackDurations} visualizer={visualizer} />
    </AbsoluteFill>
  );
};
