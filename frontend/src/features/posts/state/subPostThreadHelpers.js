import { formatTime } from "../../../shared/state/appHelpers";
import { mergeMainPostState } from "./mainPostStateHelpers";

export function buildCollapsedSubPostBranches(prevState, orderedSubPostFloors) {
  const previous = prevState && typeof prevState === "object" ? prevState : {};
  const floors = Array.isArray(orderedSubPostFloors) ? orderedSubPostFloors : [];

  if (floors.length === 0) {
    return {};
  }

  const next = {};
  floors.forEach((subPost) => {
    const branchSubPosts = Array.isArray(subPost.branchSubPosts)
      ? subPost.branchSubPosts
      : [];
    if (branchSubPosts.length > 0) {
      next[subPost.id] = Object.prototype.hasOwnProperty.call(previous, subPost.id)
        ? Boolean(previous[subPost.id])
        : true;
    }
  });

  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);
  const isSame =
    previousKeys.length === nextKeys.length &&
    previousKeys.every((key) => previous[key] === next[key]);

  return isSame ? previous : next;
}

export function updateSubPostInteraction(subPosts, subPostId, patch) {
  return (Array.isArray(subPosts) ? subPosts : []).map((subPost) =>
    subPost.id === subPostId ? { ...subPost, ...patch } : subPost,
  );
}

export function updatePostDetailAfterSubPostCreated(postDetail, selectedPostId, latestActivityAt) {
  if (!postDetail || postDetail.id !== selectedPostId) {
    return postDetail;
  }
  return mergeMainPostState(
    postDetail,
    {
      subPostCount: Number(postDetail.subPostCount || 0) + 1,
      latestActivityAt,
      latestActivityAtText: formatTime(latestActivityAt),
    },
    { recalculateHotScore: true },
  );
}

export function toggleSubPostBranchState(prevState, subPostId) {
  return {
    ...(prevState && typeof prevState === "object" ? prevState : {}),
    [subPostId]: !prevState?.[subPostId],
  };
}

export function toggleSubPostMenuState(currentMenuId, nextMenuId) {
  return currentMenuId === nextMenuId ? "" : nextMenuId;
}

export function scheduleSubPostFloorScroll(subPostId, topbarRef) {
  const normalizedId = Number(subPostId);
  if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const target = document.getElementById(`sub-post-floor-${normalizedId}`);
      if (!target) {
        return;
      }
      const topbarHeight = Math.max(0, topbarRef.current?.getBoundingClientRect().height || 0);
      const safeGap = 12;
      const targetTop =
        window.scrollY + target.getBoundingClientRect().top - topbarHeight - safeGap;
      window.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
    });
  });
}
