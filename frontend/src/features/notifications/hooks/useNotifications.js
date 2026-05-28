import { useCallback, useEffect, useRef, useState } from "react";
import {
  listNotifications as listContentNotifications,
  markAllNotificationsRead as markAllContentNotificationsRead,
} from "../../content/api/contentApi";
import { UI_MESSAGES, readableError } from "../../../shared/state/uiMessages";

function notificationTypeLabel(type) {
  switch (String(type || "").toUpperCase()) {
    case "MAIN_POST_LIKED":
    case "POST_LIKE":
      return "主帖获赞";
    case "MAIN_POST_FAVORITED":
    case "POST_FAVORITE":
      return "主帖被收藏";
    case "SUB_POST_CREATED":
    case "POST_REPLY":
      return "新子帖";
    case "SUB_POST_REPLIED":
      return "子帖回复";
    case "SUB_POST_LIKED":
      return "子帖获赞";
    case "SUB_POST_FAVORITED":
      return "子帖被收藏";
    default:
      return "通知";
  }
}

export function useNotifications({
  client,
  token,
  isLoggedIn,
  currentUser,
  setMessage,
  pageSize,
}) {
  const [notifications, setNotifications] = useState([]);
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const notificationPanelRef = useRef(null);

  const loadNotifications = useCallback(async (authToken = token, options = {}) => {
    if (!authToken) {
      setNotifications([]);
      setNotificationUnreadCount(0);
      return null;
    }
    try {
      const payload = await listContentNotifications(client, {
        token: authToken,
        limit: Number(options.limit || pageSize),
      });
      const nextList = Array.isArray(payload.notifications) ? payload.notifications : [];
      const nextUnread = Number(payload.unreadCount || 0);
      setNotifications(nextList);
      setNotificationUnreadCount(Number.isFinite(nextUnread) ? Math.max(0, nextUnread) : 0);
      return payload;
    } catch (error) {
      if (!options.silent) {
        setMessage(readableError(error, UI_MESSAGES.notificationsLoadFailed));
      }
      return null;
    }
  }, [client, pageSize, setMessage, token]);

  const markNotificationsRead = useCallback(async (authToken = token, options = {}) => {
    if (!authToken) {
      setNotificationUnreadCount(0);
      return null;
    }
    try {
      const payload = await markAllContentNotificationsRead(client, { token: authToken });
      const unread = Number(payload?.unreadCount || 0);
      setNotificationUnreadCount(Number.isFinite(unread) ? Math.max(0, unread) : 0);
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      return payload;
    } catch (error) {
      if (!options.silent) {
        setMessage(readableError(error, UI_MESSAGES.notificationsMarkReadFailed));
      }
      return null;
    }
  }, [client, setMessage, token]);

  function resetNotifications() {
    setNotifications([]);
    setNotificationUnreadCount(0);
    setNotificationPanelOpen(false);
  }

  useEffect(() => {
    if (isLoggedIn && token && currentUser) {
      return;
    }
    resetNotifications();
  }, [isLoggedIn, token, currentUser]);

  useEffect(() => {
    if (!isLoggedIn || !token) {
      return;
    }
    let active = true;
    const syncNotifications = async () => {
      const payload = await loadNotifications(token, { silent: true });
      if (!active) {
        return;
      }
      const unread = Number(payload?.unreadCount || 0);
      if (notificationPanelOpen && unread > 0) {
        await markNotificationsRead(token, { silent: true });
      }
    };
    syncNotifications();
    const interval = window.setInterval(syncNotifications, 30000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [currentUser, isLoggedIn, loadNotifications, markNotificationsRead, notificationPanelOpen, token]);

  useEffect(() => {
    if (!isLoggedIn || !notificationPanelOpen) {
      return;
    }
    let active = true;
    (async () => {
      const payload = await loadNotifications(token, { silent: true });
      if (!active) {
        return;
      }
      const unread = Number(payload?.unreadCount || 0);
      if (unread > 0) {
        await markNotificationsRead(token, { silent: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [currentUser, isLoggedIn, loadNotifications, markNotificationsRead, notificationPanelOpen, token]);

  useEffect(() => {
    if (!notificationPanelOpen) {
      return;
    }
    const close = () => setNotificationPanelOpen(false);
    const onPointerDown = (event) => {
      const target = event.target;
      if (!notificationPanelRef.current?.contains(target)) {
        close();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [notificationPanelOpen]);

  return {
    notifications,
    notificationUnreadCount,
    notificationPanelOpen,
    notificationPanelRef,
    notificationTypeLabel,
    setNotificationPanelOpen,
    loadNotifications,
    markNotificationsRead,
    resetNotifications,
  };
}
