function normalizeMainPostId(mainPostId) {
  const normalizedMainPostId = Number(mainPostId || 0);
  return normalizedMainPostId > 0 ? normalizedMainPostId : null;
}

export function buildNoopMainPostDetailIntent() {
  return {
    type: "none",
    mainPostId: null,
  };
}

export function buildSyncCurrentMainPostDetailIntent(mainPostId) {
  const normalizedMainPostId = normalizeMainPostId(mainPostId);
  if (!normalizedMainPostId) {
    return buildNoopMainPostDetailIntent();
  }
  return {
    type: "sync_current_detail",
    mainPostId: normalizedMainPostId,
  };
}

export function buildClearCurrentMainPostDetailIntent(mainPostId) {
  const normalizedMainPostId = normalizeMainPostId(mainPostId);
  if (!normalizedMainPostId) {
    return buildNoopMainPostDetailIntent();
  }
  return {
    type: "clear_current_detail",
    mainPostId: normalizedMainPostId,
  };
}

export function buildReloadCurrentMainPostDetailIntent(mainPostId) {
  const normalizedMainPostId = normalizeMainPostId(mainPostId);
  if (!normalizedMainPostId) {
    return buildNoopMainPostDetailIntent();
  }
  return {
    type: "reload_current_detail",
    mainPostId: normalizedMainPostId,
  };
}

export function buildReloadCurrentMainPostThreadIntent(mainPostId) {
  const normalizedMainPostId = normalizeMainPostId(mainPostId);
  if (!normalizedMainPostId) {
    return buildNoopMainPostDetailIntent();
  }
  return {
    type: "reload_current_thread",
    mainPostId: normalizedMainPostId,
  };
}

export function buildMainPostDetailIntentExecutionContext({
  detailIntent,
  currentDetailPostId,
  setPostDetail,
  buildNextDetail,
  loadPostDetail,
  reloadCurrentPostDetail,
  reloadCurrentPostThread,
} = {}) {
  return {
    intent: detailIntent,
    currentDetailPostId,
    setPostDetail,
    buildNextDetail,
    loadPostDetail,
    reloadCurrentPostDetail,
    reloadCurrentPostThread,
  };
}

export function shouldExecuteMainPostDetailIntent(intent, currentDetailPostId) {
  const normalizedCurrentDetailPostId = normalizeMainPostId(currentDetailPostId);
  const normalizedIntentMainPostId = normalizeMainPostId(intent?.mainPostId);

  if (!normalizedCurrentDetailPostId || !normalizedIntentMainPostId) {
    return false;
  }

  if (normalizedCurrentDetailPostId !== normalizedIntentMainPostId) {
    return false;
  }

  return [
    "sync_current_detail",
    "clear_current_detail",
    "reload_current_detail",
    "reload_current_thread",
  ].includes(intent?.type);
}

export async function executeMainPostDetailIntent({
  intent,
  currentDetailPostId,
  setPostDetail,
  buildNextDetail,
  loadPostDetail,
  reloadCurrentPostDetail,
  reloadCurrentPostThread,
}) {
  if (
    typeof setPostDetail !== "function" ||
    !shouldExecuteMainPostDetailIntent(intent, currentDetailPostId)
  ) {
    return false;
  }

  if (intent.type === "clear_current_detail") {
    setPostDetail(null);
    return true;
  }

  if (intent.type === "sync_current_detail") {
    if (typeof buildNextDetail !== "function") {
      return false;
    }
    setPostDetail((prev) => buildNextDetail(prev));
    return true;
  }

  if (intent.type === "reload_current_detail") {
    if (typeof reloadCurrentPostDetail === "function") {
      await reloadCurrentPostDetail();
      return true;
    }
    if (typeof loadPostDetail !== "function") {
      return false;
    }
    const nextPostDetail = await loadPostDetail(intent.mainPostId);
    setPostDetail(nextPostDetail);
    return true;
  }

  if (intent.type === "reload_current_thread") {
    if (typeof reloadCurrentPostThread !== "function") {
      return false;
    }
    await reloadCurrentPostThread();
    return true;
  }

  return false;
}
