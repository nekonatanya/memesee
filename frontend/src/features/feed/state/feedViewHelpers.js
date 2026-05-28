import { normalizePostPayload } from "../../../shared/state/appHelpers";

export function normalizeFeedPage(payload, apiBase) {
  const posts = (Array.isArray(payload?.posts) ? payload.posts : [])
    .map((post) => normalizePostPayload(post, apiBase));
  const nextCursor = typeof payload?.nextCursor === "string" ? payload.nextCursor : "";
  const hasMore = Boolean(payload?.hasMore);

  return {
    posts,
    nextCursor,
    hasMore,
  };
}

export function shouldSkipFeedAppend({
  append,
  loadingPosts,
  loadingMorePosts,
  feedHasMore,
  feedCursor,
}) {
  if (!append) {
    return false;
  }

  return (
    loadingPosts ||
    loadingMorePosts ||
    !feedHasMore ||
    !feedCursor
  );
}

export function isHomeFeedActive(routeType, view) {
  return routeType === "home" && view !== "mine";
}

export function didEnterHomeFeed(previousRouteType, previousView, routeType, view) {
  return isHomeFeedActive(routeType, view) && !isHomeFeedActive(previousRouteType, previousView);
}
