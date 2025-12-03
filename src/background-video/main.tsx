import { memo } from "react";
import { AbsoluteFill, Html5Audio, Img, Sequence } from "remotion";
import { KenBurns } from "../effects/ken-burns";
import { ZoomPulse } from "../effects/zoom-pulse";
import type { BackgroundVideoProps } from "./constants";
import { useAudioTracks } from "../hooks/use-audio-tracks";

const Background = memo<{
  backgroundUrl: string;
  withEffect: boolean;
  effect?: string;
}>(({ backgroundUrl, withEffect, effect }) => {
  if (!withEffect) {
    return (
      <Img
        src={backgroundUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    );
  }

  if (effect === "kenburn") {
    return <KenBurns imageUrl={backgroundUrl} />;
  }

  if (effect === "zoompulse") {
    return <ZoomPulse imageUrl={backgroundUrl} />;
  }

  return null;
});

Background.displayName = "Background";

type CompositionProps = BackgroundVideoProps & { trackDurations?: number[] };

export const BackgroundVideo: React.FC<CompositionProps> = ({
  audioTracks,
  backgroundUrl,
  withEffect,
  effect,
  trackDurations,
}) => {
  const { isValid, sequences } = useAudioTracks({ audioTracks, trackDurations });

  if (!isValid) {
    return (
      <AbsoluteFill style={{ backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <div style={{ color: "white", fontFamily: "sans-serif" }}>No audio tracks provided.</div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <AbsoluteFill>
        <Background backgroundUrl={backgroundUrl} withEffect={withEffect} effect={effect} />
      </AbsoluteFill>

      {sequences.map((seq) => (
        <Sequence key={`audio-${seq.index}`} from={seq.startFrame} durationInFrames={seq.durationInFrames}>
          <Html5Audio src={seq.track.url} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
