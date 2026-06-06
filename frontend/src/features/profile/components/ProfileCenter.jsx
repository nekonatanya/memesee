import ProfileCommunityPosts from "./ProfileCommunityPosts";
import ProfileLibraryPage from "./ProfileLibraryPage";
import ProfileNotificationPage from "./ProfileNotificationPage";
import ProfileOverview from "./ProfileOverview";
import { StatusCard } from "../../../shared/components/PageShell";

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
        <StatusCard
          kicker="个人中心"
          title="正在打开个人中心"
          description="你的主页、通知和收藏马上就好。"
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
      {!loadingProfile && !isLoggedIn && (
        <StatusCard
          title="请先登录后查看个人中心"
          description="登录后可以查看通知、收藏、点赞和发布记录。"
          tone="empty"
        />
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
        <StatusCard
          title="个人资料暂时不可用"
          description="可以稍后刷新页面再试一次。"
          tone="empty"
        />
      )}
    </section>
  );
}
