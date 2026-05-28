export function buildComposerSessionProps({ shell, composer }) {
  return {
    isLoggedIn: shell.isLoggedIn,
    currentUser: shell.currentUser,
    publishing: composer.publishing,
    editingPostId: composer.editingMainPostId,
  };
}

export function buildComposerContentProps({ composer }) {
  return {
    title: composer.title,
    isTitlePreviewMode: composer.isTitlePreviewMode,
    composerTags: composer.composerTags,
    showTagEditor: composer.showTagEditor,
    composerTagDraft: composer.composerTagDraft,
    composerMode: composer.composerMode,
    content: composer.content,
  };
}

export function buildComposerCommunityProps({ community, composer }) {
  return {
    composerCommunityName: composer.composerCommunityName,
    orderedCommunities: community.orderedCommunities,
    composerCommunitySlug: composer.composerCommunitySlug,
    composeCommunityMenuOpen: composer.composeCommunityMenuOpen,
  };
}

export function buildComposerMediaProps({ detail, composer }) {
  return {
    composerMediaUrls: composer.composerMediaUrls,
    composerMediaIndex: composer.composerMediaIndex,
    uploadingAssets: composer.uploadingAssets,
    openImageViewer: detail.openImageViewer,
  };
}

export function buildComposerActionProps({ composer }) {
  return {
    setTitle: composer.setTitle,
    commitComposerTitlePreview: composer.commitComposerTitlePreview,
    editComposerTitle: composer.editComposerTitle,
    removeComposerTag: composer.removeComposerTag,
    addComposerTag: composer.addComposerTag,
    closeComposerTagEditor: composer.closeComposerTagEditor,
    handleComposerTagInputKeyDown: composer.handleComposerTagInputKeyDown,
    toggleComposerTagEditor: composer.toggleComposerTagEditor,
    setComposerMediaIndex: composer.setComposerMediaIndex,
    removeComposerMediaAt: composer.removeComposerMediaAt,
    moveComposerMedia: composer.moveComposerMedia,
    handleComposerContentChange: composer.handleComposerContentChange,
    setComposerCommunitySlug: composer.setComposerCommunitySlug,
    setComposeCommunityMenuOpen: composer.setComposeCommunityMenuOpen,
    setComposerMode: composer.setComposerMode,
    setComposerTagDraft: composer.setComposerTagDraft,
    onComposerAssetPicked: composer.onComposerAssetPicked,
    submitPost: composer.submitPost,
  };
}

export function buildComposerRefProps({ refs, helpers }) {
  return {
    composerTitleInputRef: refs.composerTitleInputRef,
    composerTagInputRef: refs.composerTagInputRef,
    composerContentRef: refs.composerContentRef,
    composeCommunityMenuRef: refs.composeCommunityMenuRef,
    authorInitial: helpers.authorInitial,
  };
}
