import PostCard from "../../posts/components/post/PostCard";

const LIBRARY_PAGE_META = {
  liked: {
    title: "点赞",
    action: "like",
    empty: "暂无点赞。",
  },
  favorite: {
    title: "收藏",
    action: "favorite",
    empty: "暂无收藏。",
  },
  published: {
    title: "发布",
    empty: "暂无发布。",
  },
};

function timeValue(value) {
  const timestamp = value ? new Date(value).getTime() : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function mainSortTime(item) {
  return item.interactedAt || item.createdAt || item.latestActivityAt || item.updatedAt;
}

function subSortTime(item) {
  return item.interactedAt || item.createdAt || item.updatedAt;
}

function toMainEntry(item, source) {
  return {
    type: "main",
    source,
    item,
    sortAt: timeValue(mainSortTime(item)),
  };
}

function toSubEntry(item, source) {
  return {
    type: "sub",
    source,
    item,
    sortAt: timeValue(subSortTime(item)),
  };
}

function resolvePageItems(pageMeta, {
  profilePosts,
  profileSubPosts,
  postInteractions,
  subPostInteractions,
}) {
  if (!pageMeta.action) {
    return [
      ...profilePosts.map((item) => toMainEntry(item, "published")),
      ...profileSubPosts.map((item) => toSubEntry(item, "published")),
    ].sort((left, right) => right.sortAt - left.sortAt);
  }

  return [
    ...postInteractions
      .filter((item) => item.action === pageMeta.action)
      .map((item) => toMainEntry(item, pageMeta.action)),
    ...subPostInteractions
      .filter((item) => item.action === pageMeta.action)
      .map((item) => toSubEntry(item, pageMeta.action)),
  ].sort((left, right) => right.sortAt - left.sortAt);
}

function ProfileLibraryToolbar({ title, count }) {
  return (
    <div className="profile-library-page-head">
      <h3>{title}</h3>
      <span className="profile-stat-pill">共 {count} 条</span>
    </div>
  );
}

function resolveSubPostContent(item) {
  return item.subPostPreview || item.content || "";
}

function resolveSubPostTime(item) {
  return item.interactedAt || item.createdAt || item.updatedAt;
}

function resolveSubPostTimeText(item) {
  return item.interactedAtText || item.createdAtText || item.updatedAtText || "";
}

function resolveSubPostAuthor(item) {
  return item.author || item.authorUsername || "未知用户";
}

function resolveSubPostMainPost(item) {
  if (item.mainPost && Number(item.mainPost.id || 0) > 0) {
    return item.mainPost;
  }
  return {
    id: item.postId || item.mainPostId,
    title: item.mainPostTitle || item.postTitle || "未命名主帖",
    preview: "",
    content: "",
    author: "",
    communityName: "",
    communitySlug: "",
    createdAt: null,
    latestActivityAt: null,
    latestActivityAtText: "",
    createdAtText: "",
    viewCount: 0,
    hotScore: 0,
    tags: [],
    mediaUrls: [],
    mediaAssets: [],
  };
}

function mainPostKeyFromEntry(entry) {
  if (entry.type === "main") {
    return String(entry.item.id || entry.item.postId || "");
  }
  const mainPost = resolveSubPostMainPost(entry.item);
  return String(mainPost.id || entry.item.mainPostId || entry.item.postId || "");
}

function groupEntriesByMainPost(entries) {
  const groups = new Map();
  entries.forEach((entry, index) => {
    const key = mainPostKeyFromEntry(entry) || `fallback-${index}`;
    const existing = groups.get(key) || {
      key,
      post: null,
      mainEntry: null,
      subEntries: [],
      sortAt: 0,
    };

    if (entry.type === "main") {
      existing.mainEntry = entry;
      existing.post = entry.item;
    } else {
      existing.subEntries.push(entry);
      if (!existing.post) {
        existing.post = resolveSubPostMainPost(entry.item);
      }
    }

    existing.sortAt = Math.max(existing.sortAt, entry.sortAt);
    groups.set(key, existing);
  });

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      subEntries: group.subEntries.sort((left, right) => right.sortAt - left.sortAt),
    }))
    .sort((left, right) => right.sortAt - left.sortAt);
}

function groupKey(group, index) {
  return `main-group-${group.key || group.post?.id || index}-${group.sortAt || index}`;
}

function subEntryKey(entry, index) {
  const item = entry.item;
  return `sub-${entry.source}-${item.subPostId || item.id || item.postId || index}-${item.interactedAt || item.createdAt || index}`;
}

function SubPostPreviewList({
  subEntries,
  formatTime,
  clampText,
}) {
  if (subEntries.length === 0) {
    return null;
  }
  return (
    <div className="profile-sub-post-preview">
      <div className="profile-sub-post-preview-summary">
        <span>相关子帖</span>
        <strong>{subEntries.length} 条</strong>
      </div>
      <div className="profile-sub-post-preview-list">
        {subEntries.map((entry, index) => {
          const item = entry.item;
          return (
            <div className="profile-sub-post-preview-row" key={subEntryKey(entry, index)}>
              <div className="profile-sub-post-preview-head">
                <span className="profile-sub-post-preview-meta">
                  <strong>{resolveSubPostAuthor(item)}</strong>
                  <em>{formatTime(resolveSubPostTime(item), resolveSubPostTimeText(item))}</em>
                </span>
              </div>
              <p title={resolveSubPostContent(item)}>
                {clampText(resolveSubPostContent(item) || "无内容", 86)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LibraryMixedList({
  groups,
  openPostDetail,
  activeProfileLibraryPage,
  formatTime,
  clampText,
  formatHeatScore,
}) {
  const openLibraryPostDetail = (post) => openPostDetail(post, {
    manageSource: activeProfileLibraryPage === "published" ? "profile-published" : "",
  });

  return (
    <div className="profile-library-post-flow">
      {groups.map((group, index) => (
        <PostCard
          key={groupKey(group, index)}
          post={group.post}
          openPostDetail={openLibraryPostDetail}
          formatTime={formatTime}
          clampText={clampText}
          formatHeatScore={formatHeatScore}
        >
          <SubPostPreviewList
            subEntries={group.subEntries}
            formatTime={formatTime}
            clampText={clampText}
          />
        </PostCard>
      ))}
    </div>
  );
}

export default function ProfileLibraryPage({
  activeProfileLibraryPage,
  profilePosts,
  profileSubPosts,
  postInteractions,
  subPostInteractions,
  openPostDetail,
  formatTime,
  clampText,
  formatHeatScore,
}) {
  const pageMeta = LIBRARY_PAGE_META[activeProfileLibraryPage] || LIBRARY_PAGE_META.published;
  const entries = resolvePageItems(pageMeta, {
    profilePosts,
    profileSubPosts,
    postInteractions,
    subPostInteractions,
  });
  const groups = groupEntriesByMainPost(entries);

  return (
    <>
      <ProfileLibraryToolbar
        title={pageMeta.title}
        count={groups.length}
      />

      {groups.length === 0 && (
        <div className="paper-inline-status profile-empty-inline">{pageMeta.empty}</div>
      )}
      {groups.length > 0 && (
        <LibraryMixedList
          groups={groups}
          openPostDetail={openPostDetail}
          activeProfileLibraryPage={activeProfileLibraryPage}
          formatTime={formatTime}
          clampText={clampText}
          formatHeatScore={formatHeatScore}
        />
      )}
    </>
  );
}
