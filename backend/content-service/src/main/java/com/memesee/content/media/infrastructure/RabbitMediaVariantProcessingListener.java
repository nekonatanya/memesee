package com.memesee.content.media.infrastructure;

import com.memesee.content.media.application.MediaAssetApplicationService;
import com.memesee.content.media.application.MediaVariantProcessingRequested;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.media.processing", name = "async-enabled", havingValue = "true")
public class RabbitMediaVariantProcessingListener {

    private final MediaAssetApplicationService mediaAssetApplicationService;

    public RabbitMediaVariantProcessingListener(MediaAssetApplicationService mediaAssetApplicationService) {
        this.mediaAssetApplicationService = mediaAssetApplicationService;
    }

    @RabbitListener(queues = "${app.media.processing.queue.name}")
    public void handle(MediaVariantProcessingRequested request) {
        if (request == null || request.assetId() == null) {
            return;
        }
        mediaAssetApplicationService.processMissingImageVariants(request.assetId());
    }
}
