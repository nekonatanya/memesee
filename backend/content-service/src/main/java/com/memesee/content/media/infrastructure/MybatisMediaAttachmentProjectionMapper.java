package com.memesee.content.media.infrastructure;

import java.util.Collection;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.ResultMap;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface MybatisMediaAttachmentProjectionMapper {

    @Select("""
            <script>
            SELECT
                link.main_post_id AS owner_id,
                asset.id AS asset_id,
                asset.kind AS kind,
                asset.content_type AS content_type,
                asset.original_filename AS original_filename,
                asset.size_bytes AS size_bytes
            FROM main_post_media_links link
            JOIN media_assets asset
              ON asset.id = link.media_asset_id
            WHERE link.main_post_id IN
              <foreach item="mainPostId" collection="mainPostIds" open="(" separator="," close=")">
                #{mainPostId}
              </foreach>
              AND asset.status = 'ACTIVE'
            ORDER BY link.main_post_id ASC, link.sort_order ASC, link.id ASC
            </script>
            """)
    @Results(id = "mediaAttachmentProjectionRow", value = {
            @Result(property = "ownerId", column = "owner_id"),
            @Result(property = "assetId", column = "asset_id"),
            @Result(property = "kind", column = "kind"),
            @Result(property = "contentType", column = "content_type"),
            @Result(property = "originalFilename", column = "original_filename"),
            @Result(property = "sizeBytes", column = "size_bytes")
    })
    List<MybatisMediaAttachmentProjectionRow> selectMainPostMedia(@Param("mainPostIds") Collection<Long> mainPostIds);

    @Select("""
            <script>
            SELECT
                link.sub_post_id AS owner_id,
                asset.id AS asset_id,
                asset.kind AS kind,
                asset.content_type AS content_type,
                asset.original_filename AS original_filename,
                asset.size_bytes AS size_bytes
            FROM sub_post_media_links link
            JOIN media_assets asset
              ON asset.id = link.media_asset_id
            WHERE link.sub_post_id IN
              <foreach item="subPostId" collection="subPostIds" open="(" separator="," close=")">
                #{subPostId}
              </foreach>
              AND asset.status = 'ACTIVE'
            ORDER BY link.sub_post_id ASC, link.sort_order ASC, link.id ASC
            </script>
            """)
    @ResultMap("mediaAttachmentProjectionRow")
    List<MybatisMediaAttachmentProjectionRow> selectSubPostMedia(@Param("subPostIds") Collection<Long> subPostIds);
}
