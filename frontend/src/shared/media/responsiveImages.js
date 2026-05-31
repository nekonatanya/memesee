const VARIANT_WIDTHS = {
  thumb: 480,
  small: 720,
  medium: 1080,
  display: 1600,
};

export const FEED_IMAGE_SIZES = "(max-width: 720px) calc(100vw - 40px), 360px";
export const DETAIL_IMAGE_SIZES = "(max-width: 760px) calc(100vw - 32px), min(72vw, 1040px)";
export const LIGHTBOX_IMAGE_SIZES = "100vw";

function normalizeUrl(value) {
  return String(value || "").trim();
}

function variantFieldName(kind) {
  return `${kind}Url`;
}

function findVariant(asset, kind) {
  const variants = Array.isArray(asset?.variants) ? asset.variants : [];
  return variants.find((variant) => String(variant?.kind || "").toLowerCase() === kind) || null;
}

function variantUrl(asset, kind) {
  const directUrl = normalizeUrl(asset?.[variantFieldName(kind)]);
  if (directUrl) {
    return directUrl;
  }
  return normalizeUrl(findVariant(asset, kind)?.url);
}

function variantWidth(asset, kind) {
  const width = Number(findVariant(asset, kind)?.width || 0);
  return Number.isFinite(width) && width > 0 ? width : VARIANT_WIDTHS[kind];
}

function uniqueCandidates(candidates) {
  const seen = new Set();
  return candidates.filter((candidate) => {
    if (!candidate?.url || seen.has(candidate.url)) {
      return false;
    }
    seen.add(candidate.url);
    return true;
  });
}

export function buildResponsiveImageSource(asset, options = {}) {
  if (typeof asset === "string") {
    const src = normalizeUrl(asset);
    return {
      src,
      srcSet: "",
      sizes: options.sizes || "",
      originalUrl: src,
      displayUrl: src,
      processingStatus: "READY",
    };
  }

  const safeAsset = asset && typeof asset === "object" ? asset : {};
  const candidates = uniqueCandidates(["thumb", "small", "medium", "display"]
    .map((kind) => ({
      kind,
      url: variantUrl(safeAsset, kind),
      width: variantWidth(safeAsset, kind),
    }))
    .filter((candidate) => candidate.url));

  const displayUrl = variantUrl(safeAsset, "display")
    || variantUrl(safeAsset, "medium")
    || variantUrl(safeAsset, "small")
    || variantUrl(safeAsset, "thumb")
    || normalizeUrl(safeAsset.url);
  const preferredSrc = options.prefer === "feed"
    ? variantUrl(safeAsset, "thumb") || variantUrl(safeAsset, "small") || displayUrl
    : variantUrl(safeAsset, "medium") || displayUrl;
  const src = normalizeUrl(options.src || preferredSrc || displayUrl);
  const srcSet = candidates
    .sort((a, b) => a.width - b.width)
    .map((candidate) => `${candidate.url} ${candidate.width}w`)
    .join(", ");

  return {
    src,
    srcSet,
    sizes: options.sizes || "",
    originalUrl: normalizeUrl(safeAsset.originalUrl) || variantUrl(safeAsset, "original"),
    displayUrl,
    thumbUrl: variantUrl(safeAsset, "thumb"),
    smallUrl: variantUrl(safeAsset, "small"),
    mediumUrl: variantUrl(safeAsset, "medium"),
    processingStatus: String(safeAsset.processingStatus || "READY"),
  };
}

export function buildResponsiveImageSources(assets, options = {}) {
  return (Array.isArray(assets) ? assets : [])
    .map((asset) => buildResponsiveImageSource(asset, options))
    .filter((source) => source.src || source.displayUrl);
}
