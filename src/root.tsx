import { Composition } from "remotion";
import {
	BackgroundVideoSchema,
	defaultBackgroundVideoProps,
	type Music,
	PRESETS,
} from "./background-video/constants";
import { BackgroundVideo } from "./background-video/main";

// Each <Composition> is an entry in the sidebar!

const calculateDuration = (musics: Array<Music>, fps: number) => {
	const totalSeconds = musics.reduce((acc, music) => acc + music.duration, 0);
	return Math.round(totalSeconds * fps);
};

export const Root: React.FC = () => {
	return (
		<Composition
			id="BackgroundVideo"
			component={BackgroundVideo}
			durationInFrames={calculateDuration(
				defaultBackgroundVideoProps.musics,
				PRESETS.fps,
			)}
			fps={PRESETS.fps}
			width={PRESETS.dimensions.landscape.width}
			height={PRESETS.dimensions.landscape.height}
			schema={BackgroundVideoSchema}
			defaultProps={{ ...defaultBackgroundVideoProps }}
		/>
	);
};
