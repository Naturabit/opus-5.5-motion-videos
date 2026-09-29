import { Easing, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

// Fonts ship in assets/fonts (OFL-1.1, from Fontsource) so renders never depend on the network.
// Marcellus has a single weight; it is registered for every weight the components request so the
// browser never synthesizes a fake bold. Jost's files map to the sans weights components use.
const FACES: [family: string, file: string, weight: string][] = [
  ["Marcellus", "marcellus-latin-400-normal", "400"],
  ["Marcellus", "marcellus-latin-400-normal", "500"],
  ["Marcellus", "marcellus-latin-400-normal", "700"],
  ["Jost", "jost-latin-500-normal", "500"],
  ["Jost", "jost-latin-600-normal", "700"],
  ["Jost", "jost-latin-700-normal", "800"],
];

for (const [family, file, weight] of FACES) {
  loadFont({ family, url: staticFile(`fonts/${file}.woff2`), weight, style: "normal" });
}

export const fonts = {
  serif: "Marcellus, Georgia, serif",
  sans: "Jost, Helvetica, Arial, sans-serif",
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
