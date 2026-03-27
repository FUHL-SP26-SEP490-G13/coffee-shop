import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import ingredientService from '../../../../services/ingredientService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';

export default function CreateIngredient({ open, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [unitType, setUnitType] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!open) {
      setName('');
      setUnitType('');
      setUnit('');
      setFieldErrors({});
    }
  }, [open]);

  const handleSubmit = async () => {
    setFieldErrors({});
    const errors = {};

    if (!name.trim()) errors.name = 'Vui lòng nhập tên nguyên liệu';
    if (!unitType.trim()) errors.unitType = 'Vui lòng nhập loại đơn vị (VD: Khối lượng, Thể tích)';
    if (!unit.trim()) errors.unit = 'Vui lòng nhập đơn vị (VD: kg, g, ml, l)';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const data = {
        name: name.trim(),
        unit_type: unitType.trim(),
        unit: unit.trim(),
      };

      const response = await ingredientService.create(data);

      if (response.success) {
        toast.success(response.message || 'Thêm nguyên liệu thành công!');
        if (onSuccess) onSuccess(response.data);
        onClose();
      }
    } catch (err) {
      console.error('Error creating ingredient:', err);
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        const errors = {};
        err.response.data.errors.forEach((error) => {
          errors[error.field] = error.message;
        });
        setFieldErrors(errors);
        return;
      } else {
        const errorMessage = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi thêm nguyên liệu';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Thêm nguyên liệu mới</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 mt-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>
              Tên nguyên liệu <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='name'
              placeholder='VD: Đường cát trắng...'
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: null }));
              }}
              disabled={loading}
              className={fieldErrors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {fieldErrors.name && (
              <p className='text-sm text-red-500'>{fieldErrors.name}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='unitType'>
              Loại đơn vị <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='unitType'
              placeholder='VD: Khối lượng, Thể tích...'
              value={unitType}
              onChange={(e) => {
                setUnitType(e.target.value);
                if (fieldErrors.unitType) setFieldErrors((prev) => ({ ...prev, unitType: null }));
              }}
              disabled={loading}
              className={fieldErrors.unitType ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {fieldErrors.unitType && (
              <p className='text-sm text-red-500'>{fieldErrors.unitType}</p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='unit'>
              Đơn vị <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='unit'
              placeholder='VD: kg, g, ml, l...'
              value={unit}
              onChange={(e) => {
                setUnit(e.target.value);
                if (fieldErrors.unit) setFieldErrors((prev) => ({ ...prev, unit: null }));
              }}
              disabled={loading}
              className={fieldErrors.unit ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {fieldErrors.unit && (
              <p className='text-sm text-red-500'>{fieldErrors.unit}</p>
            )}
          </div>

          <div className='flex justify-end gap-2 pt-4'>
            <Button variant='outline' onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
              {loading ? 'Đang thêm...' : 'Thêm nguyên liệu'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
