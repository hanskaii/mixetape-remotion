import { AbsoluteFill, Img, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';

export const BackgroundLayer: React.FC<{ url: string; seed: number }> = ({ url, seed }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Deterministik Random values
  const scaleEnd = 1.15 + (random(seed) * 0.1); // Zoom 1.15x - 1.25x
  const xDir = random(seed + 1) > 0.5 ? 1 : -1;
  const yDir = random(seed + 2) > 0.5 ? 1 : -1;

  // Animasi
  const scale = interpolate(frame, [0, durationInFrames], [1, scaleEnd], { extrapolateRight: 'clamp' });
  const x = interpolate(frame, [0, durationInFrames], [0, 50 * xDir]);
  const y = interpolate(frame, [0, durationInFrames], [0, 30 * yDir]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000', overflow: 'hidden' }}>
      <Img
        src={url}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale}) translate(${x}px, ${y}px)`,
        }}
      />
      {/* Overlay Gelap agar Visualizer & Text terbaca */}
      <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
    </AbsoluteFill>
  );
};
