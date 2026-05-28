import { useEffect, useMemo, useRef, useState } from "react";
import {
  createMainPost as createContentMainPost,
  updateMainPost as updateContentMainPost,
} from "../../content/api/contentApi";
import {
  navigateToCompose,
  navigateToHome,
  normalizePostModeValue,
  normalizePostPayload,
} from "../../../shared/state/appHelpers";
import { buildSavedMainPostMutationStrategy } from "../../posts/state/mainPostMutationStrategyHelpers";
import {
  buildComposerSubmitPayload,
  resizeComposerContentElement,
  resolveDefaultComposerCommunitySlug,
  resolveEditComposerCommunitySlug,
} from "../state/composerDraftHelpers";
import { useComposerMediaDraft } from "./useComposerMediaDraft";
import { useComposerTagEditor } from "./useComposerTagEditor";
import { UI_MESSAGES, readableError } from "../../../shared/state/uiMessages";
import { confirmInBrowser } from "../../../shared/platform/browserDialog";
import {
  readLocalStorageItem,
  removeLocalStorageItem,
  writeLocalStorageItem,
} from "../../../shared/platform/browserStorage";

const COMPOSER_DRAFT_STORAGE_KEY = "memesee:composer-draft:v1";

function hasComposerDraftContent({
  title,
  content,
  composerTags,
  composerTagDraft,
  composerMediaUrls,
}) {
  return Boolean(
    title.trim() ||
    content.trim() ||
    composerTagDraft.trim() ||
    composerTags.length > 0 ||
    composerMediaUrls.length > 0,
  );
}

function readSavedComposerDraft() {
  const raw = readLocalStorageItem(COMPOSER_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function clearSavedComposerDraft() {
  removeLocalStorageItem(COMPOSER_DRAFT_STORAGE_KEY);
}

export function useComposerDraft({
  routeType,
  isLoggedIn,
  currentUser,
  token,
  client,
  apiBase,
  communities,
  orderedCommunities,
  feedQueryRuntime,
  setMessage,
  setView,
  setRoute,
  onAuthRequired,
  mainPostMutationInterface,
}) {
  const selectedCommunitySlug = feedQueryRuntime?.selectedCommunitySlug;
  const feedQueryState = feedQueryRuntime?.feedQueryState;
  const [composerCommunitySlug, setComposerCommunitySlug] = useState("");
  const [composerMode, setComposerMode] = useState("long");
  const [editingMainPostId, setEditingMainPostId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [isTitlePreviewMode, setIsTitlePreviewMode] = useState(false);
  const [composeCommunityMenuOpen, setComposeCommunityMenuOpen] = useState(false);
  const composerTitleInputRef = useRef(null);
  const composerContentRef = useRef(null);
  const composeCommunityMenuRef = useRef(null);
  const previousRouteTypeRef = useRef(routeType);
  const suppressLeavePromptRef = useRef(false);
  const tagEditor = useComposerTagEditor({ setMessage });
  const mediaDraft = useComposerMediaDraft({
    client,
    token,
    isLoggedIn,
    composerCommunitySlug,
    composerMode,
    setContent,
    setMessage,
  });

  const composerCommunityName = useMemo(() => {
    if (!composerCommunitySlug) {
      return "";
    }
    return communities.find((community) => community.slug === composerCommunitySlug)?.name || composerCommunitySlug;
  }, [communities, composerCommunitySlug]);

  function clearComposerFormState() {
    setTitle("");
    setContent("");
    setComposerMode("long");
    mediaDraft.resetComposerMediaDraft();
    tagEditor.resetComposerTagEditor();
    setIsTitlePreviewMode(false);
    setComposeCommunityMenuOpen(false);
    setComposerCommunitySlug("");
    setEditingMainPostId(null);
  }

  function applySavedComposerDraft(savedDraft) {
    if (!savedDraft) {
      return false;
    }
    const savedCommunitySlug = savedDraft.communitySlug || "";
    const fallbackCommunitySlug = resolveDefaultComposerCommunitySlug({
      selectedCommunitySlug,
      orderedCommunities,
    });
    const nextCommunitySlug = resolveEditComposerCommunitySlug({
      orderedCommunities,
      communitySlug: savedCommunitySlug || fallbackCommunitySlug,
    });
    setComposerCommunitySlug(nextCommunitySlug);
    setComposerMode(normalizePostModeValue(savedDraft.composerMode));
    mediaDraft.hydrateComposerMediaDraft({
      mediaUrls: savedDraft.mediaUrls,
      mediaAssets: savedDraft.mediaAssets,
    });
    tagEditor.hydrateComposerTags(savedDraft.tags);
    setTitle(savedDraft.title || "");
    setContent(savedDraft.content || "");
    setIsTitlePreviewMode(Boolean(String(savedDraft.title || "").trim()));
    setComposeCommunityMenuOpen(false);
    setEditingMainPostId(null);
    return true;
  }

  function buildComposerDraftSnapshot() {
    const { normalizedTagItems, validationMessage } = tagEditor.resolveComposerTags();
    const tags = validationMessage ? tagEditor.composerTags : normalizedTagItems;
    return {
      title,
      content,
      communitySlug: composerCommunitySlug,
      composerMode,
      tags,
      mediaUrls: mediaDraft.composerMediaUrls,
      mediaAssets: mediaDraft.composerMediaAssets,
      savedAt: new Date().toISOString(),
    };
  }

  function saveComposerDraftSnapshot() {
    const snapshot = buildComposerDraftSnapshot();
    writeLocalStorageItem(COMPOSER_DRAFT_STORAGE_KEY, JSON.stringify(snapshot));
  }

  function hasUnsavedComposerDraft() {
    if (editingMainPostId) {
      return false;
    }
    return hasComposerDraftContent({
      title,
      content,
      composerTags: tagEditor.composerTags,
      composerTagDraft: tagEditor.composerTagDraft,
      composerMediaUrls: mediaDraft.composerMediaUrls,
    });
  }

  async function askToSaveComposerDraft() {
    if (!hasUnsavedComposerDraft()) {
      clearSavedComposerDraft();
      return;
    }
    const shouldSave = await confirmInBrowser(
      "当前发布内容尚未提交，是否保存为草稿？",
      {
        title: "保存草稿",
        confirmLabel: "保存",
        cancelLabel: "不保存",
      },
    );
    if (shouldSave) {
      saveComposerDraftSnapshot();
      setMessage("草稿已保存。");
      return;
    }
    clearSavedComposerDraft();
    clearComposerFormState();
  }

  useEffect(() => {
    const previousRouteType = previousRouteTypeRef.current;
    previousRouteTypeRef.current = routeType;
    if (previousRouteType !== "compose" || routeType === "compose") {
      return;
    }
    if (suppressLeavePromptRef.current) {
      suppressLeavePromptRef.current = false;
      return;
    }
    askToSaveComposerDraft();
  }, [routeType]);

  useEffect(() => {
    if (!composeCommunityMenuOpen) {
      return;
    }
    const close = () => setComposeCommunityMenuOpen(false);
    const onPointerDown = (event) => {
      const target = event.target;
      if (!composeCommunityMenuRef.current?.contains(target)) {
        close();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [composeCommunityMenuOpen]);

  useEffect(() => {
    if (routeType !== "compose" || isTitlePreviewMode) {
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      const input = composerTitleInputRef.current;
      if (!input) {
        return;
      }
      input.focus();
      const end = input.value.length;
      input.setSelectionRange(end, end);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [routeType, isTitlePreviewMode]);

  useEffect(() => {
    if (routeType !== "compose") {
      return;
    }
    resizeComposerContentElement(composerContentRef.current);
  }, [routeType, content, composerMode]);

  function resetComposerForm() {
    clearComposerFormState();
  }

  async function updateExistingPost(mainPostId, payload) {
    return updateContentMainPost(client, {
      token,
      mainPostId,
      title: payload.title,
      content: payload.content,
      mediaAssetIds: payload.mediaAssetIds,
      tags: payload.tags,
    });
  }

  async function submitPost(event) {
    event.preventDefault();
    setMessage("");
    const normalizedTitle = title.trim();
    const isEditing = Boolean(editingMainPostId);
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    if (!normalizedTitle) {
      setMessage(UI_MESSAGES.mainPostTitleRequired);
      return;
    }
    if (normalizedTitle.length > 30) {
      setMessage(UI_MESSAGES.mainPostTitleTooLong);
      return;
    }
    if (!composerCommunitySlug) {
      setMessage(UI_MESSAGES.communityRequired);
      return;
    }
    if (composerMode === "rich" && mediaDraft.composerMediaUrls.length === 0) {
      setMessage(UI_MESSAGES.richMediaRequired);
      return;
    }
    if (composerMode === "long" && !content.trim()) {
      setMessage(UI_MESSAGES.mainPostContentRequired);
      return;
    }
    const {
      normalizedTagItems,
      normalizedTags,
      validationMessage,
    } = tagEditor.resolveComposerTags();
    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }
    if (tagEditor.composerTagDraft.trim()) {
      tagEditor.syncResolvedComposerTags(normalizedTagItems);
    }
    setPublishing(true);
    try {
      const payload = buildComposerSubmitPayload({
        communitySlug: composerCommunitySlug,
        title: normalizedTitle,
        content,
        composerMode,
        composerMediaAssets: mediaDraft.composerMediaAssets,
        tags: normalizedTags,
      });
      let savedPost;
      if (isEditing) {
        savedPost = await updateExistingPost(editingMainPostId, payload);
      } else {
        savedPost = await createContentMainPost(client, {
          token,
          communitySlug: payload.communitySlug,
          title: payload.title,
          content: payload.content,
          mediaAssetIds: payload.mediaAssetIds,
          tags: payload.tags,
        });
      }
      const resolvedSavedTags = Array.isArray(savedPost?.tags) ? savedPost.tags : normalizedTags;
      const normalizedSavedPost = normalizePostPayload({
        ...savedPost,
        tags: resolvedSavedTags,
      }, apiBase);
      const mutationStrategy = buildSavedMainPostMutationStrategy({
        savedPost: normalizedSavedPost,
        feedQueryState,
      });
      await mainPostMutationInterface.executeMainPostMutationStrategy(mutationStrategy);
      suppressLeavePromptRef.current = true;
      clearSavedComposerDraft();
      resetComposerForm();
      navigateToHome(setRoute);
      setView("latest");
      setMessage(isEditing ? UI_MESSAGES.mainPostUpdated : UI_MESSAGES.mainPostCreated);
    } catch (error) {
      setMessage(
        readableError(
          error,
          isEditing ? UI_MESSAGES.mainPostUpdateFailed : UI_MESSAGES.mainPostCreateFailed,
        ),
      );
    } finally {
      setPublishing(false);
    }
  }

  function closeComposerPage() {
    navigateToHome(setRoute);
  }

  function openComposer() {
    if (routeType === "compose") {
      closeComposerPage();
      return;
    }
    if (!isLoggedIn) {
      onAuthRequired("login");
      return;
    }
    const defaultCommunity = resolveDefaultComposerCommunitySlug({
      selectedCommunitySlug,
      orderedCommunities,
    });
    const savedDraft = readSavedComposerDraft();
    if (applySavedComposerDraft(savedDraft)) {
      setView("latest");
      navigateToCompose(setRoute);
      return;
    }
    setComposerCommunitySlug(defaultCommunity);
    setComposerMode("long");
    mediaDraft.resetComposerMediaDraft();
    tagEditor.resetComposerTagEditor();
    setTitle("");
    setContent("");
    setIsTitlePreviewMode(false);
    setComposeCommunityMenuOpen(false);
    setEditingMainPostId(null);
    setView("latest");
    navigateToCompose(setRoute);
  }

  async function openEditComposer(post) {
    if (!isLoggedIn) {
      setMessage(UI_MESSAGES.authRequired);
      return;
    }
    if (!post || post.author !== currentUser) {
      setMessage(UI_MESSAGES.onlyAuthorCanEdit);
      return;
    }
    try {
      const editingPost =
        post.contentLoaded || typeof mainPostMutationInterface.loadMainPostDetail !== "function"
          ? post
          : await mainPostMutationInterface.loadMainPostDetail(post.id);
      const nextCommunitySlug = resolveEditComposerCommunitySlug({
        orderedCommunities,
        communitySlug: editingPost.communitySlug,
      });
      setComposerCommunitySlug(nextCommunitySlug);
      setComposerMode(normalizePostModeValue(editingPost.postMode));
      mediaDraft.hydrateComposerMediaDraft({
        mediaUrls: editingPost.mediaUrls,
        mediaAssets: editingPost.mediaAssets,
      });
      tagEditor.hydrateComposerTags(editingPost.tags);
      setTitle(editingPost.title || "");
      setContent(editingPost.content || "");
      setIsTitlePreviewMode(Boolean(editingPost.title || ""));
      setComposeCommunityMenuOpen(false);
      setEditingMainPostId(editingPost.id);
      setView("latest");
      navigateToCompose(setRoute);
    } catch (error) {
      setMessage(readableError(error, UI_MESSAGES.genericOperationFailed));
    }
  }

  function commitComposerTitlePreview() {
    setIsTitlePreviewMode(Boolean(title.trim()));
  }

  function editComposerTitle() {
    setIsTitlePreviewMode(false);
  }

  function handleComposerContentChange(event) {
    setContent(event.target.value);
    resizeComposerContentElement(event.target);
  }

  function setComposerCommunitySlugAndCloseTags(slug) {
    tagEditor.closeComposerTagEditor();
    setComposerCommunitySlug(slug);
  }

  function setComposeCommunityMenuOpenAndCloseTags(nextValue) {
    tagEditor.closeComposerTagEditor();
    setComposeCommunityMenuOpen(nextValue);
  }

  function setComposerModeAndCloseTags(nextMode) {
    tagEditor.closeComposerTagEditor();
    const normalizedMode = normalizePostModeValue(nextMode);
    setComposerMode((currentMode) => {
      if (currentMode !== normalizedMode) {
        setContent("");
      }
      return normalizedMode;
    });
  }

  function handleComposerAssetPickedAndCloseTags(event) {
    tagEditor.closeComposerTagEditor();
    mediaDraft.onComposerAssetPicked(event);
  }

  return {
    composerCommunityName,
    composerCommunitySlug,
    composerMode,
    composerMediaUrls: mediaDraft.composerMediaUrls,
    editingMainPostId,
    title,
    content,
    publishing,
    uploadingAssets: mediaDraft.uploadingAssets,
    composerTags: tagEditor.composerTags,
    composerTagDraft: tagEditor.composerTagDraft,
    showTagEditor: tagEditor.showTagEditor,
    isTitlePreviewMode,
    composeCommunityMenuOpen,
    composerMediaIndex: mediaDraft.composerMediaIndex,
    setTitle,
    setComposerCommunitySlug: setComposerCommunitySlugAndCloseTags,
    setComposeCommunityMenuOpen: setComposeCommunityMenuOpenAndCloseTags,
    setComposerMode: setComposerModeAndCloseTags,
    setComposerTagDraft: tagEditor.setComposerTagDraft,
    setComposerMediaIndex: mediaDraft.setComposerMediaIndex,
    resetComposerForm,
    submitPost,
    openComposer,
    openEditComposer,
    commitComposerTitlePreview,
    editComposerTitle,
    addComposerTag: tagEditor.addComposerTag,
    removeComposerTag: tagEditor.removeComposerTag,
    toggleComposerTagEditor: tagEditor.toggleComposerTagEditor,
    handleComposerTagInputKeyDown: tagEditor.handleComposerTagInputKeyDown,
    handleComposerContentChange,
    removeComposerMediaAt: mediaDraft.removeComposerMediaAt,
    moveComposerMedia: mediaDraft.moveComposerMedia,
    closeComposerTagEditor: tagEditor.closeComposerTagEditor,
    onComposerAssetPicked: handleComposerAssetPickedAndCloseTags,
    composerTitleInputRef,
    composerTagInputRef: tagEditor.composerTagInputRef,
    composerContentRef,
    composeCommunityMenuRef,
  };
}
