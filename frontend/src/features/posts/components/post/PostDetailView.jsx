import SubPostPanel from "../sub-post/SubPostPanel";
import DetailContent from "./DetailContent";
import DetailHeader from "./DetailHeader";
import DetailInteract from "./DetailInteract";
import RichGallery from "./RichGallery";

export default function PostDetailView({
  statusProps,
  headerProps,
  galleryProps,
  contentProps,
  interactionProps,
  subPostPanelProps,
}) {
  const {
    loadingPostDetail,
    refreshingCurrentPostThread,
    selectedPost,
    refreshCurrentPostThread,
  } = statusProps;
  const hasLoadedSelectedPost = Boolean(selectedPost?.contentLoaded);
  const showInitialLoading = loadingPostDetail && !hasLoadedSelectedPost;
  const showRetryState = !loadingPostDetail && !hasLoadedSelectedPost;
  const showSelectedPost = selectedPost && hasLoadedSelectedPost;

  return (
    <section className="feed-grid">
      {showInitialLoading && (
        <article className="neo-card empty-state">正在加载主帖...</article>
      )}
      {showRetryState && (
        <article className="neo-card empty-state">
          <p>没有找到这条主帖，请返回首页重试。</p>
          <div className="btn-group">
            <button
              type="button"
              className="neo-btn small"
              onClick={refreshCurrentPostThread}
              disabled={refreshingCurrentPostThread}
            >
              {refreshingCurrentPostThread ? "重试中..." : "重试加载"}
            </button>
          </div>
        </article>
      )}
      {showSelectedPost && (
        <article className={`post-detail-paper ${loadingPostDetail ? "is-refreshing" : ""}`}>
          <DetailHeader selectedPost={selectedPost} {...headerProps} />
          {selectedPost.postMode === "rich" && galleryProps.richDetailImages.length > 0 && (
            <RichGallery {...galleryProps} />
          )}
          <DetailContent {...contentProps} />
          <DetailInteract selectedPost={selectedPost} {...interactionProps} />
          <SubPostPanel {...subPostPanelProps} />
        </article>
      )}
    </section>
  );
}
