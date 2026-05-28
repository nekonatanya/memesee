import ProfileCommunityPosts from "./ProfileCommunityPosts";
import ProfileLibraryPage from "./ProfileLibraryPage";
import ProfileNotificationPage from "./ProfileNotificationPage";
import ProfileOverview from "./ProfileOverview";

export default function ProfileCenter({
  statusProps,
  overviewProps,
  communityPostsProps,
  libraryPageProps,
  notificationPageProps,
}) {
  const { loadingProfile, isLoggedIn, profile } = statusProps;

  return (
    <section className="feed-grid">
      {loadingProfile && (
        <article className="neo-card empty-state">个人中心加载中...</article>
      )}
      {!loadingProfile && !isLoggedIn && (
        <article className="neo-card empty-state">请先登录后查看个人中心。</article>
      )}
      {!loadingProfile && isLoggedIn && profile && (
        <article className="profile-center-card profile-paper">
          {!libraryPageProps.activeProfileLibraryPage &&
            !notificationPageProps.activeProfileNotificationPage &&
            !communityPostsProps.activeProfileCommunity && (
            <ProfileOverview {...overviewProps} />
          )}
          {libraryPageProps.activeProfileLibraryPage && (
            <ProfileLibraryPage {...libraryPageProps} />
          )}
          {!libraryPageProps.activeProfileLibraryPage &&
            notificationPageProps.activeProfileNotificationPage && (
            <ProfileNotificationPage {...notificationPageProps} />
          )}
          {!libraryPageProps.activeProfileLibraryPage &&
            !notificationPageProps.activeProfileNotificationPage &&
            communityPostsProps.activeProfileCommunity && (
            <ProfileCommunityPosts {...communityPostsProps} />
          )}
        </article>
      )}
      {!loadingProfile && isLoggedIn && !profile && (
        <article className="neo-card empty-state">
          个人资料暂时不可用，请稍后重试。
        </article>
      )}
    </section>
  );
}
