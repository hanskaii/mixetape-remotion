import { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { z } from "zod";
import { MusicSchema } from "../constants";

export const musicsSchema = z.object({
	musics: z.array(MusicSchema),
});

export const useMusics = (props: z.infer<typeof musicsSchema>) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Memoize validation
	const isValid = useMemo(() => {
		try {
			musicsSchema.parse(props);
			return true;
		} catch (error) {
			console.error("Invalid musics props:", error);
			return false;
		}
	}, [props]);

	// Memoize music sequences data
	const sequences = useMemo(() => {
		let startFrame = 0;
		return props.musics.map((music, index) => {
			const durationInFrames = Math.round(music.duration * fps);
			const sequence = {
				music,
				index,
				startFrame,
				durationInFrames,
				endFrame: startFrame + durationInFrames,
			};
			startFrame += durationInFrames;
			return sequence;
		});
	}, [props.musics, fps]);

	// Calculate current track efficiently
	const currentTrackData = useMemo(() => {
		const currentSequence =
			sequences.find(
				(seq) => frame >= seq.startFrame && frame < seq.endFrame,
			) || sequences[sequences.length - 1];

		if (!currentSequence) {
			return {
				song: props.musics[0],
				index: 0,
				startFrame: 0,
				progress: 0,
			};
		}

		const localFrame = frame - currentSequence.startFrame;
		const progress = (localFrame / currentSequence.durationInFrames) * 100;

		return {
			song: currentSequence.music,
			index: currentSequence.index,
			startFrame: currentSequence.startFrame,
			progress: Math.min(100, Math.max(0, progress)),
		};
	}, [frame, sequences, props.musics]);

	// Total frames
	const totalFrames = useMemo(() => {
		return sequences.reduce((acc, seq) => acc + seq.durationInFrames, 0);
	}, [sequences]);

	return {
		isValid,
		sequences,
		currentTrackData,
		totalFrames,
		currentFrame: frame,
		fps,
	};
};
