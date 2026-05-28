import { useEffect, useMemo, useRef, useState } from "react";
import UiIcon from "../../../../shared/components/UiIcon";

export default function DetailInteract({
  selectedPost,
  metaProps,
  actionProps,
  composerProps,
}) {
  const {
    selectedLikeCount,
    selectedFavoriteCount,
    formatHeatScore,
    formatTime,
  } = metaProps;
  const {
    isLoggedIn,
    openMainPostSubPostComposer,
    togglePostLike,
    togglePostFavorite,
    handlePostReport,
  } = actionProps;
  const {
    showTopSubPostComposer,
    activeSubPostTarget,
    subPostInput,
    setSubPostInput,
    submittingSubPost,
    submitSubPost,
    cancelTopSubPostComposer,
    subPostComposerRef,
    subPostTextareaRef,
  } = composerProps;

  const [postMoreOpen, setPostMoreOpen] = useState(false);
  const postMoreRef = useRef(null);

  useEffect(() => {
    setPostMoreOpen(false);
  }, [selectedPost?.id]);

  useEffect(() => {
    if (!postMoreOpen) {
      return undefined;
    }

    function handleClick(event) {
      if (!postMoreRef.current?.contains(event.target)) {
        setPostMoreOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setPostMoreOpen(false);
      }
    }

    const timerId = window.setTimeout(() => {
      document.addEventListener("click", handleClick);
      document.addEventListener("keydown", handleKeyDown);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [postMoreOpen]);

  const showEditedHint = useMemo(() => {
    if (!selectedPost?.updatedAt) {
      return false;
    }
    const updatedTime = new Date(selectedPost.updatedAt).getTime();
    const createdTime = new Date(selectedPost.createdAt || 0).getTime();
    if (!Number.isFinite(updatedTime) || updatedTime <= 0) {
      return false;
    }
    return !Number.isFinite(createdTime) || Math.abs(updatedTime - createdTime) > 1000;
  }, [selectedPost?.createdAt, selectedPost?.updatedAt]);

  const collapseMetrics =
    postMoreOpen && selectedLikeCount > 0 && selectedFavoriteCount > 0;

  return (
    <>
      <div className="detail-interact-wrap">
        <div className="detail-interact-topline">
          <div className="detail-interact-edited-slot">
            {showEditedHint && (
              <div className="detail-interact-edited">
                已编辑 {formatTime(selectedPost.updatedAt, selectedPost.updatedAtText)}
              </div>
            )}
          </div>
          <div className="detail-interact-meta detail-interact-meta-plain">
            <span className="detail-interact-meta-text">浏览 {selectedPost.viewCount || 0}</span>
            <span className="detail-interact-meta-text">
              热度 {formatHeatScore(selectedPost.hotScore)}
            </span>
          </div>
        </div>

        <div className={`detail-interact-mainline ${postMoreOpen ? "is-more-open" : ""}`}>
          <div className={`detail-interact-badge-stack ${collapseMetrics ? "is-condensed" : ""}`}>
            <div className="detail-interact-badge-row detail-interact-badge-row-split">
              {selectedLikeCount > 0 && (
                <span className="detail-interact-badge like" title={`点赞 ${selectedLikeCount}`}>
                  <span className="action-icon">
                    <UiIcon name="heart-filled" />
                  </span>
                  <span>{selectedLikeCount}</span>
                </span>
              )}
              {selectedFavoriteCount > 0 && (
                <span
                  className="detail-interact-badge favorite"
                  title={`收藏 ${selectedFavoriteCount}`}
                >
                  <span className="action-icon">
                    <UiIcon name="star-filled" />
                  </span>
                  <span>{selectedFavoriteCount}</span>
                </span>
              )}
            </div>

            {selectedLikeCount > 0 && selectedFavoriteCount > 0 && (
              <div className="detail-interact-badge-row detail-interact-badge-row-combined">
                <span
                  className="detail-interact-badge combined"
                  title={`点赞 ${selectedLikeCount}，收藏 ${selectedFavoriteCount}`}
                >
                  <span className="action-icon">
                    <UiIcon name="heart-filled" />
                  </span>
                  <span>{selectedLikeCount}</span>
                  <span className="detail-interact-badge-divider" aria-hidden="true" />
                  <span className="action-icon">
                    <UiIcon name="star-filled" />
                  </span>
                  <span>{selectedFavoriteCount}</span>
                </span>
              </div>
            )}
          </div>

          <div className="detail-interact-bar detail-interact-bar-post" ref={postMoreRef}>
            <button
              type="button"
              className={`detail-interact-btn detail-interact-btn-large ${
                selectedPost.likedByMe ? "active" : ""
              } detail-interact-btn-like`}
              onClick={() => togglePostLike(selectedPost.id, Boolean(selectedPost.likedByMe))}
              title={!isLoggedIn ? "请先登录后再点赞" : "点赞"}
              aria-label={selectedPost.likedByMe ? "取消点赞" : "点赞"}
            >
              <span className="action-icon">
                <UiIcon name={selectedPost.likedByMe ? "heart-filled" : "heart"} />
              </span>
              <span className="action-label">点赞</span>
            </button>

            <div className="detail-post-more-wrap">
              {postMoreOpen ? (
                <div className="detail-post-more-menu">
                  <button
                    type="button"
                    className={`detail-interact-btn detail-interact-btn-large detail-post-more-action ${
                      selectedPost.favoritedByMe ? "active" : ""
                    } detail-interact-btn-favorite`}
                    onClick={() =>
                      togglePostFavorite(selectedPost.id, Boolean(selectedPost.favoritedByMe))
                    }
                    title={!isLoggedIn ? "请先登录后再收藏" : "收藏"}
                    aria-label={selectedPost.favoritedByMe ? "取消收藏" : "收藏"}
                  >
                    <span className="action-icon">
                      <UiIcon
                        name={selectedPost.favoritedByMe ? "star-filled" : "star"}
                      />
                    </span>
                    <span className="action-label">收藏</span>
                  </button>
                  <button
                    type="button"
                    className="detail-interact-btn detail-interact-btn-large detail-post-more-action detail-interact-btn-report"
                    onClick={handlePostReport}
                    title="举报"
                    aria-label="举报"
                  >
                    <span className="action-icon">
                      <UiIcon name="flag" />
                    </span>
                    <span className="action-label">举报</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="detail-interact-btn detail-interact-btn-large detail-interact-btn-more"
                  onClick={() => setPostMoreOpen(true)}
                  title={!isLoggedIn ? "请先登录后再查看更多操作" : "更多"}
                  aria-expanded={postMoreOpen}
                  aria-label="更多"
                >
                  <span className="action-icon">
                    <UiIcon name="more" />
                  </span>
                  <span className="action-label">更多</span>
                </button>
              )}
            </div>

            <button
              type="button"
              className="detail-interact-btn detail-interact-btn-large detail-interact-btn-sub-post"
              onClick={openMainPostSubPostComposer}
              title={!isLoggedIn ? "请先登录后再发布子帖" : "发布子帖"}
              aria-label="子帖"
            >
              <span className="action-icon">
                <UiIcon name="sub-post" />
              </span>
              <span className="action-label">子帖</span>
            </button>
          </div>
        </div>
      </div>

      {!activeSubPostTarget && showTopSubPostComposer && (
        <form
          ref={subPostComposerRef}
          className="sub-post-form sub-post-pop-form"
          onSubmit={submitSubPost}
        >
          <textarea
            ref={subPostTextareaRef}
            placeholder={isLoggedIn ? "写下你的子帖..." : "请先登录后再发布子帖"}
            value={subPostInput}
            onChange={(event) => setSubPostInput(event.target.value)}
            maxLength={1000}
            rows={4}
            disabled={!isLoggedIn || submittingSubPost}
            required
          />
          <div className="post-sub-post-form-foot">
            <span className="sub-post-count">{subPostInput.trim().length}/1000</span>
            <div className="inline-sub-post-actions-right">
              <button
                type="button"
                className="neo-btn small"
                onClick={cancelTopSubPostComposer}
                disabled={submittingSubPost}
              >
                取消
              </button>
              <button
                type="submit"
                className="neo-btn small secondary"
                disabled={!isLoggedIn || submittingSubPost}
              >
                {submittingSubPost ? "提交中..." : "发布子帖"}
              </button>
            </div>
          </div>
        </form>
      )}
    </>
  );
}
