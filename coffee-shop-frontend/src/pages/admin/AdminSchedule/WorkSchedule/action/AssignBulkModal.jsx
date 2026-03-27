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

  const validate = () => {
    const e = {};
    if (!startDate) e.startDate = 'Chọn ngày bắt đầu';
    if (!weeks || weeks < 1 || weeks > 12) e.weeks = 'Số tuần phải từ 1–12';
    assignments.forEach((a, i) => {
      if (!a.user_id) e[`user_${i}`] = 'Chọn nhân viên';
      if (!a.template_id) e[`tpl_${i}`] = 'Chọn ca';
      if (!a.days_of_week.length) e[`days_${i}`] = 'Chọn ít nhất 1 ngày';
    });
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
      const { total } = res?.data?.data || {};
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
