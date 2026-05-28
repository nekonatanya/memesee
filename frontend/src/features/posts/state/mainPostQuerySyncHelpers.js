import { canHydrateMainPostIntoCurrentFeed } from "../../feed/state/feedQueryStateHelpers";
import {
  patchMainPostDetail,
  patchMainPostInFeed,
  upsertMainPostInFeed,
} from "./mainPostStateHelpers";
import {
  updatePostDetailAfterSubPostCreated,
} from "./subPostThreadHelpers";

function buildLoadedMainPostFeedPatch(loadedPost) {
  return {
    viewCount: loadedPost.viewCount,
    hotScore: loadedPost.hotScore,
    updatedAt: loadedPost.updatedAt,
    latestActivityAt: loadedPost.latestActivityAt || loadedPost.latestSubPostAt,
    latestActivityAtText: loadedPost.latestActivityAtText || loadedPost.latestSubPostAtText || "",
  };
}

function buildMainPostEngagementPatch({
  hotScore,
  likeCount,
  likedByMe,
  favoriteCount,
  favoritedByMe,
}) {
  return {
    ...(likeCount === undefined ? {} : { likeCount }),
    ...(likedByMe === undefined ? {} : { likedByMe }),
    ...(favoriteCount === undefined ? {} : { favoriteCount }),
    ...(favoritedByMe === undefined ? {} : { favoritedByMe }),
    hotScore,
  };
}

export function syncLoadedMainPostIntoFeed(posts, loadedPost, feedQueryState) {
  if (!loadedPost?.id) {
    return Array.isArray(posts) ? posts : [];
  }

  return patchMainPostInFeed(
    posts,
    loadedPost.id,
    buildLoadedMainPostFeedPatch(loadedPost),
    { sortMode: feedQueryState?.feedSortMode },
  );
}

export function shouldHydrateSavedMainPostIntoFeed(feedQueryState, savedPost) {
  return Boolean(savedPost?.id) && canHydrateMainPostIntoCurrentFeed(
    feedQueryState,
    savedPost.communitySlug,
  );
}

export function syncSavedMainPostIntoFeed(posts, savedPost, feedQueryState) {
  if (!shouldHydrateSavedMainPostIntoFeed(feedQueryState, savedPost)) {
    return Array.isArray(posts) ? posts : [];
  }

  return upsertMainPostInFeed(posts, savedPost, {
    sortMode: feedQueryState?.feedSortMode,
  });
}

export function syncSavedMainPostIntoDetail(postDetail, savedPost) {
  return patchMainPostDetail(postDetail, savedPost?.id, savedPost);
}

export function syncMainPostEngagementIntoFeed(posts, mainPostId, engagementState, feedQueryState) {
  return patchMainPostInFeed(
    posts,
    mainPostId,
    buildMainPostEngagementPatch(engagementState),
    {
      sortMode: feedQueryState?.feedSortMode,
      recalculateHotScore: !Number.isFinite(Number(engagementState?.hotScore)),
    },
  );
}

export function syncMainPostEngagementIntoDetail(postDetail, mainPostId, engagementState) {
  return patchMainPostDetail(
    postDetail,
    mainPostId,
    buildMainPostEngagementPatch(engagementState),
    {
      recalculateHotScore: !Number.isFinite(Number(engagementState?.hotScore)),
    },
  );
}

export function syncCreatedSubPostIntoDetail(postDetail, mainPostId, latestMessageAt) {
  return updatePostDetailAfterSubPostCreated(postDetail, mainPostId, latestMessageAt);
}

export function syncDeletedMainPostIntoFeed(posts, mainPostId) {
  const currentPosts = Array.isArray(posts) ? posts : [];
  return currentPosts.filter((post) => post.id !== mainPostId);
}
