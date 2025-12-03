import { AudioVisualizerTemplate } from "../audio-visualizer/template";
import { BackgroundVideoTemplate } from "../background-video/template";
import { CompositionConfig } from "../types/composition";

export const templates: CompositionConfig<any>[] = [
  BackgroundVideoTemplate,
  AudioVisualizerTemplate,
];

export { AudioVisualizerTemplate, BackgroundVideoTemplate };
