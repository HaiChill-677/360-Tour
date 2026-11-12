import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Aperture,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Compass,
  Eye,
  Layers3,
  PencilRuler,
  Plus,
  Radio,
  Trash2,
  WandSparkles,
} from 'lucide-react';

function ModeSwitch({ mode, onChange, canPreview = true }) {
  return (
    <div className="mode-switch">
      <button className={mode === 'edit' ? 'mode-active' : ''} onClick={() => onChange('edit')} type="button">
        <PencilRuler size={15} /> Design
      </button>
      <button
        className={mode === 'preview' ? 'mode-active' : ''}
        onClick={() => onChange('preview')}
        type="button"
        disabled={!canPreview}
        title={!canPreview ? 'Thêm ít nhất một panorama để xem Preview' : 'Xem thử tour'}
      >
        <Eye size={15} /> Preview
      </button>
    </div>
  );
}

export default function UIOverlay({
  panoramas,
  activePanorama,
  activeId,
  hotspots,
  mode,
  onModeChange,
  onSelectPanorama,
  onUploadFiles,
  onRemovePanorama,
  canGoBack = false,
  onGoBack,
}) {
  const uploadRef = useRef(null);
  const currentIndex = panoramas.findIndex((p) => p.id === activeId);
  const isEdit = mode === 'edit';

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6">
      <header className="pointer-events-auto flex items-center justify-between gap-3">
        <div className="glass-panel flex min-w-0 items-center gap-3 px-3 py-2.5 sm:px-4">
          <div className="brand-mark"><Aperture size={19} strokeWidth={1.8} /></div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold tracking-wide text-white sm:text-base">360° VIRTUAL TOUR</div>
            <div className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400 sm:block">Spatial experience studio</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-3 py-2 text-[11px] font-medium text-emerald-200 sm:flex">
            <span className="live-dot" /> LOCAL PROJECT
          </div>
          <ModeSwitch mode={mode} onChange={onModeChange} canPreview={panoramas.length > 0} />
        </div>
      </header>

      <div className="pointer-events-none flex flex-1 items-center justify-between py-8">
        <AnimatePresence mode="wait">
          {isEdit && (
            <motion.aside
              key="design-panel"
              className="glass-panel pointer-events-auto hidden w-[250px] p-4 lg:block"
              initial={{ opacity: 0, x: -22 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-center justify-between">
                <div className="section-kicker">WORKSPACE</div>
                <WandSparkles size={16} className="text-cyan-200" />
              </div>
              <h2 className="mt-2 text-lg font-semibold text-white">Thiết kế không gian</h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">Cuộn chuột để zoom, kéo để xoay toàn cảnh và nhấp đúp lên bề mặt để tạo checkpoint.</p>
              <div className="my-4 h-px bg-white/10" />
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Không gian</span>
                  <span className="font-semibold text-white">{panoramas.length > 0 ? `${currentIndex + 1} / ${panoramas.length}` : '0 / 0'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Checkpoint</span>
                  <span className="font-semibold text-cyan-200">{hotspots.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Chế độ</span>
                  <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-100">Editing</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200"><Compass size={14} className="text-cyan-200" /> Điều hướng</div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">Giữ chuột trái và kéo để xoay; cuộn con lăn để zoom. Chọn Preview để thử các liên kết.</p>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        <div className="ml-auto self-start">
          <div className="glass-panel flex items-center gap-2 px-3 py-2 text-xs text-slate-200">
            <Layers3 size={14} className="text-cyan-200" />
            <span className="max-w-36 truncate">{activePanorama?.name ?? 'Chưa có không gian'}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEdit && (
          <motion.footer
            className="pointer-events-auto mx-auto w-full max-w-5xl"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 22 }}
            transition={{ duration: 0.22 }}
          >
        <div className="glass-panel px-3 pb-3 pt-3 sm:px-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-100"><Layers3 size={16} /></div>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">Panorama library</h3>
                <p className="text-[10px] text-slate-400">{panoramas.length} không gian · {isEdit ? 'Chọn ảnh để chỉnh sửa' : 'Chọn không gian để xem'}</p>
              </div>
            </div>
            {isEdit && (
              <>
                <input
                  ref={uploadRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    onUploadFiles(Array.from(event.target.files ?? []));
                    event.target.value = '';
                  }}
                />
                <button
                  className="upload-button"
                  type="button"
                  title="Chọn ảnh panorama từ máy tính"
                  aria-label="Thêm ảnh panorama từ máy tính"
                  onClick={() => uploadRef.current?.click()}
                >
                  <CloudUpload size={15} /> <span>Thêm ảnh</span><Plus size={14} />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              className="carousel-arrow"
              aria-label="Ảnh trước"
              type="button"
              disabled={currentIndex <= 0}
              onClick={() => onSelectPanorama(panoramas[currentIndex - 1]?.id)}
            ><ChevronLeft size={17} /></button>
            <div className="custom-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1">
              {panoramas.map((p, index) => {
                const active = p.id === activeId;
                return (
                  <motion.div
                    layout
                    key={p.id}
                    className={`group relative w-[126px] shrink-0 rounded-xl border p-2 transition sm:w-[160px] ${
                      active ? 'border-cyan-300/60 bg-cyan-300/[0.11] shadow-glow' : 'border-white/[0.09] bg-white/[0.035] hover:border-white/20 hover:bg-white/[0.07]'
                    }`}
                  >
                    <button type="button" onClick={() => onSelectPanorama(p.id)} className="flex w-full items-center gap-2 text-left">
                      <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-800 sm:h-14 sm:w-[68px]">
                        <img src={p.src} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.opacity = '0'; }} />
                        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-slate-700/40 to-slate-950/40 text-[10px] font-bold text-white/60">360°</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className={`truncate text-xs font-semibold ${active ? 'text-cyan-100' : 'text-slate-200'}`}>{p.name}</div>
                        <div className="mt-1 truncate text-[10px] text-slate-500">{p.fileName || `Ảnh ${index + 1}`}</div>
                      </div>
                      {active && <span className="absolute right-1.5 top-1.5 text-cyan-200"><Check size={12} /></span>}
                    </button>
                    {isEdit && !p.isDefault && (
                      <button
                        type="button"
                        aria-label={`Xóa ${p.name}`}
                        className="absolute bottom-1.5 right-1.5 rounded-md bg-black/60 p-1 text-slate-300 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
                        onClick={() => onRemovePanorama(p.id)}
                      ><Trash2 size={11} /></button>
                    )}
                  </motion.div>
                );
              })}
              {panoramas.length === 0 && (
                <div className="empty-library-state" role="status" aria-live="polite">
                  <span className="empty-library-title">Chưa có không gian</span>
                  <span className="empty-library-caption">Ảnh bạn tải lên sẽ xuất hiện tại đây</span>
                </div>
              )}
            </div>
            <button
              className="carousel-arrow"
              aria-label="Ảnh tiếp theo"
              type="button"
              disabled={currentIndex < 0 || currentIndex >= panoramas.length - 1}
              onClick={() => onSelectPanorama(panoramas[currentIndex + 1]?.id)}
            ><ChevronRight size={17} /></button>
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] uppercase tracking-[0.16em] text-slate-500">
            <span>{isEdit ? 'Design mode' : 'Live preview'}</span>
            <span className="flex items-center gap-1"><Radio size={10} /> 360° interactive environment</span>
          </div>
        </div>
          </motion.footer>
        )}
      </AnimatePresence>
      {!isEdit && (
        <motion.div
          className="pointer-events-auto mx-auto mb-1 flex w-full max-w-2xl flex-col items-center justify-between gap-3 rounded-2xl border border-emerald-200/15 bg-slate-950/65 px-4 py-3 shadow-2xl backdrop-blur-2xl sm:flex-row sm:px-5"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="live-dot shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">Live preview</div>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-200">
                {hotspots.length > 0
                  ? `Có ${hotspots.length} checkpoint · Nhấn biểu tượng “ĐI ĐẾN” trong ảnh để chuyển không gian.`
                  : 'Chưa có checkpoint ở đây · Chuyển về Design và nhấp đúp để tạo điểm di chuyển.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="secondary-button w-full shrink-0 sm:w-auto"
            onClick={onGoBack}
            disabled={!canGoBack}
            title={canGoBack ? 'Quay về panorama vừa xem' : 'Chưa có lịch sử điều hướng'}
          >
            <ArrowLeft size={15} /> Quay lại
          </button>
        </motion.div>
      )}
    </div>
  );
}
