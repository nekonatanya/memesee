package com.memesee.content.interaction.application;

import com.memesee.content.common.auth.AuthContext;
import com.memesee.content.common.auth.AuthContextResolver;
import com.memesee.content.interaction.dto.MyInteractionListResponse;
import com.memesee.content.interaction.dto.MyPostInteractionItemResponse;
import com.memesee.content.interaction.dto.MySubPostInteractionItemResponse;
import com.memesee.content.interaction.infrastructure.MyInteractionListCache;
import com.memesee.platform.cache.PlatformAsyncRefreshCoordinator;
import com.memesee.platform.cache.PlatformCacheReadResult;
import com.memesee.platform.cache.PlatformSingleFlight;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class InteractionQueryApplicationService {

    private static final Logger log = LoggerFactory.getLogger(InteractionQueryApplicationService.class);

    private static final int DEFAULT_LIMIT = 40;
    private static final int MAX_LIMIT = 1000;

    private final InteractionListProjectionPort interactionListProjectionPort;
    private final AuthContextResolver authContextResolver;
    private final MyInteractionListCache myInteractionListCache;
    private final PlatformAsyncRefreshCoordinator asyncRefreshCoordinator;
    private final PlatformSingleFlight cacheLoadSingleFlight = new PlatformSingleFlight();

    @Autowired
    public InteractionQueryApplicationService(
            InteractionListProjectionPort interactionListProjectionPort,
            AuthContextResolver authContextResolver,
            MyInteractionListCache myInteractionListCache
    ) {
        this(
                interactionListProjectionPort,
                authContextResolver,
                myInteractionListCache,
                new PlatformAsyncRefreshCoordinator()
        );
    }

    InteractionQueryApplicationService(
            InteractionListProjectionPort interactionListProjectionPort,
            AuthContextResolver authContextResolver,
            MyInteractionListCache myInteractionListCache,
            PlatformAsyncRefreshCoordinator asyncRefreshCoordinator
    ) {
        this.interactionListProjectionPort = interactionListProjectionPort;
        this.authContextResolver = authContextResolver;
        this.myInteractionListCache = myInteractionListCache;
        this.asyncRefreshCoordinator = asyncRefreshCoordinator;
    }

    @Transactional(readOnly = true)
    public MyInteractionListResponse listMyInteractions(String authorizationHeader, Integer limit) {
        AuthContext authContext = authContextResolver.resolveRequired(authorizationHeader);
        int safeLimit = normalizeLimit(limit);
        String username = authContext.username();
        PlatformCacheReadResult<MyInteractionListResponse> cachedSnapshot =
                myInteractionListCache.getInteractionListSnapshot(username, safeLimit);
        if (cachedSnapshot.value().isPresent()) {
            MyInteractionListResponse cachedResponse = cachedSnapshot.value().orElseThrow();
            triggerAsyncRefreshIfStale(username, safeLimit, cachedSnapshot);
            return cachedResponse;
        }
        return cacheLoadSingleFlight.execute(
                buildSingleFlightKey(username, safeLimit),
                () -> {
                    myInteractionListCache.recordLoaderHit();
                    return refreshInteractionList(username, safeLimit);
                },
                myInteractionListCache::recordRequestMerge
        );
    }

    private MyInteractionListResponse refreshInteractionList(String username, int safeLimit) {
        InteractionListProjectionPort.InteractionListProjection interactionListProjection =
                interactionListProjectionPort.loadInteractionList(username, safeLimit);
        List<MyPostInteractionItemResponse> postInteractions = interactionListProjection.postInteractions().stream()
                .map(item -> new MyPostInteractionItemResponse(
                        item.postId(),
                        item.postTitle(),
                        item.communityName(),
                        item.contentPreview(),
                        item.authorUsername(),
                        item.createdAt(),
                        item.latestActivityAt(),
                        item.viewCount(),
                        item.subPostCount(),
                        item.likeCount(),
                        item.favoriteCount(),
                        item.action(),
                        item.interactedAt()
                ))
                .toList();
        List<MySubPostInteractionItemResponse> subPostInteractions = interactionListProjection.subPostInteractions().stream()
                .map(item -> new MySubPostInteractionItemResponse(
                        item.subPostId(),
                        item.mainPostId(),
                        item.postTitle(),
                        item.mainPostCommunitySlug(),
                        item.mainPostCommunityName(),
                        item.mainPostContentPreview(),
                        item.mainPostAuthorUsername(),
                        item.mainPostCreatedAt(),
                        item.mainPostLatestActivityAt(),
                        item.mainPostViewCount(),
                        item.mainPostSubPostCount(),
                        item.mainPostLikeCount(),
                        item.mainPostFavoriteCount(),
                        item.subPostAuthorUsername(),
                        item.subPostPreview(),
                        item.action(),
                        item.interactedAt()
                ))
                .toList();
        MyInteractionListResponse response = new MyInteractionListResponse(postInteractions, subPostInteractions);
        myInteractionListCache.putInteractionList(username, safeLimit, response);
        return response;
    }

    private void triggerAsyncRefreshIfStale(
            String username,
            int safeLimit,
            PlatformCacheReadResult<MyInteractionListResponse> cachedSnapshot
    ) {
        if (!cachedSnapshot.stale()) {
            return;
        }
        PlatformAsyncRefreshCoordinator.TriggerOutcome refreshOutcome = asyncRefreshCoordinator.trigger(
                "my-interaction-list-refresh:" + username + ":" + safeLimit,
                () -> {
                    try {
                        myInteractionListCache.recordLoaderHit();
                        refreshInteractionList(username, safeLimit);
                    } catch (RuntimeException error) {
                        log.warn("my_interaction_list_async_refresh_failed username={} limit={}", username, safeLimit, error);
                    }
                },
                myInteractionListCache::recordRequestMerge
        );
        if (refreshOutcome == PlatformAsyncRefreshCoordinator.TriggerOutcome.EXECUTED) {
            myInteractionListCache.recordRefresh();
            return;
        }
        myInteractionListCache.recordRefreshMerge();
    }

    private String buildSingleFlightKey(String username, int safeLimit) {
        return "my-interaction-list:" + username + ":" + safeLimit;
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null || limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }
}
