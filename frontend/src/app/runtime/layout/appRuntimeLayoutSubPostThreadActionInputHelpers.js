export function buildSubPostThreadActionLayoutInput({ subPostThreadState }) {
  return {
    openMainPostSubPostComposer: subPostThreadState.openMainPostSubPostComposer,
    setSubPostInput: subPostThreadState.setSubPostInput,
    submitSubPost: subPostThreadState.submitSubPost,
    cancelTopSubPostComposer: subPostThreadState.cancelTopSubPostComposer,
    toggleSubPostBranches: subPostThreadState.toggleSubPostBranches,
    jumpToSubPostFloor: subPostThreadState.jumpToSubPostFloor,
    toggleSubPostMoreMenu: subPostThreadState.toggleSubPostMoreMenu,
    handleSubPostFavoriteFromMenu: subPostThreadState.handleSubPostFavoriteFromMenu,
    handleSubPostReport: subPostThreadState.handleSubPostReport,
    startNestedSubPostComposer: subPostThreadState.startNestedSubPostComposer,
    cancelNestedSubPostComposer: subPostThreadState.cancelNestedSubPostComposer,
    toggleSubPostLike: subPostThreadState.toggleSubPostLike,
    deleteSubPost: subPostThreadState.deleteSubPost,
  };
}
