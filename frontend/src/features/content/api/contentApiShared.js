export function buildAuthHeaders(token) {
  return token
    ? { Authorization: `Bearer ${token}` }
    : undefined;
}

export function normalizeAssetUrl(apiBase, pathOrUrl) {
  const rawValue = String(pathOrUrl || "").trim();
  if (!rawValue) {
    return "";
  }
  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }
  const base = String(apiBase || "").trim().replace(/\/$/, "");
  const path = rawValue.startsWith("/") ? rawValue : `/${rawValue}`;
  return base ? `${base}${path}` : path;
}

export function calculateHeatScore(post) {
  const viewWeight = 0.1;
  const favoriteWeight = 2;
  const subPostWeight = 3;
  return (Number(post?.viewCount || 0) * viewWeight)
    + Number(post?.likeCount || 0)
    + (Number(post?.favoriteCount || 0) * favoriteWeight)
    + (Number(post?.subPostCount || 0) * subPostWeight);
}
