import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../../../../components/ui/dialog';
import shiftService from '../../../../../services/shiftService';
import shiftTemplateService from '../../../../../services/shiftTemplateService';
import userService from '../../../../../services/userService';

const DAY_OPTIONS = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
];

const EMPTY_ASSIGNMENT = () => ({ user_id: '', template_id: '', days_of_week: [] });

export default function AssignBulkModal({ open, onClose, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [weeks, setWeeks] = useState(1);
  const [assignments, setAssignments] = useState([EMPTY_ASSIGNMENT()]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStartDate('');
    setWeeks(1);
    setAssignments([EMPTY_ASSIGNMENT()]);
    setErrors({});

    Promise.all([
      userService.getStaff(),
      shiftTemplateService.getAll(),
    ]).then(([staffRes, tplRes]) => {
      const raw = staffRes?.data;
      const userList = Array.isArray(raw) ? raw : (raw?.users || raw?.data || []);
      setUsers(userList);
      const tplList = tplRes?.data?.data || tplRes?.data || [];
      setTemplates(Array.isArray(tplList) ? tplList : []);
    }).catch(() => {
      toast.error('Không thể tải dữ liệu');
    });
  }, [open]);

  const addRow = () => setAssignments((a) => [...a, EMPTY_ASSIGNMENT()]);
  const removeRow = (i) => setAssignments((a) => a.filter((_, idx) => idx !== i));

  const updateRow = (i, field, value) => {
    setAssignments((a) => a.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  };

  const toggleDay = (i, day) => {
    setAssignments((a) => a.map((row, idx) => {
      if (idx !== i) return row;
      const days = row.days_of_week.includes(day)
        ? row.days_of_week.filter((d) => d !== day)
        : [...row.days_of_week, day];
      return { ...row, days_of_week: days };
    }));
  };

  // Helper: check 2 khoảng thời gian có overlap không (xử lý ca qua đêm)
  const timeToMin = (t) => {
    const [h, m] = String(t).slice(0, 5).split(':').map(Number);
    return h * 60 + m;
  };

  const isTimeOverlap = (startA, endA, startB, endB) => {
    const splitRanges = (s, e) => {
      const sm = timeToMin(s), em = timeToMin(e);
      return em > sm ? [[sm, em]] : [[sm, 1440], [0, em]];
    };
    const rA = splitRanges(startA, endA);
    const rB = splitRanges(startB, endB);
    for (const [aS, aE] of rA)
      for (const [bS, bE] of rB)
        if (aS < bE && aE > bS) return true;
    return false;
  };

  const validate = () => {
    const e = {};
    if (!startDate) e.startDate = 'Chọn ngày bắt đầu';
    if (!weeks || weeks < 1 || weeks > 12) e.weeks = 'Số tuần phải từ 1–12';
    assignments.forEach((a, i) => {
      if (!a.user_id) e[`user_${i}`] = 'Chọn nhân viên';
      if (!a.template_id) e[`tpl_${i}`] = 'Chọn ca';
      if (!a.days_of_week.length) e[`days_${i}`] = 'Chọn ít nhất 1 ngày';
    });

    // Check trùng / overlap giữa các dòng trong cùng batch
    if (!Object.keys(e).length && templates.length > 0) {
      for (let i = 0; i < assignments.length; i++) {
        const a = assignments[i];
        if (!a.user_id || !a.template_id || !a.days_of_week.length) continue;
        const tplA = templates.find((t) => String(t.id) === String(a.template_id));
        if (!tplA) continue;

        for (let j = i + 1; j < assignments.length; j++) {
          const b = assignments[j];
          if (!b.user_id || !b.template_id || !b.days_of_week.length) continue;
          // Chỉ check khi cùng user
          if (String(a.user_id) !== String(b.user_id)) continue;

          // Tìm các ngày trong tuần chung giữa 2 dòng
          const commonDays = a.days_of_week.filter((d) => b.days_of_week.includes(d));
          if (commonDays.length === 0) continue;

          const tplB = templates.find((t) => String(t.id) === String(b.template_id));
          if (!tplB) continue;

          const dayLabels = { 0: 'CN', 1: 'T2', 2: 'T3', 3: 'T4', 4: 'T5', 5: 'T6', 6: 'T7' };
          const commonDayStr = commonDays.map((d) => dayLabels[d]).join(', ');

          // Cùng template = duplicate
          if (String(a.template_id) === String(b.template_id)) {
            e[`dup_${i}_${j}`] = `Dòng ${i + 1} và ${j + 1}: cùng nhân viên, cùng "${tplA.name}" vào ${commonDayStr}`;
            continue;
          }

          // Khác template → check overlap giờ
          if (isTimeOverlap(tplA.start_time, tplA.end_time, tplB.start_time, tplB.end_time)) {
            e[`overlap_${i}_${j}`] = `Dòng ${i + 1} và ${j + 1}: cùng nhân viên,"${tplA.name}" trùng giờ với "${tplB.name}" vào ${commonDayStr}`;
          }
        }
      }
    }

    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      const res = await shiftService.assignBulk({
        start_date: startDate,
        weeks: Number(weeks),
        assignments: assignments.map((a) => ({
          user_id: Number(a.user_id),
          template_id: Number(a.template_id),
          days_of_week: a.days_of_week,
        })),
      });

      // console.log(res.data);
      const { total } = res?.data || {};
      toast.success(`Gán thành công ${total ?? '?'} ca`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gán ca thất bại');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (t) => t?.slice(0, 5) || '';

  const selectCls = (hasErr) =>
    `flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring ${hasErr ? 'border-red-500' : 'border-input'}`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gán ca hàng loạt theo tuần</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Ngày bắt đầu + số tuần */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Ngày bắt đầu <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Số tuần <span className="text-red-500">*</span> <span className="text-muted-foreground font-normal">(1–12)</span></Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={weeks}
                onChange={(e) => setWeeks(e.target.value)}
                className={errors.weeks ? 'border-red-500' : ''}
              />
              {errors.weeks && <p className="text-xs text-red-500">{errors.weeks}</p>}
            </div>
          </div>

          {/* Danh sách assignment rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Danh sách phân ca</Label>
              <Button variant="outline" size="sm" onClick={addRow} className="gap-1.5 text-xs h-8">
                <Plus className="w-3.5 h-3.5" /> Thêm dòng
              </Button>
            </div>

            {assignments.map((row, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-3 relative">
                {assignments.length > 1 && (
                  <button
                    onClick={() => removeRow(i)}
                    className="absolute top-3 right-3 p-1 rounded-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* Nhân viên */}
                  <div className="space-y-1">
                    <Label className="text-xs">Nhân viên <span className="text-red-500">*</span></Label>
                    <select
                      value={row.user_id}
                      onChange={(e) => updateRow(i, 'user_id', e.target.value)}
                      className={selectCls(errors[`user_${i}`])}
                    >
                      <option value="">-- Chọn nhân viên --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.first_name} {u.last_name}
                        </option>
                      ))}
                    </select>
                    {errors[`user_${i}`] && <p className="text-xs text-red-500">{errors[`user_${i}`]}</p>}
                  </div>

                  {/* Ca làm việc */}
                  <div className="space-y-1">
                    <Label className="text-xs">Ca làm việc <span className="text-red-500">*</span></Label>
                    <select
                      value={row.template_id}
                      onChange={(e) => updateRow(i, 'template_id', e.target.value)}
                      className={selectCls(errors[`tpl_${i}`])}
                    >
                      <option value="">-- Chọn ca --</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({formatTime(t.start_time)}–{formatTime(t.end_time)})
                        </option>
                      ))}
                    </select>
                    {errors[`tpl_${i}`] && <p className="text-xs text-red-500">{errors[`tpl_${i}`]}</p>}
                  </div>
                </div>

                {/* Ngày trong tuần */}
                <div className="space-y-1">
                  <Label className="text-xs">Ngày trong tuần <span className="text-red-500">*</span></Label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAY_OPTIONS.map(({ value, label }) => {
                      const active = row.days_of_week.includes(value);
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => toggleDay(i, value)}
                          className={`w-9 h-9 rounded-lg text-xs font-semibold border transition-all
                            ${active
                              ? 'bg-primary text-white border-primary'
                              : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                            }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                  {errors[`days_${i}`] && <p className="text-xs text-red-500">{errors[`days_${i}`]}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Hiển thị lỗi trùng/overlap giữa các dòng */}
          {Object.entries(errors)
            .filter(([k]) => k.startsWith('dup_') || k.startsWith('overlap_'))
            .length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-1">
                {Object.entries(errors)
                  .filter(([k]) => k.startsWith('dup_') || k.startsWith('overlap_'))
                  .map(([k, v]) => (
                    <p key={k} className="text-xs text-red-600 font-medium">⚠ {v}</p>
                  ))}
              </div>
            )}

          <div className="flex justify-end gap-2 pt-1 border-t">
            <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang gán...' : `Gán ${assignments.length} dòng × ${weeks} tuần`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
