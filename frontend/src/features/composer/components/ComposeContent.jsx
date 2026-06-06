import { useMemo } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { normalizeAssetUrl } from "../../../shared/media/mediaAssetHelpers";
import {
  removeExternalMarkdownImages,
  removeMarkdownImages,
} from "../../../shared/media/markdownContent";
import MarkdownMediaImage from "../../../shared/media/MarkdownMediaImage";
import {
  buildMarkdownImageGallery,
  buildMarkdownMediaAssetMap,
  resolveMarkdownImageData,
} from "../../../shared/media/markdownImages";

function keepMarkdownUrl(value) {
  return String(value || "").trim().startsWith("media:")
    ? value
    : defaultUrlTransform(value);
}

export default function ComposeContent({
  composerMode,
  content,
  viewMode,
  handleComposerContentChange,
  composerContentRef,
  closeComposerTagEditor,
  composerMediaAssets,
  openImageViewer,
}) {
  const isPreviewing = viewMode === "preview";
  const markdownPreviewContent = useMemo(
    () => composerMode === "long"
      ? removeExternalMarkdownImages(content)
      : removeMarkdownImages(content),
    [composerMode, content],
  );
  const mediaAssetMap = useMemo(
    () => buildMarkdownMediaAssetMap(composerMediaAssets),
    [composerMediaAssets],
  );
  const markdownImageGallery = useMemo(
    () => buildMarkdownImageGallery({
      content: markdownPreviewContent,
      mediaAssetMap,
    }),
    [markdownPreviewContent, mediaAssetMap],
  );
  const markdownComponents = useMemo(
    () => ({
      a: ({ href, children }) => {
        const normalized = normalizeAssetUrl(href || "");
        return (
          <a href={normalized} target="_blank" rel="noreferrer">
            {children}
          </a>
        );
      },
      img: ({ src, alt }) => {
        const imageData = resolveMarkdownImageData({
          src,
          alt,
          mediaAssetMap,
        });
        if (!imageData) {
          return null;
        }
        const viewerImages = markdownImageGallery.map((entry) => entry.imageUrl);
        const viewerOriginalImages = markdownImageGallery.map((entry) => entry.originalUrl);
        const viewerImageSources = markdownImageGallery.map((entry) => entry.imageSource);
        return (
          <MarkdownMediaImage
            {...imageData}
            openImageViewer={openImageViewer}
            viewerImages={viewerImages}
            viewerOriginalImages={viewerOriginalImages}
            viewerImageSources={viewerImageSources}
          />
        );
      },
    }),
    [markdownImageGallery, mediaAssetMap, openImageViewer],
  );

  return (
    <div className="post-detail-content article-content compose-content-shell">
      <textarea
        ref={composerContentRef}
        className={`compose-content-input ${isPreviewing ? "is-preview-hidden" : ""}`}
        placeholder={
          composerMode === "long"
            ? "在正文区域直接写长文，支持 Markdown。"
            : "添加图文说明，可留空。"
        }
        value={content}
        onFocus={closeComposerTagEditor}
        onChange={handleComposerContentChange}
        required={!isPreviewing && composerMode === "long"}
        aria-hidden={isPreviewing}
        tabIndex={isPreviewing ? -1 : undefined}
      />

      {isPreviewing && (
        <div className="markdown-content compose-markdown-preview">
          {markdownPreviewContent.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={markdownComponents}
              urlTransform={keepMarkdownUrl}
            >
              {markdownPreviewContent}
            </ReactMarkdown>
          ) : (
            <p className="paper-inline-status compose-markdown-empty">暂无预览内容。</p>
          )}
        </div>
      )}

    </div>
  );
}
