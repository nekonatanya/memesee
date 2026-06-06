import { useEffect, useMemo, useRef, useState } from "react";
import UiIcon from "../../../../shared/components/UiIcon";
import ResponsiveImage, {
  ImageFailureFallback,
  canPrefetchImages,
} from "../../../../shared/media/ResponsiveImage";

function toPositiveNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function readSourceSize(source) {
  const width = toPositiveNumber(source?.width);
  const height = toPositiveNumber(source?.height);
  return width > 0 && height > 0 ? { width, height } : null;
}

export default function RichGallery({
  richDetailImages = [],
  richOriginalImages = [],
  richImageSources = [],
  detailMediaIndex,
  setDetailMediaIndex,
  openImageViewer,
}) {
  const imageSources = useMemo(() => {
    const sources = Array.isArray(richImageSources) && richImageSources.length > 0
      ? richImageSources
      : richDetailImages.map((src, index) => ({
          src,
          displayUrl: src,
          originalUrl: richOriginalImages[index] || src,
        }));
    return sources.map((source, imageIndex) => ({
      ...source,
      loadingPriority: imageIndex === 0 ? "eager" : "lazy",
      fetchPriority: imageIndex === 0 ? "high" : "low",
    }));
  }, [richDetailImages, richImageSources, richOriginalImages]);
  const displayImages = useMemo(
    () => imageSources
      .map((source) => source.src || source.displayUrl)
      .filter(Boolean),
    [imageSources],
  );
  const hasMultipleImages = displayImages.length > 1;
  const currentImageSource = imageSources[detailMediaIndex] || {};
  const currentLoading = currentImageSource.loadingPriority || (detailMediaIndex === 0 ? "eager" : "lazy");
  const currentFetchPriority = currentImageSource.fetchPriority || (detailMediaIndex === 0 ? "high" : "low");
  const currentImage = currentImageSource.src || currentImageSource.displayUrl || displayImages[detailMediaIndex];
  const currentProcessingStatus = String(currentImageSource.processingStatus || "READY").toUpperCase();
  const originalImages = useMemo(
    () => (Array.isArray(richOriginalImages) && richOriginalImages.length > 0
      ? richOriginalImages
      : imageSources.map((source) => source.originalUrl).filter(Boolean)),
    [imageSources, richOriginalImages],
  );
  const currentOriginalImage = originalImages[detailMediaIndex] || "";
  const frameRef = useRef(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [naturalSizeMap, setNaturalSizeMap] = useState({});
  const [failedImageMap, setFailedImageMap] = useState({});
  const [loadedImageMap, setLoadedImageMap] = useState({});
  const imageFailed = Boolean(currentImage && failedImageMap[currentImage]);
  const currentStatusLabel = currentProcessingStatus === "PROCESSING"
    ? "图片处理中"
    : (currentProcessingStatus === "FAILED" ? "处理失败" : "");
  const currentStatusClass = currentProcessingStatus.toLowerCase();

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return undefined;
    }
    const updateFrameSize = () => {
      const rect = frame.getBoundingClientRect();
      const nextWidth = Math.max(0, Math.floor(rect.width));
      const nextHeight = Math.max(0, Math.floor(rect.height));
      setFrameSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight },
      );
    };
    updateFrameSize();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateFrameSize);
      observer.observe(frame);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", updateFrameSize);
    return () => window.removeEventListener("resize", updateFrameSize);
  }, []);

  useEffect(() => {
    if (!currentImage || !loadedImageMap[currentImage] || !canPrefetchImages()) {
      return undefined;
    }
    const candidates = [
      displayImages[detailMediaIndex - 1],
      displayImages[detailMediaIndex + 1],
    ].filter(Boolean);
    if (candidates.length === 0) {
      return undefined;
    }
    const prefetchAdjacentImages = () => {
      candidates.forEach((imageUrl) => {
        const image = new Image();
        image.decoding = "async";
        if ("fetchPriority" in image) {
          image.fetchPriority = "low";
        }
        image.src = imageUrl;
      });
    };
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetchAdjacentImages, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(idleId);
    }
    const timer = window.setTimeout(prefetchAdjacentImages, 900);
    return () => window.clearTimeout(timer);
  }, [currentImage, detailMediaIndex, displayImages, loadedImageMap]);

  const metadataSize = readSourceSize(currentImageSource);
  const naturalSize = currentImage ? naturalSizeMap[currentImage] || metadataSize : null;
  const renderSize = useMemo(() => {
    if (!naturalSize || frameSize.width <= 0 || frameSize.height <= 0) {
      return null;
    }
    const scale = Math.min(
      frameSize.width / naturalSize.width,
      frameSize.height / naturalSize.height,
    );
    if (!Number.isFinite(scale) || scale <= 0) {
      return null;
    }
    return {
      width: Math.max(1, Math.floor(naturalSize.width * scale)),
      height: Math.max(1, Math.floor(naturalSize.height * scale)),
    };
  }, [frameSize.height, frameSize.width, naturalSize]);

  function setCurrentImageFailed(failed) {
    if (!currentImage) {
      return;
    }
    setFailedImageMap((prev) => {
      if (Boolean(prev[currentImage]) === failed) {
        return prev;
      }
      return {
        ...prev,
        [currentImage]: failed,
      };
    });
  }

  function onImageLoad(event) {
    setCurrentImageFailed(false);
    setLoadedImageMap((prev) => (prev[currentImage] ? prev : { ...prev, [currentImage]: true }));
    const image = event.currentTarget;
    if (!currentImage || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      return;
    }
    setNaturalSizeMap((prev) => {
      const existing = prev[currentImage];
      if (
        existing &&
        existing.width === image.naturalWidth &&
        existing.height === image.naturalHeight
      ) {
        return prev;
      }
      return {
        ...prev,
        [currentImage]: {
          width: image.naturalWidth,
          height: image.naturalHeight,
        },
      };
    });
  }

  function onImageError() {
    setCurrentImageFailed(true);
  }

  return (
    <div className="post-rich-gallery">
      <div className="post-rich-gallery-stage">
        <div
          ref={frameRef}
          className="post-rich-gallery-frame"
        >
          <button
            type="button"
            className={["post-rich-gallery-image-shell", renderSize ? "" : "is-sizing", imageFailed ? "is-image-failed" : ""]
              .filter(Boolean)
              .join(" ")}
            style={
              renderSize
                ? {
                    width: String(renderSize.width) + "px",
                    height: String(renderSize.height) + "px",
                  }
                : undefined
            }
            onClick={() => {
              if (renderSize && currentImage && !imageFailed) {
                openImageViewer(currentImage, displayImages, {
                  startIndex: detailMediaIndex,
                  originalUrl: currentOriginalImage,
                  originalImages,
                  imageSources,
                });
              }
            }}
            aria-label={`View image ${detailMediaIndex + 1}`}
          >
            <ResponsiveImage
              key={currentImage}
              className="post-rich-gallery-image"
              src={currentImage}
              source={currentImageSource}
              alt={`Rich media ${detailMediaIndex + 1}`}
              loading={currentLoading}
              decoding="async"
              fetchPriority={currentFetchPriority}
              onLoad={onImageLoad}
              onLoadStateChange={({ failed: nextFailed, loaded: nextLoaded }) => {
                setFailedImageMap((prev) => ({ ...prev, [currentImage]: nextFailed }));
                if (nextLoaded) {
                  setLoadedImageMap((prev) => (prev[currentImage] ? prev : { ...prev, [currentImage]: true }));
                }
              }}
              onError={onImageError}
            />
            {imageFailed && (
              <ImageFailureFallback className="post-rich-gallery-image-fallback" />
            )}
          </button>
          {currentStatusLabel && (
            <span className={`post-rich-gallery-status is-${currentStatusClass}`}>
              {currentStatusLabel}
            </span>
          )}
        </div>

        {hasMultipleImages && (
          <div className="post-rich-gallery-controls" aria-label="Switch image">
            <button
              type="button"
              className="post-rich-gallery-nav"
              onClick={() => setDetailMediaIndex((value) => Math.max(0, value - 1))}
              disabled={detailMediaIndex <= 0}
              aria-label="Previous image"
            >
              <UiIcon name="chevron-left" />
            </button>

            <div className="post-rich-gallery-index">
              <span className="post-rich-gallery-count" aria-live="polite">
                {detailMediaIndex + 1} / {displayImages.length}
              </span>
              <input
                type="range"
                className="post-rich-gallery-range"
                min="0"
                max={displayImages.length - 1}
                value={detailMediaIndex}
                onChange={(event) => setDetailMediaIndex(Number(event.target.value))}
                aria-label="切换图片"
              />
            </div>

            <button
              type="button"
              className="post-rich-gallery-nav"
              onClick={() =>
                setDetailMediaIndex((value) => Math.min(displayImages.length - 1, value + 1))
              }
              disabled={detailMediaIndex >= displayImages.length - 1}
              aria-label="Next image"
            >
              <UiIcon name="chevron-right" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
