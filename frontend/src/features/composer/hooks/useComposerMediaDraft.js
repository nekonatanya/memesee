import { useEffect, useState } from "react";
import { uploadMediaAsset as uploadContentMediaAsset } from "../../content/api/contentApi";
import {
  buildComposerMarkdownImage,
  buildComposerUploadMessage,
  getNextComposerMediaIndex,
  mergeComposerMediaAssets,
  mergeComposerMediaUrls,
  moveIndexedItem,
  removeIndexedItem,
} from "../state/composerDraftHelpers";
import { UI_MESSAGES, readableError } from "../../../shared/state/uiMessages";

export function useComposerMediaDraft({
  client,
  token,
  isLoggedIn,
  composerCommunitySlug,
  composerMode,
  setContent,
  setMessage,
}) {
  const [composerMediaUrls, setComposerMediaUrls] = useState([]);
  const [composerMediaAssets, setComposerMediaAssets] = useState([]);
  const [composerMediaIndex, setComposerMediaIndex] = useState(0);
  const [uploadingAssets, setUploadingAssets] = useState(false);

  useEffect(() => {
    setComposerMediaIndex((prev) => {
      if (composerMediaUrls.length === 0) {
        return 0;
      }
      return Math.min(prev, composerMediaUrls.length - 1);
    });
  }, [composerMediaUrls]);

  function resetComposerMediaDraft() {
    setComposerMediaUrls([]);
    setComposerMediaAssets([]);
    setComposerMediaIndex(0);
    setUploadingAssets(false);
  }

  function hydrateComposerMediaDraft({ mediaUrls, mediaAssets }) {
    setComposerMediaUrls(Array.isArray(mediaUrls) ? mediaUrls : []);
    setComposerMediaAssets(Array.isArray(mediaAssets) ? mediaAssets : []);
    setComposerMediaIndex(0);
  }

  function removeComposerMediaAt(index) {
    setComposerMediaUrls((prev) => removeIndexedItem(prev, index));
    setComposerMediaAssets((prev) => removeIndexedItem(prev, index));
    setComposerMediaIndex((current) =>
      getNextComposerMediaIndex(current, index, composerMediaUrls.length),
    );
  }

  function moveComposerMedia(direction) {
    const from = composerMediaIndex;
    const to = from + direction;
    if (to < 0 || to >= composerMediaUrls.length) {
      return;
    }
    setComposerMediaUrls((prev) => moveIndexedItem(prev, from, to));
    setComposerMediaAssets((prev) => moveIndexedItem(prev, from, to));
    setComposerMediaIndex(to);
  }

  async function onComposerAssetPicked(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    if (!composerCommunitySlug) {
      setMessage(UI_MESSAGES.mediaUploadCommunityRequired);
      return;
    }
    setUploadingAssets(true);
    try {
      const uploadedImages = [];
      const appendedBlocks = [];
      let skippedCount = 0;
      for (const file of files) {
        const isImage = String(file.type || "").startsWith("image/");
        if (!isImage) {
          skippedCount += 1;
          continue;
        }
        const uploadedAsset = await uploadContentMediaAsset(client, { token, file });
        if (!uploadedAsset.url) {
          throw new Error("empty image url");
        }
        if (composerMode === "rich") {
          uploadedImages.push(uploadedAsset);
        } else {
          appendedBlocks.push(buildComposerMarkdownImage(file.name, uploadedAsset.url));
        }
      }
      if (composerMode === "rich" && uploadedImages.length > 0) {
        setComposerMediaAssets((prev) => mergeComposerMediaAssets(prev, uploadedImages));
        setComposerMediaUrls((prev) => mergeComposerMediaUrls(prev, uploadedImages));
      }
      if (appendedBlocks.length > 0) {
        const blockText = appendedBlocks.join("\n");
        setContent((prev) => {
          const current = String(prev || "").replace(/\s+$/g, "");
          return `${current}${current ? "\n" : ""}${blockText}\n`;
        });
      }
      const imageCount = uploadedImages.length + (
        composerMode === "long"
          ? appendedBlocks.filter((item) => item.startsWith("![")).length
          : 0
      );
      setMessage(buildComposerUploadMessage({ imageCount, skippedCount }));
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.mediaUploadFailed));
    } finally {
      setUploadingAssets(false);
    }
  }

  return {
    composerMediaUrls,
    composerMediaAssets,
    composerMediaIndex,
    uploadingAssets,
    setComposerMediaIndex,
    resetComposerMediaDraft,
    hydrateComposerMediaDraft,
    removeComposerMediaAt,
    moveComposerMedia,
    onComposerAssetPicked,
  };
}
