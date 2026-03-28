import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../../../../components/ui/dialog';
import shiftService from '../../../../../services/shiftService';
import shiftTemplateService from '../../../../../services/shiftTemplateService';
import userService from '../../../../../services/userService';

export default function AssignSingleModal({ open, onClose, onSuccess, defaultDate = '' }) {
  const [users, setUsers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ date: defaultDate, user_id: '', template_id: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load users + templates khi mở modal
  useEffect(() => {
    if (!open) return;
    setForm({ date: defaultDate, user_id: '', template_id: '' });
    setErrors({});

    Promise.all([
      userService.getStaff(),
      shiftTemplateService.getAll(),
    ]).then(([staffRes, tplRes]) => {
      // getStaff trả { data: { users: [...] } } hoặc { data: [...] }
      const raw = staffRes?.data;
      const userList = Array.isArray(raw) ? raw : (raw?.users || raw?.data || []);
      setUsers(userList);

      const tplList = tplRes?.data?.data || tplRes?.data || [];
      setTemplates(Array.isArray(tplList) ? tplList : []);
    }).catch(() => {
      toast.error('Không thể tải dữ liệu');
    });
  }, [open, defaultDate]);

  const validate = () => {
    const e = {};
    if (!form.date) e.date = 'Chọn ngày';
    if (!form.user_id) e.user_id = 'Chọn nhân viên';
    if (!form.template_id) e.template_id = 'Chọn ca làm việc';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await shiftService.assignSingle({
        date: form.date,
        user_id: Number(form.user_id),
        template_id: Number(form.template_id),
      });
      toast.success('Gán ca thành công');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Gán ca thất bại');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (t) => t?.slice(0, 5) || '';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gán ca – 1 nhân viên</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Ngày */}
          <div className="space-y-1.5">
            <Label>Ngày làm việc <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className={errors.date ? 'border-red-500' : ''}
            />
            {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
          </div>

          {/* Nhân viên */}
          <div className="space-y-1.5">
            <Label>Nhân viên <span className="text-red-500">*</span></Label>
            <select
              value={form.user_id}
              onChange={(e) => setForm((f) => ({ ...f, user_id: e.target.value }))}
              className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${errors.user_id ? 'border-red-500' : 'border-input'}`}
            >
              <option value="">-- Chọn nhân viên --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} {u.role_name ? `(${u.role_name})` : ''}
                </option>
              ))}
            </select>
            {errors.user_id && <p className="text-xs text-red-500">{errors.user_id}</p>}
          </div>

          {/* Ca làm việc */}
          <div className="space-y-1.5">
            <Label>Ca làm việc <span className="text-red-500">*</span></Label>
            <select
              value={form.template_id}
              onChange={(e) => setForm((f) => ({ ...f, template_id: e.target.value }))}
              className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${errors.template_id ? 'border-red-500' : 'border-input'}`}
            >
              <option value="">-- Chọn ca --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({formatTime(t.start_time)} – {formatTime(t.end_time)})
                </option>
              ))}
            </select>
            {errors.template_id && <p className="text-xs text-red-500">{errors.template_id}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Hủy</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Đang gán...' : 'Gán ca'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
