import { parseMedia } from "@remotion/media-parser";
import { Composition } from "remotion";
import { CROSSFADE_DURATION_FRAMES, MOCK_DATA, VisualizerSchema } from "./audio-visualizer/constants";
import { MainComposition } from "./audio-visualizer/main";
import { calculateTotalDuration } from "./audio-visualizer/utils/audio";
import {
  BackgroundVideoSchema,
  defaultBackgroundVideoProps,
  PRESETS,
} from "./background-video/constants";
import { BackgroundVideo } from "./background-video/main";

export const Root: React.FC = () => {
  return (
    <>
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
        }} />
      <Composition
        id="MusicVisualizer"
        component={MainComposition}
        // Default Resolusi
        width={1920}
        height={1080}
        fps={30}
        // Props & Schema
        schema={VisualizerSchema}
        defaultProps={{
          ...MOCK_DATA,
          trackDurations: [900, 900] // Default fallback (30 detik per lagu)
        }}
        // MAGIC: Hitung durasi video berdasarkan total durasi lagu menggunakan MediaBunny
        calculateMetadata={async ({ props }) => {
          const { totalDurationInFrames, trackDurationsInFrames } = await calculateTotalDuration(props.musics, 30, CROSSFADE_DURATION_FRAMES);

          return {
            durationInFrames: totalDurationInFrames,
            props: {
              ...props,
              trackDurations: trackDurationsInFrames
            }
          };
        }} />
    </>
  );
};
