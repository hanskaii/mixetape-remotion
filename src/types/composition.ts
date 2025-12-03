import { CalculateMetadataFunction } from "remotion";
import { ZodObject } from "zod";

/**
 * Standard configuration for a Remotion composition.
 * This interface ensures all templates follow a consistent structure.
 */
export interface CompositionConfig<T extends Record<string, unknown>> {
  /** Unique identifier for the composition */
  id: string;
  /** The React component that renders the video */
  component: React.FC<T>;
  /** Zod schema for validating props */
  schema: ZodObject<any, any, any, T, any>;
  /** Default props for the composition */
  defaultProps: T;
  /** Default width (can be overridden) */
  width?: number;
  /** Default height (can be overridden) */
  height?: number;
  /** Default FPS (can be overridden) */
  fps?: number;
  /** Default duration in frames (can be overridden by calculateMetadata) */
  durationInFrames?: number;
  /** Function to calculate dynamic metadata like duration */
  calculateMetadata?: CalculateMetadataFunction<T>;
}

/**
 * Helper type to define a template module structure
 */
export type CompositionTemplate<T extends Record<string, unknown>> = {
  config: CompositionConfig<T>;
};
