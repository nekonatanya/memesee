import {
  buildMainPostDetailQueryRuntime,
  buildMainPostFeedQueryRuntime,
} from "../../../features/posts/state/mainPostQueryRuntimeHelpers";

export function buildFeedQueryRuntime(feedView = {}) {
  return {
    ...buildMainPostFeedQueryRuntime({
      setPosts: feedView.setPosts,
      reloadCurrentFeed: feedView.reloadCurrentFeed,
    }),
    posts: feedView.posts,
    selectedCommunitySlug: feedView.selectedCommunitySlug,
    setSelectedCommunitySlug: feedView.setSelectedCommunitySlug,
    feedQueryState: feedView.feedQueryState,
    commitSearch: feedView.commitSearch,
    refreshFeed: feedView.refreshFeed,
    backToTop: feedView.backToTop,
    closeSortMenu: feedView.closeSortMenu,
    loadingPosts: feedView.loadingPosts,
    feedSortMode: feedView.feedSortMode,
  };
}

export function buildDetailQueryRuntime(postDetailView = {}) {
  return {
    selectedPost: postDetailView.selectedPost,
    selectedLikeCount: postDetailView.selectedLikeCount,
    selectedFavoriteCount: postDetailView.selectedFavoriteCount,
    subPosts: postDetailView.subPosts,
    setSubPosts: postDetailView.setSubPosts,
    loadingMoreSubPosts: postDetailView.loadingMoreSubPosts,
    subPostsHasMore: postDetailView.subPostsHasMore,
    loadMoreSubPosts: postDetailView.loadMoreSubPosts,
    orderedSubPostFloors: postDetailView.orderedSubPostFloors,
    subPostNodeMap: postDetailView.subPostNodeMap,
    loadingPostDetail: postDetailView.loadingPostDetail,
    loadingSubPosts: postDetailView.loadingSubPosts,
    ...buildMainPostDetailQueryRuntime({
      currentDetailPostId: postDetailView.selectedPost?.id,
      setPostDetail: postDetailView.setPostDetail,
      loadPostDetail: postDetailView.loadPostDetail,
      prefetchPostDetail: postDetailView.prefetchPostDetail,
      reloadCurrentPostDetail: postDetailView.reloadCurrentPostDetail,
      reloadCurrentPostThread: postDetailView.reloadCurrentPostThread,
    }),
  };
}

export function buildAppDataQueryRuntimes({
  feedView,
  postDetailView,
}) {
  return {
    feedQueryRuntime: buildFeedQueryRuntime(feedView),
    detailQueryRuntime: buildDetailQueryRuntime(postDetailView),
  };
}
