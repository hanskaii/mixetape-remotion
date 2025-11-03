import { memo } from "react";
import { AbsoluteFill, Html5Audio, Img, Sequence } from "remotion";
import { KenBurns } from "../effects/ken-burns";
import { ZoomPulse } from "../effects/zoom-pulse";
import type { BackgroundVideoProps } from "./constants";
import { useMusics } from "./hooks/use-musics";

const Background = memo<{
	backgroundUrl: string;
	withEffect: boolean;
	effect?: string;
}>(({ backgroundUrl, withEffect, effect }) => {
	if (!withEffect) {
		return (
			<Img
				src={backgroundUrl}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
				}}
			/>
		);
	}

	if (effect === "kenburn") {
		return <KenBurns imageUrl={backgroundUrl} />;
	}

	if (effect === "zoompulse") {
		return <ZoomPulse imageUrl={backgroundUrl} />;
	}

	return null;
});

Background.displayName = "Background";

// Main Component
export const BackgroundVideo: React.FC<BackgroundVideoProps> = ({
	musics,
	backgroundUrl,
	withEffect,
	effect,
}) => {
	const { isValid, sequences } = useMusics({ musics });

	if (!isValid) {
		return (
			<AbsoluteFill style={{ backgroundColor: "#000" }}>
				<div style={{ color: "white", padding: 20 }}>Invalid music data</div>
			</AbsoluteFill>
		);
	}

	return (
		<AbsoluteFill style={{ backgroundColor: "#000" }}>
			<AbsoluteFill>
				<Background
					backgroundUrl={backgroundUrl}
					withEffect={withEffect}
					effect={effect}
				/>
			</AbsoluteFill>

			{sequences.map((seq) => (
				<Sequence
					key={`audio-${seq.index}`}
					from={seq.startFrame}
					durationInFrames={seq.durationInFrames}
				>
					<Html5Audio src={seq.music.url} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
