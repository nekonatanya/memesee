import PostCard from "../../posts/components/post/PostCard";
import { StatusCard } from "../../../shared/components/PageShell";

const FEED_EAGER_PREVIEW_POST_COUNT = 2;

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
        <StatusCard
          kicker="主帖信息流"
          title="主帖马上出现"
          description="正在取回最新内容，很快就好。"
          tone="loading"
          role="status"
          ariaLive="polite"
        >
          <span className="feed-status-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </StatusCard>
      )}
      {!loadingPosts && !hasPosts && (
        <StatusCard
          title="没有匹配的主帖"
          description="这片区域暂时很安静。可以换个关键词、切回大厅，或发布一条新主帖。"
          tone="empty"
        />
      )}
      {hasPosts &&
        filteredPosts.map((post, postIndex) => (
          <PostCard
            key={post.id}
            post={post}
            prioritizePreviewImages={postIndex < FEED_EAGER_PREVIEW_POST_COUNT}
            openPostDetail={openPostDetail}
            prefetchMainPostDetail={prefetchMainPostDetail}
            formatTime={formatTime}
            clampText={clampText}
            formatHeatScore={formatHeatScore}
          />
        ))}
      {!loadingPosts && hasPosts && (
        <div ref={feedLoadMoreRef} className="feed-load-more">
          {loadingMorePosts ? "正在加载更多内容..." : feedHasMore ? "继续下滑查看更多" : "已经到底了"}
        </div>
      )}
    </div>
  );
}
