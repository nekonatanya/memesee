import ComposerPage from "../../composer/components/ComposerPage";
import HomeFeed from "./HomeFeed";
import PostDetailView from "../../posts/components/post/PostDetailView";
import ProfileCenter from "../../profile/components/ProfileCenter";

export default function Feed({
  route,
  view,
  homeFeedProps,
  profileCenterProps,
  postDetailProps,
  composerPageProps,
}) {
  return (
    <main className="feed">
      {route.type === "home" && view !== "mine" && (
        <HomeFeed {...homeFeedProps} />
      )}
      {route.type === "home" && view === "mine" && (
        <ProfileCenter {...profileCenterProps} />
      )}
      {route.type === "post" && (
        <PostDetailView {...postDetailProps} />
      )}
      {route.type === "compose" && (
        <ComposerPage {...composerPageProps} />
      )}
    </main>
  );
}

