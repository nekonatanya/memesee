import { deleteMainPost as deleteContentMainPost } from "../../content/api/contentApi";
import { buildDeletedMainPostMutationStrategy } from "../state/mainPostMutationStrategyHelpers";
import {
  navigateToHome,
  navigateToPost,
} from "../../../shared/state/appHelpers";
import { confirmInBrowser } from "../../../shared/platform/browserDialog";
import { UI_MESSAGES, readableError } from "../../../shared/state/uiMessages";

export function useMainPostActions({
  client,
  token,
  isLoggedIn,
  currentUser,
  route,
  detailQueryRuntime,
  feedQueryRuntime,
  editingMainPostId,
  setMessage,
  resetComposerForm,
  removeProfilePost,
  setView,
  setRoute,
  mainPostMutationInterface,
}) {
  const selectedPost = detailQueryRuntime?.selectedPost;
  const commitSearch = feedQueryRuntime?.commitSearch;
  const prefetchPostDetail = detailQueryRuntime?.prefetchPostDetail;

  function feedSortLabel(mode) {
    switch (mode) {
      case "most_views":
        return "浏览最多";
      case "most_heat":
        return "热度最高";
      case "latest_message":
      default:
        return "最新活跃";
    }
  }

  function openPostDetail(post, options = {}) {
    if (post?.id && typeof detailQueryRuntime?.setPostDetail === "function") {
      detailQueryRuntime.setPostDetail(post);
    }
    if (typeof detailQueryRuntime?.setSubPosts === "function") {
      detailQueryRuntime.setSubPosts([]);
    }
    navigateToPost(post.id, setRoute, options);
  }

  function prefetchMainPostDetail(post) {
    if (post?.id && typeof prefetchPostDetail === "function") {
      prefetchPostDetail(post.id);
    }
  }

  async function deletePost(post) {
    if (!post || !post.id) {
      return;
    }
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    if (post.author !== currentUser) {
      setMessage(UI_MESSAGES.onlyAuthorCanDelete);
      return;
    }
    const confirmed = await confirmInBrowser(
      "确定要删除主帖《" +
      post.title +
      "》吗？此操作无法撤销。",
      {
        title: "删除主帖",
        confirmLabel: "删除",
        variant: "danger",
      },
    );
    if (!confirmed) {
      return;
    }
    try {
      await deleteContentMainPost(client, {
        token,
        mainPostId: post.id,
      });
      const mutationStrategy = buildDeletedMainPostMutationStrategy({
        route,
        selectedPostId: selectedPost?.id,
        editingMainPostId,
        deletedPostId: post.id,
      });
      await mainPostMutationInterface.executeMainPostMutationStrategyWithFollowUp(
        mutationStrategy,
        {
          navigateHome: () => navigateToHome(setRoute),
          resetComposerForm,
        },
      );
      removeProfilePost?.(post.id);
      setMessage(UI_MESSAGES.mainPostDeleted);
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.mainPostDeleteFailed));
    }
  }

  function applySearch() {
    commitSearch?.();
    setView("latest");
    navigateToHome(setRoute);
  }
  return {
    feedSortLabel,
    openPostDetail,
    prefetchMainPostDetail,
    deletePost,
    applySearch,
  };
}
