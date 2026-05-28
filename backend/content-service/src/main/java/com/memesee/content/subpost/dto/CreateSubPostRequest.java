package com.memesee.content.subpost.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateSubPostRequest(
        Long parentSubPostId,
        @NotBlank
        @Size(min = 1, max = 2000)
        String content,
        @Size(max = 20)
        List<Long> mediaAssetIds
) {
}
