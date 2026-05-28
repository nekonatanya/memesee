export function emptyProfileInteractions() {
  return { postInteractions: [], subPostInteractions: [] };
}

function levelCriterionLabel(key) {
  switch (key) {
    case "communities_visited":
      return "\u8FDB\u5165\u4E0D\u540C\u793E\u533A";
    case "read_posts":
      return "\u7D2F\u8BA1\u9605\u8BFB\u4E3B\u5E16";
    case "read_minutes":
      return "\u7D2F\u8BA1\u9605\u8BFB\u65F6\u957F";
    case "active_days":
      return "\u7D2F\u8BA1\u6D3B\u8DC3\u5929\u6570";
    case "likes_given":
      return "\u7D2F\u8BA1\u70B9\u8D5E\u6B21\u6570";
    case "likes_received":
      return "\u7D2F\u8BA1\u83B7\u5F97\u70B9\u8D5E";
    case "main_post_communities":
    case "sub_post_communities":
      return "\u4E3B\u5E16\u8986\u76D6\u793E\u533A";
    case "recent_active_days":
      return "\u8FD1 100 \u5929\u6D3B\u8DC3\u5929\u6570";
    case "recent_main_post_communities":
    case "recent_sub_post_communities":
      return "\u8FD1 100 \u5929\u4E3B\u5E16\u8986\u76D6\u793E\u533A";
    case "recent_view_posts_ratio":
      return "\u8FD1 100 \u5929\u9605\u8BFB\u65B0\u4E3B\u5E16";
    case "recent_likes_received":
      return "\u8FD1 100 \u5929\u83B7\u5F97\u70B9\u8D5E";
    case "recent_likes_given":
      return "\u8FD1 100 \u5929\u70B9\u8D5E\u6B21\u6570";
    default:
      return "\u6210\u957F\u76EE\u6807";
  }
}

export function buildProfileDashboard(levelProgress, userLevel) {
  const dashboardPercent = Math.max(
    0,
    Math.min(100, Number(levelProgress?.completionPercent || 0)),
  );
  const dashboardCurrentLevel = Number.isFinite(Number(levelProgress?.currentLevel))
    ? Number(levelProgress.currentLevel)
    : userLevel;
  const dashboardNextLevel = levelProgress?.maxLevel
    ? dashboardCurrentLevel
    : (Number.isFinite(Number(levelProgress?.nextLevel))
      ? Number(levelProgress.nextLevel)
      : Math.min(3, dashboardCurrentLevel + 1));
  const dashboardCriteria = (Array.isArray(levelProgress?.criteria) ? levelProgress.criteria : [])
    .map((criterion) => {
      const key = String(criterion?.key || "");
      return {
        ...criterion,
        key,
        compactLabel: levelCriterionLabel(key),
      };
    });

  return {
    dashboardPercent,
    dashboardCurrentLevel,
    dashboardNextLevel,
    dashboardCriteria,
    pendingDashboardCriteria: dashboardCriteria.filter((criterion) => !criterion.achieved),
  };
}

export function buildProfilePostsByCommunity(orderedCommunities, profilePosts) {
  const groups = new Map(
    (Array.isArray(orderedCommunities) ? orderedCommunities : []).map((community) => [
      community.slug,
      { slug: community.slug, name: community.name, posts: [] },
    ]),
  );

  (Array.isArray(profilePosts) ? profilePosts : []).forEach((post) => {
    const slug = post.communitySlug || "unknown";
    if (!groups.has(slug)) {
      groups.set(slug, {
        slug,
        name: post.communityName || slug,
        posts: [],
      });
    }
    groups.get(slug).posts.push(post);
  });

  return Array.from(groups.values()).filter((group) => group.posts.length > 0);
}

export function buildProfileCommunitySummaries(profilePostsByCommunity) {
  return (Array.isArray(profilePostsByCommunity) ? profilePostsByCommunity : []).map((group) => ({
    slug: group.slug,
    name: group.name,
    count: group.posts.length,
  }));
}

export function findActiveProfileCommunity(profilePostsByCommunity, activeProfileCommunitySlug) {
  return (
    (Array.isArray(profilePostsByCommunity) ? profilePostsByCommunity : []).find(
      (group) => group.slug === activeProfileCommunitySlug,
    ) || null
  );
}
