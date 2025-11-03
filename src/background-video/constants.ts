import { z } from "zod";

export const MusicSchema = z.object({
	url: z.string().url("Must be a valid URL"),
	title: z.string().min(1, "Title is required"),
	duration: z.number().positive("Duration must be positive"),
});

export const EffectType = z.enum(["kenburn", "zoompulse"]);

export const BackgroundVideoSchema = z.object({
	musics: z.array(MusicSchema).min(1, "At least one music track is required"),
	backgroundUrl: z.string().url("Must be a valid URL"),
	withEffect: z.boolean().default(false),
	effect: EffectType.optional(),
});

export type Music = z.infer<typeof MusicSchema>;
export type Effect = z.infer<typeof EffectType>;
export type BackgroundVideoProps = z.infer<typeof BackgroundVideoSchema>;

export const MUSIC_PLAYLIST: Array<Music> = [
	{
		title: "Jay",
		duration: 156,
		url: "https://data.freetouse.com/music/tracks/07eb4398-8c28-b1e9-64b1-ea2dafa2af6f/file/mp3",
	},
	{
		title: "Gingersweet",
		duration: 159,
		url: "https://data.freetouse.com/music/tracks/c67a17e9-1f90-bd18-9a90-74fc398ab958/file/mp3",
	},
];

export const COMP_NAME = "BackgroundVideo";

export const defaultBackgroundVideoProps: BackgroundVideoProps = {
	backgroundUrl: "https://wallpapercave.com/wp/wp14231848.jpg",
	musics: MUSIC_PLAYLIST,
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
