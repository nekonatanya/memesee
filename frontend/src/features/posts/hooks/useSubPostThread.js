import { useEffect, useState } from "react";
import {
  createSubPost as createContentSubPost,
  deleteSubPost as deleteContentSubPost,
  toggleSubPostFavorite as toggleContentSubPostFavorite,
  toggleSubPostLike as toggleContentSubPostLike,
} from "../../content/api/contentApi";
import { normalizeSubPostPayload } from "../state/mainPostModel";
import { confirmInBrowser } from "../../../shared/platform/browserDialog";
import { buildCreatedSubPostMutationStrategy } from "../state/mainPostMutationStrategyHelpers";
import {
  buildCollapsedSubPostBranches,
  scheduleSubPostFloorScroll,
  toggleSubPostBranchState,
  toggleSubPostMenuState,
  updateSubPostInteraction,
} from "../state/subPostThreadHelpers";
import { UI_MESSAGES, readableError } from "../../../shared/state/uiMessages";

export function useSubPostThread({
  routeType,
  mainPostId,
  isLoggedIn,
  detailQueryRuntime,
  token,
  client,
  setMessage,
  reportUserActivity,
  currentUser,
  topbarRef,
  subPostTextareaRef,
  removeProfileSubPost,
  mainPostMutationInterface,
}) {
  const selectedPost = detailQueryRuntime?.selectedPost;
  const setSubPosts = detailQueryRuntime?.setSubPosts;
  const orderedSubPostFloors = detailQueryRuntime?.orderedSubPostFloors;
  const [submittingSubPost, setSubmittingSubPost] = useState(false);
  const [subPostInput, setSubPostInput] = useState("");
  const [activeSubPostTarget, setActiveSubPostTarget] = useState(null);
  const [showTopSubPostComposer, setShowTopSubPostComposer] = useState(false);
  const [collapsedSubPostBranches, setCollapsedSubPostBranches] = useState({});
  const [subPostMoreMenuId, setSubPostMoreMenuId] = useState("");

  useEffect(() => {
    setSubPostInput("");
    setActiveSubPostTarget(null);
    setShowTopSubPostComposer(false);
    setCollapsedSubPostBranches({});
    setSubPostMoreMenuId("");
  }, [routeType, mainPostId]);

  useEffect(() => {
    if (!Array.isArray(orderedSubPostFloors) || orderedSubPostFloors.length === 0) {
      setCollapsedSubPostBranches({});
      return;
    }
    setCollapsedSubPostBranches((prev) =>
      buildCollapsedSubPostBranches(prev, orderedSubPostFloors),
    );
  }, [orderedSubPostFloors]);

  useEffect(() => {
    if (!subPostMoreMenuId) {
      return;
    }
    const close = () => setSubPostMoreMenuId("");
    const onClick = (event) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest(".sub-post-more-wrap")) {
        close();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        close();
      }
    };
    const timerId = window.setTimeout(() => {
      window.addEventListener("click", onClick);
      window.addEventListener("keydown", onKeyDown);
    }, 0);
    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [subPostMoreMenuId]);

  function requireAuthNotice() {
    setMessage(UI_MESSAGES.authRequired);
  }

  function openMainPostSubPostComposer() {
    if (!isLoggedIn) {
      requireAuthNotice();
      return;
    }
    setActiveSubPostTarget(null);
    setShowTopSubPostComposer(true);
    window.setTimeout(() => {
      subPostTextareaRef.current?.focus();
    }, 40);
  }

  function startNestedSubPostComposer(subPost, composerInstanceId = "") {
    if (!isLoggedIn) {
      requireAuthNotice();
      return;
    }
    setShowTopSubPostComposer(false);
    setActiveSubPostTarget({
      id: subPost.id,
      author: subPost.author,
      composerInstanceId,
    });
  }

  function cancelNestedSubPostComposer() {
    setActiveSubPostTarget(null);
  }

  function cancelTopSubPostComposer() {
    setShowTopSubPostComposer(false);
    setSubPostInput("");
  }

  async function submitSubPost(event) {
    event.preventDefault();
    if (!selectedPost) {
      return;
    }
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    const trimmed = subPostInput.trim();
    const targetSubPostId = Number(activeSubPostTarget?.id || 0) || null;
    const isTopLevelSubPost = !targetSubPostId;
    if (!trimmed) {
      setMessage(UI_MESSAGES.subPostContentRequired);
      return;
    }
    setSubmittingSubPost(true);
    try {
      const createdSubPost = normalizeSubPostPayload(await createContentSubPost(client, {
        token,
        mainPostId: selectedPost.id,
        parentSubPostId: targetSubPostId,
        content: trimmed,
        mediaAssetIds: [],
      }));
      const latestMessageAt = createdSubPost.createdAt || new Date().toISOString();
      setSubPostInput("");
      setActiveSubPostTarget(null);
      if (isTopLevelSubPost) {
        setShowTopSubPostComposer(false);
      }
      if (targetSubPostId) {
        setCollapsedSubPostBranches((prev) => ({
          ...prev,
          [targetSubPostId]: false,
        }));
      }
      await reportUserActivity(
        { type: "SUB_POST_CREATED", communitySlug: selectedPost.communitySlug || "" },
        { silent: true },
      );
      const mutationStrategy = buildCreatedSubPostMutationStrategy({
        selectedPostId: selectedPost?.id,
        targetMainPostId: selectedPost.id,
        latestMessageAt,
      });
      await mainPostMutationInterface.executeMainPostMutationStrategy(mutationStrategy);
      setMessage(UI_MESSAGES.subPostCreated);
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.subPostCreateFailed));
    } finally {
      setSubmittingSubPost(false);
    }
  }

  async function toggleSubPostLike(subPostId, likedByMe, subPostAuthor = "") {
    if (!selectedPost) {
      return;
    }
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    try {
      const response = await toggleContentSubPostLike(client, {
        token,
        subPostId,
        likedByMe,
      });
      const nextCount = Number(response?.likeCount || 0);
      const nextLikedByMe = Boolean(response?.likedByMe);
      setSubPosts((prev) =>
        updateSubPostInteraction(prev, subPostId, {
          likeCount: nextCount,
          likedByMe: nextLikedByMe,
        }),
      );
      if (!likedByMe) {
        await reportUserActivity(
          { type: "LIKE_GIVEN", targetUsername: subPostAuthor },
          { silent: true },
        );
      }
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.genericOperationFailed));
    }
  }

  async function toggleSubPostFavorite(subPostId, favoritedByMe) {
    if (!selectedPost) {
      return;
    }
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    try {
      const response = await toggleContentSubPostFavorite(client, {
        token,
        subPostId,
        favoritedByMe,
      });
      const nextCount = Number(response?.favoriteCount || 0);
      const nextFavoritedByMe = Boolean(response?.favoritedByMe);
      setSubPosts((prev) =>
        updateSubPostInteraction(prev, subPostId, {
          favoriteCount: nextCount,
          favoritedByMe: nextFavoritedByMe,
        }),
      );
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.genericOperationFailed));
    }
  }

  async function deleteSubPost(subPost) {
    if (!subPost || !subPost.id) {
      return;
    }
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    const subPostAuthor = subPost.author || subPost.authorUsername || "";
    if (subPostAuthor !== currentUser) {
      setMessage(UI_MESSAGES.onlySubPostAuthorCanDelete);
      return;
    }
    const confirmed = await confirmInBrowser("确定要删除这条子帖吗？此操作无法撤销。", {
      title: "删除子帖",
      confirmLabel: "删除",
      variant: "danger",
    });
    if (!confirmed) {
      return;
    }
    try {
      await deleteContentSubPost(client, {
        token,
        subPostId: subPost.id,
      });
      setSubPosts((prev) =>
        (Array.isArray(prev) ? prev : []).filter((item) => item.id !== subPost.id),
      );
      removeProfileSubPost?.(subPost.id);
      setMessage(UI_MESSAGES.subPostDeleted);
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.subPostDeleteFailed));
    }
  }

  function jumpToSubPostFloor(subPostId) {
    const normalizedId = Number(subPostId);
    if (!Number.isFinite(normalizedId) || normalizedId <= 0) {
      return;
    }
    setCollapsedSubPostBranches((prev) => ({
      ...prev,
      [normalizedId]: false,
    }));
    scheduleSubPostFloorScroll(normalizedId, topbarRef);
  }

  function toggleSubPostBranches(subPostId) {
    setCollapsedSubPostBranches((prev) => toggleSubPostBranchState(prev, subPostId));
  }

  function toggleSubPostMoreMenu(menuId) {
    setSubPostMoreMenuId((prev) => toggleSubPostMenuState(prev, menuId));
  }

  async function handleSubPostFavoriteFromMenu(subPostId, favoritedByMe) {
    await toggleSubPostFavorite(subPostId, favoritedByMe);
  }

  function handleSubPostReport() {
    if (!isLoggedIn) {
      requireAuthNotice();
      return;
    }
    setMessage(UI_MESSAGES.reportUnavailable);
  }

  return {
    submittingSubPost,
    subPostInput,
    activeSubPostTarget,
    showTopSubPostComposer,
    collapsedSubPostBranches,
    subPostMoreMenuId,
    setSubPostInput,
    submitSubPost,
    toggleSubPostLike,
    toggleSubPostFavorite,
    deleteSubPost,
    openMainPostSubPostComposer,
    startNestedSubPostComposer,
    cancelNestedSubPostComposer,
    cancelTopSubPostComposer,
    jumpToSubPostFloor,
    toggleSubPostBranches,
    toggleSubPostMoreMenu,
    handleSubPostFavoriteFromMenu,
    handleSubPostReport,
    requireAuthNotice,
  };
}
