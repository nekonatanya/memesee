import UiIcon from "../../../../shared/components/UiIcon";

export default function SubPostPanel({
  listProps,
  managementProps,
  composerProps,
  interactionProps,
  helperProps,
}) {
  const {
    loadingSubPosts,
    loadingMoreSubPosts,
    subPostsHasMore,
    loadMoreSubPosts,
    selectedPost,
    subPosts,
    orderedSubPostFloors,
    subPostNodeMap,
  } = listProps;
  const {
    allowPostManagement,
    currentUser: managementCurrentUser,
    openEditComposer,
    deletePost,
  } = managementProps;
  const {
    activeSubPostTarget,
    subPostInput,
    setSubPostInput,
    submittingSubPost,
    submitSubPost,
    isLoggedIn,
    startNestedSubPostComposer,
    cancelNestedSubPostComposer,
  } = composerProps;
  const {
    collapsedSubPostBranches,
    subPostMoreMenuId,
    toggleSubPostBranches,
    jumpToSubPostFloor,
    toggleSubPostMoreMenu,
    handleSubPostFavoriteFromMenu,
    handleSubPostReport,
    toggleSubPostLike,
    deleteSubPost,
    currentUser,
  } = interactionProps;
  const { authorInitial, formatTime, subPostQuotePreview } = helperProps;
  const canManageMainPost = Boolean(
    allowPostManagement &&
    selectedPost &&
    managementCurrentUser &&
    selectedPost.author === managementCurrentUser,
  );

  function renderMetricBadges({ likeCount, favoriteCount }) {
    const safeLikeCount = Number(likeCount || 0);
    const safeFavoriteCount = Number(favoriteCount || 0);
    if (safeLikeCount <= 0 && safeFavoriteCount <= 0) {
      return null;
    }
    return (
      <div className="sub-post-left-metrics">
        {safeLikeCount > 0 && (
          <span className="sub-post-left-badge like" title={`点赞 ${safeLikeCount}`}>
            <span className="action-icon">
              <UiIcon name="heart-filled" />
            </span>
            <span className="action-count">{safeLikeCount}</span>
          </span>
        )}
        {safeFavoriteCount > 0 && (
          <span className="sub-post-left-badge favorite" title={`收藏 ${safeFavoriteCount}`}>
            <span className="action-icon">
              <UiIcon name="star-filled" />
            </span>
            <span className="action-count">{safeFavoriteCount}</span>
          </span>
        )}
      </div>
    );
  }

  function renderInlineSubPostForm(targetId, composerInstanceId) {
    if (
      activeSubPostTarget?.id !== targetId
      || activeSubPostTarget?.composerInstanceId !== composerInstanceId
    ) {
      return null;
    }
    return (
      <form className="inline-sub-post-form" onSubmit={submitSubPost}>
        <textarea
          autoFocus
          placeholder="写下你的子帖..."
          value={subPostInput}
          onChange={(event) => setSubPostInput(event.target.value)}
          maxLength={1000}
          rows={3}
          disabled={!isLoggedIn || submittingSubPost}
          required
        />
        <div className="inline-sub-post-actions">
          <span className="sub-post-count">{subPostInput.trim().length}/1000</span>
          <div className="btn-group">
            <button
              type="button"
              className="neo-btn small"
              onClick={cancelNestedSubPostComposer}
            >
              取消
            </button>
            <button
              type="submit"
              className="neo-btn small secondary"
              disabled={!isLoggedIn || submittingSubPost}
              title={submittingSubPost ? "提交中..." : "发布子帖"}
            >
              {submittingSubPost ? "提交中..." : "发布子帖"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  function renderSubPostFloor(subPost) {
    const branchSubPosts = Array.isArray(subPostNodeMap.get(subPost.id)?.branchSubPosts)
      ? subPostNodeMap.get(subPost.id).branchSubPosts
      : [];
    const hasBranches = branchSubPosts.length > 0;
    const isCollapsed = Boolean(collapsedSubPostBranches[subPost.id]);
    const metricBadges = renderMetricBadges({
      likeCount: subPost.likeCount,
      favoriteCount: subPost.favoriteCount,
    });
    const mainMoreMenuKey = `main-${subPost.id}`;
    const floorComposerInstanceId = `floor-${subPost.id}`;
    const canDeleteSubPost = Boolean(currentUser && subPost.author === currentUser);

    return (
      <div
        id={`sub-post-floor-${subPost.id}`}
        key={subPost.id}
        className="sub-post-root-thread"
      >
        <article
          className={`sub-post-item main-sub-post ${hasBranches ? "has-branches" : ""}`}
        >
          <div className="sub-post-head-row">
            <div className="sub-post-user">
              <div className="sub-post-avatar">{authorInitial(subPost.author)}</div>
              <div className="sub-post-user-meta">
                <strong className="sub-post-author-name">{subPost.author}</strong>
              </div>
            </div>
            <span className="sub-post-time-floor">
              {formatTime(subPost.createdAt, subPost.createdAtText)}
            </span>
          </div>

          {(subPost.targetSubPostAuthor || subPost.targetSubPostDeleted) && (
            <div className="sub-post-reference">
              <p>
                {subPost.targetSubPostAuthor && (
                  <strong className="sub-post-reference-author">
                    @{subPost.targetSubPostAuthor}
                  </strong>
                )}
                <span className="sub-post-reference-text">
                  {subPostQuotePreview(subPost.targetSubPostPreview)}
                </span>
              </p>
            </div>
          )}

          <p className="sub-post-text">{subPost.content}</p>

          <div className="sub-post-actions sub-post-actions-bottom">
            <div className="sub-post-actions-left">
              {hasBranches ? (
                <button
                  type="button"
                  className="sub-post-action-btn expand-btn"
                  onClick={() => toggleSubPostBranches(subPost.id)}
                  title={isCollapsed ? "展开子帖" : "收起子帖"}
                >
                  <span className="action-icon">
                    <UiIcon name={isCollapsed ? "chevron-down" : "chevron-up"} />
                  </span>
                  <span className="action-count">{branchSubPosts.length}</span>
                </button>
              ) : null}

              {metricBadges ? (
                <div
                  className={`sub-post-left-metrics-wrap ${hasBranches ? "with-anchor" : ""}`}
                >
                  {metricBadges}
                </div>
              ) : !hasBranches ? (
                <span className="sub-post-left-empty" aria-hidden="true" />
              ) : null}
            </div>

            <div className="sub-post-actions-right">
              <button
                type="button"
                className={`sub-post-action-btn ${subPost.likedByMe ? "is-active" : ""}`}
                onClick={() =>
                  toggleSubPostLike(subPost.id, Boolean(subPost.likedByMe), subPost.author)
                }
                title={subPost.likedByMe ? "取消点赞" : "点赞"}
              >
                <span className="action-icon">
                  <UiIcon name={subPost.likedByMe ? "heart-filled" : "heart"} />
                </span>
              </button>

              <div className="sub-post-more-wrap">
                {subPostMoreMenuId === mainMoreMenuKey ? (
                  <>
                    <button
                      type="button"
                      className={`sub-post-action-btn more-expand favorite ${subPost.favoritedByMe ? "is-active" : ""}`}
                      onClick={() =>
                        handleSubPostFavoriteFromMenu(
                          subPost.id,
                          Boolean(subPost.favoritedByMe),
                        )
                      }
                      title={subPost.favoritedByMe ? "取消收藏" : "收藏"}
                    >
                      <span className="action-icon">
                        <UiIcon name={subPost.favoritedByMe ? "star-filled" : "star"} />
                      </span>
                    </button>
                    <button
                      type="button"
                      className="sub-post-action-btn more-expand report"
                      onClick={handleSubPostReport}
                      title="举报"
                    >
                      <span className="action-icon">
                        <UiIcon name="flag" />
                      </span>
                    </button>
                    {canDeleteSubPost && (
                      <button
                        type="button"
                        className="sub-post-action-btn more-expand danger"
                        onClick={() => deleteSubPost(subPost)}
                        title="删除子帖"
                      >
                        <span className="action-icon">
                          <UiIcon name="close" />
                        </span>
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    className="sub-post-action-btn more-btn"
                    onClick={() => toggleSubPostMoreMenu(mainMoreMenuKey)}
                    title="更多"
                    aria-expanded={false}
                  >
                    <span className="action-icon">
                      <UiIcon name="more" />
                    </span>
                  </button>
                )}
              </div>

              <button
                type="button"
                className="sub-post-action-btn sub-post-launch-btn"
                onClick={() => startNestedSubPostComposer(subPost, floorComposerInstanceId)}
                title={!isLoggedIn ? "请先登录后再发布子帖" : "发布子帖"}
              >
                <span className="action-icon">
                  <UiIcon name="sub-post" />
                </span>
              </button>
            </div>
          </div>

          {renderInlineSubPostForm(subPost.id, floorComposerInstanceId)}
        </article>

        {hasBranches && !isCollapsed && (
          <div className="sub-post-sub-list-wrap">
            <div className="sub-post-sub-list">
              {branchSubPosts.map((branchSubPost) => {
                const branchMetricBadges = renderMetricBadges({
                  likeCount: branchSubPost.likeCount,
                  favoriteCount: branchSubPost.favoriteCount,
                });
                const subMoreMenuKey = `sub-${subPost.id}-${branchSubPost.id}`;
                const branchComposerInstanceId = `branch-${subPost.id}-${branchSubPost.id}`;
                const canDeleteBranchSubPost =
                  Boolean(currentUser && branchSubPost.author === currentUser);

                return (
                  <div
                    key={`preview-${subPost.id}-${branchSubPost.id}`}
                    className="sub-post-item sub-post-branch-item"
                  >
                    <div className="sub-post-branch-head">
                      <div className="sub-post-avatar sub-avatar">
                        {authorInitial(branchSubPost.author)}
                      </div>
                      <strong className="sub-author">{branchSubPost.author}</strong>
                      <span className="sub-time">
                        {formatTime(branchSubPost.createdAt, branchSubPost.createdAtText)}
                      </span>
                    </div>

                    <p className="sub-post-text">{branchSubPost.content}</p>

                    <div className="sub-post-actions sub-post-actions-bottom sub-sub-post-actions">
                      <div className="sub-post-actions-left">
                        <button
                          type="button"
                          className="sub-post-action-btn jump-btn"
                          onClick={() => jumpToSubPostFloor(branchSubPost.id)}
                          title="跳转到该子帖"
                          aria-label="跳转到该子帖"
                        >
                          <span className="action-icon">
                            <UiIcon name="jump" />
                          </span>
                        </button>

                        {branchMetricBadges ? (
                          <div className="sub-post-left-metrics-wrap with-anchor">
                            {branchMetricBadges}
                          </div>
                        ) : (
                          <span className="sub-post-left-empty" aria-hidden="true" />
                        )}
                      </div>

                      <div className="sub-post-actions-right">
                        <button
                          type="button"
                          className={`sub-post-branch-action-btn ${branchSubPost.likedByMe ? "is-active" : ""}`}
                          onClick={() =>
                            toggleSubPostLike(
                              branchSubPost.id,
                              Boolean(branchSubPost.likedByMe),
                              branchSubPost.author,
                            )
                          }
                          title={branchSubPost.likedByMe ? "取消点赞" : "点赞"}
                        >
                          <span className="action-icon">
                            <UiIcon
                              name={branchSubPost.likedByMe ? "heart-filled" : "heart"}
                            />
                          </span>
                        </button>

                        <div className="sub-post-more-wrap">
                          {subPostMoreMenuId === subMoreMenuKey ? (
                            <>
                              <button
                                type="button"
                                className={`sub-post-branch-action-btn more-expand favorite ${branchSubPost.favoritedByMe ? "is-active" : ""}`}
                                onClick={() =>
                                  handleSubPostFavoriteFromMenu(
                                    branchSubPost.id,
                                    Boolean(branchSubPost.favoritedByMe),
                                  )
                                }
                                title={branchSubPost.favoritedByMe ? "取消收藏" : "收藏"}
                              >
                                <span className="action-icon">
                                  <UiIcon
                                    name={branchSubPost.favoritedByMe ? "star-filled" : "star"}
                                  />
                                </span>
                              </button>
                              <button
                                type="button"
                                className="sub-post-branch-action-btn more-expand report"
                                onClick={handleSubPostReport}
                                title="举报"
                              >
                                <span className="action-icon">
                                  <UiIcon name="flag" />
                                </span>
                              </button>
                              {canDeleteBranchSubPost && (
                                <button
                                  type="button"
                                  className="sub-post-branch-action-btn more-expand danger"
                                  onClick={() => deleteSubPost(branchSubPost)}
                                  title="删除子帖"
                                >
                                  <span className="action-icon">
                                    <UiIcon name="close" />
                                  </span>
                                </button>
                              )}
                            </>
                          ) : (
                            <button
                              type="button"
                              className="sub-post-branch-action-btn more-btn"
                              onClick={() => toggleSubPostMoreMenu(subMoreMenuKey)}
                              title="更多"
                              aria-expanded={false}
                            >
                              <span className="action-icon">
                                <UiIcon name="more" />
                              </span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          className="sub-post-branch-action-btn sub-post-launch-btn"
                          onClick={() =>
                            startNestedSubPostComposer(branchSubPost, branchComposerInstanceId)
                          }
                          title={!isLoggedIn ? "请先登录后再发布子帖" : "发布子帖"}
                        >
                          <span className="action-icon">
                            <UiIcon name="sub-post" />
                          </span>
                        </button>
                      </div>
                    </div>

                    {renderInlineSubPostForm(
                      branchSubPost.id,
                      branchComposerInstanceId,
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="sub-post-panel detail-section-block">
      {(loadingSubPosts || subPosts.length === 0 || canManageMainPost) && (
        <div className="sub-post-panel-head">
          <div className="sub-post-panel-status">
            {loadingSubPosts && <p className="side-empty">正在加载子帖...</p>}
            {!loadingSubPosts && subPosts.length === 0 && (
              <p className="side-empty">还没有子帖，来抢首帖吧。</p>
            )}
          </div>
          {canManageMainPost && (
            <div className="btn-group">
              <button
                type="button"
                className="post-detail-manage-btn"
                onClick={() => openEditComposer(selectedPost)}
              >
                编辑
              </button>
              <button
                type="button"
                className="post-detail-manage-btn danger"
                onClick={() => deletePost(selectedPost)}
              >
                删除
              </button>
            </div>
          )}
        </div>
      )}
      {!loadingSubPosts && subPosts.length > 0 && (
        <div className="sub-post-list">
          {orderedSubPostFloors.map((subPost) => renderSubPostFloor(subPost))}
          {subPostsHasMore && (
            <button
              type="button"
              className="sub-post-load-more"
              onClick={() => loadMoreSubPosts?.()}
              disabled={loadingMoreSubPosts}
            >
              {loadingMoreSubPosts ? "正在加载更多..." : "加载更多子帖"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
