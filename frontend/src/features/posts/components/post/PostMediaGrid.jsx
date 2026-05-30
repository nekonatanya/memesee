export default function PostMediaGrid({ post }) {
  const sourceItems = Array.isArray(post.previewImageSources) && post.previewImageSources.length > 0
    ? post.previewImageSources
    : (Array.isArray(post.previewImages) ? post.previewImages.map((src) => ({ src })) : []);

  if (sourceItems.length === 0) {
    return null;
  }

  const visibleImages = sourceItems.slice(0, 3);
  const countClass = `count-${Math.min(3, visibleImages.length)}`;

  return (
    <div className={`post-media-grid ${countClass}`}>
      {visibleImages.map((imageSource, imageIndex) => {
        const processingStatus = String(imageSource.processingStatus || "READY").toUpperCase();
        const statusLabel = processingStatus === "PROCESSING"
          ? "处理中"
          : (processingStatus === "FAILED" ? "处理失败" : "");
        return (
          <div key={`${post.id}-${imageIndex}`} className="post-media-item">
            <img
              src={imageSource.src || imageSource.displayUrl}
              srcSet={imageSource.srcSet || undefined}
              sizes={imageSource.sizes || undefined}
              alt={`${post.title}-图${imageIndex + 1}`}
              className="post-media-image"
              loading="lazy"
              decoding="async"
            />
            {statusLabel && (
              <span className={`post-media-status is-${processingStatus.toLowerCase()}`}>
                {statusLabel}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
