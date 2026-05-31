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
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import com.luciad.imageio.webp.WebPWriteParam;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class MediaImageProcessor {

    private static final int DISPLAY_MAX_EDGE = 1600;
    private static final int MEDIUM_MAX_EDGE = 1080;
    private static final int SMALL_MAX_EDGE = 720;
    private static final int THUMB_MAX_EDGE = 480;
    private static final long MAX_PIXELS = 36_000_000L;
    private static final String DERIVATIVE_CONTENT_TYPE = "image/webp";
    private static final String FALLBACK_DERIVATIVE_CONTENT_TYPE = "image/jpeg";

    public ProcessedImageSet process(MultipartFile file) {
        return processOriginalImage(readOriginalImage(file));
    }

    public ProcessedImage readOriginalImage(MultipartFile file) {
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
        String originalContentType = resolveOriginalContentType(originalBytes, file.getContentType(), originalFilename);
        ProcessedImage original = new ProcessedImage(
                MediaAssetVariantKind.ORIGINAL,
                originalBytes,
                originalFilename,
                originalContentType,
                source.getWidth(),
                source.getHeight()
        );
        return original;
    }

    public ProcessedImageSet processOriginalBytes(byte[] originalBytes, String originalFilename, String contentType) {
        if (originalBytes == null || originalBytes.length == 0) {
            throw invalidImage("图片数据为空。");
        }
        BufferedImage source = readImage(originalBytes);
        long pixels = (long) source.getWidth() * (long) source.getHeight();
        if (pixels > MAX_PIXELS) {
            throw invalidImage("图片像素过大。");
        }
        ProcessedImage original = new ProcessedImage(
                MediaAssetVariantKind.ORIGINAL,
                originalBytes,
                normalizeFilename(originalFilename),
                resolveOriginalContentType(originalBytes, contentType, originalFilename),
                source.getWidth(),
                source.getHeight()
        );
        return processOriginalImage(original);
    }

    private ProcessedImageSet processOriginalImage(ProcessedImage original) {
        BufferedImage source = readImage(original.bytes());
        List<ProcessedImage> processedImages = new ArrayList<>();
        processedImages.add(original);
        processedImages.add(buildDerivative(
                source,
                MediaAssetVariantKind.DISPLAY,
                original.filename(),
                "display",
                DISPLAY_MAX_EDGE
        ));
        processedImages.add(buildDerivative(
                source,
                MediaAssetVariantKind.MEDIUM,
                original.filename(),
                "medium",
                MEDIUM_MAX_EDGE
        ));
        processedImages.add(buildDerivative(
                source,
                MediaAssetVariantKind.SMALL,
                original.filename(),
                "small",
                SMALL_MAX_EDGE
        ));
        processedImages.add(buildDerivative(
                source,
                MediaAssetVariantKind.THUMB,
                original.filename(),
                "thumb",
                THUMB_MAX_EDGE
        ));
        return new ProcessedImageSet(List.copyOf(processedImages));
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
            String originalFilename,
            String suffix,
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
        EncodedDerivative encodedDerivative = writeDerivative(resized);
        return new ProcessedImage(
                kind,
                encodedDerivative.bytes(),
                derivativeFilename(originalFilename, suffix, encodedDerivative.extension()),
                encodedDerivative.contentType(),
                targetWidth,
                targetHeight
        );
    }

    private EncodedDerivative writeDerivative(BufferedImage image) {
        Iterator<ImageWriter> webpWriters = ImageIO.getImageWritersByMIMEType(DERIVATIVE_CONTENT_TYPE);
        if (webpWriters.hasNext()) {
            try {
                return new EncodedDerivative(
                        writeWebpImage(image, webpWriters.next(), 0.82f),
                        DERIVATIVE_CONTENT_TYPE,
                        "webp"
                );
            } catch (RuntimeException | LinkageError ignored) {
                // Fall back to JPEG if the runtime lacks a working WebP native writer.
            }
        }
        ImageWriter jpegWriter = ImageIO.getImageWritersByFormatName("jpg").next();
        return new EncodedDerivative(
                writeImage(image, jpegWriter, FALLBACK_DERIVATIVE_CONTENT_TYPE, 0.86f),
                FALLBACK_DERIVATIVE_CONTENT_TYPE,
                "jpg"
        );
    }

    private byte[] writeWebpImage(BufferedImage image, ImageWriter writer, float quality) {
        WebPWriteParam params = new WebPWriteParam(Locale.ROOT);
        params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        params.setCompressionType(params.getCompressionTypes()[WebPWriteParam.LOSSY_COMPRESSION]);
        params.setCompressionQuality(quality);
        params.setMethod(4);
        return writeImage(image, writer, DERIVATIVE_CONTENT_TYPE, params);
    }

    private byte[] writeImage(BufferedImage image, ImageWriter writer, String contentType, float quality) {
        ImageWriteParam params = writer.getDefaultWriteParam();
        if (params.canWriteCompressed()) {
            params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            params.setCompressionQuality(quality);
        }
        return writeImage(image, writer, contentType, params);
    }

    private byte[] writeImage(BufferedImage image, ImageWriter writer, String contentType, ImageWriteParam params) {
        try (
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                ImageOutputStream imageOutputStream = ImageIO.createImageOutputStream(outputStream)
        ) {
            writer.setOutput(imageOutputStream);
            writer.write(null, new IIOImage(image, null, null), params);
            imageOutputStream.flush();
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    ApiErrorCode.INTERNAL_ERROR,
                    "图片处理失败：" + contentType,
                    ex
            );
        } finally {
            writer.dispose();
        }
    }

    private String derivativeFilename(String originalFilename, String suffix, String extension) {
        String normalized = normalizeFilename(originalFilename);
        int dot = normalized.lastIndexOf('.');
        String base = dot > 0 ? normalized.substring(0, dot) : normalized;
        return base + "-" + suffix + "." + extension;
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

    private String resolveOriginalContentType(byte[] bytes, String declaredContentType, String originalFilename) {
        String detectedContentType = detectContentType(bytes);
        if (detectedContentType != null) {
            return detectedContentType;
        }
        String normalizedDeclaredContentType = normalizeContentType(declaredContentType);
        if (isSupportedImageContentType(normalizedDeclaredContentType)) {
            return normalizedDeclaredContentType;
        }
        String filenameContentType = contentTypeFromFilename(originalFilename);
        return filenameContentType == null ? "image/jpeg" : filenameContentType;
    }

    private String detectContentType(byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            return null;
        }
        if ((bytes[0] & 0xff) == 0xff && (bytes[1] & 0xff) == 0xd8 && (bytes[2] & 0xff) == 0xff) {
            return "image/jpeg";
        }
        if (
                bytes.length >= 8
                        && (bytes[0] & 0xff) == 0x89
                        && bytes[1] == 0x50
                        && bytes[2] == 0x4e
                        && bytes[3] == 0x47
                        && bytes[4] == 0x0d
                        && bytes[5] == 0x0a
                        && bytes[6] == 0x1a
                        && bytes[7] == 0x0a
        ) {
            return "image/png";
        }
        if (
                bytes.length >= 6
                        && bytes[0] == 0x47
                        && bytes[1] == 0x49
                        && bytes[2] == 0x46
                        && bytes[3] == 0x38
                        && (bytes[4] == 0x37 || bytes[4] == 0x39)
                        && bytes[5] == 0x61
        ) {
            return "image/gif";
        }
        if (
                bytes.length >= 12
                        && bytes[0] == 0x52
                        && bytes[1] == 0x49
                        && bytes[2] == 0x46
                        && bytes[3] == 0x46
                        && bytes[8] == 0x57
                        && bytes[9] == 0x45
                        && bytes[10] == 0x42
                        && bytes[11] == 0x50
        ) {
            return "image/webp";
        }
        if (bytes[0] == 0x42 && bytes[1] == 0x4d) {
            return "image/bmp";
        }
        return null;
    }

    private boolean isSupportedImageContentType(String contentType) {
        return switch (contentType) {
            case "image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp" -> true;
            default -> false;
        };
    }

    private String contentTypeFromFilename(String filename) {
        String normalizedFilename = normalizeFilename(filename).toLowerCase(Locale.ROOT);
        int dot = normalizedFilename.lastIndexOf('.');
        if (dot < 0 || dot >= normalizedFilename.length() - 1) {
            return null;
        }
        return switch (normalizedFilename.substring(dot + 1)) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "gif" -> "image/gif";
            case "webp" -> "image/webp";
            case "bmp" -> "image/bmp";
            default -> null;
        };
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

    private record EncodedDerivative(byte[] bytes, String contentType, String extension) {
    }
}
