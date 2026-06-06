const amqp = require("amqplib");
const mysql = require("mysql2/promise");
const { Client: MinioClient } = require("minio");
const sharp = require("sharp");
const Redis = require("ioredis");

const VARIANTS = [
  { kind: "THUMB", maxEdge: 480, quality: 78 },
  { kind: "SMALL", maxEdge: 720, quality: 80 },
  { kind: "MEDIUM", maxEdge: 1080, quality: 82 },
  { kind: "DISPLAY", maxEdge: 1600, quality: 84 },
];

const config = {
  rabbitUrl: env("MEDIA_WORKER_RABBITMQ_URL", "amqp://memesee:memesee_password@127.0.0.1:5672"),
  queue: env("MEDIA_WORKER_QUEUE", "memesee.media.variant-processing"),
  concurrency: Number(env("MEDIA_WORKER_CONCURRENCY", "2")),
  mysql: {
    host: env("MEDIA_WORKER_DB_HOST", "127.0.0.1"),
    port: Number(env("MEDIA_WORKER_DB_PORT", "3307")),
    user: env("MEDIA_WORKER_DB_USERNAME", "memesee_app"),
    password: env("MEDIA_WORKER_DB_PASSWORD", "memesee_app_password"),
    database: env("MEDIA_WORKER_DB_NAME", "memesee_content"),
    waitForConnections: true,
    connectionLimit: Number(env("MEDIA_WORKER_DB_POOL", "5")),
  },
  minio: {
    endPoint: env("MEDIA_WORKER_MINIO_ENDPOINT", "127.0.0.1"),
    port: Number(env("MEDIA_WORKER_MINIO_PORT", "9000")),
    useSSL: env("MEDIA_WORKER_MINIO_USE_SSL", "false") === "true",
    accessKey: env("MEDIA_WORKER_MINIO_ACCESS_KEY", "minioadmin"),
    secretKey: env("MEDIA_WORKER_MINIO_SECRET_KEY", "minioadmin"),
  },
  bucket: env("MEDIA_WORKER_MINIO_BUCKET", "memesee-post-images"),
  redisUrl: env("MEDIA_WORKER_REDIS_URL", ""),
};

const db = mysql.createPool(config.mysql);
const minio = new MinioClient(config.minio);
const redis = config.redisUrl ? new Redis(config.redisUrl) : null;

function env(name, fallback) {
  return process.env[name] || fallback;
}

function parseMessage(message) {
  const raw = message.content.toString("utf8");
  const parsed = JSON.parse(raw);
  const assetId = Number(parsed.assetId || parsed.id || 0);
  if (!Number.isFinite(assetId) || assetId <= 0) {
    throw new Error(`invalid media processing message: ${raw}`);
  }
  return assetId;
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function loadAsset(assetId) {
  const [rows] = await db.query(
    `select id, kind, bucket_name as bucketName, object_key as objectKey,
            original_filename as originalFilename, content_type as contentType,
            size_bytes as sizeBytes, status, processing_status as processingStatus, blur_data_url as blurDataUrl
       from media_assets
      where id = ?`,
    [assetId],
  );
  return rows[0] || null;
}

async function downloadOriginal(asset) {
  const stream = await minio.getObject(asset.bucketName || config.bucket, asset.objectKey);
  return streamToBuffer(stream);
}

function variantObjectKey(originalObjectKey, kind) {
  const cleanKey = String(originalObjectKey || "image").replace(/^\/+/, "");
  const dotIndex = cleanKey.lastIndexOf(".");
  const stem = dotIndex > 0 ? cleanKey.slice(0, dotIndex) : cleanKey;
  return `${stem}/${kind.toLowerCase()}.webp`;
}

async function buildBlurDataUrl(originalBuffer) {
  const output = await sharp(originalBuffer, { failOn: "none" })
    .rotate()
    .resize({ width: 24, height: 24, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 35, effort: 2 })
    .toBuffer();
  return "data:image/webp;base64," + output.toString("base64");
}

async function putVariant(asset, kind, body) {
  const objectKey = kind === "ORIGINAL" ? asset.objectKey : variantObjectKey(asset.objectKey, kind);
  if (kind !== "ORIGINAL") {
    await minio.putObject(asset.bucketName || config.bucket, objectKey, body, body.length, {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
    });
  }
  return objectKey;
}

async function upsertVariant(conn, asset, variant) {
  await conn.execute(
    `insert into media_asset_variants
       (media_asset_id, kind, bucket_name, object_key, content_type, size_bytes, width, height)
     values (?, ?, ?, ?, ?, ?, ?, ?)
     on duplicate key update
       bucket_name = values(bucket_name),
       object_key = values(object_key),
       content_type = values(content_type),
       size_bytes = values(size_bytes),
       width = values(width),
       height = values(height)`,
    [
      asset.id,
      variant.kind,
      asset.bucketName || config.bucket,
      variant.objectKey,
      variant.contentType,
      variant.sizeBytes,
      variant.width,
      variant.height,
    ],
  );
}

async function buildResponseForAsset(assetId) {
  const [assetRows] = await db.query(
    `select id, kind, bucket_name as bucketName, object_key as objectKey,
            original_filename as originalFilename, content_type as contentType,
            size_bytes as sizeBytes, processing_status as processingStatus, blur_data_url as blurDataUrl
       from media_assets
      where id = ? and status = 'ACTIVE'`,
    [assetId],
  );
  const asset = assetRows[0];
  if (!asset) {
    return null;
  }
  const [variantRows] = await db.query(
    `select kind, bucket_name as bucketName, object_key as objectKey,
            content_type as contentType, size_bytes as sizeBytes, width, height
       from media_asset_variants
      where media_asset_id = ?`,
    [assetId],
  );
  const variants = variantRows.map((variant) => ({
    kind: variant.kind,
    url: publicUrl(variant.objectKey),
    contentType: variant.contentType,
    sizeBytes: Number(variant.sizeBytes || 0),
    width: Number(variant.width || 0),
    height: Number(variant.height || 0),
  }));
  const byKind = Object.fromEntries(variants.map((variant) => [variant.kind, variant]));
  const originalUrl = byKind.ORIGINAL?.url || publicUrl(asset.objectKey);
  const displayUrl = byKind.DISPLAY?.url || originalUrl;
  const mediumUrl = byKind.MEDIUM?.url || displayUrl;
  const smallUrl = byKind.SMALL?.url || mediumUrl;
  const thumbUrl = byKind.THUMB?.url || smallUrl;
  const original = byKind.ORIGINAL;
  return {
    id: Number(asset.id),
    kind: asset.kind,
    url: displayUrl,
    thumbUrl,
    smallUrl,
    mediumUrl,
    displayUrl,
    originalUrl,
    contentType: original?.contentType || asset.contentType,
    originalFilename: asset.originalFilename,
    sizeBytes: Number(original?.sizeBytes || asset.sizeBytes || 0),
    width: Number(original?.width || 0),
    height: Number(original?.height || 0),
    processingStatus: asset.processingStatus || "READY",
    blurDataUrl: asset.blurDataUrl || "",
    variants,
  };
}

function publicUrl(objectKey) {
  const baseUrl = env("MEDIA_WORKER_PUBLIC_BASE_URL", "").replace(/\/+$/, "");
  return baseUrl && objectKey ? `${baseUrl}/${String(objectKey).replace(/^\/+/, "")}` : "";
}

async function refreshLinkedFeedMedia(assetId) {
  const [links] = await db.query(
    `select distinct main_post_id as mainPostId
       from main_post_media_links
      where media_asset_id = ?`,
    [assetId],
  );
  for (const link of links) {
    const [linkedAssets] = await db.query(
      `select media_asset_id as assetId
         from main_post_media_links
        where main_post_id = ?
        order by sort_order asc, id asc`,
      [link.mainPostId],
    );
    const responses = [];
    for (const linkedAsset of linkedAssets) {
      const response = await buildResponseForAsset(linkedAsset.assetId);
      if (response) {
        responses.push(response);
      }
    }
    await db.execute(
      `update main_post_feed_items set media_assets_json = ? where main_post_id = ?`,
      [JSON.stringify(responses), link.mainPostId],
    );
  }
}

async function evictCaches(assetId) {
  if (!redis) {
    return;
  }
  const [mainLinks] = await db.query(
    `select distinct main_post_id as id from main_post_media_links where media_asset_id = ?`,
    [assetId],
  );
  const [subLinks] = await db.query(
    `select distinct sub_post_id as id from sub_post_media_links where media_asset_id = ?`,
    [assetId],
  );
  const keys = [`memesee:content:media-asset-metadata:${assetId}:detail`];
  keys.push(...mainLinks.map((link) => `memesee:content:main-post-media:${link.id}:attachments`));
  keys.push(...subLinks.map((link) => `memesee:content:sub-post-media:${link.id}:attachments`));
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  const stream = redis.scanStream({ match: "memesee:content:main-post-feed-page:*", count: 100 });
  const feedKeys = [];
  for await (const batch of stream) {
    feedKeys.push(...batch);
    if (feedKeys.length >= 100) {
      await redis.del(...feedKeys.splice(0, feedKeys.length));
    }
  }
  if (feedKeys.length > 0) {
    await redis.del(...feedKeys);
  }
}

async function processAsset(assetId) {
  const asset = await loadAsset(assetId);
  if (!asset || asset.status !== "ACTIVE" || asset.kind !== "IMAGE") {
    return;
  }
  const originalBuffer = await downloadOriginal(asset);
  const originalMetadata = await sharp(originalBuffer, { failOn: "none" }).metadata();
  const blurDataUrl = await buildBlurDataUrl(originalBuffer);
  const generated = [{
    kind: "ORIGINAL",
    objectKey: asset.objectKey,
    contentType: asset.contentType,
    sizeBytes: Number(asset.sizeBytes || originalBuffer.length),
    width: Number(originalMetadata.width || 0),
    height: Number(originalMetadata.height || 0),
  }];

  for (const variant of VARIANTS) {
    const output = await sharp(originalBuffer, { failOn: "none" })
      .rotate()
      .resize({
        width: variant.maxEdge,
        height: variant.maxEdge,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: variant.quality, effort: 5 })
      .toBuffer({ resolveWithObject: true });
    const objectKey = await putVariant(asset, variant.kind, output.data);
    generated.push({
      kind: variant.kind,
      objectKey,
      contentType: "image/webp",
      sizeBytes: output.data.length,
      width: Number(output.info.width || 0),
      height: Number(output.info.height || 0),
    });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (const variant of generated) {
      await upsertVariant(conn, asset, variant);
    }
    await conn.execute(
      `update media_assets set processing_status = 'READY', blur_data_url = ? where id = ?`,
      [blurDataUrl, asset.id],
    );
    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
  await refreshLinkedFeedMedia(asset.id);
  await evictCaches(asset.id);
}

async function markFailed(assetId, error) {
  console.error("media_variant_processing_failed", { assetId, message: error.message });
  await db.execute(
    `update media_assets set processing_status = 'FAILED' where id = ?`,
    [assetId],
  );
  await evictCaches(assetId);
}

async function main() {
  const connection = await amqp.connect(config.rabbitUrl);
  const channel = await connection.createChannel();
  channel.prefetch(Math.max(1, config.concurrency));
  await channel.consume(config.queue, async (message) => {
    if (!message) {
      return;
    }
    let assetId = 0;
    try {
      assetId = parseMessage(message);
      await processAsset(assetId);
      channel.ack(message);
    } catch (error) {
      if (assetId > 0) {
        await markFailed(assetId, error);
      }
      channel.nack(message, false, false);
    }
  });
  console.log("media worker started", { queue: config.queue, concurrency: config.concurrency });
}

main().catch((error) => {
  console.error("media_worker_start_failed", error);
  process.exit(1);
});
