import { z } from "zod";
import { BaseTemplateSchema } from "../types/schema";

export const VisualizerConfigSchema = z.object({
  color: z.string().default("#ffffff"),
  barWidth: z.number().default(16),
  gap: z.number().default(4),
  maxHeight: z.number().default(640),
  position: z.enum(["bottom-left", "bottom-center", "bottom-right"]).default("bottom-center"),
  barsToDisplay: z.number().default(64),
});

export const AudioVisualizerSchema = BaseTemplateSchema.extend({
  seed: z.number().default(42),
  visualizer: VisualizerConfigSchema.default({}),
});

export type AudioVisualizerProps = z.infer<typeof AudioVisualizerSchema>;

export const CROSSFADE_DURATION_FRAMES = 60; // 2 seconds at 30fps

export const defaultAudioVisualizerProps: AudioVisualizerProps = {
  seed: 42,
  title: "AUDIO REACTIVE",
  backgroundUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920",
  audioTracks: [
    {
      title: "Sci-Fi Drama",
      url: "https://cdn.mixetape.com/sample.mp3",
    },
    {
      title: "Industrial Hum",
      url: "https://cdn.mixetape.com/sample.mp3",
    },
  ],
  visualizer: {
    color: "#ffffff",
    barWidth: 16,
    gap: 4,
    maxHeight: 640,
    position: "bottom-center",
    barsToDisplay: 64,
  },
};
