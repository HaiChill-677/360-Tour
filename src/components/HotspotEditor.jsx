import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, MapPin, Trash2, X } from 'lucide-react';
import { HOTSPOT_ICONS } from '../data/defaultPanoramas.js';

export default function HotspotEditor({
  open,
  initialHotspot,
  panoramas,
  currentPanoramaId,
  onSave,
  onDelete,
  onClose,
}) {
  const [name, setName] = useState('Điểm tham quan mới');
  const [icon, setIcon] = useState('⌖');
  const [targetId, setTargetId] = useState('');
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const availableTargets = useMemo(
    () => panoramas.filter((panorama) => panorama.id !== currentPanoramaId),
    [panoramas, currentPanoramaId],
  );
  const firstTargetId = availableTargets[0]?.id ?? '';
  const selectedTargetExists = availableTargets.some((panorama) => panorama.id === targetId);
  const canSave = name.trim().length > 0 && selectedTargetExists;

  useEffect(() => {
    if (!open) return;
    setName(initialHotspot?.name ?? 'Điểm tham quan mới');
    setIcon(initialHotspot?.icon ?? '⌖');
    setTargetId(initialHotspot?.targetId ?? firstTargetId);
    setAttemptedSubmit(false);
  }, [
    open,
    initialHotspot?.id,
    initialHotspot?.name,
    initialHotspot?.icon,
    initialHotspot?.targetId,
    firstTargetId,
  ]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setAttemptedSubmit(true);
    if (!canSave) return;

    onSave({
      id: initialHotspot?.id,
      name: name.trim(),
      icon,
      targetId,
      position: initialHotspot?.position,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Đóng hộp thoại"
            className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* The outer flex layer centers the dialog without transform utilities,
              so Framer Motion cannot override the centering transform. */}
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-5">
            <motion.form
              role="dialog"
              aria-modal="true"
              aria-labelledby="hotspot-editor-title"
              className="glass-panel pointer-events-auto my-auto flex max-h-[min(92dvh,820px)] w-full max-w-[460px] flex-col overflow-hidden"
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              onSubmit={handleSubmit}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
                <div className="min-w-0">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                    <MapPin size={19} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/70">
                    {initialHotspot ? 'Checkpoint settings' : 'New checkpoint'}
                  </div>
                  <h2 id="hotspot-editor-title" className="mt-1 text-xl font-semibold text-white sm:text-2xl">
                    {initialHotspot ? 'Chỉnh sửa checkpoint' : 'Tạo checkpoint'}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
                    Đặt tên, chọn biểu tượng và không gian mà điểm này sẽ mở.
                  </p>
                </div>
                <button className="icon-button shrink-0" type="button" onClick={onClose} aria-label="Đóng">
                  <X size={18} />
                </button>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                <label className="block">
                  <span className="field-label">1. Tên điểm đến</span>
                  <input
                    className="glass-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={48}
                    placeholder="Ví dụ: Sảnh chính"
                    autoFocus
                  />
                  {attemptedSubmit && !name.trim() && (
                    <span className="mt-1.5 block text-xs text-rose-300">Vui lòng nhập tên cho checkpoint.</span>
                  )}
                </label>

                <div>
                  <span className="field-label">2. Chọn biểu tượng</span>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {HOTSPOT_ICONS.map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        title={item.label}
                        aria-label={item.label}
                        aria-pressed={icon === item.value}
                        onClick={() => setIcon(item.value)}
                        className={`flex h-12 items-center justify-center rounded-xl border text-xl transition ${
                          icon === item.value
                            ? 'border-cyan-300/70 bg-cyan-300/15 text-cyan-100 shadow-glow'
                            : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-white/25 hover:bg-white/10'
                        }`}
                      >
                        {item.value}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block">
                  <span className="field-label">3. Liên kết đến panorama</span>
                  <select
                    className="glass-input"
                    value={targetId}
                    onChange={(event) => setTargetId(event.target.value)}
                    disabled={availableTargets.length === 0}
                  >
                    <option value="">Chọn không gian đích...</option>
                    {availableTargets.map((panorama) => (
                      <option value={panorama.id} key={panorama.id}>
                        {panorama.name} · {panorama.fileName || 'Ảnh đã tải lên'}
                      </option>
                    ))}
                  </select>
                  {availableTargets.length === 0 ? (
                    <span className="mt-1.5 block text-xs leading-relaxed text-amber-200">
                      Cần có ít nhất hai panorama. Hãy tải thêm một ảnh trước khi tạo checkpoint di chuyển.
                    </span>
                  ) : attemptedSubmit && !selectedTargetExists ? (
                    <span className="mt-1.5 block text-xs text-rose-300">Vui lòng chọn một panorama đích hợp lệ.</span>
                  ) : null}
                </label>

                <div className="rounded-xl border border-cyan-300/10 bg-cyan-300/[0.055] p-3 text-xs leading-relaxed text-cyan-100/75">
                  Vị trí 3D được lưu theo tọa độ X, Y, Z trên mặt cầu. Trong Preview, người xem chỉ cần nhấp vào checkpoint này để mở panorama đích.
                </div>
              </div>

              <div className="border-t border-white/[0.08] bg-slate-950/25 px-5 py-4 sm:px-6">
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {initialHotspot ? (
                    <button type="button" className="danger-button w-full sm:w-auto" onClick={() => onDelete(initialHotspot.id)}>
                      <Trash2 size={15} /> Xóa checkpoint
                    </button>
                  ) : (
                    <span className="hidden text-[11px] text-slate-500 sm:block">Bước cuối: xác nhận tạo điểm đến</span>
                  )}
                  <div className="flex w-full gap-2 sm:w-auto">
                    <button type="button" className="secondary-button flex-1 sm:flex-none" onClick={onClose}>
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="primary-button flex-1 sm:min-w-[190px]"
                      disabled={!canSave}
                    >
                      <Check size={16} />
                      {initialHotspot ? 'Lưu thay đổi' : 'Tạo checkpoint'}
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
                {!canSave && availableTargets.length > 0 && (
                  <p className="mt-2 text-center text-[10px] text-slate-500">
                    Nhập tên và chọn panorama đích để bật nút xác nhận.
                  </p>
                )}
              </div>
            </motion.form>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
