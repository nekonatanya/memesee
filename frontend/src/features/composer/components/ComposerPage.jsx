import { useState } from "react";
import { StatusCard } from "../../../shared/components/PageShell";
import ComposeContent from "./ComposeContent";
import ComposeHeader from "./ComposeHeader";
import ComposeMedia from "./ComposeMedia";
import ComposeTools from "./ComposeTools";

export default function ComposerPage({
  isLoggedIn,
  title,
  isTitlePreviewMode,
  composerTags,
  showTagEditor,
  composerTagDraft,
  currentUser,
  composerMode,
  composerMediaUrls,
  composerMediaIndex,
  composerMediaAssets,
  content,
  composerCommunityName,
  orderedCommunities,
  composerCommunitySlug,
  composeCommunityMenuOpen,
  uploadingAssets,
  publishing,
  editingPostId,
  setTitle,
  commitComposerTitlePreview,
  editComposerTitle,
  removeComposerTag,
  addComposerTag,
  handleComposerTagInputKeyDown,
  setComposerMediaIndex,
  removeComposerMediaAt,
  moveComposerMedia,
  openImageViewer,
  handleComposerContentChange,
  setComposerCommunitySlug,
  setComposeCommunityMenuOpen,
  setComposerMode,
  toggleComposerTagEditor,
  closeComposerTagEditor,
  setComposerTagDraft,
  onComposerAssetPicked,
  submitPost,
  composerTitleInputRef,
  composerTagInputRef,
  composerContentRef,
  composeCommunityMenuRef,
  authorInitial,
}) {
  const [composerContentViewMode, setComposerContentViewMode] = useState("edit");
  const [markdownGuideOpen, setMarkdownGuideOpen] = useState(false);

  return (
    <section className="feed-grid">
      {!isLoggedIn && (
        <StatusCard
          title="请先登录后发布主帖"
          description="登录后就可以选择分区、上传图片并发布内容。"
          tone="empty"
        />
      )}
      {isLoggedIn && (
        <article className="composer-page composer-inline-page composer-paper">
          <form id="composer-form" onSubmit={submitPost} className="compose-inline-form">
            <ComposeHeader
              title={title}
              isTitlePreviewMode={isTitlePreviewMode}
              composerTags={composerTags}
              showTagEditor={showTagEditor}
              composerTagDraft={composerTagDraft}
              composerCommunityName={composerCommunityName}
              orderedCommunities={orderedCommunities}
              composerCommunitySlug={composerCommunitySlug}
              composeCommunityMenuOpen={composeCommunityMenuOpen}
              currentUser={currentUser}
              setTitle={setTitle}
              commitComposerTitlePreview={commitComposerTitlePreview}
              editComposerTitle={editComposerTitle}
              removeComposerTag={removeComposerTag}
              addComposerTag={addComposerTag}
              handleComposerTagInputKeyDown={handleComposerTagInputKeyDown}
              setComposerTagDraft={setComposerTagDraft}
              setComposerCommunitySlug={setComposerCommunitySlug}
              setComposeCommunityMenuOpen={setComposeCommunityMenuOpen}
              toggleComposerTagEditor={toggleComposerTagEditor}
              closeComposerTagEditor={closeComposerTagEditor}
              composerTitleInputRef={composerTitleInputRef}
              composerTagInputRef={composerTagInputRef}
              composerContentRef={composerContentRef}
              composeCommunityMenuRef={composeCommunityMenuRef}
              authorInitial={authorInitial}
            />

            {composerMode === "rich" && (
              <ComposeMedia
                composerMediaUrls={composerMediaUrls}
                composerMediaIndex={composerMediaIndex}
                setComposerMediaIndex={setComposerMediaIndex}
                openImageViewer={openImageViewer}
                removeComposerMediaAt={removeComposerMediaAt}
                moveComposerMedia={moveComposerMedia}
              />
            )}

            <ComposeContent
              composerMode={composerMode}
              content={content}
              viewMode={composerContentViewMode}
              handleComposerContentChange={handleComposerContentChange}
              composerContentRef={composerContentRef}
              closeComposerTagEditor={closeComposerTagEditor}
              composerMediaAssets={composerMediaAssets}
              openImageViewer={openImageViewer}
            />

            <ComposeTools
              composerCommunitySlug={composerCommunitySlug}
              uploadingAssets={uploadingAssets}
              publishing={publishing}
              editingPostId={editingPostId}
              setComposerMode={setComposerMode}
              onComposerAssetPicked={onComposerAssetPicked}
              composerMode={composerMode}
              viewMode={composerContentViewMode}
              setViewMode={setComposerContentViewMode}
              markdownGuideOpen={markdownGuideOpen}
              setMarkdownGuideOpen={setMarkdownGuideOpen}
              closeComposerTagEditor={closeComposerTagEditor}
            />
          </form>
        </article>
      )}
    </section>
  );
}
