import PostCard from "../../posts/components/post/PostCard";

export default function PostList({
  loadingPosts,
  filteredPosts,
  openPostDetail,
  prefetchMainPostDetail,
  formatTime,
  clampText,
  formatHeatScore,
  feedHasMore,
  loadingMorePosts,
  feedLoadMoreRef,
}) {
  const hasPosts = Array.isArray(filteredPosts) && filteredPosts.length > 0;

  return (
    <div className={`post-list-flow ${loadingPosts && hasPosts ? "is-refreshing" : ""}`}>
      {loadingPosts && !hasPosts && (
        <div className="feed-status-card is-loading" role="status" aria-live="polite">
          <span className="feed-status-kicker">主帖信息流</span>
          <strong>正在加载主帖</strong>
          <span className="feed-status-subtext">稍等一下，正在整理最新内容。</span>
          <span className="feed-status-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>
      )}
      {!loadingPosts && !hasPosts && (
        <div className="feed-status-card feed-status-card-empty">
          <div className="feed-status-mainline">
            <span className="feed-status-mark" aria-hidden="true" />
            <strong>没有匹配的主帖</strong>
          </div>
          <span className="feed-status-subtext">这片区域暂时很安静。可以换个关键词、切回大厅，或发布一条新主帖。</span>
        </div>
      )}
      {hasPosts &&
        filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            openPostDetail={openPostDetail}
            prefetchMainPostDetail={prefetchMainPostDetail}
            formatTime={formatTime}
            clampText={clampText}
            formatHeatScore={formatHeatScore}
          />
        ))}
      {!loadingPosts && hasPosts && (
        <div ref={feedLoadMoreRef} className="feed-load-more">
          {loadingMorePosts ? "正在加载更多..." : feedHasMore ? "继续下滑加载更多" : "已经到底了"}
        </div>
      )}
    </div>
  );
}
