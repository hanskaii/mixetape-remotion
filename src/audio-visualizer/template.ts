import { CompositionConfig } from "../types/composition";
import { AudioVisualizerSchema, CROSSFADE_DURATION_FRAMES, defaultAudioVisualizerProps } from "./constants";
import { CompositionProps, MainComposition } from "./main";
import { calculateTotalDuration } from "./utils/audio";

export const AudioVisualizerTemplate: CompositionConfig<CompositionProps> = {
  id: "MusicVisualizer",
  component: MainComposition,
  schema: AudioVisualizerSchema,
  defaultProps: defaultAudioVisualizerProps,
  width: 1920,
  height: 1080,
  fps: 30,
  calculateMetadata: async ({ props }) => {
    const fps = 30;
    const { totalDurationInFrames, trackDurationsInFrames } = await calculateTotalDuration(
      props.audioTracks,
      fps,
      CROSSFADE_DURATION_FRAMES,
    );

    return {
      durationInFrames: totalDurationInFrames,
      props: {
        ...props,
        trackDurations: trackDurationsInFrames,
      },
    };
  },
};
