import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, MousePointer2, Sparkles } from 'lucide-react';
import TourViewer from './components/TourViewer.jsx';
import HotspotEditor from './components/HotspotEditor.jsx';
import UIOverlay from './components/UIOverlay.jsx';
import { DEFAULT_PANORAMAS } from './data/defaultPanoramas.js';

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [panoramas, setPanoramas] = useState(DEFAULT_PANORAMAS);
  const [activeId, setActiveId] = useState(DEFAULT_PANORAMAS[0]?.id ?? null);
  const [hotspotsByPanorama, setHotspotsByPanorama] = useState({});
  const [mode, setMode] = useState('edit');
  const [pendingPosition, setPendingPosition] = useState(null);
  const [editingHotspot, setEditingHotspot] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState([]);
  const [toastMessage, setToastMessage] = useState('');
  const transitionTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const objectUrlsRef = useRef(new Set());

  const activePanorama = panoramas.find((p) => p.id === activeId) ?? panoramas[0] ?? null;
  const activeHotspots = useMemo(() => {
    if (!activePanorama) return [];
    return (hotspotsByPanorama[activePanorama.id] ?? []).map((hotspot) => ({
      ...hotspot,
      targetName: panoramas.find((panorama) => panorama.id === hotspot.targetId)?.name ?? 'Không gian đích',
    }));
  }, [activePanorama, hotspotsByPanorama, panoramas]);
  const editorOpen = Boolean(pendingPosition || editingHotspot);

  const showToast = useCallback((message) => {
    setToastMessage(message);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 3600);
  }, []);

  const transitionTo = useCallback((targetId, { remember = true } = {}) => {
    if (!targetId || targetId === activeId || !panoramas.some((p) => p.id === targetId)) return;

    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (remember && activeId) {
      setNavigationHistory((history) => [...history, activeId]);
    }

    setTransitioning(true);
    transitionTimerRef.current = window.setTimeout(() => {
      setActiveId(targetId);
      transitionTimerRef.current = window.setTimeout(() => {
        setTransitioning(false);
        transitionTimerRef.current = null;
      }, 150);
    }, 150);
  }, [activeId, panoramas]);

  const navigateBack = useCallback(() => {
    const previousId = navigationHistory[navigationHistory.length - 1];
    if (!previousId) return;
    setNavigationHistory((history) => history.slice(0, -1));
    transitionTo(previousId, { remember: false });
  }, [navigationHistory, transitionTo]);

  const handleModeChange = useCallback((nextMode) => {
    setNavigationHistory([]);
    setMode(nextMode);
  }, []);

  const handleCreateHotspot = useCallback((position) => {
    if (mode !== 'edit' || !activePanorama) return;
    setEditingHotspot(null);
    setPendingPosition(position);
  }, [mode, activePanorama]);

  const handleSelectHotspot = useCallback((hotspot) => {
    if (mode === 'preview') {
      transitionTo(hotspot.targetId);
    } else {
      setPendingPosition(null);
      setEditingHotspot(hotspot);
    }
  }, [mode, transitionTo]);

  const closeEditor = () => {
    setPendingPosition(null);
    setEditingHotspot(null);
  };

  const saveHotspot = (values) => {
    if (!activePanorama || !values.targetId || (!values.position && !pendingPosition)) return;
    if (!panoramas.some((panorama) => panorama.id === values.targetId && panorama.id !== activePanorama.id)) return;
    const id = values.id ?? makeId();
    const hotspot = {
      id,
      name: values.name,
      icon: values.icon,
      targetId: values.targetId,
      position: values.position ?? pendingPosition,
    };
    setHotspotsByPanorama((current) => {
      const currentList = current[activePanorama.id] ?? [];
      const nextList = values.id
        ? currentList.map((item) => item.id === id ? hotspot : item)
        : [...currentList, hotspot];
      return { ...current, [activePanorama.id]: nextList };
    });
    closeEditor();
    showToast(values.id ? 'Đã cập nhật checkpoint.' : 'Đã tạo checkpoint. Chuyển sang Preview để thử.');
  };

  const deleteHotspot = (id) => {
    if (!activePanorama) return;
    setHotspotsByPanorama((current) => ({
      ...current,
      [activePanorama.id]: (current[activePanorama.id] ?? []).filter((item) => item.id !== id),
    }));
    closeEditor();
    showToast('Đã xóa checkpoint.');
  };

  const uploadFiles = (fileList) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;

    // Một số trình duyệt/thiết bị không điền MIME type; kiểm tra thêm phần mở rộng.
    const isSupportedImage = (file) =>
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      /\.(jpe?g|png|webp)$/i.test(file.name);
    const accepted = files.filter(isSupportedImage);
    const rejectedCount = files.length - accepted.length;

    if (accepted.length === 0) {
      showToast('Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.');
      return;
    }

    const additions = accepted.map((file, index) => {
      const src = URL.createObjectURL(file);
      return {
        id: makeId(),
        name: file.name.replace(/\.[^.]+$/, '').slice(0, 28) || `Không gian ${index + 1}`,
        fileName: file.name,
        src,
        isDefault: false,
        isObjectUrl: true,
      };
    });

    additions.forEach((item) => objectUrlsRef.current.add(item.src));
    setPanoramas((current) => [...current, ...additions]);
    setActiveId((currentId) => currentId ?? additions[0]?.id ?? null);

    const successMessage = additions.length === 1
      ? `Đã thêm “${additions[0].name}” vào thư viện.`
      : `Đã thêm ${additions.length} ảnh panorama vào thư viện.`;
    showToast(rejectedCount > 0
      ? `${successMessage} Bỏ qua ${rejectedCount} tệp không hỗ trợ.`
      : successMessage);
  };

  const removePanorama = (id) => {
    const target = panoramas.find((p) => p.id === id);
    if (!target || target.isDefault) return;
    if (target.isObjectUrl) {
      URL.revokeObjectURL(target.src);
      objectUrlsRef.current.delete(target.src);
    }
    setPanoramas((current) => current.filter((p) => p.id !== id));
    setHotspotsByPanorama((current) => {
      const next = { ...current };
      delete next[id];
      Object.keys(next).forEach((sourceId) => {
        next[sourceId] = next[sourceId].filter((hotspot) => hotspot.targetId !== id);
      });
      return next;
    });
    if (activeId === id) {
      const next = panoramas.find((p) => p.id !== id);
      setActiveId(next?.id ?? null);
    }
  };

  // Thu hồi mọi Object URL và timer còn tồn tại khi người dùng đóng/unmount ứng dụng.
  useEffect(() => () => {
    if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current.clear();
  }, []);

  // Nếu xóa panorama đang được chọn, không để canvas nhận một giá trị cũ.
  useEffect(() => {
    if (activeId && !panoramas.some((p) => p.id === activeId)) {
      setActiveId(panoramas[0]?.id ?? null);
    }
  }, [activeId, panoramas]);

  return (
    <main className="relative h-[100dvh] min-h-[620px] w-full overflow-hidden bg-[#080b14] text-white">
      {activePanorama ? (
        <TourViewer
          panorama={activePanorama}
          hotspots={activeHotspots}
          mode={mode}
          onCreateHotspot={handleCreateHotspot}
          onSelectHotspot={handleSelectHotspot}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center px-6 text-center text-slate-300">
          <div className="max-w-md">
            <p className="text-lg font-semibold text-white/75">Chưa có không gian</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">Nhấn <span className="font-semibold text-cyan-200/80">Thêm ảnh +</span> ở thanh phía dưới để chọn ảnh panorama trực tiếp từ máy tính.</p>
          </div>
        </div>
      )}

      <div className="ambient-glow ambient-glow-a" />
      <div className="ambient-glow ambient-glow-b" />

      <UIOverlay
        panoramas={panoramas}
        activePanorama={activePanorama}
        activeId={activePanorama?.id}
        hotspots={activeHotspots}
        mode={mode}
        onModeChange={handleModeChange}
        onSelectPanorama={setActiveId}
        onUploadFiles={uploadFiles}
        onRemovePanorama={removePanorama}
        canGoBack={navigationHistory.length > 0}
        onGoBack={navigateBack}
      />

      <HotspotEditor
        open={editorOpen}
        initialHotspot={editingHotspot}
        panoramas={panoramas}
        currentPanoramaId={activePanorama?.id}
        onSave={saveHotspot}
        onDelete={deleteHotspot}
        onClose={closeEditor}
      />


      <AnimatePresence>
        {toastMessage && (
          <div className="pointer-events-none fixed inset-x-0 bottom-36 z-[60] flex justify-center px-4">
            <motion.div
              role="status"
              aria-live="polite"
              className="flex max-w-[min(92vw,520px)] items-center gap-2 rounded-full border border-emerald-200/20 bg-slate-950/85 px-4 py-3 text-sm font-medium text-emerald-100 shadow-2xl backdrop-blur-2xl"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-emerald-300/15 text-emerald-200">✓</span>
              <span>{toastMessage}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {transitioning && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-30 bg-[#080b14]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="fixed bottom-[150px] right-5 z-30 hidden max-w-[260px] lg:block"
            initial={{ opacity: 0, x: 18, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ delay: 0.5, duration: 0.35 }}
          >
            <div className="glass-panel relative p-4 pr-9">
              <button type="button" className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 hover:text-white" onClick={() => setShowWelcome(false)} aria-label="Đóng hướng dẫn">×</button>
              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-100"><Sparkles size={14} /> BẮT ĐẦU NHANH</div>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">{activePanorama ? 'Cuộn chuột để zoom, kéo để xoay góc nhìn và nhấp đúp để thêm checkpoint.' : 'Nhấn “Thêm ảnh +” ở thanh dưới để tải ảnh panorama từ máy tính. Sau đó bạn có thể cuộn chuột để zoom và kéo để xoay.'}</p>
              <button className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-200 hover:text-white" onClick={() => setShowWelcome(false)}>
                Đã hiểu <ArrowRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-32 left-5 z-10 hidden items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/35 xl:flex">
        <MousePointer2 size={12} /> Drag to look <span className="text-white/15">·</span> Scroll to zoom <span className="text-white/15">·</span> Double-click to pin
      </div>
    </main>
  );
}
