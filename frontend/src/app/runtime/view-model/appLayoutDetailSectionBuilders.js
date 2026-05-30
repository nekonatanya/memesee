export function buildDetailStatusProps({ detail }) {
  return {
    loadingPostDetail: detail.loadingPostDetail,
    refreshingCurrentPostThread: detail.refreshingCurrentPostThread,
    selectedPost: detail.selectedPost,
    refreshCurrentPostThread: detail.refreshCurrentPostThread,
  };
}

export function buildDetailHeaderProps({ shell, actions, helpers }) {
  return {
    authorInitial: helpers.authorInitial,
    formatTime: helpers.formatTime,
  };
}

export function buildDetailGalleryProps({ detail }) {
  return {
    richDetailImages: detail.richDetailImages,
    richOriginalImages: detail.richOriginalImages,
    richImageSources: detail.richImageSources,
    detailMediaIndex: detail.detailMediaIndex,
    setDetailMediaIndex: detail.setDetailMediaIndex,
    openImageViewer: detail.openImageViewer,
  };
}

export function buildDetailContentProps({ detail }) {
  return {
    detailMarkdown: detail.detailMarkdown,
  };
}

export function buildDetailInteractionProps({ shell, detail, subPostThread, refs, helpers }) {
  return {
    metaProps: {
      selectedLikeCount: detail.selectedLikeCount,
      selectedFavoriteCount: detail.selectedFavoriteCount,
      formatHeatScore: helpers.formatHeatScore,
      formatTime: helpers.formatTime,
    },
    actionProps: {
      isLoggedIn: shell.isLoggedIn,
      openMainPostSubPostComposer: subPostThread.openMainPostSubPostComposer,
      togglePostLike: detail.togglePostLike,
      togglePostFavorite: detail.togglePostFavorite,
      handlePostReport: detail.handlePostReport,
      requireAuthNotice: subPostThread.requireAuthNotice,
    },
    composerProps: {
      showTopSubPostComposer: subPostThread.showTopSubPostComposer,
      activeSubPostTarget: subPostThread.activeSubPostTarget,
      subPostInput: subPostThread.subPostInput,
      setSubPostInput: subPostThread.setSubPostInput,
      submittingSubPost: subPostThread.submittingSubPost,
      submitSubPost: subPostThread.submitSubPost,
      cancelTopSubPostComposer: subPostThread.cancelTopSubPostComposer,
      subPostComposerRef: refs.subPostComposerRef,
      subPostTextareaRef: refs.subPostTextareaRef,
    },
  };
}

export function buildSubPostPanelProps({ shell, detail, subPostThread, actions, helpers }) {
  return {
    listProps: {
      loadingSubPosts: detail.loadingSubPosts,
      loadingMoreSubPosts: detail.loadingMoreSubPosts,
      subPostsHasMore: detail.subPostsHasMore,
      loadMoreSubPosts: detail.loadMoreSubPosts,
      selectedPost: detail.selectedPost,
      subPosts: detail.subPosts,
      orderedSubPostFloors: detail.orderedSubPostFloors,
      subPostNodeMap: detail.subPostNodeMap,
    },
    managementProps: {
      allowPostManagement: shell.route?.manageSource === "profile-published",
      currentUser: shell.currentUser,
      openEditComposer: actions.openEditComposer,
      deletePost: actions.deletePost,
    },
    composerProps: {
      activeSubPostTarget: subPostThread.activeSubPostTarget,
      subPostInput: subPostThread.subPostInput,
      setSubPostInput: subPostThread.setSubPostInput,
      submittingSubPost: subPostThread.submittingSubPost,
      submitSubPost: subPostThread.submitSubPost,
      isLoggedIn: shell.isLoggedIn,
      startNestedSubPostComposer: subPostThread.startNestedSubPostComposer,
      cancelNestedSubPostComposer: subPostThread.cancelNestedSubPostComposer,
    },
    interactionProps: {
      collapsedSubPostBranches: subPostThread.collapsedSubPostBranches,
      subPostMoreMenuId: subPostThread.subPostMoreMenuId,
      toggleSubPostBranches: subPostThread.toggleSubPostBranches,
      jumpToSubPostFloor: subPostThread.jumpToSubPostFloor,
      toggleSubPostMoreMenu: subPostThread.toggleSubPostMoreMenu,
      handleSubPostFavoriteFromMenu: subPostThread.handleSubPostFavoriteFromMenu,
      handleSubPostReport: subPostThread.handleSubPostReport,
      toggleSubPostLike: subPostThread.toggleSubPostLike,
      deleteSubPost: subPostThread.deleteSubPost,
      currentUser: shell.currentUser,
    },
    helperProps: {
      authorInitial: helpers.authorInitial,
      formatTime: helpers.formatTime,
      subPostQuotePreview: helpers.subPostQuotePreview,
    },
  };
}
