import {
  navigateToHome,
} from "../../../shared/state/appHelpers";
import { useCommunityNavigationState } from "../../../features/shell/hooks/useCommunityNavigationState";

export function useShellNavigation({
  route,
  view,
  setView,
  isLoggedIn,
  setRoute,
  feedQueryRuntime,
  activeProfileCommunitySlug,
  setActiveProfileCommunitySlug,
  activeProfileLibraryPage,
  setActiveProfileLibraryPage,
  activeProfileNotificationPage,
  setActiveProfileNotificationPage,
  setProfileLevelExpanded,
  setNotificationPanelOpen,
  refreshCurrentCommunity,
  reportUserActivity,
  onAuthRequired,
}) {
  const selectedCommunitySlug = feedQueryRuntime?.selectedCommunitySlug;
  const setSelectedCommunitySlug = feedQueryRuntime?.setSelectedCommunitySlug;
  const communityNavigationState = useCommunityNavigationState();

  function resetShellNavigation() {
  }

  function hasActiveProfileChildPage() {
    return Boolean(
      activeProfileCommunitySlug ||
      activeProfileLibraryPage ||
      activeProfileNotificationPage,
    );
  }

  function clearProfileChildPage() {
    setNotificationPanelOpen(false);
    setActiveProfileCommunitySlug("");
    setActiveProfileLibraryPage("");
    setActiveProfileNotificationPage(false);
  }

  function handleTopbarLeadingAction() {
    if (route.type === "home" && view === "mine") {
      if (hasActiveProfileChildPage()) {
        clearProfileChildPage();
        return;
      }
      setView("latest");
      return;
    }
    if (route.type === "post") {
      navigateToHome(setRoute);
      return;
    }
    if (route.type === "compose") {
      navigateToHome(setRoute);
    }
  }

  function openMineView() {
    if (!isLoggedIn) {
      onAuthRequired("login");
      return;
    }
    setNotificationPanelOpen(false);
    setProfileLevelExpanded(false);
    setActiveProfileCommunitySlug("");
    setActiveProfileLibraryPage("");
    setActiveProfileNotificationPage(false);
    setView("mine");
    navigateToHome(setRoute);
  }

  function backToLatest() {
    setNotificationPanelOpen(false);
    setActiveProfileCommunitySlug("");
    setActiveProfileLibraryPage("");
    setActiveProfileNotificationPage(false);
    setView("latest");
    navigateToHome(setRoute);
  }

  function openProfileCommunity(slug) {
    setActiveProfileLibraryPage("");
    setActiveProfileNotificationPage(false);
    setActiveProfileCommunitySlug(slug);
  }

  function openProfileLibraryPage(page) {
    setActiveProfileCommunitySlug("");
    setActiveProfileNotificationPage(false);
    setActiveProfileLibraryPage(page);
  }

  function openProfileNotificationPage() {
    setActiveProfileCommunitySlug("");
    setActiveProfileLibraryPage("");
    setActiveProfileNotificationPage(true);
  }

  function backToProfileOverview() {
    clearProfileChildPage();
  }

  async function selectCommunity(slug) {
    const isSameCommunity = selectedCommunitySlug === slug;
    setActiveProfileCommunitySlug("");
    setActiveProfileLibraryPage("");
    setActiveProfileNotificationPage(false);
    setView("latest");
    setSelectedCommunitySlug(slug);
    navigateToHome(setRoute);
    if (slug) {
      reportUserActivity({ type: "COMMUNITY_ENTER", communitySlug: slug }, { silent: true });
    }
    if (isSameCommunity) {
      await refreshCurrentCommunity();
    }
  }

  return {
    isCommunityCondensed: communityNavigationState.isCommunityCondensed,
    isMobileViewport: communityNavigationState.isMobileViewport,
    handleTopbarLeadingAction,
    toggleCommunityCondensed: communityNavigationState.toggleCommunityCondensed,
    openMineView,
    backToLatest,
    openProfileCommunity,
    openProfileLibraryPage,
    openProfileNotificationPage,
    backToProfileOverview,
    selectCommunity,
    resetShellNavigation,
  };
}
