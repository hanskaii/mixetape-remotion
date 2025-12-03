import { Composition } from "remotion";
import { templates } from "./templates";

export const Root: React.FC = () => {
  return (
    <>
      {templates.map((template) => (
        <Composition
          key={template.id}
          id={template.id}
          component={template.component}
          schema={template.schema}
          defaultProps={template.defaultProps}
          // Gunakan nilai dari template atau fallback ke default HD 30fps
          width={template.width ?? 1920}
          height={template.height ?? 1080}
          fps={template.fps ?? 30}
          durationInFrames={template.durationInFrames ?? 300}
          calculateMetadata={template.calculateMetadata}
        />
      ))}
    </>
  );
};
