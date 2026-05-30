package com.memesee.content.media.api;

import com.memesee.content.media.application.MediaAssetApplicationService;
import com.memesee.content.media.dto.MediaProcessingRetryResponse;
import com.memesee.platform.error.ApiErrorCode;
import com.memesee.platform.error.ApiException;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/media-assets")
public class MediaProcessingAdminController {

    static final String INTERNAL_SERVICE_TOKEN_HEADER = "X-Internal-Service-Token";

    private final MediaAssetApplicationService mediaAssetApplicationService;
    private final String serviceToken;

    public MediaProcessingAdminController(
            MediaAssetApplicationService mediaAssetApplicationService,
            @Value("${app.security.internal.service-token}") String serviceToken
    ) {
        this.mediaAssetApplicationService = mediaAssetApplicationService;
        this.serviceToken = normalizeToken(serviceToken);
    }

    @PostMapping("/{assetId}/variants/retry")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MediaProcessingRetryResponse retryOne(
            @RequestHeader(name = INTERNAL_SERVICE_TOKEN_HEADER, required = false) String providedServiceToken,
            @PathVariable Long assetId
    ) {
        requireInternalServiceToken(providedServiceToken);
        mediaAssetApplicationService.retryMediaVariantProcessing(assetId);
        return new MediaProcessingRetryResponse(List.of(assetId), 1);
    }

    @PostMapping("/variants/retry-failed")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public MediaProcessingRetryResponse retryFailed(
            @RequestHeader(name = INTERNAL_SERVICE_TOKEN_HEADER, required = false) String providedServiceToken,
            @RequestParam(required = false, defaultValue = "20") Integer limit
    ) {
        requireInternalServiceToken(providedServiceToken);
        List<Long> assetIds = mediaAssetApplicationService.retryFailedMediaVariantProcessing(limit == null ? 20 : limit);
        return new MediaProcessingRetryResponse(assetIds, assetIds.size());
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
