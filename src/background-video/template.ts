import { parseMedia } from "@remotion/media-parser";
import { CompositionConfig } from "../types/composition";
import { BackgroundVideoProps, BackgroundVideoSchema, defaultBackgroundVideoProps, PRESETS } from "./constants";
import { BackgroundVideo } from "./main";

type ActualProps = BackgroundVideoProps & { trackDurations?: number[] };

export const BackgroundVideoTemplate: CompositionConfig<ActualProps> = {
  id: "BackgroundVideo",
  component: BackgroundVideo,
  schema: BackgroundVideoSchema,
  defaultProps: defaultBackgroundVideoProps,
  width: PRESETS.dimensions.landscape.width,
  height: PRESETS.dimensions.landscape.height,
  fps: PRESETS.fps,
  calculateMetadata: async ({ props }) => {
    const fps = PRESETS.fps;

    const durationsInSeconds = await Promise.all(
      props.audioTracks.map(async (track) => {
        if (track.durationInSeconds) {
          return track.durationInSeconds;
        }

        try {
          const result = await parseMedia({
            acknowledgeRemotionLicense: true,
            src: track.url,
            fields: {
              durationInSeconds: true,
            },
          });
          return result.durationInSeconds ?? 30;
        } catch (error) {
          console.error(`Error parsing ${track.url}:`, error);
          return 30;
        }
      }),
    );

    const trackDurations = durationsInSeconds.map((d) => Math.round(d * fps));
    const totalDurationInFrames = trackDurations.reduce((a, b) => a + b, 0);

    return {
      durationInFrames: totalDurationInFrames,
      props: {
        ...props,
        trackDurations,
      },
    };
  },
};
