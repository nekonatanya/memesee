package com.memesee.content.media.api;


import com.memesee.content.media.dto.MediaAssetResponse;
import com.memesee.content.media.application.MediaAssetApplicationService;
import com.memesee.content.media.domain.MediaAssetVariantKind;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/media-assets")
public class MediaAssetController {

    private final MediaAssetApplicationService mediaAssetApplicationService;

    public MediaAssetController(MediaAssetApplicationService mediaAssetApplicationService) {
        this.mediaAssetApplicationService = mediaAssetApplicationService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MediaAssetResponse> uploadImage(
            @RequestHeader(name = "Authorization", required = false) String authorizationHeader,
            @RequestParam("file") MultipartFile file
    ) {
        MediaAssetResponse response = mediaAssetApplicationService.uploadImage(authorizationHeader, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{assetId}")
    public MediaAssetResponse getMediaAsset(@PathVariable Long assetId) {
        return mediaAssetApplicationService.getMediaAsset(assetId);
    }

    @GetMapping("/{assetId}/binary")
    public ResponseEntity<?> loadMediaBinary(
            @PathVariable Long assetId,
            @RequestParam(name = "variant", required = false, defaultValue = "display") String variant,
            @RequestParam(name = "v", required = false) String cacheVersion
    ) {
        MediaAssetApplicationService.LoadedMediaAsset loadedMediaAsset =
                mediaAssetApplicationService.loadMediaBinary(assetId, parseVariantKind(variant));
        return ResponseEntity.ok()
                .cacheControl(resolveCacheControl(cacheVersion))
                .contentType(parseMediaType(loadedMediaAsset.contentType()))
                .body(loadedMediaAsset.resource());
    }

    private MediaAssetVariantKind parseVariantKind(String value) {
        if (value == null || value.isBlank()) {
            return MediaAssetVariantKind.DISPLAY;
        }
        return switch (value.trim().toLowerCase(java.util.Locale.ROOT)) {
            case "thumb", "thumbnail" -> MediaAssetVariantKind.THUMB;
            case "original", "raw" -> MediaAssetVariantKind.ORIGINAL;
            default -> MediaAssetVariantKind.DISPLAY;
        };
    }

    private MediaType parseMediaType(String contentType) {
        try {
            return MediaType.parseMediaType(contentType);
        } catch (RuntimeException ex) {
            return MediaType.APPLICATION_OCTET_STREAM;
        }
    }

    private CacheControl resolveCacheControl(String cacheVersion) {
        if (cacheVersion != null && !cacheVersion.isBlank()) {
            return CacheControl.maxAge(java.time.Duration.ofDays(365)).cachePublic().immutable();
        }
        return CacheControl.noCache().cachePrivate();
    }
}
