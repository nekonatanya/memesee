import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getMainPost as getContentMainPost,
  listSubPostPage as listContentSubPostPage,
} from "../../content/api/contentApi";
import {
  compareSubPostsBySort,
  extractImageUrls,
  normalizePostPayload,
  normalizeSubPostPayload,
} from "../../../shared/state/appHelpers";
import {
  buildGuardedPostThreadRuntimeCallbacks,
  buildPostThreadMessageHandlers,
  isActivePostRoute,
  reloadCurrentPostDetailState,
  reloadCurrentPostThreadState,
  reloadCurrentSubPostsState,
} from "../state/postDetailQueryRuntimeHelpers";
import { UI_MESSAGES, readableError } from "../../../shared/state/uiMessages";

const POST_DETAIL_PREFETCH_TTL_MS = 15000;
const POST_DETAIL_PREFETCH_LIMIT = 24;
const SUB_POST_PAGE_SIZE = 30;

function buildPostDetailCacheKey(mainPostId, authToken) {
  return `${authToken || "anonymous"}:${Number(mainPostId || 0)}`;
}

function buildPostDetailRequestKey(mainPostId, authToken, trackView) {
  return `${buildPostDetailCacheKey(mainPostId, authToken)}:${trackView ? "view" : "prefetch"}`;
}

function getFreshCachedPostDetail(cache, key) {
  const entry = cache.get(key);
  if (!entry) {
    return null;
  }
  if (Date.now() - Number(entry.cachedAt || 0) > POST_DETAIL_PREFETCH_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.value || null;
}

function rememberPostDetail(cache, key, value) {
  cache.delete(key);
  cache.set(key, {
    value,
    cachedAt: Date.now(),
  });
  while (cache.size > POST_DETAIL_PREFETCH_LIMIT) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
}

function mergeSubPostPages(previous, nextPage) {
  const mergedById = new Map();
  (Array.isArray(previous) ? previous : []).forEach((item) => {
    if (item?.id) {
      mergedById.set(item.id, item);
    }
  });
  (Array.isArray(nextPage) ? nextPage : []).forEach((item) => {
    if (item?.id) {
      mergedById.set(item.id, item);
    }
  });
  return Array.from(mergedById.values());
}

export function usePostDetailView({
  route,
  token,
  client,
  apiBase,
  setMessage,
  onPostDetailLoaded,
}) {
  const [postDetail, setPostDetail] = useState(null);
  const [loadingPostDetail, setLoadingPostDetail] = useState(false);
  const [subPosts, setSubPosts] = useState([]);
  const [loadingSubPosts, setLoadingSubPosts] = useState(false);
  const [loadingMoreSubPosts, setLoadingMoreSubPosts] = useState(false);
  const [subPostCursor, setSubPostCursor] = useState("");
  const [subPostsHasMore, setSubPostsHasMore] = useState(false);
  const onPostDetailLoadedRef = useRef(onPostDetailLoaded);
  const postDetailCacheRef = useRef(new Map());
  const postDetailRequestCacheRef = useRef(new Map());
  const subPostCursorRef = useRef("");
  const subPostsHasMoreRef = useRef(false);
  const loadingMoreSubPostsRef = useRef(false);

  useEffect(() => {
    onPostDetailLoadedRef.current = onPostDetailLoaded;
  }, [onPostDetailLoaded]);

  const loadPostDetail = useCallback(async (mainPostId, authToken = token, options = {}) => {
    const trackView = options?.trackView !== false;
    const cacheKey = buildPostDetailCacheKey(mainPostId, authToken);
    const startRequest = () => {
      const requestKey = buildPostDetailRequestKey(mainPostId, authToken, trackView);
      const cachedRequest = postDetailRequestCacheRef.current.get(requestKey);
      if (cachedRequest) {
        return cachedRequest;
      }
      const request = getContentMainPost(client, {
        token: authToken,
        mainPostId,
        trackView,
      })
        .then((post) => {
          const normalizedPost = normalizePostPayload(post, apiBase);
          rememberPostDetail(postDetailCacheRef.current, cacheKey, normalizedPost);
          return normalizedPost;
        })
        .finally(() => {
          postDetailRequestCacheRef.current.delete(requestKey);
        });
      postDetailRequestCacheRef.current.set(requestKey, request);
      return request;
    };
    const cachedPostDetail = getFreshCachedPostDetail(postDetailCacheRef.current, cacheKey);
    if (cachedPostDetail) {
      if (trackView) {
        startRequest().catch(() => {});
      }
      return cachedPostDetail;
    }
    return startRequest();
  }, [apiBase, client, token]);

  const prefetchPostDetail = useCallback((mainPostId, authToken = token) => {
    const normalizedMainPostId = Number(mainPostId || 0);
    if (!Number.isFinite(normalizedMainPostId) || normalizedMainPostId <= 0) {
      return;
    }
    loadPostDetail(normalizedMainPostId, authToken, { trackView: false }).catch(() => {});
  }, [loadPostDetail, token]);

  const loadSubPosts = useCallback(async (mainPostId, authToken = token) => {
    const page = await listContentSubPostPage(client, {
      token: authToken,
      mainPostId,
      limit: SUB_POST_PAGE_SIZE,
    });
    const nextCursor = page.nextCursor || "";
    const hasMore = Boolean(page.hasMore);
    subPostCursorRef.current = nextCursor;
    subPostsHasMoreRef.current = hasMore;
    setSubPostCursor(nextCursor);
    setSubPostsHasMore(hasMore);
    return page.subPosts.map((subPost) => normalizeSubPostPayload(subPost));
  }, [client, token]);

  const loadMoreSubPosts = useCallback(async (authToken = token) => {
    if (
      !isActivePostRoute(route) ||
      !subPostsHasMoreRef.current ||
      loadingMoreSubPostsRef.current
    ) {
      return [];
    }
    loadingMoreSubPostsRef.current = true;
    setLoadingMoreSubPosts(true);
    try {
      const page = await listContentSubPostPage(client, {
        token: authToken,
        mainPostId: route.mainPostId,
        cursor: subPostCursorRef.current,
        limit: SUB_POST_PAGE_SIZE,
      });
      const nextSubPosts = page.subPosts.map((subPost) => normalizeSubPostPayload(subPost));
      const nextCursor = page.nextCursor || "";
      const hasMore = Boolean(page.hasMore);
      subPostCursorRef.current = nextCursor;
      subPostsHasMoreRef.current = hasMore;
      setSubPostCursor(nextCursor);
      setSubPostsHasMore(hasMore);
      setSubPosts((prev) => mergeSubPostPages(prev, nextSubPosts));
      return nextSubPosts;
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.subPostsLoadFailed));
      return [];
    } finally {
      loadingMoreSubPostsRef.current = false;
      setLoadingMoreSubPosts(false);
    }
  }, [client, route, setMessage, token]);

  const postThreadMessageHandlers = useMemo(() => buildPostThreadMessageHandlers({
    setPostDetail,
    setSubPosts,
    setMessage,
    formatPostDetailError: (error) =>
      readableError(error, UI_MESSAGES.mainPostDetailLoadFailed),
    formatSubPostsError: (error) =>
      readableError(error, UI_MESSAGES.subPostsLoadFailed),
  }), [setMessage]);

  const reloadCurrentPostDetail = useCallback(async (authToken = token) => {
    setLoadingPostDetail(true);
    try {
      return await reloadCurrentPostDetailState({
        route,
        authToken,
        loadPostDetail,
        setPostDetail,
        onPostDetailLoaded: onPostDetailLoadedRef.current,
      });
    } finally {
      setLoadingPostDetail(false);
    }
  }, [loadPostDetail, route, token]);

  const reloadCurrentSubPosts = useCallback(async (authToken = token) => {
    setLoadingSubPosts(true);
    try {
      return await reloadCurrentSubPostsState({
        route,
        authToken,
        loadSubPosts,
        setSubPosts,
      });
    } finally {
      setLoadingSubPosts(false);
    }
  }, [loadSubPosts, route, token]);

  const reloadCurrentPostThread = useCallback(async (authToken = token) => {
    setLoadingPostDetail(true);
    setLoadingSubPosts(true);
    try {
      const runtimeCallbacks = buildGuardedPostThreadRuntimeCallbacks({
        setPostDetail,
        onPostDetailLoaded: onPostDetailLoadedRef.current,
        setSubPosts,
        ...postThreadMessageHandlers,
      });
      return await reloadCurrentPostThreadState({
        route,
        authToken,
        loadPostDetail,
        loadSubPosts,
        ...runtimeCallbacks,
      });
    } finally {
      setLoadingPostDetail(false);
      setLoadingSubPosts(false);
    }
  }, [loadPostDetail, loadSubPosts, postThreadMessageHandlers, route, setPostDetail, setSubPosts, token]);

  useEffect(() => {
    if (!isActivePostRoute(route)) {
      setPostDetail(null);
      setSubPosts([]);
      setLoadingPostDetail(false);
      setLoadingSubPosts(false);
      setLoadingMoreSubPosts(false);
      setSubPostCursor("");
      setSubPostsHasMore(false);
      subPostCursorRef.current = "";
      subPostsHasMoreRef.current = false;
      loadingMoreSubPostsRef.current = false;
      return;
    }
    let active = true;
    setSubPostCursor("");
    setSubPostsHasMore(false);
    subPostCursorRef.current = "";
    subPostsHasMoreRef.current = false;
    setLoadingPostDetail(true);
    setLoadingSubPosts(true);
    const runtimeCallbacks = buildGuardedPostThreadRuntimeCallbacks({
      isActive: () => active,
      setPostDetail,
      onPostDetailLoaded: (nextPostDetail) => {
        onPostDetailLoadedRef.current?.(nextPostDetail);
      },
      setSubPosts,
      ...postThreadMessageHandlers,
    });
    reloadCurrentPostThreadState({
      route,
      loadPostDetail,
      loadSubPosts,
      ...runtimeCallbacks,
    })
      .finally(() => {
        if (active) {
          setLoadingPostDetail(false);
          setLoadingSubPosts(false);
        }
      });
    return () => {
      active = false;
    };
  }, [loadPostDetail, loadSubPosts, postThreadMessageHandlers, route, setPostDetail, setSubPosts]);

  const routeMainPostId = Number(route?.mainPostId || 0);
  const selectedPost =
    route.type === "post" && Number(postDetail?.id || 0) === routeMainPostId
      ? postDetail
      : null;
  const selectedLikeCount = Number(selectedPost?.likeCount || 0);
  const selectedFavoriteCount = Number(selectedPost?.favoriteCount || 0);
  const detailImageUrls = useMemo(
    () => extractImageUrls(selectedPost?.content || "", apiBase),
    [selectedPost?.content, apiBase],
  );
  const richDetailImages = useMemo(() => {
    if (!selectedPost || selectedPost.postMode !== "rich") {
      return [];
    }
    return Array.isArray(selectedPost.mediaUrls) ? selectedPost.mediaUrls : [];
  }, [selectedPost]);
  const richOriginalImages = useMemo(() => {
    if (!selectedPost || selectedPost.postMode !== "rich") {
      return [];
    }
    return Array.isArray(selectedPost.mediaOriginalUrls) && selectedPost.mediaOriginalUrls.length > 0
      ? selectedPost.mediaOriginalUrls
      : richDetailImages;
  }, [richDetailImages, selectedPost]);
  const richImageSources = useMemo(() => {
    if (!selectedPost || selectedPost.postMode !== "rich") {
      return [];
    }
    return Array.isArray(selectedPost.mediaImageSources) && selectedPost.mediaImageSources.length > 0
      ? selectedPost.mediaImageSources
      : richDetailImages.map((src, index) => ({
          src,
          displayUrl: src,
          originalUrl: richOriginalImages[index] || src,
        }));
  }, [richDetailImages, richOriginalImages, selectedPost]);
  const subPostNodeMap = useMemo(() => {
    if (!Array.isArray(subPosts) || subPosts.length === 0) {
      return new Map();
    }
    const map = new Map(
      subPosts.map((subPost) => [
        subPost.id,
        {
          ...subPost,
          branchSubPosts: [],
          targetSubPostAuthor: null,
          targetSubPostPreview: "",
          targetSubPostDeleted: false,
        },
      ]),
    );
    subPosts.forEach((subPost) => {
      const node = map.get(subPost.id);
      if (!node) {
        return;
      }
      if (subPost.parentId && map.has(subPost.parentId)) {
        const parent = map.get(subPost.parentId);
        node.targetSubPostAuthor = parent.author;
        node.targetSubPostPreview = parent.content || "";
        parent.branchSubPosts.push(node);
      } else if (subPost.parentId) {
        node.targetSubPostAuthor =
          subPost.parentSubPostAuthor || subPost.parentSubPostAuthorUsername || "";
        node.targetSubPostDeleted = true;
        node.targetSubPostPreview = "该子帖已删除。";
      }
    });
    map.forEach((node) => {
      if (Array.isArray(node.branchSubPosts) && node.branchSubPosts.length > 0) {
        node.branchSubPosts.sort((a, b) => compareSubPostsBySort(a, b, "time_asc"));
      }
    });
    return map;
  }, [subPosts]);
  const orderedSubPostFloors = useMemo(() => {
    const list = Array.from(subPostNodeMap.values());
    list.sort((a, b) => {
      const timeGap = compareSubPostsBySort(a, b, "time_asc");
      if (timeGap !== 0) {
        return timeGap;
      }
      const aId = Number(a?.id);
      const bId = Number(b?.id);
      if (Number.isFinite(aId) && Number.isFinite(bId) && aId !== bId) {
        return aId - bId;
      }
      return String(a?.id || "").localeCompare(String(b?.id || ""));
    });
    return list;
  }, [subPostNodeMap]);

  return {
    postDetail,
    setPostDetail,
    subPosts,
    setSubPosts,
    loadingPostDetail,
    loadingSubPosts,
    loadingMoreSubPosts,
    subPostCursor,
    subPostsHasMore,
    selectedPost,
    selectedLikeCount,
    selectedFavoriteCount,
    detailImageUrls,
    richDetailImages,
    richOriginalImages,
    richImageSources,
    subPostNodeMap,
    orderedSubPostFloors,
    loadPostDetail,
    prefetchPostDetail,
    reloadCurrentPostDetail,
    loadSubPosts,
    loadMoreSubPosts,
    reloadCurrentSubPosts,
    reloadCurrentPostThread,
  };
}
