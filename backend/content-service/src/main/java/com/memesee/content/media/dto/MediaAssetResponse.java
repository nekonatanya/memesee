package com.memesee.content.media.dto;

import java.util.List;

public record MediaAssetResponse(
        Long id,
        String kind,
        String url,
        String thumbUrl,
        String displayUrl,
        String originalUrl,
        String contentType,
        String originalFilename,
        long sizeBytes,
        int width,
        int height,
        List<MediaAssetVariantResponse> variants
) {
}
