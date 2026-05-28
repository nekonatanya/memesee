package com.memesee.content.media.application;

import com.memesee.content.media.domain.MediaAssetVariantKind;
import com.memesee.platform.error.ApiErrorCode;
import com.memesee.platform.error.ApiException;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.Locale;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class MediaImageProcessor {

    private static final int DISPLAY_MAX_EDGE = 1600;
    private static final int THUMB_MAX_EDGE = 480;
    private static final long MAX_PIXELS = 36_000_000L;
    private static final String DERIVATIVE_CONTENT_TYPE = "image/jpeg";

    public ProcessedImageSet process(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw invalidImage("请选择要上传的图片。");
        }
        byte[] originalBytes;
        try {
            originalBytes = file.getBytes();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.INVALID_REQUEST, "图片读取失败。", ex);
        }
        BufferedImage source = readImage(originalBytes);
        long pixels = (long) source.getWidth() * (long) source.getHeight();
        if (pixels > MAX_PIXELS) {
            throw invalidImage("图片像素过大。");
        }
        String originalFilename = normalizeFilename(file.getOriginalFilename());
        String originalContentType = normalizeContentType(file.getContentType());
        ProcessedImage original = new ProcessedImage(
                MediaAssetVariantKind.ORIGINAL,
                originalBytes,
                originalFilename,
                originalContentType,
                source.getWidth(),
                source.getHeight()
        );
        ProcessedImage display = buildDerivative(
                source,
                MediaAssetVariantKind.DISPLAY,
                derivativeFilename(originalFilename, "display"),
                DISPLAY_MAX_EDGE
        );
        ProcessedImage thumb = buildDerivative(
                source,
                MediaAssetVariantKind.THUMB,
                derivativeFilename(originalFilename, "thumb"),
                THUMB_MAX_EDGE
        );
        return new ProcessedImageSet(List.of(original, display, thumb));
    }

    private BufferedImage readImage(byte[] bytes) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
            if (image == null || image.getWidth() <= 0 || image.getHeight() <= 0) {
                throw invalidImage("不支持的图片格式。");
            }
            return image;
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.INVALID_REQUEST, "不支持的图片格式。", ex);
        }
    }

    private ProcessedImage buildDerivative(
            BufferedImage source,
            MediaAssetVariantKind kind,
            String filename,
            int maxEdge
    ) {
        int sourceWidth = source.getWidth();
        int sourceHeight = source.getHeight();
        double scale = Math.min(1.0d, (double) maxEdge / (double) Math.max(sourceWidth, sourceHeight));
        int targetWidth = Math.max(1, (int) Math.round(sourceWidth * scale));
        int targetHeight = Math.max(1, (int) Math.round(sourceHeight * scale));
        BufferedImage resized = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = resized.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.setColor(java.awt.Color.WHITE);
            graphics.fillRect(0, 0, targetWidth, targetHeight);
            graphics.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            graphics.dispose();
        }
        return new ProcessedImage(
                kind,
                writeJpeg(resized),
                filename,
                DERIVATIVE_CONTENT_TYPE,
                targetWidth,
                targetHeight
        );
    }

    private byte[] writeJpeg(BufferedImage image) {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpg").next();
        try (
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                ImageOutputStream imageOutputStream = ImageIO.createImageOutputStream(outputStream)
        ) {
            writer.setOutput(imageOutputStream);
            ImageWriteParam params = writer.getDefaultWriteParam();
            if (params.canWriteCompressed()) {
                params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                params.setCompressionQuality(0.86f);
            }
            writer.write(null, new IIOImage(image, null, null), params);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, ApiErrorCode.INTERNAL_ERROR, "图片处理失败。", ex);
        } finally {
            writer.dispose();
        }
    }

    private String derivativeFilename(String originalFilename, String suffix) {
        String normalized = normalizeFilename(originalFilename);
        int dot = normalized.lastIndexOf('.');
        String base = dot > 0 ? normalized.substring(0, dot) : normalized;
        return base + "-" + suffix + ".jpg";
    }

    private String normalizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "image";
        }
        return filename.trim();
    }

    private String normalizeContentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return "application/octet-stream";
        }
        return contentType.trim().toLowerCase(Locale.ROOT);
    }

    private ApiException invalidImage(String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.INVALID_REQUEST, message);
    }

    public record ProcessedImageSet(List<ProcessedImage> images) {
        public ProcessedImage require(MediaAssetVariantKind kind) {
            return images.stream()
                    .filter(image -> image.kind() == kind)
                    .findFirst()
                    .orElseThrow(() -> new IllegalStateException("Missing processed image kind=" + kind));
        }
    }

    public record ProcessedImage(
            MediaAssetVariantKind kind,
            byte[] bytes,
            String filename,
            String contentType,
            int width,
            int height
    ) {
    }
}
