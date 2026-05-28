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

  function openImageViewer(url, sourceImages = []) {
    const normalized = normalizeAssetUrl(url || "", apiBase);
    if (!normalized) {
      return;
    }
    const gallery = Array.from(
      new Set(
        (Array.isArray(sourceImages) ? sourceImages : [])
          .map((item) => normalizeAssetUrl(item, apiBase))
          .filter(Boolean),
      ),
    );
    const images = gallery.length > 0 ? gallery : [normalized];
    const index = Math.max(0, images.indexOf(normalized));
    setImageViewer({ images, index });
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
