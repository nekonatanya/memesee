import { UI_MESSAGES } from "./uiMessages";
import {
  pushBrowserHistory,
  readBrowserCurrentPath,
  readBrowserSearchParams,
  readBrowserUrl,
  scrollBrowserTo,
} from "../platform/browserNavigation";
import {
  buildResponsiveImageSources,
  DETAIL_IMAGE_SIZES,
  FEED_IMAGE_SIZES,
} from "../media/responsiveImages";

const PREVIEW_LENGTH = 120;

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

export function normalizeAssetUrl(pathOrUrl, apiBase = "") {
  if (!pathOrUrl) {
    return "";
  }
  const normalizedRaw = pathOrUrl.trim();
  if (/^https?:\/\//i.test(normalizedRaw)) {
    try {
      const parsed = new URL(normalizedRaw);
      // 开发环境里若后端返回 localhost 绝对地址，这里统一收敛成相对路径。
      if (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "::1"
      ) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch {
      // keep original value on parse failure
    }
    return normalizedRaw;
  }
  const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  const path = normalizedRaw.startsWith("/") ? normalizedRaw : `/${normalizedRaw}`;
  if (!base) {
    return path;
  }
  return `${base}${path}`;
}

export function buildPostMediaCacheVersionSeed(post) {
  const safePost = post && typeof post === "object" ? post : {};
  return [
    safePost.id || safePost.postId || "",
    safePost.updatedAt || safePost.createdAt || "",
    String(safePost.content || "").length,
  ].filter(Boolean).join("-");
}

export function withMediaCacheVersion(pathOrUrl, versionSeed = "") {
  if (!pathOrUrl || !versionSeed || !String(pathOrUrl).includes("/api/media-assets/")) {
    return pathOrUrl || "";
  }
  try {
    const rawUrl = String(pathOrUrl);
    const isAbsolute = /^https?:\/\//i.test(rawUrl);
    const parsed = new URL(rawUrl, "http://localhost");
    if (!parsed.pathname.includes("/api/media-assets/") || !parsed.pathname.endsWith("/binary")) {
      return pathOrUrl;
    }
    if (!parsed.searchParams.has("v")) {
      parsed.searchParams.set("v", String(versionSeed));
    }
    return isAbsolute
      ? parsed.toString()
      : `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return pathOrUrl;
  }
}

export function extractImageUrls(content, apiBase = "") {
  if (!content) {
    return [];
  }
  const results = [];
  const seen = new Set();
  const markdownRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const htmlRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = markdownRegex.exec(content)) !== null) {
    const normalized = normalizeAssetUrl(match[1]?.trim() || "", apiBase);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      results.push(normalized);
    }
  }
  while ((match = htmlRegex.exec(content)) !== null) {
    const normalized = normalizeAssetUrl(match[1]?.trim() || "", apiBase);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      results.push(normalized);
    }
  }
  return results;
}

export function buildPreview(content) {
  if (!content) {
    return "";
  }
  const sampled = content.length > 800 ? content.slice(0, 800) : content;
  const plain = stripMarkdown(sampled);
  if (plain.length <= PREVIEW_LENGTH) {
    return plain;
  }
  return `${plain.slice(0, PREVIEW_LENGTH)}...`;
}

export function clampText(value, maxLength) {
  const text = String(value || "");
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength);
}

export function removeMarkdownImages(content) {
  return String(content || "")
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/<img[^>]*>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

export function normalizePostModeValue(raw) {
  return raw === "rich" ? "rich" : "long";
}

export function resolveLatestActivityAt(post) {
  const safePost = post && typeof post === "object" ? post : {};
  return safePost.latestActivityAt || safePost.latestSubPostAt || safePost.updatedAt || safePost.createdAt || null;
}

export function resolveLatestActivityAtText(post) {
  const safePost = post && typeof post === "object" ? post : {};
  return safePost.latestActivityAtText || safePost.latestSubPostAtText || "";
}

export function normalizePostPayload(post, apiBase = "") {
  const safePost = post && typeof post === "object" ? post : {};
  const mode = normalizePostModeValue(safePost.postMode);
  const viewCount = Number(safePost.viewCount || 0);
  const likeCount = Number(safePost.likeCount || 0);
  const favoriteCount = Number(safePost.favoriteCount || 0);
  const latestActivityAt = resolveLatestActivityAt(safePost);
  const latestActivityAtText = resolveLatestActivityAtText(safePost);
  const computedHotScore = calculateHeatScore({
    viewCount,
    likeCount,
    favoriteCount,
    subPostCount: Number(safePost.subPostCount || 0),
  });
  const backendHotScore = Number(safePost.heatScore ?? safePost.hotScore);
  const mediaUrls = Array.isArray(safePost.mediaUrls)
    ? safePost.mediaUrls
      .map((url) => normalizeAssetUrl(url || "", apiBase))
      .filter(Boolean)
    : [];
  const mediaOriginalUrls = Array.isArray(safePost.mediaOriginalUrls)
    ? safePost.mediaOriginalUrls
      .map((url) => normalizeAssetUrl(url || "", apiBase))
      .filter(Boolean)
    : mediaUrls;
  const mediaAssets = Array.isArray(safePost.mediaAssets)
    ? safePost.mediaAssets.map((asset) => {
        const safeAsset = asset && typeof asset === "object" ? asset : {};
        const rawUrl = safeAsset.url || safeAsset.displayUrl || "";
        const displayUrl = normalizeAssetUrl(safeAsset.displayUrl || rawUrl, apiBase);
        const mediumUrl = normalizeAssetUrl(safeAsset.mediumUrl || displayUrl || rawUrl, apiBase);
        const smallUrl = normalizeAssetUrl(safeAsset.smallUrl || mediumUrl || displayUrl || rawUrl, apiBase);
        const thumbUrl = normalizeAssetUrl(safeAsset.thumbUrl || smallUrl || displayUrl || rawUrl, apiBase);
        const originalUrl = normalizeAssetUrl(safeAsset.originalUrl || rawUrl || displayUrl, apiBase);
        return {
          ...safeAsset,
          url: displayUrl || normalizeAssetUrl(rawUrl, apiBase),
          thumbUrl,
          smallUrl,
          mediumUrl,
          displayUrl,
          originalUrl,
          processingStatus: String(safeAsset.processingStatus || "READY"),
        };
      })
    : [];
  const existingPreviewImages = Array.isArray(safePost.previewImages)
    ? safePost.previewImages
      .map((url) => normalizeAssetUrl(url || "", apiBase))
      .filter(Boolean)
    : [];
  const mediaImageSources = buildResponsiveImageSources(mediaAssets, {
    prefer: "detail",
    sizes: DETAIL_IMAGE_SIZES,
  });
  const previewImageSources = buildResponsiveImageSources(mediaAssets.slice(0, 3), {
    prefer: "feed",
    sizes: FEED_IMAGE_SIZES,
  });
  const mediaVersionSeed = buildPostMediaCacheVersionSeed(safePost);
  const previewImages = existingPreviewImages.length > 0
    ? existingPreviewImages.map((url) => withMediaCacheVersion(url, mediaVersionSeed)).slice(0, 3)
    : (mode === "rich"
        ? mediaUrls.slice(0, 3)
        : extractImageUrls(safePost.content || "", apiBase)
          .map((url) => withMediaCacheVersion(url, mediaVersionSeed))
          .slice(0, 3));
  return {
    ...safePost,
    postMode: mode,
    viewCount,
    likeCount,
    favoriteCount,
    subPostCount: Number(safePost.subPostCount || 0),
    hotScore: Number.isFinite(backendHotScore) ? backendHotScore : computedHotScore,
    latestActivityAt,
    latestActivityAtText,
    latestSubPostAt: latestActivityAt,
    latestSubPostAtText: latestActivityAtText,
    likedByMe: Boolean(safePost.likedByMe),
    favoritedByMe: Boolean(safePost.favoritedByMe),
    mediaUrls,
    mediaOriginalUrls,
    mediaAssets,
    mediaImageSources,
    previewImageSources,
    tags: Array.isArray(safePost.tags) ? safePost.tags : [],
    preview: buildPreview(safePost.content || ""),
    previewImages,
  };
}

export function normalizeSubPostPayload(subPost) {
  const safeSubPost = subPost && typeof subPost === "object" ? subPost : {};
  return {
    ...safeSubPost,
    likeCount: Number(safeSubPost.likeCount || 0),
    likedByMe: Boolean(safeSubPost.likedByMe),
    favoriteCount: Number(safeSubPost.favoriteCount || 0),
    favoritedByMe: Boolean(safeSubPost.favoritedByMe),
  };
}

export function sortPostsByMode(postList, mode) {
  const posts = Array.isArray(postList) ? [...postList] : [];
  const publishTimeOf = (post) => new Date(post.createdAt || 0).getTime();
  const latestActivityTimeOf = (post) => new Date(resolveLatestActivityAt(post) || 0).getTime();
  const descBy = (primary, secondary) => (a, b) => {
    const gap = primary(b) - primary(a);
    if (gap !== 0) {
      return gap;
    }
    return secondary(b) - secondary(a);
  };

  switch (mode) {
    case "most_views":
      posts.sort(
        descBy(
          (post) => Number(post.viewCount || 0),
          latestActivityTimeOf,
        ),
      );
      break;
    case "most_heat":
      posts.sort(
        descBy(
          (post) =>
            Number.isFinite(Number(post.hotScore))
              ? Number(post.hotScore)
              : calculateHeatScore(post),
          latestActivityTimeOf,
        ),
      );
      break;
    case "latest_message":
    default:
      posts.sort(descBy(latestActivityTimeOf, publishTimeOf));
      break;
  }
  return posts;
}

export function mergePostPages(existingPosts, incomingPosts) {
  const merged = Array.isArray(existingPosts) ? [...existingPosts] : [];
  const indexMap = new Map(merged.map((post, index) => [post.id, index]));
  for (const post of Array.isArray(incomingPosts) ? incomingPosts : []) {
    const existingIndex = indexMap.get(post.id);
    if (existingIndex === undefined) {
      indexMap.set(post.id, merged.length);
      merged.push(post);
      continue;
    }
    merged[existingIndex] = { ...merged[existingIndex], ...post };
  }
  return merged;
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

export function stripMarkdown(content) {
  return content
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/!\[[^\]\n]*(?:][^\n]*)?/g, " ")
    .replace(/<img[^>]*>/gi, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[`*_>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sortSubPostNodes(nodes) {
  nodes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  nodes.forEach((node) => {
    if (node.branchSubPosts.length > 0) {
      sortSubPostNodes(node.branchSubPosts);
    }
  });
}

export function calculateHeatScore(post) {
  const viewWeight = 0.1;
  const likeWeight = 1;
  const favoriteWeight = 2;
  const subPostWeight = 3;
  const viewCount = Number(post?.viewCount || 0);
  const likeCount = Number(post?.likeCount || 0);
  const favoriteCount = Number(post?.favoriteCount || 0);
  const subPostCount = Number(post?.subPostCount || 0);
  return (viewCount * viewWeight)
    + (likeCount * likeWeight)
    + (favoriteCount * favoriteWeight)
    + (subPostCount * subPostWeight);
}

export function formatHeatScore(score) {
  const value = Number(score);
  if (!Number.isFinite(value)) {
    return "0.0";
  }
  return (Math.round(value * 10) / 10).toFixed(1);
}
