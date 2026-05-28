import { useEffect, useMemo, useState } from "react";
import UiIcon from "../../../shared/components/UiIcon";

const NOTIFICATION_PAGE_LIMIT = 100;

function notificationKey(item, index) {
  return `notification-${item.id || item.createdAt || index}`;
}

function notificationIcon(type) {
  switch (String(type || "").toUpperCase()) {
    case "MAIN_POST_LIKED":
    case "POST_LIKE":
    case "SUB_POST_LIKED":
      return "heart-filled";
    case "MAIN_POST_FAVORITED":
    case "POST_FAVORITE":
    case "SUB_POST_FAVORITED":
      return "star-filled";
    case "SUB_POST_CREATED":
    case "POST_REPLY":
    case "SUB_POST_REPLIED":
      return "sub-post";
    default:
      return "bell";
  }
}

function notificationCategory(type) {
  switch (String(type || "").toUpperCase()) {
    case "MAIN_POST_LIKED":
    case "POST_LIKE":
    case "SUB_POST_LIKED":
      return "liked";
    case "MAIN_POST_FAVORITED":
    case "POST_FAVORITE":
    case "SUB_POST_FAVORITED":
      return "favorite";
    case "SUB_POST_CREATED":
    case "POST_REPLY":
    case "SUB_POST_REPLIED":
      return "reply";
    default:
      return "other";
  }
}

const NOTIFICATION_GROUPS = [
  { key: "all", title: "全部", icon: "bell" },
  { key: "liked", title: "点赞", icon: "heart-filled" },
  { key: "favorite", title: "收藏", icon: "star-filled" },
  { key: "reply", title: "回复", icon: "sub-post" },
  { key: "other", title: "其他", icon: "bell" },
];

function groupNotifications(notifications) {
  const buckets = new Map(NOTIFICATION_GROUPS.map((group) => [group.key, []]));
  buckets.set("all", notifications);
  notifications.forEach((item) => {
    const key = notificationCategory(item.type);
    const list = buckets.get(key) || buckets.get("other");
    list.push(item);
  });
  return NOTIFICATION_GROUPS
    .map((group) => ({
      ...group,
      items: buckets.get(group.key) || [],
    }));
}

function actorInitial(name) {
  const value = String(name || "").trim();
  return value ? value.slice(0, 1).toUpperCase() : "?";
}

function removeActorPrefix(text, actorUsername) {
  const value = String(text || "").trim();
  const actor = String(actorUsername || "").trim();
  if (actor && value.startsWith(actor)) {
    return value.slice(actor.length).trim();
  }
  return value;
}

function extractQuotedTitle(text) {
  const match = String(text || "").match(/《([^》]+)》/);
  return match?.[1] || "";
}

function extractPreview(text) {
  const match = String(text || "").match(/[：:]\s*[“"]?(.+?)[”"]?\s*$/);
  return match?.[1] || "";
}

function notificationDetail(item) {
  const type = String(item.type || "").toUpperCase();
  const body = removeActorPrefix(item.body, item.actorUsername);
  const quotedTitle = extractQuotedTitle(body);
  const preview = extractPreview(body);
  const postTitle = quotedTitle || item.postTitle || "主帖";

  switch (type) {
    case "MAIN_POST_LIKED":
    case "POST_LIKE":
    case "MAIN_POST_FAVORITED":
    case "POST_FAVORITE":
      return `《${postTitle}》`;
    case "SUB_POST_CREATED":
    case "POST_REPLY":
    case "SUB_POST_REPLIED":
      return body || `《${postTitle}》下的子帖`;
    case "SUB_POST_LIKED":
    case "SUB_POST_FAVORITED":
      return preview
        ? `${preview} · 《${postTitle}》`
        : `《${postTitle}》下的子帖`;
    default:
      return body || item.title || "查看详情";
  }
}

function ProfileNotificationToolbar({
  unreadCount,
}) {
  return (
    <div className="profile-library-page-head profile-notification-page-head">
      <h3>通知</h3>
      <span className="profile-stat-pill">
        {unreadCount > 0 ? `未读 ${unreadCount > 99 ? "99+" : unreadCount}` : "无未读"}
      </span>
    </div>
  );
}

function NotificationRow({
  item,
  index,
  navigateToPost,
  formatTime,
}) {
  const canOpenPost = Number.isFinite(Number(item.postId));
  const category = notificationCategory(item.type);
  const actorName = item.actorUsername || "用户";

  return (
    <button
      key={notificationKey(item, index)}
      type="button"
      className={`profile-library-entry profile-notification-entry profile-notification-entry-${category} ${item.read ? "" : "unread"}`}
      onClick={() => {
        if (canOpenPost) {
          navigateToPost(Number(item.postId));
        }
      }}
      disabled={!canOpenPost}
    >
      <span className="profile-notification-action-icon" aria-hidden="true">
        <UiIcon name={notificationIcon(item.type)} />
      </span>
      <span className="profile-library-entry-main profile-notification-main">
        <span className="profile-notification-actor-line">
          <span className="profile-notification-avatar" aria-hidden="true">
            {actorInitial(actorName)}
          </span>
          <strong>{actorName}</strong>
          <em>{formatTime(item.createdAt, item.createdAtText)}</em>
        </span>
        <span className="profile-notification-detail">{notificationDetail(item)}</span>
      </span>
      <UiIcon name="chevron-right" />
    </button>
  );
}

export default function ProfileNotificationPage({
  activeProfileNotificationPage,
  notifications,
  notificationUnreadCount,
  loadNotifications,
  markNotificationsRead,
  navigateToPost,
  formatTime,
}) {
  const [activeCategory, setActiveCategory] = useState("all");
  const groups = useMemo(() => groupNotifications(notifications), [notifications]);
  const activeGroup = groups.find((group) => group.key === activeCategory) || groups[0];
  const activeItems = activeGroup?.items || [];

  useEffect(() => {
    if (!activeProfileNotificationPage) {
      return undefined;
    }
    let active = true;
    (async () => {
      const payload = await loadNotifications(undefined, {
        limit: NOTIFICATION_PAGE_LIMIT,
        silent: true,
      });
      if (!active) {
        return;
      }
      const unread = Number(payload?.unreadCount || 0);
      if (unread > 0) {
        await markNotificationsRead(undefined, { silent: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [
    activeProfileNotificationPage,
    loadNotifications,
    markNotificationsRead,
  ]);

  useEffect(() => {
    if (!groups.some((group) => group.key === activeCategory)) {
      setActiveCategory("all");
    }
  }, [activeCategory, groups]);

  return (
    <>
      <ProfileNotificationToolbar
        unreadCount={notificationUnreadCount}
      />

      {notifications.length === 0 && (
        <div className="empty-state profile-empty-inline">暂无通知。</div>
      )}
      {groups.length > 0 && (
        <>
          <div className="profile-notification-tabs" role="tablist" aria-label="通知分类">
            {groups.map((group) => (
              <button
                key={group.key}
                type="button"
                className={`profile-notification-tab profile-notification-tab-${group.key} ${group.key === activeCategory ? "active" : ""}`}
                onClick={() => setActiveCategory(group.key)}
              >
                <UiIcon name={group.icon} />
                <span>{group.title}</span>
                <strong>{group.items.length}</strong>
              </button>
            ))}
          </div>
          <div className="profile-notification-grid">
            {activeItems.map((item, index) => (
              <NotificationRow
                key={notificationKey(item, index)}
                item={item}
                index={index}
                navigateToPost={navigateToPost}
                formatTime={formatTime}
              />
            ))}
          </div>
          {activeItems.length === 0 && (
            <div className="empty-state profile-empty-inline">暂无{activeGroup?.title || ""}通知。</div>
          )}
        </>
      )}
    </>
  );
}
