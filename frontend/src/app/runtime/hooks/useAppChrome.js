import { useEffect, useState } from "react";
import { normalizeAssetUrl } from "../../../shared/media/mediaAssetHelpers";
import { parseRouteFromLocation } from "../../../shared/state/appHelpers";

export function useAppChrome({
  apiBase,
}) {
  const [route, setRoute] = useState(parseRouteFromLocation);
  const [message, setMessage] = useState("");
  const [imageViewer, setImageViewer] = useState(null);
  const [detailMediaIndex, setDetailMediaIndex] = useState(0);

  useEffect(() => {
    const onPopState = () => setRoute(parseRouteFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (!message) {
      return;
    }
    const timer = window.setTimeout(() => setMessage(""), 2800);
    return () => window.clearTimeout(timer);
  }, [message]);

  function normalizeImageList(sourceImages, { keepEmpty = false } = {}) {
    const normalizedImages = (Array.isArray(sourceImages) ? sourceImages : [])
      .map((item) => normalizeAssetUrl(item, apiBase));
    return keepEmpty
      ? normalizedImages
      : normalizedImages.filter(Boolean);
  }

  function comparableImageKey(value) {
    const normalized = normalizeAssetUrl(value || "", apiBase);
    if (!normalized) {
      return "";
    }
    try {
      const parsed = new URL(normalized, window.location.origin);
      parsed.hash = "";
      parsed.searchParams.delete("v");
      const origin = parsed.origin === window.location.origin ? "" : parsed.origin;
      const search = parsed.searchParams.toString();
      return `${origin}${parsed.pathname}${search ? `?${search}` : ""}`;
    } catch {
      return normalized
        .replace(/#.*$/, "")
        .replace(/([?&])v=[^&]*&?/i, "$1")
        .replace(/[?&]$/, "");
    }
  }

  function resolveImageViewerIndex(images, targetUrl, preferredIndex) {
    const indexCandidate = Number(preferredIndex);
    if (
      Number.isInteger(indexCandidate) &&
      indexCandidate >= 0 &&
      indexCandidate < images.length
    ) {
      return indexCandidate;
    }
    const exactIndex = images.indexOf(targetUrl);
    if (exactIndex >= 0) {
      return exactIndex;
    }
    const targetKey = comparableImageKey(targetUrl);
    const comparableIndex = images.findIndex((image) => comparableImageKey(image) === targetKey);
    return comparableIndex >= 0 ? comparableIndex : 0;
  }

  function alignImageSources(images, imageSources) {
    if (!Array.isArray(imageSources) || imageSources.length === 0) {
      return [];
    }
    return images.map((image, imageIndex) => {
      const imageKey = comparableImageKey(image);
      return imageSources.find((source) =>
        [source?.src, source?.displayUrl, source?.originalUrl]
          .filter(Boolean)
          .some((sourceUrl) => comparableImageKey(sourceUrl) === imageKey),
      ) || imageSources[imageIndex] || {};
    });
  }

  function openImageViewer(url, sourceImages = [], options = {}) {
    const normalized = normalizeAssetUrl(url || "", apiBase);
    if (!normalized) {
      return;
    }
    const imageSources = Array.isArray(options.imageSources)
      ? options.imageSources.map((source) => ({
          ...source,
          src: normalizeAssetUrl(source?.src || source?.displayUrl || "", apiBase),
          displayUrl: normalizeAssetUrl(source?.displayUrl || source?.src || "", apiBase),
          originalUrl: normalizeAssetUrl(source?.originalUrl || "", apiBase),
        }))
      : [];
    const gallery = normalizeImageList(sourceImages);
    const sourceGallery = imageSources
      .map((source) => source.src || source.displayUrl)
      .filter(Boolean);
    const images = gallery.length > 0 ? gallery : (sourceGallery.length > 0 ? sourceGallery : [normalized]);
    const index = resolveImageViewerIndex(images, normalized, options.startIndex);
    const alignedImageSources = alignImageSources(images, imageSources);
    const normalizedOriginalImages = normalizeImageList(options.originalImages, { keepEmpty: true });
    const normalizedOriginalUrl = normalizeAssetUrl(options.originalUrl || "", apiBase);
    const sourceOriginalImages = alignedImageSources.map((source) => source.originalUrl || "");
    const originalImages = images.map((image, imageIndex) => (
      normalizedOriginalImages[imageIndex]
      || sourceOriginalImages[imageIndex]
      || (imageIndex === index && normalizedOriginalUrl ? normalizedOriginalUrl : "")
      || ""
    ));
    setImageViewer({ images, index, originalImages, imageSources: alignedImageSources });
  }

  function closeImageViewer() {
    setImageViewer(null);
  }

  return {
    route,
    setRoute,
    message,
    setMessage,
    imageViewer,
    openImageViewer,
    closeImageViewer,
    detailMediaIndex,
    setDetailMediaIndex,
  };
}
