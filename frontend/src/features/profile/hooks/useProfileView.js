import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  loadMyInteractions,
  loadMyPosts,
  loadMyProfile,
  loadMySubPosts,
} from "../state/profileViewDataApi";
import {
  buildProfileCommunitySummaries,
  buildProfileDashboard,
  buildProfilePostsByCommunity,
  emptyProfileInteractions,
  findActiveProfileCommunity,
} from "../state/profileViewHelpers";
import { UI_MESSAGES, readableError } from "../../../shared/state/uiMessages";

export function useProfileView({
  view,
  isLoggedIn,
  token,
  orderedCommunities,
  levelProgress,
  userLevel,
  client,
  apiBase,
  setMessage,
  syncUserProgressFromPayload,
  profilePostPageSize,
}) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profilePosts, setProfilePosts] = useState([]);
  const [profileSubPosts, setProfileSubPosts] = useState([]);
  const [profileInteractions, setProfileInteractions] = useState(
    emptyProfileInteractions(),
  );
  const [profileLevelExpanded, setProfileLevelExpanded] = useState(false);
  const [activeProfileCommunitySlug, setActiveProfileCommunitySlug] = useState("");
  const [activeProfileLibraryPage, setActiveProfileLibraryPage] = useState("");
  const [activeProfileNotificationPage, setActiveProfileNotificationPage] = useState(false);
  const syncUserProgressRef = useRef(syncUserProgressFromPayload);

  useEffect(() => {
    syncUserProgressRef.current = syncUserProgressFromPayload;
  }, [syncUserProgressFromPayload]);

  const {
    dashboardPercent,
    dashboardCurrentLevel,
    dashboardNextLevel,
    dashboardCriteria,
    pendingDashboardCriteria,
  } = useMemo(
    () => buildProfileDashboard(levelProgress, userLevel),
    [levelProgress, userLevel],
  );
  const profilePostsByCommunity = useMemo(() => {
    return buildProfilePostsByCommunity(orderedCommunities, profilePosts);
  }, [orderedCommunities, profilePosts]);
  const profileCommunitySummaries = useMemo(
    () => buildProfileCommunitySummaries(profilePostsByCommunity),
    [profilePostsByCommunity],
  );
  const activeProfileCommunity = useMemo(
    () => findActiveProfileCommunity(profilePostsByCommunity, activeProfileCommunitySlug),
    [profilePostsByCommunity, activeProfileCommunitySlug],
  );

  useEffect(() => {
    if (activeProfileLibraryPage) {
      setActiveProfileCommunitySlug("");
      setActiveProfileNotificationPage(false);
    }
  }, [activeProfileLibraryPage]);

  const refreshProfilePosts = useCallback(async (authToken = token) => {
    const nextPosts = await loadMyPosts({
      client,
      token: authToken,
      limit: profilePostPageSize,
      apiBase,
    });
    setProfilePosts(nextPosts);
    return nextPosts;
  }, [apiBase, client, profilePostPageSize, token]);

  const refreshProfileSubPosts = useCallback(async (authToken = token) => {
    const nextSubPosts = await loadMySubPosts({
      client,
      token: authToken,
      limit: profilePostPageSize,
    });
    setProfileSubPosts(nextSubPosts);
    return nextSubPosts;
  }, [client, profilePostPageSize, token]);

  const removeProfilePost = useCallback((mainPostId) => {
    const normalizedMainPostId = Number(mainPostId || 0);
    if (normalizedMainPostId <= 0) {
      return;
    }
    setProfilePosts((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (item) => Number(item?.id || 0) !== normalizedMainPostId,
      ),
    );
  }, []);

  const removeProfileSubPost = useCallback((subPostId) => {
    const normalizedSubPostId = Number(subPostId || 0);
    if (normalizedSubPostId <= 0) {
      return;
    }
    setProfileSubPosts((prev) =>
      (Array.isArray(prev) ? prev : []).filter(
        (item) => Number(item?.id || 0) !== normalizedSubPostId,
      ),
    );
  }, []);

  function clearProfileState() {
    setProfile(null);
    setLoadingProfile(false);
    setProfilePosts([]);
    setProfileSubPosts([]);
    setProfileInteractions(emptyProfileInteractions());
    setProfileLevelExpanded(false);
    setActiveProfileCommunitySlug("");
    setActiveProfileLibraryPage("");
    setActiveProfileNotificationPage(false);
  }

  useEffect(() => {
    if (view !== "mine") {
      setActiveProfileCommunitySlug("");
      setActiveProfileLibraryPage("");
      setActiveProfileNotificationPage(false);
      setProfileLevelExpanded(false);
      return;
    }
    if (!isLoggedIn) {
      clearProfileState();
      return;
    }
    let active = true;
    setLoadingProfile(true);
    Promise.all([
      loadMyProfile(client, token),
      loadMyPosts({
        client,
        token,
        limit: profilePostPageSize,
        apiBase,
      }),
      loadMyInteractions({ client, token, limit: 1000 }),
      loadMySubPosts({ client, token, limit: 1000 }),
    ])
      .then(([profileData, myPostList, interactionData, mySubPostList]) => {
        if (!active) {
          return;
        }
        setProfile(profileData);
        syncUserProgressRef.current(profileData);
        setProfilePosts(myPostList);
        setProfileInteractions(interactionData);
        setProfileSubPosts(mySubPostList);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        setMessage(readableError(error, UI_MESSAGES.profileLoadFailed));
      })
      .finally(() => {
        if (active) {
          setLoadingProfile(false);
        }
      });
    return () => {
      active = false;
    };
  }, [apiBase, client, isLoggedIn, profilePostPageSize, setMessage, token, view]);

  useEffect(() => {
    if (!activeProfileCommunitySlug) {
      return;
    }
    setActiveProfileLibraryPage("");
    setActiveProfileNotificationPage(false);
    if (!profilePostsByCommunity.some((group) => group.slug === activeProfileCommunitySlug)) {
      setActiveProfileCommunitySlug("");
    }
  }, [activeProfileCommunitySlug, profilePostsByCommunity]);

  return {
    profile,
    loadingProfile,
    profilePosts,
    profileSubPosts,
    profileInteractions,
    profileLevelExpanded,
    activeProfileCommunitySlug,
    activeProfileLibraryPage,
    activeProfileNotificationPage,
    dashboardPercent,
    dashboardCurrentLevel,
    dashboardNextLevel,
    dashboardCriteria,
    pendingDashboardCriteria,
    profileCommunitySummaries,
    activeProfileCommunity,
    setProfileLevelExpanded,
    setActiveProfileCommunitySlug,
    setActiveProfileLibraryPage,
    setActiveProfileNotificationPage,
    refreshProfilePosts,
    refreshProfileSubPosts,
    removeProfilePost,
    removeProfileSubPost,
    clearProfileState,
  };
}
