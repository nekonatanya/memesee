import { useEffect, useMemo, useRef, useState } from "react";
import UiIcon from "../../../../shared/components/UiIcon";

export default function RichGallery({
  richDetailImages,
  richOriginalImages = [],
  richImageSources = [],
  detailMediaIndex,
  setDetailMediaIndex,
  openImageViewer,
}) {
  const imageSources = useMemo(
    () => (Array.isArray(richImageSources) && richImageSources.length > 0
      ? richImageSources
      : richDetailImages.map((src, index) => ({
          src,
          displayUrl: src,
          originalUrl: richOriginalImages[index] || src,
        }))),
    [richDetailImages, richImageSources, richOriginalImages],
  );
  const displayImages = useMemo(
    () => imageSources
      .map((source) => source.src || source.displayUrl)
      .filter(Boolean),
    [imageSources],
  );
  const hasMultipleImages = displayImages.length > 1;
  const currentImageSource = imageSources[detailMediaIndex] || {};
  const currentImage = currentImageSource.src || currentImageSource.displayUrl || displayImages[detailMediaIndex];
  const currentProcessingStatus = String(currentImageSource.processingStatus || "READY").toUpperCase();
  const currentStatusLabel = currentProcessingStatus === "PROCESSING"
    ? "图片处理中"
    : (currentProcessingStatus === "FAILED" ? "处理失败" : "");
  const originalImages = useMemo(
    () => (Array.isArray(richOriginalImages) && richOriginalImages.length > 0
      ? richOriginalImages
      : imageSources.map((source) => source.originalUrl || source.displayUrl || source.src).filter(Boolean)),
    [imageSources, richOriginalImages],
  );
  const currentOriginalImage = originalImages[detailMediaIndex] || currentImage;
  const frameRef = useRef(null);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const [naturalSizeMap, setNaturalSizeMap] = useState({});

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const nextWidth = Math.max(0, Math.floor(entry.contentRect.width));
      const nextHeight = Math.max(0, Math.floor(entry.contentRect.height));
      setFrameSize((prev) =>
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight },
      );
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!currentImage || !naturalSizeMap[currentImage]) {
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
        image.src = imageUrl;
      });
    };
    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(prefetchAdjacentImages, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(idleId);
    }
    const timer = window.setTimeout(prefetchAdjacentImages, 250);
    return () => window.clearTimeout(timer);
  }, [currentImage, detailMediaIndex, displayImages, naturalSizeMap]);

  const naturalSize = naturalSizeMap[currentImage];
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
  }, [naturalSize, frameSize.width, frameSize.height]);

  function onImageLoad(event) {
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

  return (
    <div className="post-rich-gallery">
      <div className="post-rich-gallery-stage">
        <button
          ref={frameRef}
          type="button"
          className="post-rich-gallery-frame"
          onClick={() =>
            openImageViewer(currentImage, displayImages, {
              originalUrl: currentOriginalImage,
              originalImages,
              imageSources,
            })
          }
          aria-label={`View image ${detailMediaIndex + 1}`}
        >
          <span
            className={`post-rich-gallery-image-shell ${renderSize ? "" : "is-sizing"}`}
            style={
              renderSize
                ? {
                    width: `${renderSize.width}px`,
                    height: `${renderSize.height}px`,
                  }
                : undefined
            }
          >
            <img
              key={currentImage}
              className="post-rich-gallery-image"
              src={currentImage}
              srcSet={currentImageSource.srcSet || undefined}
              sizes={currentImageSource.sizes || undefined}
              alt={`Rich media ${detailMediaIndex + 1}`}
              onLoad={onImageLoad}
              decoding="async"
              fetchPriority="high"
            />
          </span>
          {currentStatusLabel && (
            <span className={`post-rich-gallery-status is-${currentProcessingStatus.toLowerCase()}`}>
              {currentStatusLabel}
            </span>
          )}
        </button>

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
