import { useComposerDraft } from "../../../features/composer/hooks/useComposerDraft";
import { useMainPostActions } from "../../../features/posts/hooks/useMainPostActions";
import { useMainPostEngagement } from "../../../features/posts/hooks/useMainPostEngagement";
import { buildInteractionQueryRuntimeDependencies } from "../query/appInteractionQueryRuntimeHelpers";
import { useQueryRuntimeRefreshInterface } from "./useQueryRuntimeRefreshInterface";
import { useSessionCleanup } from "./useSessionCleanup";
import { useShellNavigation } from "./useShellNavigation";
import { useSubPostThread } from "../../../features/posts/hooks/useSubPostThread";

export function useAppInteractionRuntime({
  client,
  apiBase,
  view,
  setView,
  refs,
  appChrome,
  authSession,
  dataRuntime,
  setMessage,
}) {
  const {
    queryRuntimes,
    communitiesCatalogState,
    profileViewState,
    notificationsState,
  } =
    dataRuntime;
  const {
    feedQueryRuntime,
    detailQueryRuntime,
    mainPostMutationInterface,
    queryRuntimeActionRuntime,
  } = buildInteractionQueryRuntimeDependencies(queryRuntimes);

  const mainPostEngagement = useMainPostEngagement({
    route: appChrome.route,
    isLoggedIn: authSession.isLoggedIn,
    token: authSession.token,
    client,
    setMessage,
    syncUserProgressFromPayload: authSession.syncUserProgressFromPayload,
    feedQueryRuntime,
    detailQueryRuntime,
    mainPostMutationInterface,
  });

  const queryRuntimeRefreshInterface = useQueryRuntimeRefreshInterface({
    queryRuntimeActionRuntime,
  });

  const shellNavigationState = useShellNavigation({
    route: appChrome.route,
    view,
    setView,
    isLoggedIn: authSession.isLoggedIn,
    setRoute: appChrome.setRoute,
    feedQueryRuntime,
    activeProfileCommunitySlug: profileViewState.activeProfileCommunitySlug,
    setActiveProfileCommunitySlug: profileViewState.setActiveProfileCommunitySlug,
    activeProfileLibraryPage: profileViewState.activeProfileLibraryPage,
    setActiveProfileLibraryPage: profileViewState.setActiveProfileLibraryPage,
    activeProfileNotificationPage: profileViewState.activeProfileNotificationPage,
    setActiveProfileNotificationPage: profileViewState.setActiveProfileNotificationPage,
    setProfileLevelExpanded: profileViewState.setProfileLevelExpanded,
    setNotificationPanelOpen: notificationsState.setNotificationPanelOpen,
    refreshCurrentCommunity: queryRuntimeRefreshInterface.refreshCurrentCommunity,
    reportUserActivity: mainPostEngagement.reportUserActivity,
    onAuthRequired: authSession.openAuthModal,
  });

  const subPostThreadState = useSubPostThread({
    routeType: appChrome.route.type,
    mainPostId: appChrome.route.type === "post" ? appChrome.route.mainPostId : null,
    isLoggedIn: authSession.isLoggedIn,
    detailQueryRuntime,
    token: authSession.token,
    client,
    setMessage,
    reportUserActivity: mainPostEngagement.reportUserActivity,
    currentUser: authSession.currentUser,
    topbarRef: refs.topbarRef,
    subPostTextareaRef: refs.subPostTextareaRef,
    removeProfileSubPost: profileViewState.removeProfileSubPost,
    mainPostMutationInterface,
  });

  const composerDraft = useComposerDraft({
    routeType: appChrome.route.type,
    isLoggedIn: authSession.isLoggedIn,
    currentUser: authSession.currentUser,
    token: authSession.token,
    client,
    apiBase,
    communities: communitiesCatalogState.communities,
    orderedCommunities: communitiesCatalogState.orderedCommunities,
    feedQueryRuntime,
    setMessage,
    setView,
    setRoute: appChrome.setRoute,
    onAuthRequired: authSession.openAuthModal,
    mainPostMutationInterface,
  });

  const mainPostActions = useMainPostActions({
    client,
    token: authSession.token,
    isLoggedIn: authSession.isLoggedIn,
    currentUser: authSession.currentUser,
    route: appChrome.route,
    detailQueryRuntime,
    feedQueryRuntime,
    editingMainPostId: composerDraft.editingMainPostId,
    setMessage,
    resetComposerForm: composerDraft.resetComposerForm,
    removeProfilePost: profileViewState.removeProfilePost,
    setView,
    setRoute: appChrome.setRoute,
    mainPostMutationInterface,
  });

  const sessionCleanupState = useSessionCleanup({
    resetShellNavigation: shellNavigationState.resetShellNavigation,
    resetNotifications: notificationsState.resetNotifications,
    clearProfileState: profileViewState.clearProfileState,
    resetComposerForm: composerDraft.resetComposerForm,
    clearLocalAuth: authSession.clearLocalAuth,
    setView,
    setRoute: appChrome.setRoute,
    setMessage,
  });

  return {
    mainPostEngagement,
    shellNavigationState,
    subPostThreadState,
    composerDraft,
    mainPostActions,
    queryRuntimeRefreshInterface,
    sessionCleanupState,
  };
}
