import { useCallback, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import Footer from "~/components/dom/layout/Footer";
import Header from "~/components/dom/layout/Header";
import MenuOverlay from "~/components/dom/layout/MenuOverlay.client";
import Cursor from "~/components/dom/overlays/Cursor.client";
import LoadingScreen from "~/components/dom/overlays/LoadingScreen.client";
import NotFoundScene from "./scene/NotFoundScene.client";

// Rendered by the root ErrorBoundary on 404 — the boundary replaces <App/>, so
// this page carries its own header + menu + footer chrome, plus the loading
// overlay that normally lives in <App/> (otherwise the chrome flashes while the
// fog scene boots).
export default function NotFoundScreen() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLoading, setShowLoading] = useState(true);
  const toggle = useCallback(() => setMenuOpen((v) => !v), []);
  const close = useCallback(() => setMenuOpen(false), []);
  const handleLoadComplete = useCallback(() => setShowLoading(false), []);

  return (
    <>
      <ClientOnly fallback={null}>{() => <Cursor />}</ClientOnly>
      <ClientOnly fallback={null}>
        {() => showLoading && <LoadingScreen onComplete={handleLoadComplete} />}
      </ClientOnly>
      <Header isMenuOpen={menuOpen} onMenuToggle={toggle} onMenuClose={close} />
      <ClientOnly fallback={null}>
        {() => <MenuOverlay isOpen={menuOpen} onClose={close} />}
      </ClientOnly>

      <section className="relative min-h-screen overflow-hidden">
        <ClientOnly fallback={<div className="fixed inset-0 bg-bg" />}>
          {() => <NotFoundScene />}
        </ClientOnly>
      </section>

      <div className="relative z-20 pointer-events-auto">
        <Footer />
      </div>
    </>
  );
}
