import { Suspense, lazy } from "react";
import AuthModal from "../features/auth/components/AuthModal";
import ConfirmDialog from "../shared/components/ConfirmDialog";
import FloatingActions from "../shared/components/FloatingActions";
import Toast from "../shared/components/Toast";
import ForumGrid from "../features/shell/components/ForumGrid";
import Topbar from "../features/shell/components/topbar/Topbar";

const ImageLightbox = lazy(() => import("../shared/components/overlays/ImageLightbox"));

export default function AppLayout({
  chromeProps,
  overlayProps,
}) {
  const { topbarProps, forumGridProps } = chromeProps;
  const {
    authModalProps,
    floatingProps: { homeFloatingProps, postFloatingProps },
    toastProps,
    lightboxProps,
  } = overlayProps;

  return (
    <div className="forum-app">
      <Topbar {...topbarProps} />
      <ForumGrid {...forumGridProps} />
      <AuthModal {...authModalProps} />
      <ConfirmDialog />
      <FloatingActions {...homeFloatingProps} />
      <FloatingActions {...postFloatingProps} />
      <Toast {...toastProps} />
      {lightboxProps && (
        <Suspense fallback={null}>
          <ImageLightbox {...lightboxProps} />
        </Suspense>
      )}
    </div>
  );
}
