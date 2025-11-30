import { AbsoluteFill } from "remotion";
import { AudioEngineResolved } from "./components/audio-engine";
import { AudioVisualizer } from "./components/audio-visualizer";
import { BackgroundLayer } from "./components/background-layer";
import type { VisualizerProps } from "./constants";

// Kita butuh prop tambahan 'trackDurations' yang dihitung di Root
type CompositionProps = VisualizerProps & { trackDurations: number[] };

export const MainComposition: React.FC<CompositionProps> = ({
  musics,
  backgroundUrl,
  seed,
  titleText,
  trackDurations,
  visualizer,
}) => {
  return (
    <AbsoluteFill>
      {/* 1. Audio Playback Engine */}
      <AudioEngineResolved musics={musics} trackDurations={trackDurations} />

      {/* 2. Visuals */}
      <BackgroundLayer url={backgroundUrl} seed={seed} />

      {/* 3. Text Overlay */}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
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
          {titleText}
        </h1>
      </AbsoluteFill>

      {/* 4. Visualizer Bars */}
      <AudioVisualizer
        musics={musics}
        trackDurations={trackDurations}
        visualizer={visualizer}
      />
    </AbsoluteFill>
  );
};
