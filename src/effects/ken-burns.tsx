import type React from "react";
import { useMemo } from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

interface KenBurnsProps {
	imageUrl?: string;
	minScale?: number;
	maxScale?: number;
	moveX?: number;
	moveY?: number;
	speed?: number;
}

export const KenBurns: React.FC<KenBurnsProps> = ({
	imageUrl = "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba",
	minScale = 1,
	maxScale = 1.08,
	moveX = 30,
	moveY = 20,
	speed = 0.2,
}) => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// random tapi tetap — pakai useMemo biar gak berubah tiap frame
	const randomX = useMemo(() => (Math.random() - 0.5) * moveX * 2, []);
	const randomY = useMemo(() => (Math.random() - 0.5) * moveY * 2, []);
	const randomDir = useMemo(() => (Math.random() > 0.5 ? 1 : -1), []);

	// animasi smooth bolak balik
	const pulse = Math.sin((frame / fps) * Math.PI * speed) * 0.5 + 0.5;
	const scale = interpolate(pulse, [0, 1], [minScale, maxScale]);
	const translateX = interpolate(pulse, [0, 1], [0, randomX * randomDir]);
	const translateY = interpolate(pulse, [0, 1], [0, randomY * randomDir]);

	return (
		<div
			style={{
				flex: 1,
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: "black",
				overflow: "hidden",
			}}
		>
			<img
				src={imageUrl}
				style={{
					width: "100%",
					height: "100%",
					objectFit: "cover",
					transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
					transition: "transform 0.1s linear",
				}}
			/>
		</div>
	);
};
