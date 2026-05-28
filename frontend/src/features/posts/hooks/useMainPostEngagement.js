import { useCallback, useEffect } from "react";
import {
  toggleMainPostFavorite as toggleContentMainPostFavorite,
  toggleMainPostLike as toggleContentMainPostLike,
} from "../../content/api/contentApi";
import { buildMainPostEngagementMutationStrategy } from "../state/mainPostMutationStrategyHelpers";
import { UI_MESSAGES, readableError } from "../../../shared/state/uiMessages";

export function useMainPostEngagement({
  route,
  isLoggedIn,
  token,
  client,
  setMessage,
  syncUserProgressFromPayload,
  feedQueryRuntime,
  detailQueryRuntime,
  mainPostMutationInterface,
}) {
  const selectedPost = detailQueryRuntime?.selectedPost;
  const posts = Array.isArray(feedQueryRuntime?.posts) ? feedQueryRuntime.posts : [];
  const feedSortMode = feedQueryRuntime?.feedSortMode;

  const reportUserActivity = useCallback(async (activity, options = {}) => {
    if (!isLoggedIn || !token) {
      return null;
    }
    try {
      const response = await client.post("/api/users/activity/report", activity, {
        headers: { Authorization: `Bearer ${token}` },
      });
      syncUserProgressFromPayload(response?.data);
      return response?.data || null;
    } catch (error) {
      if (!options.silent) {
        setMessage(readableError(error, UI_MESSAGES.activitySyncFailed));
      }
      return null;
    }
  }, [client, isLoggedIn, setMessage, syncUserProgressFromPayload, token]);

  useEffect(() => {
    if (!isLoggedIn || route.type !== "post" || !selectedPost?.id) {
      return;
    }
    reportUserActivity(
      {
        type: "MAIN_POST_READ",
        mainPostId: selectedPost.id,
        communitySlug: selectedPost.communitySlug || "",
      },
      { silent: true },
    );
  }, [isLoggedIn, reportUserActivity, route.type, selectedPost?.communitySlug, selectedPost?.id]);

  useEffect(() => {
    if (!isLoggedIn || route.type !== "post" || !selectedPost?.id) {
      return;
    }
    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }
      reportUserActivity(
        { type: "READ_SECONDS", seconds: 30, mainPostId: selectedPost.id },
        { silent: true },
      );
    }, 30000);
    return () => window.clearInterval(interval);
  }, [isLoggedIn, reportUserActivity, route.type, selectedPost?.id]);

  async function togglePostLike(mainPostId, likedByMe) {
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    try {
      const response = await toggleContentMainPostLike(client, {
        token,
        mainPostId,
        likedByMe,
      });
      const nextHotScore = Number(response?.hotScore);
      const nextCount = Number(response?.likeCount || 0);
      const nextLikedByMe = Boolean(response?.likedByMe);
      const engagementState = {
        likeCount: nextCount,
        likedByMe: nextLikedByMe,
        hotScore: nextHotScore,
      };
      const mutationStrategy = buildMainPostEngagementMutationStrategy({
        mainPostId,
        engagementState,
        feedSortMode,
      });
      await mainPostMutationInterface.executeMainPostMutationStrategy(mutationStrategy);
      if (!likedByMe) {
        const targetAuthor = (() => {
          if (selectedPost && selectedPost.id === mainPostId) {
            return selectedPost.author;
          }
          const feedPost = posts.find((post) => post.id === mainPostId);
          return feedPost?.author || "";
        })();
        await reportUserActivity(
          { type: "LIKE_GIVEN", targetUsername: targetAuthor },
          { silent: true },
        );
      }
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.genericOperationFailed));
    }
  }

  async function togglePostFavorite(mainPostId, favoritedByMe) {
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    try {
      const response = await toggleContentMainPostFavorite(client, {
        token,
        mainPostId,
        favoritedByMe,
      });
      const nextHotScore = Number(response?.hotScore);
      const nextCount = Number(response?.favoriteCount || 0);
      const nextFavoritedByMe = Boolean(response?.favoritedByMe);
      const engagementState = {
        favoriteCount: nextCount,
        favoritedByMe: nextFavoritedByMe,
        hotScore: nextHotScore,
      };
      const mutationStrategy = buildMainPostEngagementMutationStrategy({
        mainPostId,
        engagementState,
        feedSortMode,
      });
      await mainPostMutationInterface.executeMainPostMutationStrategy(mutationStrategy);
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.genericOperationFailed));
    }
  }

  function handlePostReport() {
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    setMessage(UI_MESSAGES.reportUnavailable);
  }

  return {
    reportUserActivity,
    togglePostLike,
    togglePostFavorite,
    handlePostReport,
  };
}
