import { buildAppChromeProps } from "./appLayoutChromePropsBuilders";
import { buildAppOverlayProps } from "./appLayoutOverlayPropsBuilders";

export function buildAppLayoutProps(dependencies) {
  return {
    chromeProps: buildAppChromeProps(dependencies),
    overlayProps: buildAppOverlayProps(dependencies),
  };
}
