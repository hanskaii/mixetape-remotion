import { parseMedia } from "@remotion/media-parser";
import { Composition } from "remotion";
import {
  BackgroundVideoSchema,
  defaultBackgroundVideoProps,
  PRESETS,
} from "./background-video/constants";
import { BackgroundVideo } from "./background-video/main";

export const Root: React.FC = () => {
  return (
    <Composition
      id="BackgroundVideo"
      component={BackgroundVideo}
      fps={PRESETS.fps}
      width={PRESETS.dimensions.landscape.width}
      height={PRESETS.dimensions.landscape.height}
      schema={BackgroundVideoSchema}
      defaultProps={{ ...defaultBackgroundVideoProps }}
      calculateMetadata={async ({ props }) => {
        const durations = await Promise.all(
          props.musics.map(async (music) => {
            try {
              const result = await parseMedia({
                acknowledgeRemotionLicense: true,
                src: music.url,
                fields: {
                  durationInSeconds: true,
                },
              });
              return result.durationInSeconds ?? 30;
            } catch (error) {
              console.error(`Error parsing ${music.url}:`, error);
              return 30;
            }
          })
        );
        const totalDurationInSeconds = durations.reduce((a, b) => a + b, 0);
        const durationInFrames = Math.round(totalDurationInSeconds * PRESETS.fps);
        return {
          durationInFrames,
          fps: PRESETS.fps,
        };
      }}
    />
  );
};
