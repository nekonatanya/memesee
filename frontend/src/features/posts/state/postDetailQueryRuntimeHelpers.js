export function isActivePostRoute(route) {
  const mainPostId = Number(route?.mainPostId || 0);
  return route?.type === "post" && Number.isFinite(mainPostId) && mainPostId > 0;
}

export function applyLoadedPostDetail(setPostDetail, onPostDetailLoaded, postDetail) {
  if (typeof setPostDetail === "function") {
    setPostDetail(postDetail);
  }
  if (typeof onPostDetailLoaded === "function") {
    onPostDetailLoaded(postDetail);
  }
  return postDetail;
}

export function applyLoadedSubPosts(setSubPosts, subPosts) {
  if (typeof setSubPosts === "function") {
    setSubPosts(Array.isArray(subPosts) ? subPosts : []);
  }
  return Array.isArray(subPosts) ? subPosts : [];
}

export function buildGuardedPostThreadRuntimeCallbacks({
  isActive,
  setPostDetail,
  onPostDetailLoaded,
  setSubPosts,
  onPostDetailError,
  onSubPostsError,
}) {
  const shouldApply = typeof isActive === "function" ? isActive : () => true;

  return {
    setPostDetail: (nextPostDetail) => {
      if (shouldApply() && typeof setPostDetail === "function") {
        setPostDetail(nextPostDetail);
      }
    },
    onPostDetailLoaded: (nextPostDetail) => {
      if (shouldApply() && typeof onPostDetailLoaded === "function") {
        onPostDetailLoaded(nextPostDetail);
      }
    },
    setSubPosts: (nextSubPosts) => {
      if (shouldApply() && typeof setSubPosts === "function") {
        setSubPosts(nextSubPosts);
      }
    },
    onPostDetailError: (error) => {
      if (shouldApply() && typeof onPostDetailError === "function") {
        onPostDetailError(error);
      }
    },
    onSubPostsError: (error) => {
      if (shouldApply() && typeof onSubPostsError === "function") {
        onSubPostsError(error);
      }
    },
  };
}

export function buildPostThreadMessageHandlers({
  setPostDetail,
  setSubPosts,
  setMessage,
  formatPostDetailError,
  formatSubPostsError,
}) {
  return {
    onPostDetailError: (error) => {
      if (typeof setPostDetail === "function") {
        setPostDetail(null);
      }
      if (typeof setMessage === "function") {
        setMessage(
          typeof formatPostDetailError === "function"
            ? formatPostDetailError(error)
            : error,
        );
      }
    },
    onSubPostsError: (error) => {
      if (typeof setSubPosts === "function") {
        setSubPosts([]);
      }
      if (typeof setMessage === "function") {
        setMessage(
          typeof formatSubPostsError === "function"
            ? formatSubPostsError(error)
            : error,
        );
      }
    },
  };
}

export async function reloadCurrentPostDetailState({
  route,
  authToken,
  loadPostDetail,
  setPostDetail,
  onPostDetailLoaded,
}) {
  if (!isActivePostRoute(route) || typeof loadPostDetail !== "function") {
    return null;
  }

  const nextPostDetail = await loadPostDetail(route.mainPostId, authToken);
  return applyLoadedPostDetail(setPostDetail, onPostDetailLoaded, nextPostDetail);
}

export async function reloadCurrentSubPostsState({
  route,
  authToken,
  loadSubPosts,
  setSubPosts,
}) {
  if (!isActivePostRoute(route) || typeof loadSubPosts !== "function") {
    return [];
  }

  const nextSubPosts = await loadSubPosts(route.mainPostId, authToken);
  return applyLoadedSubPosts(setSubPosts, nextSubPosts);
}

export async function reloadCurrentPostThreadState({
  route,
  authToken,
  loadPostDetail,
  setPostDetail,
  onPostDetailLoaded,
  loadSubPosts,
  setSubPosts,
  onPostDetailError,
  onSubPostsError,
}) {
  if (!isActivePostRoute(route)) {
    return {
      postDetail: null,
      subPosts: [],
    };
  }

  let nextPostDetail = null;
  let nextSubPosts = [];

  const postDetailRequest = (typeof loadPostDetail === "function"
    ? loadPostDetail(route.mainPostId, authToken)
    : Promise.resolve(null))
    .then((postDetail) => {
      nextPostDetail = applyLoadedPostDetail(
        setPostDetail,
        onPostDetailLoaded,
        postDetail,
      );
      return nextPostDetail;
    })
    .catch((error) => {
      if (typeof onPostDetailError === "function") {
        onPostDetailError(error);
      }
      return null;
    });

  const subPostsRequest = (typeof loadSubPosts === "function"
    ? loadSubPosts(route.mainPostId, authToken)
    : Promise.resolve([]))
    .then((subPosts) => {
      nextSubPosts = applyLoadedSubPosts(setSubPosts, subPosts);
      return nextSubPosts;
    })
    .catch((error) => {
      if (typeof onSubPostsError === "function") {
        onSubPostsError(error);
      }
      return [];
    });

  await Promise.allSettled([postDetailRequest, subPostsRequest]);

  return {
    postDetail: nextPostDetail,
    subPosts: nextSubPosts,
  };
}
