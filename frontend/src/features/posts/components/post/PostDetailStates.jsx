import { StatusCard } from "../../../../shared/components/PageShell";

export function PostDetailLoadingState() {
  return (
    <StatusCard
      kicker="主帖详情"
      title="主帖马上出现"
      description="正文会先显示，子帖随后补上。"
      tone="loading"
      role="status"
      ariaLive="polite"
    >
      <span className="feed-status-dots" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
    </StatusCard>
  );
}

export function PostDetailRetryState({ refreshingCurrentPostThread, refreshCurrentPostThread }) {
  return (
    <StatusCard
      title="没有找到这条主帖"
      description="可能已经被删除，或网络刚才慢了一拍。"
      className="feed-status-card-empty"
      tone="empty"
    >
      <span className="feed-status-subtext">可以返回首页，也可以再试一次加载。</span>
      <div className="btn-group">
        <button
          type="button"
          className="neo-btn small"
          onClick={refreshCurrentPostThread}
          disabled={refreshingCurrentPostThread}
        >
          {refreshingCurrentPostThread ? "正在重试..." : "重试加载"}
        </button>
      </div>
    </StatusCard>
  );
}
