import { Composition } from "remotion";
import { ProductSpot, type ProductSpotProps } from "./compositions/ProductSpot";
import sample from "../configs/sample-product.json";

const FPS = 30;
const defaultProps = sample as ProductSpotProps;
const durationInFrames = defaultProps.durationSeconds * FPS;

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="SponsoredBrandsLandscape"
      component={ProductSpot}
      width={1920}
      height={1080}
      fps={FPS}
      durationInFrames={durationInFrames}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => ({ durationInFrames: props.durationSeconds * FPS })}
    />
    <Composition
      id="VerticalStory"
      component={ProductSpot}
      width={1080}
      height={1920}
      fps={FPS}
      durationInFrames={durationInFrames}
      defaultProps={defaultProps}
      calculateMetadata={({ props }) => ({ durationInFrames: props.durationSeconds * FPS })}
    />
  </>
);
