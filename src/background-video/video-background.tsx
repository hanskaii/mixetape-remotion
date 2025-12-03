import { getVideoMetadata } from "@remotion/media-utils";
import React, { useCallback, useEffect, useState } from "react";
import { continueRender, delayRender, Loop, OffthreadVideo, useVideoConfig } from "remotion";

export const VideoBackground: React.FC<{
  videoUrl: string;
}> = ({ videoUrl }) => {
  const [durationInSeconds, setDurationInSeconds] = useState<number | null>(null);
  const [handle] = useState(() => delayRender());
  const { fps } = useVideoConfig();

  const fetchMetadata = useCallback(async () => {
    try {
      const metadata = await getVideoMetadata(videoUrl);
      setDurationInSeconds(metadata.durationInSeconds);
      continueRender(handle);
    } catch (err) {
      console.error(`Error fetching metadata for ${videoUrl}:`, err);
      continueRender(handle);
    }
  }, [handle, videoUrl]);

  useEffect(() => {
    fetchMetadata();
  }, [fetchMetadata]);

  if (durationInSeconds === null) {
    return null;
  }

  // Calculate duration in frames, ensure at least 1 frame
  const durationInFrames = Math.max(1, Math.floor(durationInSeconds * fps));

  return (
    <Loop durationInFrames={durationInFrames}>
      <OffthreadVideo
        src={videoUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        muted
      />
    </Loop>
  );
};
