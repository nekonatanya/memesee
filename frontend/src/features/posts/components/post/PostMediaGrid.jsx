export default function PostMediaGrid({ post }) {
  if (!Array.isArray(post.previewImages) || post.previewImages.length === 0) {
    return null;
  }

  const visibleImages = post.previewImages.slice(0, 3);
  const countClass = `count-${Math.min(3, visibleImages.length)}`;

  return (
    <div className={`post-media-grid ${countClass}`}>
      {visibleImages.map((imageUrl, imageIndex) => (
        <div key={`${post.id}-${imageIndex}`} className="post-media-item">
          <img
            src={imageUrl}
            alt={`${post.title}-ͼ${imageIndex + 1}`}
            className="post-media-image"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
