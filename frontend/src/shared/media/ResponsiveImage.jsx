import { useEffect, useRef, useState } from "react";
import { responsiveImageSourceUrl } from "./responsiveImages";

export const IMAGE_LOAD_FAILED_LABEL = "图片加载失败";

function classNames(...values) {
  return values.filter(Boolean).join(" ");
}

function normalizeImageUrl(value) {
  return String(value || "").trim();
}

function responsiveImagePlaceholderUrl(source, imageUrl) {
  const normalizedImageUrl = normalizeImageUrl(imageUrl);
  const candidates = [
    source?.blurDataUrl,
    source?.placeholderUrl,
  ]
    .map(normalizeImageUrl)
    .filter(Boolean);

  const placeholderUrl = candidates[0] || "";
  if (!placeholderUrl) {
    return "";
  }
  if (placeholderUrl === normalizedImageUrl && !normalizeImageUrl(source?.srcSet)) {
    return "";
  }
  return placeholderUrl;
}

export function imageStateClassName(baseClassName, failedClassName, failed) {
  return [baseClassName, failed ? failedClassName : ""]
    .filter(Boolean)
    .join(" ");
}

export function canPrefetchImages() {
  if (typeof navigator === "undefined") {
    return false;
  }
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) {
    return true;
  }
  if (connection.saveData) {
    return false;
  }
  return !/(^|-)2g$/i.test(String(connection.effectiveType || ""));
}

export function ImageFailureFallback({ className, label = IMAGE_LOAD_FAILED_LABEL }) {
  return (
    <span className={className} role="status">
      {label}
    </span>
  );
}

export default function ResponsiveImage({
  source = {},
  src,
  alt = "",
  className = "",
  wrapperClassName = "",
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  style,
  onLoad,
  onError,
  onLoadStateChange,
  placeholder = "blur",
  ...imageProps
}) {
  const safeSource = source && typeof source === "object" ? source : {};
  const imageUrl = src || responsiveImageSourceUrl(safeSource);
  const placeholderUrl = placeholder === "blur"
    ? responsiveImagePlaceholderUrl(safeSource, imageUrl)
    : "";
  const hasPlaceholder = Boolean(placeholderUrl);
  const placeholderStyle = hasPlaceholder
    ? { backgroundImage: `url(${JSON.stringify(placeholderUrl)})` }
    : undefined;
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const imageRef = useRef(null);
  const onLoadStateChangeRef = useRef(onLoadStateChange);
  onLoadStateChangeRef.current = onLoadStateChange;

  useEffect(() => {
    setFailed(false);
    setLoaded(false);

    const image = imageRef.current;
    if (!image || !imageUrl || !image.complete) {
      return;
    }
    if (image.naturalWidth > 0) {
      setLoaded(true);
      if (typeof onLoadStateChangeRef.current === "function") {
        onLoadStateChangeRef.current({ failed: false, loaded: true, event: null });
      }
      return;
    }
    setFailed(true);
    if (typeof onLoadStateChangeRef.current === "function") {
      onLoadStateChangeRef.current({ failed: true, loaded: false, event: null });
    }
  }, [imageUrl, safeSource.srcSet]);

  function notifyLoadState(nextState, event) {
    setFailed(nextState.failed);
    setLoaded(nextState.loaded);
    if (typeof onLoadStateChangeRef.current === "function") {
      onLoadStateChangeRef.current({ ...nextState, event });
    }
  }

  function handleLoad(event) {
    notifyLoadState({ failed: false, loaded: true }, event);
    if (typeof onLoad === "function") {
      onLoad(event);
    }
  }

  function handleError(event) {
    notifyLoadState({ failed: true, loaded: false }, event);
    if (typeof onError === "function") {
      onError(event);
    }
  }

  const imageState = failed ? "failed" : (loaded ? "loaded" : "loading");

  return (
    <span
      className={classNames(
        "responsive-image-shell",
        hasPlaceholder ? "has-blur-placeholder" : "",
        loaded ? "is-loaded" : "",
        failed ? "is-failed" : "",
        wrapperClassName,
      )}
      data-responsive-image-state={imageState}
    >
      {hasPlaceholder && (
        <span
          className="responsive-image-placeholder"
          style={placeholderStyle}
          aria-hidden="true"
        />
      )}
      <img
        {...imageProps}
        ref={imageRef}
        className={classNames("responsive-image-img", className)}
        src={imageUrl}
        srcSet={safeSource.srcSet || undefined}
        sizes={safeSource.sizes || undefined}
        width={safeSource.width || undefined}
        height={safeSource.height || undefined}
        alt={alt}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
        style={style}
        data-image-state={imageState}
        onLoad={handleLoad}
        onError={handleError}
      />
    </span>
  );
}
