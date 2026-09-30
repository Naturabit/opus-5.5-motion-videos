import { Composition } from "remotion";
import { Editorial, EDITORIAL_FRAMES } from "./videos/Editorial";
import { Playful, PLAYFUL_FRAMES } from "./videos/Playful";
import { Lifestyle, LIFESTYLE_FRAMES } from "./videos/Lifestyle";
import { Horizon, HORIZON_FRAMES } from "./videos/Horizon";
import { FPS } from "./system/theme";
import type { Product } from "./system/product";
import ashwagandha from "../configs/ashwagandha-es.json";
import cardo from "../configs/cardo-mariano-es.json";
import ailnoirfrCfg from "../configs/ail-noir-fr.json";
import arandanoesCfg from "../configs/arandano-es.json";
import ashwagandhafrCfg from "../configs/ashwagandha-fr.json";
import aubepinefrCfg from "../configs/aubepine-fr.json";
import azafranesCfg from "../configs/azafran-es.json";
import boswelliaesCfg from "../configs/boswellia-es.json";
import cabelloesCfg from "../configs/cabello-es.json";
import cannellefrCfg from "../configs/cannelle-fr.json";
import chardonmariefrCfg from "../configs/chardon-marie-fr.json";
import curcumaesCfg from "../configs/curcuma-es.json";
import dermocollagenefrCfg from "../configs/dermo-collagene-fr.json";
import enzymesfrCfg from "../configs/enzymes-fr.json";
import flexicollagenefrCfg from "../configs/flexi-collagene-fr.json";
import ginkgoesCfg from "../configs/ginkgo-es.json";
import ginsengrojoesCfg from "../configs/ginseng-rojo-es.json";
import harpagophytumfrCfg from "../configs/harpagophytum-fr.json";
import magnesioesCfg from "../configs/magnesio-es.json";
import ovometfrCfg from "../configs/ovomet-fr.json";

const PRODUCTS: Record<string, Product> = {
  Ashwagandha: ashwagandha as Product,
  CardoMariano: cardo as Product,
};

// Catalogue roll-out (ES + FR): Editorial 16:9 only.
const EDITORIAL_ONLY: Record<string, Product> = {
  AilNoirFR: ailnoirfrCfg as Product,
  ArandanoES: arandanoesCfg as Product,
  AshwagandhaFR: ashwagandhafrCfg as Product,
  AubepineFR: aubepinefrCfg as Product,
  AzafranES: azafranesCfg as Product,
  BoswelliaES: boswelliaesCfg as Product,
  CabelloES: cabelloesCfg as Product,
  CannelleFR: cannellefrCfg as Product,
  ChardonMarieFR: chardonmariefrCfg as Product,
  CurcumaES: curcumaesCfg as Product,
  DermoCollageneFR: dermocollagenefrCfg as Product,
  EnzymesFR: enzymesfrCfg as Product,
  FlexiCollageneFR: flexicollagenefrCfg as Product,
  GinkgoES: ginkgoesCfg as Product,
  GinsengRojoES: ginsengrojoesCfg as Product,
  HarpagophytumFR: harpagophytumfrCfg as Product,
  MagnesioES: magnesioesCfg as Product,
  OvometFR: ovometfrCfg as Product,
};

const FORMATS = [
  { id: "16x9", width: 1920, height: 1080 },
  { id: "1x1", width: 1080, height: 1080 },
  { id: "2x3", width: 1080, height: 1620 },
];

const VARIANTS = [
  { id: "Editorial", component: Editorial, frames: EDITORIAL_FRAMES },
  { id: "Horizon", component: Horizon, frames: HORIZON_FRAMES, needsHorizon: true },
  { id: "Playful", component: Playful, frames: PLAYFUL_FRAMES },
  // Lifestyle crops come from listing images and only frame well in 16:9 until real photos exist.
  { id: "Lifestyle", component: Lifestyle, frames: LIFESTYLE_FRAMES, needsPhotos: true, formats: ["16x9"] },
];

export const RemotionRoot: React.FC = () => (
  <>
    {VARIANTS.flatMap((v) =>
      Object.entries(PRODUCTS)
        .filter(([, product]) => !("needsPhotos" in v) || product.photos)
        .filter(([, product]) => !("needsHorizon" in v) || product.horizon)
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
    {Object.entries(EDITORIAL_ONLY).map(([name, product]) => (
      <Composition
        key={`Editorial-${name}-16x9`}
        id={`Editorial-${name}-16x9`}
        component={Editorial}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={EDITORIAL_FRAMES}
        defaultProps={product}
      />
    ))}
  </>
);
