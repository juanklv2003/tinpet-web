import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { CircleNotch } from '@phosphor-icons/react';
import { useTranslation } from '../../../i18n/useTranslation';

interface PetPhotoCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onConfirm: (croppedBlob: Blob) => void;
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx?.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise<Blob>((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else resolve(new Blob());
      },
      'image/jpeg',
      0.92,
    );
  });
}

export function PetPhotoCropModal({ imageSrc, onCancel, onConfirm }: PetPhotoCropModalProps) {
  const t = useTranslation();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [previewSrc, setPreviewSrc] = useState(imageSrc);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, cropped: Area) => {
    setCroppedAreaPixels(cropped);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const updatePreview = async () => {
      if (!croppedAreaPixels) {
        setPreviewSrc(imageSrc);
        return;
      }

      try {
        const image = await createImage(imageSrc);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = 720;
        canvas.height = 720;
        context.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          canvas.width,
          canvas.height,
        );

        if (!cancelled) {
          setPreviewSrc(canvas.toDataURL('image/jpeg', 0.92));
        }
      } catch {
        if (!cancelled) {
          setPreviewSrc(imageSrc);
        }
      }
    };

    void updatePreview();

    return () => {
      cancelled = true;
    };
  }, [croppedAreaPixels, imageSrc]);

  const handleConfirm = async () => {
    if (!croppedAreaPixels || saving) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      setSaving(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl max-h-[calc(100vh-2rem)] overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('pets.crop.title') || 'Adjust pet photo'}
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {t('pets.crop.hint') || 'Drag and use zoom to frame the photo as it will appear in the mobile card.'}
            </p>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
          <div className="relative h-[24rem] bg-slate-900">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="rect"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-700 dark:bg-slate-950/50 lg:border-t-0 lg:border-l">
            <div className="mb-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                {t('pets.crop.previewTitle') || 'Mobile card preview'}
              </p>
            </div>

            <div className="mx-auto w-full max-w-[20rem] overflow-hidden rounded-[2.5rem] border border-stone-200/70 bg-white shadow-[0_28px_60px_-24px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between px-5 pt-6 pb-3">
                <div className="flex items-center gap-2 text-brand font-black text-lg">
                  <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                    <span className="text-base">T</span>
                  </div>
                  <span>{t('pets.crop.appName') || 'TinPet'}</span>
                </div>
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  {t('pets.crop.photoCounter') || '1 / 1'}
                </span>
              </div>

              <div className="mx-4 overflow-hidden rounded-[1.75rem] bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="relative aspect-[0.82/1] overflow-hidden">
                  <img src={previewSrc} alt={t('pets.crop.previewAlt') || 'Vista previa'} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                  <div className="absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm">
                    <span className="text-sm font-black">⋯</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 px-5 py-5">
                <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-red-500 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <span className="text-xl leading-none">{t('pets.crop.reject') || '×'}</span>
                </button>
                <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-emerald-500 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <span className="text-lg leading-none">{t('pets.crop.like') || '♥'}</span>
                </button>
              </div>

              <div className="h-16 bg-brand flex items-center justify-around text-white px-4">
                <span className="h-2 w-2 rounded-full bg-brand-cream" />
                <span className="h-2 w-2 rounded-full bg-white/70" />
                <span className="h-2 w-2 rounded-full bg-white/70" />
                <span className="h-2 w-2 rounded-full bg-white/70" />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <label className="block flex-1">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {t('pets.crop.zoom') || 'Zoom'}
                </span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-brand"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving || !croppedAreaPixels}
                className="flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-brand/20 transition-colors hover:bg-brand-dark disabled:opacity-40"
              >
                {saving ? <CircleNotch size={16} className="animate-spin" /> : null}
                {saving ? (t('pets.crop.saving') || 'Saving...') : (t('pets.crop.confirm') || 'Confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
}