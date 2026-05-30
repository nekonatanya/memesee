export function buildDetailPresentationLayoutInput({
  appChrome,
  postDetailView,
}) {
  return {
    detailMarkdown: postDetailView.detailMarkdown,
    richDetailImages: postDetailView.richDetailImages,
    richOriginalImages: postDetailView.richOriginalImages,
    richImageSources: postDetailView.richImageSources,
    detailMediaIndex: appChrome.detailMediaIndex,
    setDetailMediaIndex: appChrome.setDetailMediaIndex,
    openImageViewer: appChrome.openImageViewer,
  };
}
