import { z } from "zod";
import { BaseTemplateSchema } from "../types/schema";

export const EffectType = z.enum(["kenburn", "zoompulse"]);

export const BackgroundVideoSchema = BaseTemplateSchema.extend({
  withEffect: z.boolean().default(false),
  effect: EffectType.optional(),
});

export type Effect = z.infer<typeof EffectType>;
export type BackgroundVideoProps = z.infer<typeof BackgroundVideoSchema>;

export const defaultBackgroundVideoProps: BackgroundVideoProps = {
  backgroundUrl: "https://wallpapercave.com/wp/wp14231848.jpg",
  audioTracks: [
    {
      title: "Jay",
      url: "https://cdn.mixetape.com/sample.mp3",
    },
  ],
  withEffect: false,
};

export const PRESETS = {
  fps: 30,
  dimensions: {
    landscape: { width: 1920, height: 1080 },
    portrait: { width: 1080, height: 1920 },
    square: { width: 1080, height: 1080 },
  },
} as const;
