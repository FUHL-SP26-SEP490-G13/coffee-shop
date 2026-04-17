import { useState, useEffect, useCallback } from 'react';
import { Coffee, Clock, Users } from 'lucide-react';
import attendanceService from '@/services/attendanceService';

// ─── Live Clock ───────────────────────────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const date = now.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="select-none">
      <div className="text-7xl font-bold tabular-nums tracking-tight text-white leading-none">
        {time}
      </div>
      <div className="text-white/70 text-lg mt-3 capitalize">{date}</div>
    </div>
  );
}

// ─── PIN dots ─────────────────────────────────────────────────────────────────
function PinDots({ length, filled, shaking }) {
  return (
    <div className={`flex items-center justify-center gap-5 ${shaking ? 'animate-[shake_0.4s_ease]' : ''}`}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          style={{ transitionDuration: '120ms' }}
          className={`rounded-full border-2 transition-all ${i < filled
            ? 'w-5 h-5 bg-primary border-primary'
            : 'w-4 h-4 bg-transparent border-muted-foreground/30'
            }`}
        />
      ))}
    </div>
  );
}

// ─── Numpad key ───────────────────────────────────────────────────────────────
function Key({ label, sub, onClick, variant = 'default', disabled }) {
  const base =
    'flex flex-col items-center justify-center rounded-2xl font-semibold transition-all duration-100 active:scale-95 select-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed';

  const styles = {
    default:
      'w-24 h-20 bg-card text-foreground border border-border hover:bg-primary/5 hover:border-primary/40 shadow-sm hover:shadow-md',
    delete:
      'w-24 h-20 bg-muted text-destructive border border-border hover:bg-destructive/10',
    clear:
      'w-24 h-20 bg-muted text-muted-foreground border border-border hover:bg-muted/60',
  };

  return (
    <button
      className={`${base} ${styles[variant]}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="text-2xl leading-none">{label}</span>
      {sub && (
        <span className="text-[10px] tracking-widest text-muted-foreground mt-0.5 uppercase">
          {sub}
        </span>
      )}
    </button>
  );
}

// ─── Result Overlay ────────────────────────────────────────────────────────────
function ResultOverlay({ result, onDismiss }) {
  const isIn = result?.type === 'check_in';
  const att = result?.attendance;
  const DURATION = 5000;

  useEffect(() => {
    const id = setTimeout(onDismiss, DURATION);
    return () => clearTimeout(id);
  }, [onDismiss]);

  const fmt = (t) =>
    t
      ? new Date(t).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      : '--:--';

  const title = isIn ? 'Check-in thành công' : 'Check-out thành công';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onDismiss}
    >
      <div
        className="bg-card rounded-2xl shadow-xl w-[360px] overflow-hidden animate-in zoom-in-95 duration-200 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-1.5 w-full ${isIn ? 'bg-green-500' : 'bg-amber-500'}`} />

        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-lg font-bold text-foreground">{title}</p>
            </div>

            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isIn
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                }`}
            >
              {isIn ? (
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              )}
            </div>
          </div>

          <div
            className={`rounded-xl border p-4 flex gap-4 ${isIn
              ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              }`}
          >
            {att?.check_in && (
              <div className="flex-1 text-center">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isIn ? 'text-green-700/60 dark:text-green-400/60' : 'text-amber-700/60 dark:text-amber-400/60'
                  }`}>
                  Check-in
                </p>
                <p className={`text-2xl font-bold tabular-nums ${isIn ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
                  }`}>
                  {fmt(att.check_in)}
                </p>
              </div>
            )}

            {att?.check_in && att?.check_out && <div className="w-px bg-border" />}

            {att?.check_out && (
              <div className="flex-1 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-amber-700/60 dark:text-amber-400/60">
                  Check-out
                </p>
                <p className="text-2xl font-bold tabular-nums text-amber-700 dark:text-amber-300">
                  {fmt(att.check_out)}
                </p>
              </div>
            )}
          </div>

          {result?.lateMinutes > 0 && (
            <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 text-center">
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                ⚠ Đi trễ {result.lateMinutes} phút
              </p>
            </div>
          )}

          <div className="mt-5 h-0.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full ${isIn ? 'bg-green-500' : 'bg-amber-500'}`}
              style={{ width: '100%', animation: `shrink ${DURATION}ms linear forwards` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Error Overlay ─────────────────────────────────────────────────────────────
function ErrorOverlay({ message, onDismiss }) {
  const DURATION = 3500;

  useEffect(() => {
    const id = setTimeout(onDismiss, DURATION);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onDismiss}
    >
      <div
        className="bg-card rounded-2xl shadow-xl w-[360px] overflow-hidden animate-in zoom-in-95 duration-200 border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-destructive" />
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-11 h-11 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-destructive mb-1">
                Điểm danh thất bại
              </p>
              <p className="text-sm text-foreground leading-relaxed">{message}</p>
            </div>
          </div>
          <div className="h-0.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-destructive opacity-50"
              style={{ width: '100%', animation: `shrink ${DURATION}ms linear forwards` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const PIN_LENGTH = 4;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_SECONDS = 30;

const NUMPAD = [
  [{ label: '1' }, { label: '2', sub: 'ABC' }, { label: '3', sub: 'DEF' }],
  [{ label: '4', sub: 'GHI' }, { label: '5', sub: 'JKL' }, { label: '6', sub: 'MNO' }],
  [{ label: '7', sub: 'PQRS' }, { label: '8', sub: 'TUV' }, { label: '9', sub: 'WXYZ' }],
  [{ label: 'C', variant: 'clear' }, { label: '0' }, { label: '⌫', variant: 'delete' }],
];

export default function Attendance() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [shaking, setShaking] = useState(false);

  const [failedCount, setFailedCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);

  const storeName = 'Coffee Shop';
  const isLocked = lockedUntil > Date.now();

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 400);
  };

  useEffect(() => {
    if (!lockedUntil) {
      setLockSecondsLeft(0);
      return;
    }

    const tick = () => {
      const remain = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockSecondsLeft(remain);

      if (remain <= 0) {
        setLockedUntil(0);
        setFailedCount(0);
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  const handleSubmit = useCallback(
    async (currentPin) => {
      if (isLocked) {
        setError(`Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau ${lockSecondsLeft} giây.`);
        triggerShake();
        setPin('');
        return;
      }

      setLoading(true);

      try {
        const res = await attendanceService.clock(currentPin);
        console.log(res);

        setFailedCount(0);

        setResult({
          ...res?.data,
          message: res?.message,
        });
      } catch (err) {
        const status = err?.response?.status;
        const message =
          err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.';

        setError(message);
        triggerShake();

        const normalizedMessage = message.toLowerCase();

        const isInvalidPinError =
          status === 404 &&
          (normalizedMessage.includes('mã pin không hợp lệ') ||
            normalizedMessage.includes('tài khoản đã bị khóa'));

        const isLockedByServer = status === 429;

        if (isLockedByServer) {
          setLockedUntil(Date.now() + LOCK_DURATION_SECONDS * 1000);
          setFailedCount(MAX_FAILED_ATTEMPTS);
        } else if (isInvalidPinError) {
          setFailedCount((prev) => {
            const next = prev + 1;

            if (next >= MAX_FAILED_ATTEMPTS) {
              setLockedUntil(Date.now() + LOCK_DURATION_SECONDS * 1000);
              return MAX_FAILED_ATTEMPTS;
            }

            return next;
          });
        }
      } finally {
        setLoading(false);
        setPin('');
      }
    },
    [isLocked, lockSecondsLeft]
  );

  const handleKey = useCallback(
    (key) => {
      if (loading || isLocked) return;

      if (key === 'C') {
        setPin('');
        return;
      }

      if (key === '⌫') {
        setPin((p) => p.slice(0, -1));
        return;
      }

      if (pin.length >= PIN_LENGTH) return;

      const next = pin + key;
      setPin(next);

      if (next.length === PIN_LENGTH) {
        handleSubmit(next);
      }
    },
    [pin, loading, isLocked, handleSubmit]
  );

  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      else if (e.key === 'Backspace') handleKey('⌫');
      else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') handleKey('C');
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  return (
    <div className="min-h-screen flex overflow-hidden bg-background">
      <div
        className="relative hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #c25e28 0%, #8a3e18 50%, #4c2210 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">{storeName}</p>
          </div>
        </div>

        <div className="relative z-10">
          <LiveClock />
          <div className="mt-10 flex flex-col gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/15">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Điểm danh ca làm việc</p>
                <p className="text-white/60 text-sm">Nhập mã PIN 4 chữ số của bạn</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/15">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Check-in / Check-out tự động</p>
                <p className="text-white/60 text-sm">Hệ thống tự nhận diện trạng thái ca</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white/40 text-xs">
            © {new Date().getFullYear()} {storeName}. Phần mềm quản lý nội bộ.
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 bg-background">
        <div className="flex lg:hidden items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Coffee className="w-5 h-5 text-primary" />
          </div>
          <span className="font-bold text-foreground">{storeName}</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Điểm danh</h1>
            <p className="text-muted-foreground mt-2">
              Nhập mã PIN 4 chữ số để check-in hoặc check-out
            </p>
          </div>

          <div className="mb-8 bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Mã PIN</span>
              {pin.length > 0 && !isLocked && (
                <button
                  onClick={() => setPin('')}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            <PinDots length={PIN_LENGTH} filled={pin.length} shaking={shaking} />

            {loading && (
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Đang xử lý...</span>
              </div>
            )}

            {!loading && isLocked && (
              <div className="mt-4 text-center">
                <p className="text-sm font-medium text-destructive">
                  Bạn đã nhập sai quá 5 lần. Thử lại sau {lockSecondsLeft}s
                </p>
              </div>
            )}

            {/* {!loading && !isLocked && failedCount > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Đã nhập sai {failedCount}/{MAX_FAILED_ATTEMPTS} lần
                </p>
              </div>
            )} */}
          </div>

          <div className="grid grid-cols-3 gap-3 justify-items-center">
            {NUMPAD.flat().map(({ label, sub, variant }) => (
              <Key
                key={label}
                label={label}
                sub={sub}
                variant={variant || 'default'}
                disabled={loading || isLocked}
                onClick={() => handleKey(label)}
              />
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground/50 mt-8">
            Hỗ trợ bàn phím số · Backspace để xóa · Esc để reset
          </p>
        </div>
      </div>

      {result && <ResultOverlay result={result} onDismiss={() => setResult(null)} />}
      {error && <ErrorOverlay message={error} onDismiss={() => setError(null)} />}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}