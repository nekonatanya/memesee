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
        <article className="feed-status-card">
          <span className="feed-status-kicker">个人中心</span>
          <strong>个人中心加载中</strong>
          <span className="feed-status-subtext">正在整理你的主页、通知和收藏。</span>
          <span className="feed-status-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </article>
      )}
      {!loadingProfile && !isLoggedIn && (
        <article className="feed-status-card feed-status-card-empty">
          <div className="feed-status-mainline">
            <span className="feed-status-mark" aria-hidden="true" />
            <strong>请先登录后查看个人中心</strong>
          </div>
          <span className="feed-status-subtext">登录后可以查看通知、收藏、点赞和发布记录。</span>
        </article>
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
        <article className="feed-status-card feed-status-card-empty">
          <div className="feed-status-mainline">
            <span className="feed-status-mark" aria-hidden="true" />
            <strong>个人资料暂时不可用</strong>
          </div>
          <span className="feed-status-subtext">可以稍后刷新页面再试一次。</span>
        </article>
      )}
    </section>
  );
}
