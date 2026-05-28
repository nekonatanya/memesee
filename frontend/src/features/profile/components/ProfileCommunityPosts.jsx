export default function ProfileCommunityPosts({
  activeProfileCommunity,
  openPostDetail,
  formatTime,
}) {
  return (
    <>
      <div className="profile-community-header">
        <h3>{activeProfileCommunity.name}</h3>
        <span className="profile-stat-pill">共 {activeProfileCommunity.posts.length} 篇</span>
      </div>
      <div className="profile-post-list">
        {activeProfileCommunity.posts.map((post) => (
          <div key={post.id} className="profile-post-item">
            <button
              type="button"
              className="profile-post-main"
              onClick={() => openPostDetail(post)}
            >
              <strong>{post.title}</strong>
              <span>{formatTime(post.createdAt, post.createdAtText)}</span>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
