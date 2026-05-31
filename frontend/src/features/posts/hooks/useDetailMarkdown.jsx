import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import UiIcon from "../../../shared/components/UiIcon";
import {
  buildPostMediaCacheVersionSeed,
  normalizeAssetUrl,
  removeMarkdownImages,
  withMediaCacheVersion,
} from "../../../shared/state/appHelpers";
import { DETAIL_IMAGE_SIZES } from "../../../shared/media/responsiveImages";
import { resolveMarkdownImageSizing } from "../../../shared/state/markdownImageSizing";

function extractCodeText(children) {
  const codeNode = Array.isArray(children) ? children[0] : children;
  const codeChildren = codeNode?.props?.children;
  return Array.isArray(codeChildren)
    ? codeChildren.join("")
    : String(codeChildren || "");
}

async function copyTextToClipboard(text) {
  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function MarkdownCodeBlock({ children }) {
  const [copied, setCopied] = useState(false);
  const codeText = extractCodeText(children).replace(/\n$/, "");

  async function copyCode() {
    if (!codeText) {
      return;
    }
    try {
      await copyTextToClipboard(codeText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="markdown-code-block">
      <button
        type="button"
        className={`markdown-code-copy ${copied ? "copied" : ""}`}
        onClick={copyCode}
        aria-label={copied ? "代码已复制" : "复制代码"}
        title={copied ? "已复制" : "复制代码"}
      >
        <UiIcon name={copied ? "check" : "copy"} />
      </button>
      <pre>{children}</pre>
    </div>
  );
}

function toOriginalMediaUrl(url) {
  if (!url || !url.includes("/api/media-assets/")) {
    return url;
  }
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.includes("/api/media-assets/") && parsed.pathname.endsWith("/binary")) {
      parsed.searchParams.set("variant", "original");
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return url.replace(/([?&])variant=[^&]*/i, "$1variant=original");
  }
  return url;
}

function toVariantMediaUrl(url, variant) {
  if (!url || !url.includes("/api/media-assets/")) {
    return "";
  }
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.pathname.includes("/api/media-assets/") && parsed.pathname.endsWith("/binary")) {
      parsed.searchParams.set("variant", variant);
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch {
    return "";
  }
  return "";
}

function buildMarkdownImageSource(url) {
  const candidates = [
    ["small", 720],
    ["medium", 1080],
    ["display", 1600],
  ]
    .map(([variant, width]) => {
      const variantUrl = toVariantMediaUrl(url, variant);
      return variantUrl ? `${variantUrl} ${width}w` : "";
    })
    .filter(Boolean);
  return {
    src: url,
    srcSet: candidates.join(", "),
    sizes: DETAIL_IMAGE_SIZES,
    originalUrl: toOriginalMediaUrl(url),
  };
}

export function useDetailMarkdown({
  apiBase,
  detailImageUrls,
  selectedPost,
  openImageViewer,
}) {
  const mediaVersionSeed = useMemo(
    () => buildPostMediaCacheVersionSeed(selectedPost),
    [selectedPost],
  );
  const markdownComponents = useMemo(
    () => ({
      a: ({ href, children }) => {
        const normalized = normalizeAssetUrl(href || "", apiBase);
        return (
          <a href={normalized} target="_blank" rel="noreferrer">
            {children}
          </a>
        );
      },
      img: ({ src, alt, title }) => {
        if (selectedPost?.postMode === "rich") {
          return null;
        }
        const normalized = withMediaCacheVersion(
          normalizeAssetUrl(src || "", apiBase),
          mediaVersionSeed,
        );
        if (!normalized) {
          return null;
        }
        const viewerImages = detailImageUrls
          .map((url) => withMediaCacheVersion(url, mediaVersionSeed));
        const startIndex = Math.max(0, viewerImages.indexOf(normalized));
        const originalUrl = toOriginalMediaUrl(normalized);
        const originalGallery = viewerImages
          .map(toOriginalMediaUrl);
        const imageSource = buildMarkdownImageSource(normalized);
        const imageSources = viewerImages
          .map(buildMarkdownImageSource);
        const imageSizing = resolveMarkdownImageSizing({ alt, title });
        return (
          <button
            type="button"
            className="markdown-image-trigger"
            style={imageSizing.containerStyle}
            onClick={() => openImageViewer(normalized, viewerImages, {
              startIndex,
              originalUrl,
              originalImages: originalGallery,
              imageSources,
            })}
          >
            <span className="markdown-image-frame" style={imageSizing.frameStyle}>
              <img
                src={normalized}
                srcSet={imageSource.srcSet || undefined}
                sizes={imageSource.sizes}
                alt={imageSizing.alt || "image"}
                className="markdown-inline-image"
                style={imageSizing.imageStyle}
                loading="lazy"
                decoding="async"
              />
            </span>
          </button>
        );
      },
      pre: ({ children }) => (
        <MarkdownCodeBlock>{children}</MarkdownCodeBlock>
      ),
    }),
    [apiBase, detailImageUrls, mediaVersionSeed, openImageViewer, selectedPost?.postMode],
  );

  return useMemo(() => {
    if (!selectedPost) {
      return null;
    }
    const content = selectedPost.postMode === "rich"
      ? removeMarkdownImages(selectedPost.content || "")
      : selectedPost.content || "";
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    );
  }, [selectedPost, markdownComponents]);
}
