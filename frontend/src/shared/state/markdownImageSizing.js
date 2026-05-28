const DEFAULT_IMAGE_SIZE = {
  containerStyle: { width: "100%", maxWidth: "100%" },
  frameStyle: { width: "100%", maxWidth: "100%" },
  imageStyle: { width: "100%", maxWidth: "100%", maxHeight: "none" },
};

function normalizeDimensionValue(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (/^\d+(\.\d+)?%$/.test(raw)) {
    return raw;
  }
  if (/^\d+(\.\d+)?(px|rem|em|vw|vh)$/.test(raw)) {
    return raw;
  }
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return `${raw}px`;
  }
  return "";
}

function parseSizeSpec(spec) {
  const normalized = String(spec || "").trim();
  if (!normalized) {
    return null;
  }

  const pairMatch = normalized.match(/^(\d+(?:\.\d+)?(?:px|rem|em|vw|vh|%)?)\s*[xX*]\s*(\d+(?:\.\d+)?(?:px|rem|em|vw|vh|%)?)$/);
  if (pairMatch) {
    return {
      width: normalizeDimensionValue(pairMatch[1]),
      height: normalizeDimensionValue(pairMatch[2]),
    };
  }

  const keyed = {};
  normalized.replace(/\b(?:w|width|宽)\s*[:=]\s*([^\s,;，；}]+)/gi, (_, value) => {
    keyed.width = normalizeDimensionValue(value);
    return "";
  });
  normalized.replace(/\b(?:h|height|高)\s*[:=]\s*([^\s,;，；}]+)/gi, (_, value) => {
    keyed.height = normalizeDimensionValue(value);
    return "";
  });
  if (keyed.width || keyed.height) {
    return keyed;
  }

  const single = normalizeDimensionValue(normalized);
  return single ? { width: single } : null;
}

function extractSizeFromAlt(rawAlt) {
  const alt = String(rawAlt || "");
  const tokenMatch = alt.match(/\s*(?:\{([^{}]+)\}|\|([^|{}]+))\s*$/);
  if (!tokenMatch) {
    return { alt, size: null };
  }
  const size = parseSizeSpec(tokenMatch[1] || tokenMatch[2]);
  if (!size) {
    return { alt, size: null };
  }
  return {
    alt: alt.slice(0, tokenMatch.index).trim(),
    size,
  };
}

export function resolveMarkdownImageSizing({ alt, title } = {}) {
  const altResult = extractSizeFromAlt(alt);
  const titleSize = parseSizeSpec(title);
  const size = altResult.size || titleSize;
  if (!size) {
    return {
      alt: altResult.alt || String(alt || ""),
      ...DEFAULT_IMAGE_SIZE,
    };
  }

  const containerStyle = {
    display: "inline-block",
    width: "fit-content",
    maxWidth: "100%",
  };
  const frameStyle = {
    display: "inline-block",
    width: "fit-content",
    maxWidth: "100%",
  };
  const imageStyle = {
    display: "block",
    width: "auto",
    height: "auto",
    maxWidth: "100%",
    maxHeight: "none",
  };

  if (size.width && size.height) {
    imageStyle.maxWidth = size.width;
    imageStyle.maxHeight = size.height;
  } else if (size.width) {
    imageStyle.width = size.width;
    imageStyle.maxWidth = "100%";
  } else if (size.height) {
    imageStyle.height = size.height;
    imageStyle.maxHeight = size.height;
  }

  return {
    alt: altResult.alt || String(alt || ""),
    containerStyle,
    frameStyle,
    imageStyle,
  };
}
