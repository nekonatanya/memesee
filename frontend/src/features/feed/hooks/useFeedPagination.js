import { useCallback, useEffect, useRef, useState } from "react";
import { listFeedPosts as listContentFeedPosts } from "../../content/api/contentApi";
import { mergePostPages } from "../../../shared/state/appHelpers";
import { normalizeFeedPage, shouldSkipFeedAppend } from "../state/feedViewHelpers";
import { UI_MESSAGES, readableError } from "../../../shared/state/uiMessages";

export function useFeedPagination({
  client,
  token,
  apiBase,
  setMessage,
  feedBatchSize,
}) {
  const [selectedCommunitySlug, setSelectedCommunitySlug] = useState("lobby");
  const [posts, setPosts] = useState([]);
  const [feedCursor, setFeedCursor] = useState("");
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const feedLoadMoreRef = useRef(null);
  const feedRequestSeqRef = useRef(0);
  const selectedCommunitySlugRef = useRef(selectedCommunitySlug);
  const feedCursorRef = useRef(feedCursor);
  const feedHasMoreRef = useRef(feedHasMore);
  const loadingPostsRef = useRef(loadingPosts);
  const loadingMorePostsRef = useRef(loadingMorePosts);

  useEffect(() => {
    selectedCommunitySlugRef.current = selectedCommunitySlug;
  }, [selectedCommunitySlug]);

  useEffect(() => {
    feedCursorRef.current = feedCursor;
  }, [feedCursor]);

  useEffect(() => {
    feedHasMoreRef.current = feedHasMore;
  }, [feedHasMore]);

  useEffect(() => {
    loadingPostsRef.current = loadingPosts;
  }, [loadingPosts]);

  useEffect(() => {
    loadingMorePostsRef.current = loadingMorePosts;
  }, [loadingMorePosts]);

  const resetFeedCollection = useCallback(() => {
    setPosts([]);
    setFeedCursor("");
    setFeedHasMore(true);
    feedCursorRef.current = "";
    feedHasMoreRef.current = true;
  }, []);

  const loadPosts = useCallback(async (
    communitySlug,
    keyword = "",
    sortMode = "latest_message",
    options = {},
  ) => {
    const append = Boolean(options.append);
    const reset = Boolean(options.reset);
    const resolvedCommunitySlug = String(
      communitySlug || selectedCommunitySlugRef.current || "lobby",
    );

    if (
      shouldSkipFeedAppend({
        append,
        loadingPosts: loadingPostsRef.current,
        loadingMorePosts: loadingMorePostsRef.current,
        feedHasMore: feedHasMoreRef.current,
        feedCursor: feedCursorRef.current,
      })
    ) {
      return;
    }

    if (append) {
      loadingMorePostsRef.current = true;
      setLoadingMorePosts(true);
    } else {
      loadingPostsRef.current = true;
      setLoadingPosts(true);
      if (reset) {
        feedCursorRef.current = "";
        feedHasMoreRef.current = true;
        setFeedCursor("");
        setFeedHasMore(true);
      }
    }

    const requestId = ++feedRequestSeqRef.current;
    try {
      const payload = await listContentFeedPosts(client, {
        token,
        communitySlug: resolvedCommunitySlug,
        keyword,
        sortMode,
        cursor: append ? feedCursorRef.current : "",
        size: feedBatchSize,
      });

      if (requestId !== feedRequestSeqRef.current) {
        return;
      }

      const normalizedPage = normalizeFeedPage(payload, apiBase);
      feedCursorRef.current = normalizedPage.nextCursor;
      feedHasMoreRef.current = normalizedPage.hasMore;
      setFeedCursor(normalizedPage.nextCursor);
      setFeedHasMore(normalizedPage.hasMore);
      setPosts((prev) =>
        append ? mergePostPages(prev, normalizedPage.posts) : normalizedPage.posts,
      );
    } catch (error) {
      if (requestId === feedRequestSeqRef.current) {
        setMessage(readableError(error, UI_MESSAGES.feedLoadFailed));
      }
    } finally {
      if (requestId === feedRequestSeqRef.current) {
        if (append) {
          loadingMorePostsRef.current = false;
          setLoadingMorePosts(false);
        } else {
          loadingPostsRef.current = false;
          setLoadingPosts(false);
        }
      }
    }
  }, [
    apiBase,
    client,
    feedBatchSize,
    setMessage,
    token,
  ]);

  return {
    selectedCommunitySlug,
    setSelectedCommunitySlug,
    posts,
    setPosts,
    feedCursor,
    feedHasMore,
    loadingPosts,
    loadingMorePosts,
    feedLoadMoreRef,
    resetFeedCollection,
    loadPosts,
  };
}
