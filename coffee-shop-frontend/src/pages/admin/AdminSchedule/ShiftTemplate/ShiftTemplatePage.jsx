import { useState, useEffect } from 'react';
import { Clock, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '../../../../components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '../../../../components/ui/alert-dialog';
import { TimePicker, TimeRangePreview } from '../../../../components/ui/time-picker';
import shiftTemplateService from '../../../../services/shiftTemplateService';

const COLOR_OPTIONS = [
  { value: 'red', label: 'Đỏ', bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
  { value: 'orange', label: 'Cam', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  { value: 'yellow', label: 'Vàng', bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  { value: 'green', label: 'Xanh lá', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  { value: 'emerald', label: 'Xanh ngọc', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { value: 'teal', label: 'Xanh teal', bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500' },
  { value: 'blue', label: 'Xanh dương', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  { value: 'indigo', label: 'Indigo', bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  { value: 'purple', label: 'Tím', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
];

const getColorClass = (v) => COLOR_OPTIONS.find((c) => c.value === v) || COLOR_OPTIONS[0];
const formatTime = (t) => t?.slice(0, 5) || '';

export default function ShiftTemplatePage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: '', start_time: '', end_time: '', color: 'blue' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const usedColors = templates.map(t => t.color);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await shiftTemplateService.getAll();
      setTemplates(res?.data?.data || res?.data || []);
    } catch {
      toast.error('Không thể tải danh sách ca làm việc');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    // Tự chọn màu đầu tiên chưa bị dùng
    const firstAvailable = COLOR_OPTIONS.find((c) => !usedColors.includes(c.value));
    setForm({ name: '', start_time: '', end_time: '', color: firstAvailable?.value || 'blue' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (tpl) => {
    setEditTarget(tpl);
    setForm({
      name: tpl.name,
      start_time: tpl.start_time?.slice(0, 5) ?? '',  // HH:MM:SS → HH:MM
      end_time: tpl.end_time?.slice(0, 5) ?? '',
      color: tpl.color || 'blue',
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên ca';
    if (!form.start_time) e.start_time = 'Chọn giờ bắt đầu';
    if (!form.end_time) e.end_time = 'Chọn giờ kết thúc';
    if (Object.keys(e).length) { setErrors(e); return; }

    try {
      setSaving(true);
      if (editTarget) {
        await shiftTemplateService.update(editTarget.id, form);
        toast.success('Cập nhật ca làm việc thành công');
      } else {
        await shiftTemplateService.create(form);
        toast.success('Tạo ca làm việc thành công');
      }
      setModalOpen(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await shiftTemplateService.delete(deleteTarget.id);
      toast.success(`Xóa ca làm thành công"`);
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Không thể xóa ca này');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý ca làm</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Thiết lập các ca làm việc cho quán</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Thêm ca mới
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Clock className="w-12 h-12 opacity-30" />
          <p className="text-sm">Chưa có ca làm việc nào. Hãy tạo ca đầu tiên!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const color = getColorClass(tpl.color);
            const [sh, sm] = tpl.start_time.split(':').map(Number);
            const [eh, em] = tpl.end_time.split(':').map(Number);
            const mins = (eh * 60 + em) - (sh * 60 + sm);
            return (
              <div key={tpl.id} className="rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow p-5 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${color.dot}`} />
                    <span className="font-semibold text-base">{tpl.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEdit(tpl)} className="p-1.5 rounded-md hover:bg-secondary transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => setDeleteTarget(tpl)} className="p-1.5 rounded-md hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${color.bg} ${color.text}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(tpl.start_time)} – {formatTime(tpl.end_time)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Thời lượng: {Math.floor(mins / 60)}h{mins % 60 > 0 ? `${mins % 60}p` : ''}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Cập nhật ca làm việc' : 'Thêm ca làm việc mới'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Tên ca <span className="text-red-500">*</span></Label>
              <Input
                placeholder="VD: Ca Sáng, Ca Chiều..."
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((e2) => ({ ...e2, name: null })); }}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Giờ bắt đầu <span className="text-red-500">*</span></Label>
                <TimePicker
                  id="start-time-picker"
                  value={form.start_time}
                  onChange={(v) => { setForm((f) => ({ ...f, start_time: v })); setErrors((e2) => ({ ...e2, start_time: null })); }}
                  error={errors.start_time}
                />
                {errors.start_time && <p className="text-xs text-red-500">{errors.start_time}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Giờ kết thúc <span className="text-red-500">*</span></Label>
                <TimePicker
                  id="end-time-picker"
                  value={form.end_time}
                  onChange={(v) => { setForm((f) => ({ ...f, end_time: v })); setErrors((e2) => ({ ...e2, end_time: null })); }}
                  error={errors.end_time}
                />
                {errors.end_time && <p className="text-xs text-red-500">{errors.end_time}</p>}
              </div>
            </div>

            {/* Visual timeline preview */}
            <TimeRangePreview
              startTime={form.start_time}
              endTime={form.end_time}
              color={form.color}
            />

            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((c) => {
                  const isUsed = usedColors.includes(c.value) && c.value !== form.color;
                  const isSelected = form.color === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      disabled={isUsed}
                      title={isUsed ? 'Màu này đã được dùng cho ca khác' : c.label}
                      onClick={() => setForm((f) => ({ ...f, color: c.value }))}
                      className={[
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
                        isSelected
                          ? `${c.bg} ${c.text} border-current ring-2 ring-offset-1 ring-current/40`
                          : 'border-border text-muted-foreground hover:border-current',
                        isUsed ? 'opacity-30 cursor-not-allowed line-through' : 'cursor-pointer',
                      ].join(' ')}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>



            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>Hủy</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : editTarget ? 'Cập nhật' : 'Tạo ca'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa ca làm việc</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa ca <strong>"{deleteTarget?.name}"</strong>? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
