import { z } from "zod";

export const MusicSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z.string().min(1, "Title is required"),
  // Opsional: override durasi jika mediabunny gagal
  durationInSeconds: z.number().optional(),
});

export const VisualizerSchema = z.object({
  musics: z.array(MusicSchema).min(1, "At least one music track is required"),
  backgroundUrl: z.string().url(),
  seed: z.number().default(12345),
  titleText: z.string().default("REMOTION AUDIO"),
  visualizer: z.object({
    position: z.enum(["bottom-left", "bottom-center", "bottom-right"]).default("bottom-center"),
    useTitle: z.boolean().default(true),
    title: z.object({
      fontSize: z.number().default(32),
      fontFamily: z.string().default("Arial"),
      color: z.string().default("#FFFFFF"),
    }).default({}),
    settings: z.object({
      barWidth: z.number().default(16),
      gap: z.number().default(4),
      maxBarHeight: z.number().default(2400),
      barColor: z.string().default("#ffffff"),
      barsToDisplay: z.number().default(64),
    }).default({}),
  }).default({}),
});

export type Music = z.infer<typeof MusicSchema>;
export type VisualizerProps = z.infer<typeof VisualizerSchema>;

export const CROSSFADE_DURATION_FRAMES = 60; // 2 detik pada 30fps

export const MOCK_DATA: VisualizerProps = {
  seed: 42,
  titleText: "AUDIO REACTIVE",
  backgroundUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920",
  visualizer: {
    position: "bottom-center",
    title: {
      fontSize: 32,
      fontFamily: "Arial",
      color: "#FFFFFF",
    },
    useTitle: true,
    settings: {
      barWidth: 16,
      gap: 4,
      maxBarHeight: 2400,
      barColor: "#ffffff",
      barsToDisplay: 64,
    },
  },
  musics: [
    {
      title: "Sci-Fi Drama",
      url: "https://cdn.mixetape.com/sample.mp3",
    },
    {
      title: "Industrial Hum",
      url: "https://cdn.mixetape.com/sample.mp3",
    }
  ]
};
