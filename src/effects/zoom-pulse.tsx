import {
	AbsoluteFill,
	Img,
	useCurrentFrame,
	useVideoConfig,
	interpolate,
} from "remotion";

interface ZoomPulseProps {
	imageUrl?: string;
	duration?: number; // seconds per loop
	minScale?: number;
	maxScale?: number;
}

export const ZoomPulse: React.FC<ZoomPulseProps> = ({
	imageUrl = "https://images.pexels.com/photos/1726310/pexels-photo-1726310.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
	duration = 10,
	minScale = 1,
	maxScale = 1.1,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();
	const totalFrames = duration * fps;

	// Loop frame agar efek berulang terus
	const loopedFrame = frame % totalFrames;
	const half = totalFrames / 2;

	// Interpolasi scale bolak-balik
	const progress =
		loopedFrame <= half
			? interpolate(loopedFrame, [0, half], [minScale, maxScale])
			: interpolate(loopedFrame, [half, totalFrames], [maxScale, minScale]);

	return (
		<AbsoluteFill
			style={{
				backgroundColor: "black",
				justifyContent: "center",
				alignItems: "center",
				overflow: "hidden",
			}}
		>
			<Img
				src={imageUrl}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: `scale(${progress})`,
				}}
			/>
		</AbsoluteFill>
	);
};
