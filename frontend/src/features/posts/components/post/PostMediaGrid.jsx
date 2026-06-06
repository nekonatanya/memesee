import { useState } from "react";
import ResponsiveImage from "../../../../shared/media/ResponsiveImage";
import { responsiveImageSourceUrl } from "../../../../shared/media/responsiveImages";

function PostMediaGridItem({ post, imageSource, imageIndex, priorityMode }) {
  const [failed, setFailed] = useState(false);
  const processingStatus = String(imageSource.processingStatus || "READY").toUpperCase();
  const processingLabel = processingStatus === "PROCESSING"
    ? "处理中"
    : (processingStatus === "FAILED" ? "处理失败" : "");
  const statusLabel = failed ? "加载失败" : processingLabel;
  const statusClass = failed ? "is-failed" : `is-${processingStatus.toLowerCase()}`;
  const imageUrl = responsiveImageSourceUrl(imageSource);

  return (
    <div className={`post-media-item ${failed ? "is-image-failed" : ""}`}>
      <ResponsiveImage
        src={imageUrl}
        source={imageSource}
        alt={`${post.title}-图${imageIndex + 1}`}
        className="post-media-image"
        loading={priorityMode ? "eager" : "lazy"}
        fetchPriority={priorityMode === "high" ? "high" : undefined}
        decoding="async"
        onLoadStateChange={({ failed: nextFailed }) => setFailed(nextFailed)}
      />
      {statusLabel && (
        <span className={`post-media-status ${statusClass}`}>
          {statusLabel}
        </span>
      )}
    </div>
  );
}

export default function PostMediaGrid({ post, prioritizeImages = false }) {
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
      {visibleImages.map((imageSource, imageIndex) => (
        <PostMediaGridItem
          key={`${post.id}-${imageIndex}`}
          post={post}
          imageSource={imageSource}
          imageIndex={imageIndex}
          priorityMode={prioritizeImages ? (imageIndex === 0 ? "high" : "eager") : ""}
        />
      ))}
    </div>
  );
}
