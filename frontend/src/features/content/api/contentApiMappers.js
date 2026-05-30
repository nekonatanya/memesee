import {
  buildPostMediaCacheVersionSeed,
  buildPreview,
  extractImageUrls,
  withMediaCacheVersion,
} from "../../../shared/state/appHelpers";
import {
  buildResponsiveImageSources,
  FEED_IMAGE_SIZES,
  DETAIL_IMAGE_SIZES,
} from "../../../shared/media/responsiveImages";
import { calculateHeatScore, normalizeAssetUrl } from "./contentApiShared";

export function normalizeMediaAsset(apiBase, asset) {
  const safeAsset = asset && typeof asset === "object" ? asset : {};
  const assetId = Number(safeAsset.id || 0);
  const rawUrl = safeAsset.url || safeAsset.displayUrl || "";
  const rawDisplayUrl = safeAsset.displayUrl || safeAsset.url || "";
  const rawMediumUrl = safeAsset.mediumUrl || rawDisplayUrl;
  const rawSmallUrl = safeAsset.smallUrl || rawMediumUrl;
  const rawThumbUrl = safeAsset.thumbUrl || rawDisplayUrl;
  const rawOriginalUrl = safeAsset.originalUrl || rawDisplayUrl;
  const variants = Array.isArray(safeAsset.variants)
    ? safeAsset.variants.map((variant) => ({
        kind: String(variant?.kind || ""),
        url: normalizeAssetUrl(apiBase, variant?.url || ""),
        contentType: String(variant?.contentType || ""),
        sizeBytes: Number(variant?.sizeBytes || 0),
        width: Number(variant?.width || 0),
        height: Number(variant?.height || 0),
      }))
    : [];
  return {
    id: assetId,
    kind: String(safeAsset.kind || "IMAGE"),
    url: normalizeAssetUrl(apiBase, rawUrl),
    thumbUrl: normalizeAssetUrl(apiBase, rawThumbUrl),
    smallUrl: normalizeAssetUrl(apiBase, rawSmallUrl),
    mediumUrl: normalizeAssetUrl(apiBase, rawMediumUrl),
    displayUrl: normalizeAssetUrl(apiBase, rawDisplayUrl),
    originalUrl: normalizeAssetUrl(apiBase, rawOriginalUrl),
    contentType: String(safeAsset.contentType || ""),
    originalFilename: String(safeAsset.originalFilename || ""),
    sizeBytes: Number(safeAsset.sizeBytes || 0),
    width: Number(safeAsset.width || 0),
    height: Number(safeAsset.height || 0),
    processingStatus: String(safeAsset.processingStatus || "READY"),
    variants,
  };
}

function resolveLatestActivityAt(post) {
  return post.latestActivityAt || post.latestSubPostAt || post.updatedAt || post.createdAt || null;
}

export function mapMainPost(apiBase, payload, { detailed = false } = {}) {
  const safePost = payload && typeof payload === "object" ? payload : {};
  const mediaAssets = Array.isArray(safePost.mediaAssets)
    ? safePost.mediaAssets.map((asset) => normalizeMediaAsset(apiBase, asset))
    : [];
  const latestActivityAt = resolveLatestActivityAt(safePost);
  const mediaImageSources = buildResponsiveImageSources(mediaAssets, {
    prefer: "detail",
    sizes: DETAIL_IMAGE_SIZES,
  });
  const previewImageSources = buildResponsiveImageSources(mediaAssets.slice(0, 3), {
    prefer: "feed",
    sizes: FEED_IMAGE_SIZES,
  });
  const backendHotScore = Number(safePost.heatScore ?? safePost.hotScore);
  const content = detailed
    ? String(safePost.content || "")
    : String(safePost.contentPreview || safePost.content || "");
  const previewImageUrls = Array.isArray(safePost.previewImageUrls)
    ? safePost.previewImageUrls
      .map((url) => normalizeAssetUrl(apiBase, url || ""))
      .filter(Boolean)
    : [];
  const mainPost = {
    id: Number(safePost.id || 0),
    communitySlug: String(safePost.communitySlug || ""),
    communityName: String(safePost.communityName || safePost.communitySlug || ""),
    title: String(safePost.title || ""),
    content,
    preview: detailed ? undefined : buildPreview(content),
    postMode: mediaAssets.length > 0 ? "rich" : "long",
    mediaUrls: mediaAssets.map((asset) => asset.displayUrl || asset.mediumUrl || asset.url).filter(Boolean),
    mediaOriginalUrls: mediaAssets
      .map((asset) => asset.originalUrl || asset.displayUrl || asset.url)
      .filter(Boolean),
    mediaAssets,
    mediaImageSources,
    previewImageSources,
    author: String(safePost.authorUsername || ""),
    createdAt: safePost.createdAt || null,
    updatedAt: safePost.updatedAt || safePost.createdAt || null,
    latestActivityAt,
    latestActivityAtText: safePost.latestActivityAtText || safePost.latestSubPostAtText || "",
    latestSubPostAt: latestActivityAt,
    latestSubPostAtText: safePost.latestActivityAtText || safePost.latestSubPostAtText || "",
    createdAtText: "",
    updatedAtText: "",
    viewCount: Number(safePost.viewCount || 0),
    subPostCount: Number(safePost.subPostCount || 0),
    likeCount: Number(safePost.likeCount || 0),
    favoriteCount: Number(safePost.favoriteCount || 0),
    likedByMe: Boolean(safePost.likedByMe),
    favoritedByMe: Boolean(safePost.favoritedByMe),
    tags: Array.isArray(safePost.tags) ? safePost.tags : [],
    hotScore: Number.isFinite(backendHotScore) ? backendHotScore : 0,
    contentLoaded: detailed,
  };
  const mediaVersionSeed = buildPostMediaCacheVersionSeed(mainPost);
  mainPost.previewImages = mediaAssets.length > 0
    ? mediaAssets.map((asset) => asset.thumbUrl || asset.displayUrl || asset.url).filter(Boolean).slice(0, 3)
    : (previewImageUrls.length > 0
        ? previewImageUrls
        : extractImageUrls(content, apiBase))
      .map((url) => withMediaCacheVersion(url, mediaVersionSeed))
      .slice(0, 3);
  if (!Number.isFinite(backendHotScore)) {
    mainPost.hotScore = calculateHeatScore(mainPost);
  }
  return mainPost;
}

export function mapSubPost(apiBase, payload) {
  const safeSubPost = payload && typeof payload === "object" ? payload : {};
  const mediaAssets = Array.isArray(safeSubPost.mediaAssets)
    ? safeSubPost.mediaAssets.map((asset) => normalizeMediaAsset(apiBase, asset))
    : [];
  return {
    id: Number(safeSubPost.id || 0),
    postId: Number(safeSubPost.mainPostId || 0),
    mainPostId: Number(safeSubPost.mainPostId || 0),
    parentId: Number(safeSubPost.parentSubPostId || 0) || null,
    parentSubPostId: Number(safeSubPost.parentSubPostId || 0) || null,
    parentSubPostAuthor: String(safeSubPost.parentSubPostAuthorUsername || ""),
    parentSubPostAuthorUsername: String(safeSubPost.parentSubPostAuthorUsername || ""),
    author: String(safeSubPost.authorUsername || ""),
    content: String(safeSubPost.content || ""),
    createdAt: safeSubPost.createdAt || null,
    updatedAt: safeSubPost.updatedAt || safeSubPost.createdAt || null,
    createdAtText: "",
    updatedAtText: "",
    likeCount: Number(safeSubPost.likeCount || 0),
    favoriteCount: Number(safeSubPost.favoriteCount || 0),
    childSubPostCount: Number(safeSubPost.childSubPostCount || 0),
    likedByMe: Boolean(safeSubPost.likedByMe),
    favoritedByMe: Boolean(safeSubPost.favoritedByMe),
    mediaUrls: mediaAssets.map((asset) => asset.displayUrl || asset.mediumUrl || asset.url).filter(Boolean),
    mediaOriginalUrls: mediaAssets
      .map((asset) => asset.originalUrl || asset.displayUrl || asset.url)
      .filter(Boolean),
    mediaAssets,
  };
}

export function mapNotification(payload) {
  const safeNotification = payload && typeof payload === "object" ? payload : {};
  return {
    id: Number(safeNotification.id || 0),
    type: String(safeNotification.type || ""),
    postId: Number(safeNotification.mainPostId || 0) || null,
    subPostId: Number(safeNotification.subPostId || 0) || null,
    actorUsername: String(safeNotification.actorUsername || ""),
    postTitle: String(safeNotification.mainPostTitle || safeNotification.postTitle || ""),
    title: String(safeNotification.title || ""),
    body: String(safeNotification.body || ""),
    createdAt: safeNotification.createdAt || null,
    createdAtText: "",
    read: Boolean(safeNotification.read),
  };
}

export function mapMyPostInteraction(payload) {
  const safeItem = payload && typeof payload === "object" ? payload : {};
  const postId = Number(safeItem.postId || 0) || null;
  const backendHotScore = Number(safeItem.heatScore ?? safeItem.hotScore);
  const postLikeCount = Number(safeItem.likeCount || 0);
  const postFavoriteCount = Number(safeItem.favoriteCount || 0);
  const postSubPostCount = Number(safeItem.subPostCount || 0);
  const postViewCount = Number(safeItem.viewCount || 0);
  const postShape = {
    id: postId,
    postId,
    title: String(safeItem.postTitle || ""),
    postTitle: String(safeItem.postTitle || ""),
    communityName: String(safeItem.communityName || ""),
    communitySlug: String(safeItem.communitySlug || ""),
    content: String(safeItem.contentPreview || ""),
    preview: String(safeItem.contentPreview || ""),
    author: String(safeItem.authorUsername || ""),
    createdAt: safeItem.createdAt || null,
    updatedAt: safeItem.updatedAt || safeItem.createdAt || null,
    latestActivityAt: safeItem.latestActivityAt || safeItem.createdAt || null,
    latestActivityAtText: "",
    createdAtText: "",
    updatedAtText: "",
    viewCount: postViewCount,
    subPostCount: postSubPostCount,
    likeCount: postLikeCount,
    favoriteCount: postFavoriteCount,
    likedByMe: safeItem.action === "like",
    favoritedByMe: safeItem.action === "favorite",
    tags: [],
    mediaUrls: [],
    mediaAssets: [],
  };
  return {
    ...postShape,
    hotScore: Number.isFinite(backendHotScore)
      ? backendHotScore
      : calculateHeatScore(postShape),
    action: String(safeItem.action || ""),
    interactedAt: safeItem.interactedAt || null,
    interactedAtText: "",
  };
}

export function mapMySubPostInteraction(payload) {
  const safeItem = payload && typeof payload === "object" ? payload : {};
  const mainPostId = Number(safeItem.mainPostId || 0) || null;
  const mainPostLikeCount = Number(safeItem.mainPostLikeCount || 0);
  const mainPostFavoriteCount = Number(safeItem.mainPostFavoriteCount || 0);
  const mainPostSubPostCount = Number(safeItem.mainPostSubPostCount || 0);
  const mainPostViewCount = Number(safeItem.mainPostViewCount || 0);
  const mainPost = {
    id: mainPostId,
    postId: mainPostId,
    title: String(safeItem.postTitle || ""),
    postTitle: String(safeItem.postTitle || ""),
    communitySlug: String(safeItem.mainPostCommunitySlug || ""),
    communityName: String(safeItem.mainPostCommunityName || ""),
    content: String(safeItem.mainPostContentPreview || ""),
    preview: String(safeItem.mainPostContentPreview || ""),
    author: String(safeItem.mainPostAuthorUsername || ""),
    createdAt: safeItem.mainPostCreatedAt || null,
    updatedAt: safeItem.mainPostCreatedAt || null,
    latestActivityAt: safeItem.mainPostLatestActivityAt || safeItem.mainPostCreatedAt || null,
    latestActivityAtText: "",
    createdAtText: "",
    updatedAtText: "",
    viewCount: mainPostViewCount,
    subPostCount: mainPostSubPostCount,
    likeCount: mainPostLikeCount,
    favoriteCount: mainPostFavoriteCount,
    likedByMe: false,
    favoritedByMe: false,
    tags: [],
    mediaUrls: [],
    mediaAssets: [],
  };
  return {
    subPostId: Number(safeItem.subPostId || 0) || null,
    postId: mainPostId,
    mainPostId,
    postTitle: String(safeItem.postTitle || ""),
    mainPostTitle: String(safeItem.postTitle || ""),
    mainPost: {
      ...mainPost,
      hotScore: calculateHeatScore(mainPost),
    },
    author: String(safeItem.subPostAuthorUsername || ""),
    authorUsername: String(safeItem.subPostAuthorUsername || ""),
    subPostPreview: String(safeItem.subPostPreview || ""),
    action: String(safeItem.action || ""),
    interactedAt: safeItem.interactedAt || null,
    interactedAtText: "",
  };
}
