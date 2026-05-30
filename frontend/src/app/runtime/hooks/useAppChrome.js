import { useEffect, useState } from "react";
import {
  normalizeAssetUrl,
  parseRouteFromLocation,
} from "../../../shared/state/appHelpers";

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
    const index = Math.max(0, images.indexOf(normalized));
    const normalizedOriginalImages = normalizeImageList(options.originalImages, { keepEmpty: true });
    const normalizedOriginalUrl = normalizeAssetUrl(options.originalUrl || "", apiBase);
    const sourceOriginalImages = imageSources.map((source) => source.originalUrl || "");
    const originalImages = images.map((image, imageIndex) => (
      normalizedOriginalImages[imageIndex]
      || sourceOriginalImages[imageIndex]
      || (imageIndex === index && normalizedOriginalUrl ? normalizedOriginalUrl : "")
      || image
    ));
    setImageViewer({ images, index, originalImages, imageSources });
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
