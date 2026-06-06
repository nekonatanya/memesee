import { UI_MESSAGES } from "./uiMessages";
import {
  pushBrowserHistory,
  readBrowserCurrentPath,
  readBrowserSearchParams,
  readBrowserUrl,
  scrollBrowserTo,
} from "../platform/browserNavigation";

export {
  buildMediaAssetMap,
  normalizeAssetUrl,
  resolveMediaAssetImageUrl,
} from "../media/mediaAssetHelpers";
export {
  buildPreview,
  extractMarkdownMediaAssetIds,
  isMediaReference,
  normalizeMarkdownImageSize,
  parseMarkdownImageAlt,
  parseMediaReference,
  removeExternalMarkdownImages,
  removeMarkdownImages,
  stripMarkdown,
} from "../media/markdownContent";
export {
  calculateHeatScore,
  formatHeatScore,
  normalizePostModeValue,
  normalizePostPayload,
  normalizeSubPostPayload,
  resolveLatestActivityAt,
  resolveLatestActivityAtText,
  sortPostsByMode,
} from "../../features/posts/state/mainPostModel";

export function parseRouteFromLocation() {
  const params = readBrowserSearchParams();
  const composeParam = params.get("compose");
  if (composeParam === "1" || composeParam === "true") {
    return { type: "compose" };
  }
  const postParam = params.get("post");
  if (!postParam) {
    return { type: "home" };
  }
  const mainPostId = Number(postParam);
  if (!Number.isInteger(mainPostId) || mainPostId <= 0) {
    return { type: "home" };
  }
  return {
    type: "post",
    mainPostId,
    manageSource: params.get("manage") === "published" ? "profile-published" : "",
  };
}

export function navigateToPost(mainPostId, setRoute, options = {}) {
  const url = readBrowserUrl();
  url.searchParams.delete("compose");
  url.searchParams.set("post", String(mainPostId));
  if (options.manageSource === "profile-published") {
    url.searchParams.set("manage", "published");
  } else {
    url.searchParams.delete("manage");
  }
  const nextPath = `${url.pathname}?${url.searchParams.toString()}`;
  pushBrowserHistory(nextPath);
  setRoute(parseRouteFromLocation());
  scrollBrowserTo({ top: 0, behavior: "auto" });
}

export function navigateToCompose(setRoute) {
  const url = readBrowserUrl();
  url.searchParams.delete("post");
  url.searchParams.delete("manage");
  url.searchParams.set("compose", "1");
  const nextPath = `${url.pathname}?${url.searchParams.toString()}`;
  pushBrowserHistory(nextPath);
  setRoute(parseRouteFromLocation());
  scrollBrowserTo({ top: 0, behavior: "auto" });
}

export function navigateToHome(setRoute) {
  const url = readBrowserUrl();
  url.searchParams.delete("post");
  url.searchParams.delete("compose");
  url.searchParams.delete("manage");
  const search = url.searchParams.toString();
  const nextPath = search ? `${url.pathname}?${search}` : url.pathname;
  if (readBrowserCurrentPath() !== nextPath) {
    pushBrowserHistory(nextPath);
  }
  setRoute(parseRouteFromLocation());
}

export function compareSubPostsBySort(a, b, sortMode) {
  const aTime = new Date(a?.createdAt).getTime();
  const bTime = new Date(b?.createdAt).getTime();
  if (sortMode === "time_asc") {
    return aTime - bTime;
  }
  if (sortMode === "like_desc") {
    const likeGap = Number(b?.likeCount || 0) - Number(a?.likeCount || 0);
    if (likeGap !== 0) {
      return likeGap;
    }
    return bTime - aTime;
  }
  return bTime - aTime;
}

export function formatTime(value, serverText = "") {
  if (typeof serverText === "string" && serverText.trim()) {
    return serverText.trim();
  }
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  const now = Date.now();
  let diffSeconds = Math.floor((now - date.getTime()) / 1000);
  if (diffSeconds < 0) {
    diffSeconds = 0;
  }
  if (diffSeconds < 3600) {
    const minutes = Math.max(1, Math.floor(diffSeconds / 60));
    return `${minutes}分钟前`;
  }
  const hours = Math.floor(diffSeconds / 3600);
  if (hours < 24) {
    return `${hours}小时前`;
  }
  const days = Math.floor(diffSeconds / 86400);
  if (days <= 30) {
    return `${days}天前`;
  }
  const nowDate = new Date(now);
  if (date.getFullYear() === nowDate.getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function subPostQuotePreview(value) {
  const text = String(value || "").trim();
  if (!text) {
    return UI_MESSAGES.emptySubPostPreview;
  }
  return text;
}

export function authorInitial(name) {
  if (!name) {
    return "?";
  }
  return name.slice(0, 1).toUpperCase();
}

export function clampText(value, maxLength) {
  const text = String(value || "");
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}

export function normalizeTagItems(raw) {
  if (!raw) {
    return [];
  }
  const source = Array.isArray(raw) ? raw.join(",") : String(raw);
  return source
    .split(/[,\n/]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^#/, ""))
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);
}

export function parseTagInput(raw) {
  return normalizeTagItems(raw).slice(0, 3);
}

export function sortCommunitiesByOrder(communityList, order) {
  const rank = new Map(order.map((slug, index) => [slug, index]));
  return [...communityList].sort((a, b) => {
    const aRank = rank.has(a.slug) ? rank.get(a.slug) : Number.MAX_SAFE_INTEGER;
    const bRank = rank.has(b.slug) ? rank.get(b.slug) : Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

export function sortSubPostNodes(nodes) {
  nodes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  nodes.forEach((node) => {
    if (node.branchSubPosts.length > 0) {
      sortSubPostNodes(node.branchSubPosts);
    }
  });
}

