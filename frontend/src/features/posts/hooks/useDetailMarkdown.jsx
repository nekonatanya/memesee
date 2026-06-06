import { useMemo, useState } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import UiIcon from "../../../shared/components/UiIcon";
import { normalizeAssetUrl } from "../../../shared/media/mediaAssetHelpers";
import {
  removeExternalMarkdownImages,
  removeMarkdownImages,
} from "../../../shared/media/markdownContent";
import MarkdownMediaImage from "../../../shared/media/MarkdownMediaImage";
import {
  buildMarkdownImageGallery,
  getMarkdownImageOccurrenceIndex,
  buildMarkdownMediaAssetMap,
  resolveMarkdownImageData,
} from "../../../shared/media/markdownImages";

function keepMarkdownUrl(value) {
  return String(value || "").trim().startsWith("media:")
    ? value
    : defaultUrlTransform(value);
}

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

export function useDetailMarkdown({
  apiBase,
  detailImageUrls,
  selectedPost,
  openImageViewer,
}) {
  const [firstMarkdownImageLoadedKey, setFirstMarkdownImageLoadedKey] = useState("");
  const renderedMarkdownContent = selectedPost?.postMode === "rich"
    ? removeMarkdownImages(selectedPost?.content || "")
    : removeExternalMarkdownImages(selectedPost?.content || "");

  const markdownImageLoadKey = String(selectedPost?.id || "") + ":" + renderedMarkdownContent;
  const firstMarkdownImageLoaded = firstMarkdownImageLoadedKey === markdownImageLoadKey;

  const mediaAssetMap = useMemo(
    () => buildMarkdownMediaAssetMap(selectedPost?.mediaAssets),
    [selectedPost?.mediaAssets],
  );
  const markdownImageGallery = useMemo(
    () => buildMarkdownImageGallery({
      content: renderedMarkdownContent,
      mediaAssetMap,
      apiBase,
    }),
    [apiBase, mediaAssetMap, renderedMarkdownContent],
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
      img: ({ src, alt }) => {
        const imageData = resolveMarkdownImageData({
          src,
          alt,
          mediaAssetMap,
          apiBase,
        });
        if (!imageData) {
          return null;
        }
        const imageOccurrenceIndex = getMarkdownImageOccurrenceIndex({
          content: renderedMarkdownContent,
          src,
        });
        const isLongMode = selectedPost?.postMode === "long";
        const shouldPrioritizeImage = isLongMode && imageOccurrenceIndex === 0;
        const shouldDeferImage = isLongMode && imageOccurrenceIndex > 0;
        const viewerImages = markdownImageGallery.length > 0
          ? markdownImageGallery.map((entry) => entry.imageUrl)
          : (Array.isArray(detailImageUrls) ? detailImageUrls : []);
        const viewerOriginalImages = markdownImageGallery.length > 0
          ? markdownImageGallery.map((entry) => entry.originalUrl)
          : [];
        const viewerImageSources = markdownImageGallery.length > 0
          ? markdownImageGallery.map((entry) => entry.imageSource)
          : [];
        return (
          <MarkdownMediaImage
            {...imageData}
            openImageViewer={openImageViewer}
            viewerImages={viewerImages}
            viewerOriginalImages={viewerOriginalImages}
            viewerImageSources={viewerImageSources}
            loading={shouldPrioritizeImage ? "eager" : "lazy"}
            fetchPriority={shouldPrioritizeImage ? "high" : "low"}
            deferLoad={shouldDeferImage}
            holdLoad={shouldDeferImage && !firstMarkdownImageLoaded}
            onLoadStateChange={shouldPrioritizeImage
              ? (nextState) => {
                  if (nextState?.loaded || nextState?.failed) {
                    setFirstMarkdownImageLoadedKey(markdownImageLoadKey);
                  }
                }
              : undefined}
          />
        );
      },
      pre: ({ children }) => (
        <MarkdownCodeBlock>{children}</MarkdownCodeBlock>
      ),
    }),
    [apiBase, detailImageUrls, firstMarkdownImageLoaded, markdownImageGallery, markdownImageLoadKey, mediaAssetMap, openImageViewer, renderedMarkdownContent, selectedPost?.postMode],
  );

  return useMemo(() => {
    if (!selectedPost) {
      return null;
    }
    const content = renderedMarkdownContent;
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={markdownComponents}
        urlTransform={keepMarkdownUrl}
      >
        {content}
      </ReactMarkdown>
    );
  }, [renderedMarkdownContent, selectedPost, markdownComponents]);
}
