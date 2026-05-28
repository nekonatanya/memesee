export function buildDetailPresentationLayoutInput({
  appChrome,
  postDetailView,
}) {
  return {
    detailMarkdown: postDetailView.detailMarkdown,
    richDetailImages: postDetailView.richDetailImages,
    detailMediaIndex: appChrome.detailMediaIndex,
    setDetailMediaIndex: appChrome.setDetailMediaIndex,
    openImageViewer: appChrome.openImageViewer,
  };
}
