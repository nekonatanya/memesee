export function buildSubPostThreadStateLayoutInput({ subPostThreadState }) {
  return {
    showTopSubPostComposer: subPostThreadState.showTopSubPostComposer,
    activeSubPostTarget: subPostThreadState.activeSubPostTarget,
    subPostInput: subPostThreadState.subPostInput,
    submittingSubPost: subPostThreadState.submittingSubPost,
    collapsedSubPostBranches: subPostThreadState.collapsedSubPostBranches,
    subPostMoreMenuId: subPostThreadState.subPostMoreMenuId,
  };
}
