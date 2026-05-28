import PostList from "./PostList";

export default function HomeFeed({
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
  return (
    <section className="feed-grid">
      <PostList
        loadingPosts={loadingPosts}
        filteredPosts={filteredPosts}
        openPostDetail={openPostDetail}
        prefetchMainPostDetail={prefetchMainPostDetail}
        formatTime={formatTime}
        clampText={clampText}
        formatHeatScore={formatHeatScore}
        feedHasMore={feedHasMore}
        loadingMorePosts={loadingMorePosts}
        feedLoadMoreRef={feedLoadMoreRef}
      />
    </section>
  );
}
