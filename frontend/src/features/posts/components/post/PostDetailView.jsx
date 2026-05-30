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
        <article className="feed-status-card is-loading" role="status" aria-live="polite">
          <span className="feed-status-kicker">主帖详情</span>
          <strong>正在加载主帖</strong>
          <span className="feed-status-subtext">内容和子帖会分批出现，先把正文请出来。</span>
          <span className="feed-status-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </article>
      )}
      {showRetryState && (
        <article className="feed-status-card feed-status-card-empty">
          <div className="feed-status-mainline">
            <span className="feed-status-mark" aria-hidden="true" />
            <strong>没有找到这条主帖</strong>
          </div>
          <span className="feed-status-subtext">可能已经被删除，或网络刚才慢了一拍。</span>
          <span className="feed-status-subtext">可以返回首页，也可以再试一次加载。</span>
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
