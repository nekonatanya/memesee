import {
  normalizeTagItems,
  parseTagInput,
  removeMarkdownImages,
} from "../../../shared/state/appHelpers";
import { shouldReloadFeedAfterMainPostUpsert } from "../../feed/state/feedQueryStateHelpers";

const MAX_COMPOSER_TAG_COUNT = 3;
const MAX_COMPOSER_TAG_TOTAL_LENGTH = 12;
const COMPOSER_TAG_SUBMIT_KEYS = new Set(["Enter", ",", "\uFF0C"]);

export function buildComposerTagState(composerTags, composerTagDraft) {
  const normalizedTagItems = normalizeTagItems([
    ...(Array.isArray(composerTags) ? composerTags : []),
    ...normalizeTagItems(composerTagDraft),
  ]);

  return {
    normalizedTagItems,
    normalizedTags: parseTagInput(normalizedTagItems),
    validationMessage: validateComposerTags(normalizedTagItems),
  };
}

export function validateComposerTags(tagItems) {
  if (tagItems.length > MAX_COMPOSER_TAG_COUNT) {
    return "TAG \u6700\u591A 3 \u4E2A\uFF0C\u4E0D\u80FD\u7EE7\u7EED\u6DFB\u52A0\u3002";
  }

  const totalLength = tagItems.reduce((sum, item) => sum + item.length, 0);
  if (totalLength > MAX_COMPOSER_TAG_TOTAL_LENGTH) {
    return "TAG \u603B\u957F\u5EA6\u4E0D\u80FD\u8D85\u8FC7 12 \u4E2A\u5B57\u7B26\u3002";
  }

  return "";
}

export function buildComposerSubmitPayload({
  communitySlug,
  title,
  content,
  composerMode,
  composerMediaAssets,
  tags,
}) {
  return {
    communitySlug,
    title,
    content: composerMode === "rich" ? removeMarkdownImages(content) : content,
    mediaAssetIds:
      composerMode === "rich"
        ? composerMediaAssets
            .map((asset) => Number(asset?.id || 0))
            .filter((assetId) => assetId > 0)
        : [],
    tags,
  };
}

export function shouldRefreshComposerFeed({
  searchQuery,
  selectedCommunitySlug,
  postCommunitySlug,
}) {
  return shouldReloadFeedAfterMainPostUpsert(
    { searchQuery, selectedCommunitySlug },
    postCommunitySlug,
  );
}

export function resolveDefaultComposerCommunitySlug({
  selectedCommunitySlug,
  orderedCommunities,
}) {
  return selectedCommunitySlug && selectedCommunitySlug !== "lobby"
    ? selectedCommunitySlug
    : (orderedCommunities[0]?.slug || "");
}

export function resolveEditComposerCommunitySlug({
  orderedCommunities,
  communitySlug,
}) {
  const fallbackCommunitySlug = orderedCommunities[0]?.slug || "";
  const hasMatchingCommunity = orderedCommunities.some(
    (community) => community.slug === communitySlug,
  );

  return hasMatchingCommunity
    ? communitySlug
    : (communitySlug || fallbackCommunitySlug);
}

export function isComposerTagSubmitKey(key) {
  return COMPOSER_TAG_SUBMIT_KEYS.has(key);
}

export function resizeComposerContentElement(target) {
  if (!target) {
    return;
  }
  target.style.height = "auto";
  target.style.height = `${Math.max(120, target.scrollHeight)}px`;
}

export function removeIndexedItem(items, index) {
  if (!Array.isArray(items) || index < 0 || index >= items.length) {
    return items;
  }
  return items.filter((_, itemIndex) => itemIndex !== index);
}

export function moveIndexedItem(items, from, to) {
  if (
    !Array.isArray(items) ||
    items.length <= 1 ||
    to < 0 ||
    to >= items.length ||
    from < 0 ||
    from >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const [picked] = next.splice(from, 1);
  next.splice(to, 0, picked);
  return next;
}

export function getNextComposerMediaIndex(currentIndex, removedIndex, mediaCount) {
  const nextLength = Math.max(0, Number(mediaCount || 0) - 1);
  if (nextLength === 0) {
    return 0;
  }
  if (currentIndex > removedIndex) {
    return currentIndex - 1;
  }
  return Math.min(currentIndex, nextLength - 1);
}

export function mergeComposerMediaAssets(existingAssets, uploadedAssets) {
  const merged = Array.isArray(existingAssets) ? [...existingAssets] : [];
  for (const asset of Array.isArray(uploadedAssets) ? uploadedAssets : []) {
    if (!merged.some((item) => Number(item?.id || 0) === Number(asset?.id || 0))) {
      merged.push(asset);
    }
  }
  return merged.slice(0, 20);
}

export function mergeComposerMediaUrls(existingUrls, uploadedAssets) {
  const merged = Array.isArray(existingUrls) ? [...existingUrls] : [];
  for (const asset of Array.isArray(uploadedAssets) ? uploadedAssets : []) {
    if (asset?.url && !merged.includes(asset.url)) {
      merged.push(asset.url);
    }
  }
  return merged.slice(0, 20);
}

export function buildComposerMarkdownImage(filename, url) {
  const safeName = String(filename || "").replace(/[)\]]/g, "");
  return `![${safeName}](${url})`;
}

export function buildComposerUploadMessage({ imageCount, skippedCount }) {
  const summary = [];
  if (imageCount > 0) {
    summary.push(`\u6210\u529F\u4E0A\u4F20 ${imageCount} \u5F20\u56FE\u7247`);
  }
  if (skippedCount > 0) {
    summary.push(`\u8DF3\u8FC7 ${skippedCount} \u4E2A\u65E0\u6548\u6587\u4EF6`);
  }
  return summary.length > 0
    ? summary.join("\uFF0C")
    : "\u56FE\u7247\u4E0A\u4F20\u5B8C\u6210\u3002";
}
