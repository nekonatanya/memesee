import { useEffect, useState } from "react";
import { uploadMediaAsset as uploadContentMediaAsset } from "../../content/api/contentApi";
import {
  appendComposerMarkdownImages,
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
      const imageFiles = [];
      let skippedCount = 0;
      for (const file of files) {
        const isImage = String(file.type || "").startsWith("image/");
        if (!isImage) {
          skippedCount += 1;
          continue;
        }
        imageFiles.push(file);
      }

      const uploadedEntries = new Array(imageFiles.length);
      let nextIndex = 0;
      const uploadNext = async () => {
        while (nextIndex < imageFiles.length) {
          const currentIndex = nextIndex;
          const file = imageFiles[currentIndex];
          nextIndex += 1;
          const uploadedAsset = await uploadContentMediaAsset(client, { token, file });
          if (!uploadedAsset.url) {
            throw new Error("empty image url");
          }
          uploadedEntries[currentIndex] = uploadedAsset;
        }
      };
      const concurrency = Math.min(3, imageFiles.length);
      await Promise.all(Array.from({ length: concurrency }, uploadNext));

      const uploadedImages = uploadedEntries.filter(Boolean);
      setComposerMediaAssets((prev) => mergeComposerMediaAssets(prev, uploadedImages));
      setComposerMediaUrls((prev) => mergeComposerMediaUrls(prev, uploadedImages));
      if (composerMode === "long" && typeof setContent === "function") {
        setContent((prev) => appendComposerMarkdownImages(prev, uploadedImages));
      }
      setMessage(buildComposerUploadMessage({ imageCount: uploadedImages.length, skippedCount }));
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
