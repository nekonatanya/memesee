package com.memesee.content.media.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.memesee.content.media.application.MediaAssetApplicationService;
import com.memesee.content.media.application.MediaVariantProcessingRequested;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.retry.MessageRecoverer;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.media.processing", name = "async-enabled", havingValue = "true")
public class RabbitMediaVariantProcessingFailureRecoverer implements MessageRecoverer {

    private static final Logger log = LoggerFactory.getLogger(RabbitMediaVariantProcessingFailureRecoverer.class);

    private final ObjectMapper objectMapper;
    private final MediaAssetApplicationService mediaAssetApplicationService;

    public RabbitMediaVariantProcessingFailureRecoverer(
            ObjectMapper objectMapper,
            MediaAssetApplicationService mediaAssetApplicationService
    ) {
        this.objectMapper = objectMapper;
        this.mediaAssetApplicationService = mediaAssetApplicationService;
    }

    @Override
    public void recover(Message message, Throwable cause) {
        try {
            MediaVariantProcessingRequested request = objectMapper.readValue(
                    message.getBody(),
                    MediaVariantProcessingRequested.class
            );
            if (request != null && request.assetId() != null) {
                mediaAssetApplicationService.markMediaVariantProcessingFailed(request.assetId());
            }
        } catch (RuntimeException | java.io.IOException error) {
            log.warn("media_variant_processing_failure_recoverer_failed", error);
        }
        throw new org.springframework.amqp.AmqpRejectAndDontRequeueException(
                "media variant processing failed after retries",
                cause
        );
    }
}
