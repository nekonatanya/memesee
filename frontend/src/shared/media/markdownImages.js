import {
  buildMediaAssetMap,
  normalizeAssetUrl,
  resolveMediaAssetImageUrl,
} from "./mediaAssetHelpers";
import {
  normalizeMarkdownImageSize,
  parseMarkdownImageAlt,
  parseMediaReference,
} from "./markdownContent";
import {
  buildResponsiveImageSource,
  DETAIL_IMAGE_SIZES,
  responsiveImageSourceUrl,
} from "./responsiveImages";

export function buildMarkdownImageStyles({ width, height }) {
  if (!width && !height) {
    return {
      frameStyle: undefined,
      imageStyle: undefined,
    };
  }

  const frameStyle = {
    ...(width ? { width, maxWidth: "100%" } : null),
  };
  const imageStyle = {
    ...(width ? { width: "100%", maxWidth: "100%" } : null),
    ...(height ? { height: "auto", maxHeight: height } : null),
  };

  return {
    frameStyle,
    imageStyle,
  };
}

export function buildMarkdownImageSource(asset) {
  return buildResponsiveImageSource(asset, {
    prefer: "detail",
    sizes: DETAIL_IMAGE_SIZES,
  });
}

export function resolveMarkdownMediaAsset(mediaAssetMap, mediaReference) {
  if (!mediaReference) {
    return null;
  }
  return mediaAssetMap.get(mediaReference.ref) || mediaAssetMap.get(mediaReference.assetId) || null;
}

export function resolveMarkdownImageData({ src, alt, mediaAssetMap, apiBase = "" }) {
  const mediaReference = parseMediaReference(src || "");
  if (!mediaReference) {
    return null;
  }
  const asset = resolveMarkdownMediaAsset(mediaAssetMap, mediaReference);
  const imageSource = buildMarkdownImageSource(asset);
  const imageUrl = normalizeAssetUrl(
    responsiveImageSourceUrl(imageSource) || resolveMediaAssetImageUrl(asset),
    apiBase,
  );
  if (!imageUrl) {
    return null;
  }
  const parsedAlt = parseMarkdownImageAlt(alt);
  const width = normalizeMarkdownImageSize(mediaReference.width || parsedAlt.width);
  const height = normalizeMarkdownImageSize(mediaReference.height || parsedAlt.height);
  const { frameStyle, imageStyle } = buildMarkdownImageStyles({ width, height });
  return {
    imageUrl,
    imageSource,
    parsedAlt,
    alt,
    hasCustomSize: Boolean(width || height),
    hasCustomWidth: Boolean(width),
    hasCustomHeight: Boolean(height),
    frameStyle,
    imageStyle,
  };
}

export function getMarkdownImageOccurrenceIndex({ content, src }) {
  const target = String(src || "").trim();
  if (!target) {
    return -1;
  }
  const markdownRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let index = 0;
  let match;
  while ((match = markdownRegex.exec(String(content || ""))) !== null) {
    if (String(match[1] || "").trim() === target) {
      return index;
    }
    index += 1;
  }
  return -1;
}

export function buildMarkdownImageGallery({ content, mediaAssetMap, apiBase = "" }) {
  const entries = [];
  const seen = new Set();
  const markdownRegex = /!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let match;
  while ((match = markdownRegex.exec(String(content || ""))) !== null) {
    const imageData = resolveMarkdownImageData({
      src: match[1],
      alt: "",
      mediaAssetMap,
      apiBase,
    });
    if (!imageData || seen.has(imageData.imageUrl)) {
      continue;
    }
    seen.add(imageData.imageUrl);
    entries.push({
      imageUrl: imageData.imageUrl,
      originalUrl: normalizeAssetUrl(
        imageData.imageSource.originalUrl || imageData.imageSource.displayUrl || imageData.imageUrl,
        apiBase,
      ),
      imageSource: imageData.imageSource,
    });
  }
  return entries;
}

export function buildMarkdownMediaAssetMap(mediaAssets) {
  return buildMediaAssetMap(mediaAssets);
}
