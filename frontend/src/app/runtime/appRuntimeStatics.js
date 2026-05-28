import {
  communityMarks,
  communityShortDescriptions,
  feedSortModes,
} from "./appRuntimeConfig";
import {
  authorInitial,
  clampText,
  formatDateTime,
  formatHeatScore,
  formatTime,
  subPostQuotePreview,
} from "../../shared/state/appHelpers";

export const runtimeHelpers = {
  formatTime,
  clampText,
  formatHeatScore,
  formatDateTime,
  authorInitial,
  subPostQuotePreview,
};

export const runtimeLayoutConfig = {
  communityMarks,
  communityShortDescriptions,
  feedSortModes,
};
