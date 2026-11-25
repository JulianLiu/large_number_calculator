import { useEffect, useState } from 'react';

function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => void;
  };
  return !!(
    document.fullscreenEnabled ||
    el.requestFullscreen ||
    el.webkitRequestFullscreen
  );
}

function isCurrentlyFullscreen(): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return !!(document.fullscreenElement || doc.webkitFullscreenElement);
}

export default function FullscreenButton() {
  const [supported] = useState(() => isFullscreenSupported());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(isCurrentlyFullscreen());
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange' as never, onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange' as never, onChange);
    };
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    try {
      if (isCurrentlyFullscreen()) {
        const doc = document as Document & { webkitExitFullscreen?: () => void };
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
      } else {
        const el = document.documentElement as HTMLElement & {
          webkitRequestFullscreen?: () => void;
        };
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          // iOS Safari fallback
          el.webkitRequestFullscreen();
        }
      }
    } catch {
      /* 使用者拒絕或瀏覽器限制時靜默忽略 */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isFullscreen}
      aria-label={isFullscreen ? '退出全螢幕' : '進入全螢幕'}
      title={isFullscreen ? '退出全螢幕' : '進入全螢幕'}
      className="ml-auto rounded-full border border-stone-300 bg-white/80 px-3 py-1 text-xs font-bold text-stone-700 transition hover:border-teal-700 hover:text-teal-800 active:scale-95"
    >
      {isFullscreen ? '⤢ 退出' : '⛶ 全螢幕'}
    </button>
  );
}
