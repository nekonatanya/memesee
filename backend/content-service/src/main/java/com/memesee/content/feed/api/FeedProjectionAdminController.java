package com.memesee.content.feed.api;

import com.memesee.content.feed.application.FeedProjectionRebuildResult;
import com.memesee.content.feed.application.MainPostFeedProjectionRebuildService;
import com.memesee.content.feed.dto.FeedProjectionRebuildResponse;
import com.memesee.platform.error.ApiErrorCode;
import com.memesee.platform.error.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/feed/main-posts")
public class FeedProjectionAdminController {

    static final String INTERNAL_SERVICE_TOKEN_HEADER = "X-Internal-Service-Token";

    private final MainPostFeedProjectionRebuildService rebuildService;
    private final String serviceToken;

    public FeedProjectionAdminController(
            MainPostFeedProjectionRebuildService rebuildService,
            @Value("${app.security.internal.service-token}") String serviceToken
    ) {
        this.rebuildService = rebuildService;
        this.serviceToken = normalizeToken(serviceToken);
    }

    @PostMapping("/rebuild")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public FeedProjectionRebuildResponse rebuildMainPostFeedProjection(
            @RequestHeader(name = INTERNAL_SERVICE_TOKEN_HEADER, required = false) String providedServiceToken,
            @RequestParam(required = false) Integer batchSize
    ) {
        requireInternalServiceToken(providedServiceToken);
        FeedProjectionRebuildResult result = rebuildService.rebuildAll(batchSize);
        return new FeedProjectionRebuildResponse(result.deletedItems(), result.rebuiltItems());
    }

    private void requireInternalServiceToken(String providedServiceToken) {
        if (serviceToken == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "内部服务凭证未配置。");
        }
        if (!serviceToken.equals(normalizeToken(providedServiceToken))) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "内部服务凭证无效。");
        }
    }

    private String normalizeToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        return token.trim();
    }
}
