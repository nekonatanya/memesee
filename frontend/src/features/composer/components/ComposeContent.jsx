import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import {
  extractImageUrls,
  normalizeAssetUrl,
  removeMarkdownImages,
} from "../../../shared/state/appHelpers";
import { resolveMarkdownImageSizing } from "../../../shared/state/markdownImageSizing";

export default function ComposeContent({
  composerMode,
  content,
  viewMode,
  handleComposerContentChange,
  composerContentRef,
  closeComposerTagEditor,
  openImageViewer,
}) {
  const isPreviewing = viewMode === "preview";
  const markdownPreviewContent = useMemo(
    () => (composerMode === "rich" ? removeMarkdownImages(content) : String(content || "")),
    [composerMode, content],
  );
  const previewImageUrls = useMemo(
    () => (composerMode === "long" ? extractImageUrls(content || "") : []),
    [composerMode, content],
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
      img: ({ src, alt, title }) => {
        if (composerMode === "rich") {
          return null;
        }
        const normalized = normalizeAssetUrl(src || "");
        if (!normalized) {
          return null;
        }
        const imageSizing = resolveMarkdownImageSizing({ alt, title });
        return (
          <button
            type="button"
            className="markdown-image-trigger"
            style={imageSizing.containerStyle}
            onClick={() => openImageViewer?.(normalized, previewImageUrls)}
          >
            <span className="markdown-image-frame" style={imageSizing.frameStyle}>
              <img
                src={normalized}
                alt={imageSizing.alt || "image"}
                className="markdown-inline-image"
                style={imageSizing.imageStyle}
                loading="lazy"
              />
            </span>
          </button>
        );
      },
    }),
    [composerMode, openImageViewer, previewImageUrls],
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
            >
              {markdownPreviewContent}
            </ReactMarkdown>
          ) : (
            <p className="compose-markdown-empty">暂无预览内容。</p>
          )}
        </div>
      )}

    </div>
  );
}
