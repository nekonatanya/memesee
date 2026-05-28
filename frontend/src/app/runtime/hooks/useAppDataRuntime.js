import {
  apiBase as runtimeApiBase,
  feedBatchSize,
  feedSortModes,
  notificationPageSize,
  profilePostPageSize,
  publishCommunityOrder,
  lobbyCommunity,
} from "../appRuntimeConfig";
import {
  buildDetailQueryRuntime,
  buildFeedQueryRuntime,
} from "../query/appDataQueryRuntimeHelpers";
import { syncLoadedMainPostIntoFeed } from "../../../features/posts/state/mainPostQuerySyncHelpers";
import { syncLoadedMainPostIntoFeedQueryRuntime } from "../../../features/posts/state/mainPostQueryRuntimeHelpers";
import { useCommunitiesCatalog } from "../../../features/communities/hooks/useCommunitiesCatalog";
import { useDetailMarkdown } from "../../../features/posts/hooks/useDetailMarkdown";
import { useFeedView } from "../../../features/feed/hooks/useFeedView";
import { useNotifications } from "../../../features/notifications/hooks/useNotifications";
import { usePostDetailView } from "../../../features/posts/hooks/usePostDetailView";
import { useProfileView } from "../../../features/profile/hooks/useProfileView";

export function useAppDataRuntime({
  client,
  apiBase = runtimeApiBase,
  view,
  topSortRef,
  appChrome,
  authSession,
  setMessage,
}) {
  const feedView = useFeedView({
    client,
    token: authSession.token,
    apiBase,
    routeType: appChrome.route.type,
    view,
    topSortRef,
    setMessage,
    feedBatchSize,
    feedSortModes,
  });
  const feedQueryRuntime = buildFeedQueryRuntime(feedView);

  const communitiesCatalog = useCommunitiesCatalog({
    client,
    publishCommunityOrder,
    lobbyCommunity,
    feedQueryRuntime,
    setMessage,
  });

  const profileViewState = useProfileView({
    view,
    isLoggedIn: authSession.isLoggedIn,
    token: authSession.token,
    orderedCommunities: communitiesCatalog.orderedCommunities,
    levelProgress: authSession.levelProgress,
    userLevel: authSession.userLevel,
    client,
    apiBase,
    setMessage,
    syncUserProgressFromPayload: authSession.syncUserProgressFromPayload,
    profilePostPageSize,
  });

  const notificationsState = useNotifications({
    client,
    token: authSession.token,
    isLoggedIn: authSession.isLoggedIn,
    currentUser: authSession.currentUser,
    setMessage,
    pageSize: notificationPageSize,
  });

  const postDetailBase = usePostDetailView({
    route: appChrome.route,
    token: authSession.token,
    client,
    apiBase,
    setMessage,
    onPostDetailLoaded: (loadedPost) => {
      syncLoadedMainPostIntoFeedQueryRuntime({
        feedQueryRuntime,
        loadedPost,
        syncLoadedMainPostIntoFeed,
      });
    },
  });
  const detailQueryRuntime = buildDetailQueryRuntime(postDetailBase);
  const queryRuntimes = {
    feedQueryRuntime,
    detailQueryRuntime,
  };

  const detailMarkdown = useDetailMarkdown({
    apiBase,
    detailImageUrls: postDetailBase.detailImageUrls,
    selectedPost: postDetailBase.selectedPost,
    openImageViewer: appChrome.openImageViewer,
  });

  return {
    feedView,
    queryRuntimes,
    communitiesCatalogState: {
      ...communitiesCatalog,
    },
    profileViewState,
    notificationsState,
    postDetailView: {
      ...postDetailBase,
      detailMarkdown,
    },
  };
}
