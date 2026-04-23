import { useMemo } from 'react';
import { Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

const HOURS = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, '0'),
);
const MINUTES = ['00', '15', '30', '45'];

/**
 * TimePicker – bộ chọn giờ gồm 2 dropdown Giờ + Phút.
 * value: string "HH:MM" hoặc ""
 * onChange(value: string): void
 */
export function TimePicker({ value = '', onChange, error, disabled, id }) {
  const [hour, minute] = useMemo(() => {
    if (!value) return ['', ''];
    const [h, m] = value.split(':');
    return [h || '', m || ''];
  }, [value]);

  const handleHour = (h) => {
    const m = minute || '00';
    onChange?.(`${h}:${m}`);
  };

  const handleMinute = (m) => {
    const h = hour || '06';
    onChange?.(`${h}:${m}`);
  };

  return (
    <div className="flex items-center gap-1.5" id={id}>
      {/* Hour select */}
      <Select value={hour} onValueChange={handleHour} disabled={disabled}>
        <SelectTrigger
          className={`w-[72px] text-sm font-mono ${error ? 'border-red-500' : ''}`}
        >
          <SelectValue placeholder="Giờ" />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="max-h-[240px] overflow-y-auto"
        >
          {HOURS.map((h) => (
            <SelectItem key={h} value={h} className="font-mono">
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-lg font-bold text-muted-foreground select-none">
        :
      </span>

      {/* Minute select */}
      <Select value={minute} onValueChange={handleMinute} disabled={disabled}>
        <SelectTrigger
          className={`w-[72px] text-sm font-mono ${error ? 'border-red-500' : ''}`}
        >
          <SelectValue placeholder="Phút" />
        </SelectTrigger>
        <SelectContent position="popper">
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m} className="font-mono">
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * TimeRangePreview – hiển thị visual bar khung giờ đã chọn + thời lượng.
 * Hỗ trợ ca đêm qua ngày (end < start).
 */
export function TimeRangePreview({ startTime, endTime, color }) {
  const toMin = (t) => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const startMin = toMin(startTime);
  const endMin = toMin(endTime);
  const isValid = startMin !== null && endMin !== null;

  // Ca qua đêm: end_time < start_time (VD: 22:00 → 02:00)
  const isOvernight = isValid && endMin <= startMin;
  const duration = isValid
    ? isOvernight
      ? 24 * 60 - startMin + endMin   // qua ngày hôm sau
      : endMin - startMin
    : 0;
  const durationH = Math.floor(duration / 60);
  const durationM = duration % 60;

  // Timeline toàn bộ 24h: 00:00 → 24:00
  const TIMELINE_START = 0;
  const TIMELINE_RANGE = 24 * 60; // 1440 phút

  // Tính vị trí & chiều rộng bar (% của 24h)
  const leftPct  = isValid ? (startMin / TIMELINE_RANGE) * 100 : 0;
  const widthPct = isValid ? (duration  / TIMELINE_RANGE) * 100 : 0;

  const colorMap = {
    red:     'bg-red-400',
    orange:  'bg-orange-400',
    yellow:  'bg-yellow-400',
    green:   'bg-green-400',
    emerald: 'bg-emerald-400',
    teal:    'bg-teal-400',
    blue:    'bg-blue-400',
    indigo:  'bg-indigo-400',
    purple:  'bg-purple-400',
  };
  const barColor = colorMap[color] || 'bg-blue-400';

  // Mốc giờ hiển thị
  const markers = [0, 3, 6, 9, 12, 15, 18, 21, 24];

  return (
    <div className="space-y-2">
      {/* Duration label */}
      {isValid && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Thời lượng:</span>
          <span className="font-semibold">
            {startTime} – {endTime}
          </span>
          {isOvernight && (
            <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
              🌙 Qua đêm
            </span>
          )}
          <span className="text-muted-foreground">
            ({durationH > 0 ? `${durationH} tiếng` : ''}
            {durationM > 0 ? ` ${durationM} phút` : ''})
          </span>
        </div>
      )}

      {/* Visual timeline */}
      <div className="relative">
        <div className="h-3 rounded-full bg-muted/60 relative overflow-hidden">
          {isValid && !isOvernight && (
            /* Ca bình thường: 1 đoạn liên tục */
            <div
              className={`absolute top-0 h-full rounded-full ${barColor} transition-all duration-300 ease-out`}
              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            />
          )}
          {isValid && isOvernight && (
            /* Ca đêm: 2 đoạn — từ start → 24:00 và 00:00 → end */
            <>
              <div
                className={`absolute top-0 h-full rounded-l-full ${barColor} transition-all duration-300 ease-out`}
                style={{ left: `${leftPct}%`, width: `${((TIMELINE_RANGE - startMin) / TIMELINE_RANGE) * 100}%` }}
              />
              <div
                className={`absolute top-0 h-full rounded-r-full ${barColor} transition-all duration-300 ease-out`}
                style={{ left: '0%', width: `${(endMin / TIMELINE_RANGE) * 100}%` }}
              />
            </>
          )}
        </div>
        {/* Time markers */}
        <div className="relative h-4 mt-0.5">
          {markers.map((h) => {
            const pct = (h * 60 / TIMELINE_RANGE) * 100;
            return (
              <span
                key={h}
                className="absolute text-[10px] text-muted-foreground/60 -translate-x-1/2 select-none"
                style={{ left: `${pct}%` }}
              >
                {h === 24 ? '0h' : `${h}h`}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
