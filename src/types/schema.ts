import { z } from "zod";

export const AudioTrackSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  title: z.string().min(1, "Title is required"),
  durationInSeconds: z.number().optional(),
});

export const BaseTemplateSchema = z.object({
  audioTracks: z.array(AudioTrackSchema).min(1, "At least one audio track is required"),
  backgroundUrl: z.string().url("Must be a valid URL"),
  title: z.string().optional(),
});

export type AudioTrack = z.infer<typeof AudioTrackSchema>;
export type BaseTemplateProps = z.infer<typeof BaseTemplateSchema>;
