import { Easing, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

// Fonts ship in assets/fonts (OFL-1.1, from Fontsource) so renders never depend on the network.
const FACES: [family: string, file: string, weight: string, style: string][] = [
  ["Playfair Display", "playfair-display-latin-400-normal", "400", "normal"],
  ["Playfair Display", "playfair-display-latin-500-normal", "500", "normal"],
  ["Playfair Display", "playfair-display-latin-700-normal", "700", "normal"],
  ["Playfair Display", "playfair-display-latin-400-italic", "400", "italic"],
  ["Playfair Display", "playfair-display-latin-500-italic", "500", "italic"],
  ["Manrope", "manrope-latin-500-normal", "500", "normal"],
  ["Manrope", "manrope-latin-700-normal", "700", "normal"],
  ["Manrope", "manrope-latin-800-normal", "800", "normal"],
];

for (const [family, file, weight, style] of FACES) {
  loadFont({ family, url: staticFile(`fonts/${file}.woff2`), weight, style });
}

export const fonts = {
  serif: "'Playfair Display', Georgia, serif",
  sans: "Manrope, Helvetica, Arial, sans-serif",
};

export const colors = {
  navy: "#12264F",
  navyDeep: "#0B1733",
  royal: "#1C4A96",
  ivory: "#F6F1E7",
  ivoryDeep: "#ECE3D2",
  gold: "#C4A05A",
  goldLight: "#E3CB91",
  ink: "#12264F",
  capsuleA: "#D8C19B",
  capsuleB: "#C9AE83",
};

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};

export const FPS = 30;
