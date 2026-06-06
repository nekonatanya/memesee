import PostDetailArticle from "./PostDetailArticle";
import PostDetailLayout from "./PostDetailLayout";
import {
  PostDetailLoadingState,
  PostDetailRetryState,
} from "./PostDetailStates";

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
    <PostDetailLayout>
      {showInitialLoading && <PostDetailLoadingState />}
      {showRetryState && (
        <PostDetailRetryState
          refreshingCurrentPostThread={refreshingCurrentPostThread}
          refreshCurrentPostThread={refreshCurrentPostThread}
        />
      )}
      {showSelectedPost && (
        <PostDetailArticle
          loadingPostDetail={loadingPostDetail}
          selectedPost={selectedPost}
          headerProps={headerProps}
          galleryProps={galleryProps}
          contentProps={contentProps}
          interactionProps={interactionProps}
          subPostPanelProps={subPostPanelProps}
        />
      )}
    </PostDetailLayout>
  );
}
