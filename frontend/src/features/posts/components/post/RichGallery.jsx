import { useEffect, useMemo, useRef, useState } from "react";
import UiIcon from "../../../../shared/components/UiIcon";

export default function RichGallery({
  richDetailImages,
  richOriginalImages = [],
  detailMediaIndex,
  setDetailMediaIndex,
  openImageViewer,
}) {
  const hasMultipleImages = richDetailImages.length > 1;
  const currentImage = richDetailImages[detailMediaIndex];
  const originalImages = Array.isArray(richOriginalImages) && richOriginalImages.length > 0
    ? richOriginalImages
    : richDetailImages;
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
    let active = true;
    richDetailImages.forEach((imageUrl) => {
      if (!imageUrl || naturalSizeMap[imageUrl]) {
        return;
      }
      const image = new Image();
      image.onload = () => {
        if (!active || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
          return;
        }
        setNaturalSizeMap((prev) => {
          if (prev[imageUrl]) {
            return prev;
          }
          return {
            ...prev,
            [imageUrl]: {
              width: image.naturalWidth,
              height: image.naturalHeight,
            },
          };
        });
      };
      image.src = imageUrl;
    });
    return () => {
      active = false;
    };
  }, [richDetailImages, naturalSizeMap]);

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
          onClick={() => openImageViewer(currentOriginalImage, originalImages)}
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
              alt={`Rich media ${detailMediaIndex + 1}`}
              onLoad={onImageLoad}
            />
          </span>
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
                {detailMediaIndex + 1} / {richDetailImages.length}
              </span>
              <input
                type="range"
                className="post-rich-gallery-range"
                min="0"
                max={richDetailImages.length - 1}
                value={detailMediaIndex}
                onChange={(event) => setDetailMediaIndex(Number(event.target.value))}
                aria-label="切换图片"
              />
            </div>

            <button
              type="button"
              className="post-rich-gallery-nav"
              onClick={() =>
                setDetailMediaIndex((value) => Math.min(richDetailImages.length - 1, value + 1))
              }
              disabled={detailMediaIndex >= richDetailImages.length - 1}
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
