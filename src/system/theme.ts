import { createContext, useContext } from "react";
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

// Per-product design tokens. Editorial provides one through ThemeContext; system components read
// their default colours and headline font from it, so a new product line only needs a theme here.
export type Theme = {
  navy: string;
  navyDeep: string;
  ink: string;
  ivory: string;
  ivoryDeep: string;
  /** Accent for lines, circles and `*word*` highlights (gold by default). */
  accent: string;
  /** Accent on dark backgrounds. */
  accentLight: string;
  headline: string;
  headlineWeight: number;
  headlineTracking: number;
  /** Ingredient circles filled with the accent (amount in ivory) instead of outlined. */
  solidCircles?: boolean;
  /** End card badges sit in a full-width accent band. */
  band?: boolean;
};

const base: Theme = {
  navy: colors.navy,
  navyDeep: colors.navyDeep,
  ink: colors.ink,
  ivory: colors.ivory,
  ivoryDeep: colors.ivoryDeep,
  accent: colors.gold,
  accentLight: colors.goldLight,
  headline: fonts.serif,
  headlineWeight: 500,
  headlineTracking: -0.02,
};

export const themes = {
  navy: base,
  // Estado Puro Clinic line.
  burgundy: { ...base, navy: "#6B2233", navyDeep: "#43121F", ink: "#5A1A28" },
  // Magnesio Ultradirect label: navy + orange, bold sans headlines.
  orange: {
    ...base,
    navy: "#102C5E",
    navyDeep: "#0A1F45",
    ink: "#102C5E",
    ivory: "#F8F3ED",
    ivoryDeep: "#F1E6DA",
    accent: "#E8601C",
    accentLight: "#F58A4B",
    headline: fonts.sans,
    headlineWeight: 700,
    headlineTracking: -0.03,
    solidCircles: true,
    band: true,
  },
} satisfies Record<string, Theme>;

export const ThemeContext = createContext<Theme>(base);
export const useTheme = () => useContext(ThemeContext);

export const ease = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  inOut: Easing.bezier(0.65, 0, 0.35, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
};

export const FPS = 30;
