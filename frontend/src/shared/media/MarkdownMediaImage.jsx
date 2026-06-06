import { useEffect, useMemo, useRef, useState } from "react";
import ResponsiveImage, {
  ImageFailureFallback,
  IMAGE_LOAD_FAILED_LABEL,
  imageStateClassName,
} from "./ResponsiveImage";

export default function MarkdownMediaImage({
  imageUrl,
  imageSource,
  parsedAlt,
  alt,
  hasCustomSize,
  hasCustomWidth,
  hasCustomHeight,
  frameStyle,
  imageStyle,
  openImageViewer,
  viewerImages = [],
  viewerOriginalImages = [],
  viewerImageSources = [],
  loading = "lazy",
  fetchPriority,
  deferLoad = false,
  holdLoad = false,
  onLoadStateChange,
}) {
  const [failed, setFailed] = useState(false);
  const [shouldRenderImage, setShouldRenderImage] = useState(!deferLoad && !holdLoad);
  const frameRef = useRef(null);
  const startIndex = Math.max(0, viewerImages.indexOf(imageUrl));
  const imageViewerPayload = useMemo(
    () => ({
      startIndex,
      originalUrl: viewerOriginalImages[startIndex] || "",
      originalImages: viewerOriginalImages,
      imageSources: viewerImageSources,
    }),
    [startIndex, viewerImageSources, viewerOriginalImages],
  );

  useEffect(() => {
    if (holdLoad) {
      setShouldRenderImage(false);
      return undefined;
    }
    if (!deferLoad) {
      setShouldRenderImage(true);
      return undefined;
    }

    setShouldRenderImage(false);
    const frame = frameRef.current;
    if (!frame || typeof IntersectionObserver === "undefined") {
      const timer = window.setTimeout(() => setShouldRenderImage(true), 1200);
      return () => window.clearTimeout(timer);
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setShouldRenderImage(true);
        observer.disconnect();
      }
    }, { rootMargin: "420px 0px", threshold: 0.01 });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [deferLoad, holdLoad, imageUrl]);

  const frameClassName = imageStateClassName(
    [
      "markdown-image-frame",
      hasCustomSize ? "is-custom-size" : "is-full-width",
      hasCustomWidth ? "has-custom-width" : "",
      hasCustomHeight ? "has-custom-height" : "",
      shouldRenderImage ? "" : "is-deferred",
    ].filter(Boolean).join(" "),
    "is-image-failed",
    failed,
  );
  const sourceWidth = Number(imageSource?.width || 0);
  const sourceHeight = Number(imageSource?.height || 0);
  const aspectRatio = sourceWidth > 0 && sourceHeight > 0
    ? sourceWidth + " / " + sourceHeight
    : "";
  const placeholderUrl = String(imageSource?.blurDataUrl || imageSource?.placeholderUrl || "");
  const deferredFrameStyle = !shouldRenderImage && aspectRatio
    ? { ...frameStyle, aspectRatio }
    : frameStyle;
  const deferredPlaceholderStyle = {
    ...(aspectRatio ? { aspectRatio } : { minHeight: "180px" }),
    ...(placeholderUrl ? { backgroundImage: "url(" + JSON.stringify(placeholderUrl) + ")" } : null),
  };

  return (
    <span ref={frameRef} className={frameClassName} style={deferredFrameStyle}>
      {shouldRenderImage ? (
        <ResponsiveImage
          className="markdown-inline-image"
          src={imageUrl}
          source={imageSource}
          alt={parsedAlt.alt || alt || ""}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          style={imageStyle}
          onLoadStateChange={(nextState) => {
            setFailed(nextState.failed);
            onLoadStateChange?.(nextState);
          }}
          onClick={() => {
            if (typeof openImageViewer === "function" && !failed) {
              openImageViewer(imageUrl, viewerImages, imageViewerPayload);
            }
          }}
        />
      ) : (
        <span
          className="markdown-image-deferred-placeholder"
          style={deferredPlaceholderStyle}
          aria-hidden="true"
        />
      )}
      {shouldRenderImage && failed && (
        <ImageFailureFallback className="markdown-image-fallback" label={IMAGE_LOAD_FAILED_LABEL} />
      )}
    </span>
  );
}
