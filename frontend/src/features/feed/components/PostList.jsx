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
      {loadingPosts && !hasPosts && <div className="neo-card empty-state">加载中...</div>}
      {!loadingPosts && !hasPosts && (
        <div className="neo-card empty-state">没有匹配的主帖。</div>
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
