import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ease } from "./theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const useProgress = (delay: number, duration: number, easing = ease.out) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [delay, delay + duration], [0, 1], { ...clamp, easing });
};

// Scale unit: 1 = 1px at 1080p short side, so layouts hold across 16:9, 1:1 and 2:3.
// Square frames reuse the stacked (portrait) layouts, so they scale everything down to fit.
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  const ratio = width / height;
  const squareFit = ratio <= 1.2 && ratio >= 0.85 ? 0.7 : 1;
  return (Math.min(width, height) / 1080) * squareFit;
};

export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const ratio = width / height;
  return { width, height, landscape: ratio > 1.2, square: ratio <= 1.2 && ratio >= 0.85, portrait: ratio <= 1.2 };
};
