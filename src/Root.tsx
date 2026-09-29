import { Composition } from "remotion";
import { Editorial, EDITORIAL_FRAMES } from "./videos/Editorial";
import { Playful, PLAYFUL_FRAMES } from "./videos/Playful";
import { Lifestyle, LIFESTYLE_FRAMES } from "./videos/Lifestyle";
import { FPS } from "./system/theme";
import type { Product } from "./system/product";
import ashwagandha from "../configs/ashwagandha-it.json";
import cardo from "../configs/cardo-mariano-es.json";

const PRODUCTS: Record<string, Product> = {
  Ashwagandha: ashwagandha as Product,
  CardoMariano: cardo as Product,
};

const FORMATS = [
  { id: "16x9", width: 1920, height: 1080 },
  { id: "1x1", width: 1080, height: 1080 },
  { id: "2x3", width: 1080, height: 1620 },
];

const VARIANTS = [
  { id: "Editorial", component: Editorial, frames: EDITORIAL_FRAMES },
  { id: "Playful", component: Playful, frames: PLAYFUL_FRAMES },
  // Lifestyle crops come from listing images and only frame well in 16:9 until real photos exist.
  { id: "Lifestyle", component: Lifestyle, frames: LIFESTYLE_FRAMES, needsPhotos: true, formats: ["16x9"] },
];

export const RemotionRoot: React.FC = () => (
  <>
    {VARIANTS.flatMap((v) =>
      Object.entries(PRODUCTS)
        .filter(([, product]) => !("needsPhotos" in v) || product.photos)
        .flatMap(([name, product]) =>
        FORMATS.filter((f) => !("formats" in v) || (v.formats ?? []).includes(f.id)).map((f) => (
          <Composition
            key={`${v.id}-${name}-${f.id}`}
            id={`${v.id}-${name}-${f.id}`}
            component={v.component}
            width={f.width}
            height={f.height}
            fps={FPS}
            durationInFrames={v.frames}
            defaultProps={product}
          />
        )),
      ),
    )}
  </>
);
