import {
  calculateHeatScore,
  resolveLatestActivityAt,
  resolveLatestActivityAtText,
  sortPostsByMode,
} from "../../../shared/state/appHelpers";

function resolvePatch(post, patchOrUpdater) {
  if (typeof patchOrUpdater === "function") {
    return patchOrUpdater(post);
  }
  return patchOrUpdater;
}

function hasMetricPatch(patch = {}) {
  return (
    Object.prototype.hasOwnProperty.call(patch, "viewCount") ||
    Object.prototype.hasOwnProperty.call(patch, "subPostCount") ||
    Object.prototype.hasOwnProperty.call(patch, "likeCount") ||
    Object.prototype.hasOwnProperty.call(patch, "favoriteCount")
  );
}

export function mergeMainPostState(post, patchOrUpdater, options = {}) {
  if (!post || typeof post !== "object") {
    return post;
  }

  const patch = resolvePatch(post, patchOrUpdater);
  if (!patch || typeof patch !== "object") {
    return post;
  }

  const merged = { ...post, ...patch };
  const latestActivityAt = resolveLatestActivityAt(merged);
  const latestActivityAtText = resolveLatestActivityAtText(merged);

  merged.latestActivityAt = latestActivityAt;
  merged.latestActivityAtText = latestActivityAtText;
  merged.latestSubPostAt = latestActivityAt;
  merged.latestSubPostAtText = latestActivityAtText;

  const explicitHotScore = Number(merged.hotScore ?? merged.heatScore);
  if (Number.isFinite(explicitHotScore) && !options.recalculateHotScore) {
    merged.hotScore = explicitHotScore;
    return merged;
  }

  if (options.recalculateHotScore || hasMetricPatch(patch)) {
    merged.hotScore = calculateHeatScore(merged);
  }

  return merged;
}

export function patchMainPostInFeed(posts, mainPostId, patchOrUpdater, options = {}) {
  const currentPosts = Array.isArray(posts) ? posts : [];
  let changed = false;

  const nextPosts = currentPosts.map((post) => {
    if (post.id !== mainPostId) {
      return post;
    }
    changed = true;
    return mergeMainPostState(post, patchOrUpdater, options);
  });

  if (!changed) {
    return currentPosts;
  }

  if (!options.sortMode) {
    return nextPosts;
  }

  return sortPostsByMode(nextPosts, options.sortMode);
}

export function patchMainPostDetail(postDetail, mainPostId, patchOrUpdater, options = {}) {
  if (!postDetail || postDetail.id !== mainPostId) {
    return postDetail;
  }
  return mergeMainPostState(postDetail, patchOrUpdater, options);
}

export function upsertMainPostInFeed(posts, nextPost, options = {}) {
  const currentPosts = Array.isArray(posts) ? posts : [];
  const normalizedPost = mergeMainPostState(nextPost, {});
  const filteredPosts = currentPosts.filter((post) => post.id !== normalizedPost.id);
  const nextPosts = [normalizedPost, ...filteredPosts];

  if (!options.sortMode) {
    return nextPosts;
  }

  return sortPostsByMode(nextPosts, options.sortMode);
}
