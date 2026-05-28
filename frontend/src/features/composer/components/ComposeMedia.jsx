import RichGallery from "../../posts/components/post/RichGallery";

function displayUrl(url) {
  if (!url) {
    return "";
  }
  const normalizedRaw = String(url).trim();
  if (!normalizedRaw) {
    return "";
  }
  if (/^https?:\/\//i.test(normalizedRaw)) {
    return normalizedRaw;
  }
  return normalizedRaw.startsWith("/") ? normalizedRaw : `/${normalizedRaw}`;
}

export default function ComposeMedia({
  composerMediaUrls,
  composerMediaIndex,
  setComposerMediaIndex,
  openImageViewer,
  moveComposerMedia,
  removeComposerMediaAt,
}) {
  const galleryUrls = composerMediaUrls.map((url) => displayUrl(url)).filter(Boolean);

  if (galleryUrls.length === 0) {
    return null;
  }

  return (
    <div className="compose-media-area">
      <RichGallery
        richDetailImages={galleryUrls}
        detailMediaIndex={composerMediaIndex}
        setDetailMediaIndex={setComposerMediaIndex}
        openImageViewer={openImageViewer}
      />

      <div className="compose-rich-editbar">
        <button
          type="button"
          className="compose-rich-control-btn"
          onClick={() => moveComposerMedia(-1)}
          disabled={composerMediaIndex <= 0}
        >
          前移
        </button>
        <button
          type="button"
          className="compose-rich-control-btn danger"
          onClick={() => removeComposerMediaAt(composerMediaIndex)}
        >
          移除
        </button>
        <button
          type="button"
          className="compose-rich-control-btn"
          onClick={() => moveComposerMedia(1)}
          disabled={composerMediaIndex >= galleryUrls.length - 1}
        >
          后移
        </button>
      </div>
    </div>
  );
}
