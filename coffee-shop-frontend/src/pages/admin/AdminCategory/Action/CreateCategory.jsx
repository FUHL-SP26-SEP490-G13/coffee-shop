import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import categoryService from '../../../../services/categoryService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';

export default function CreateCategory({ open, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  //  State lưu lỗi của từng field
  const [fieldErrors, setFieldErrors] = useState({});

  // Reset khi đóng modal
  useEffect(() => {
    if (!open) {
      setName('');
      setCode('');
      setType('');
      setImage(null);
      setPreview(null);
      setFieldErrors({});
    }
  }, [open]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({
        ...prev,
        image: 'Vui lòng chọn file hình ảnh',
      }));
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        image: 'Kích thước ảnh tối đa 5MB',
      }));
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
    // Clear error khi chọn ảnh hợp lệ
    setFieldErrors((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async () => {
    // Reset errors trước khi validate
    setFieldErrors({});

    // Client-side validation
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Vui lòng nhập tên danh mục';
    } else if (name.trim().length < 2) {
      errors.name = 'Tên danh mục phải có ít nhất 2 ký tự';
    } else if (name.trim().length > 100) {
      errors.name = 'Tên danh mục không được vượt quá 100 ký tự';
    }

    const codePattern = /^[A-Z]{1,5}-[0-9]{1,5}$/;

    if (!code.trim()) {
      errors.code = 'Vui lòng nhập mã code';
    } else if (!codePattern.test(code.trim().toUpperCase())) {
      errors.code = 'Code phải có định dạng: CHỮ HOA - SỐ (VD: CF-001)';
    }

    // Nếu có lỗi client-side, hiển thị ngay
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', name.trim());

      formData.append('code', code.trim().toUpperCase());
      
      if (type.trim()) {
        formData.append('type', type.trim());
      }

      if (image) {
        formData.append('image', image);
      }

      const response = await categoryService.create(formData);

      if (response.success) {
        toast.success(response.message || 'Tạo danh mục thành công!');

        if (onSuccess) {
          onSuccess(response.data);
        }

        onClose();
      }
    } catch (err) {
      console.error('Error creating category:', err);

      // Xử lý validation errors từ BE
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        const errors = {};
        err.response.data.errors.forEach((error) => {
          errors[error.field] = error.message;
        });
        setFieldErrors(errors);
        return;
      } else {
        // Lỗi thông thường (500, network, etc.)
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          'Có lỗi xảy ra khi tạo danh mục';

        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Thêm danh mục mới</DialogTitle>
        </DialogHeader>

        <div className='space-y-5 mt-4'>
          {/* Tên danh mục */}
          <div className='space-y-2'>
            <Label htmlFor='name'>
              Tên danh mục <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='name'
              placeholder='Nhập tên danh mục...'
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                // Clear error khi user gõ
                if (fieldErrors.name) {
                  setFieldErrors((prev) => ({ ...prev, name: null }));
                }
              }}
              disabled={loading}
              className={
                fieldErrors.name
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />
            {/* Hiển thị lỗi */}
            {fieldErrors.name && (
              <p className='text-sm text-red-500 flex items-center gap-1'>
                <span className='inline-block w-1 h-1 rounded-full bg-red-500'></span>
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Mã code danh mục */}

          <div className='space-y-2'>
            <Label htmlFor='code'>
              Mã code <span className='text-red-500'>*</span>
            </Label>

            <Input
              id='code'
              placeholder='VD:TEA-02,...'
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());

                if (fieldErrors.code) {
                  setFieldErrors((prev) => ({ ...prev, code: null }));
                }
              }}
              disabled={loading}
              className={
                fieldErrors.code
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />

            {fieldErrors.code && (
              <p className='text-sm text-red-500 flex items-center gap-1'>
                <span className='inline-block w-1 h-1 rounded-full bg-red-500'></span>
                {fieldErrors.code}
              </p>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='type'>
              Loại (Type) <span className='text-xs text-muted-foreground'>(tùy chọn)</span>
            </Label>
            <Input
              id='type'
              placeholder='VD: TEA, COFFEE,... (tùy chọn)'
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Hình ảnh */}
          <div className='space-y-2'>
            <Label htmlFor='image'>Hình ảnh</Label>

            {preview && (
              <div className='relative w-32 h-32 rounded-lg overflow-hidden border'>
                <img
                  src={preview}
                  alt='preview'
                  className='w-full h-full object-cover'
                />
                <button
                  type='button'
                  onClick={() => {
                    setImage(null);
                    setPreview(null);
                    setFieldErrors((prev) => ({ ...prev, image: null }));
                  }}
                  disabled={loading}
                  className='absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition disabled:opacity-50'
                >
                  ×
                </button>
              </div>
            )}

            <Input
              id='image'
              type='file'
              accept='image/*'
              onChange={handleImageChange}
              disabled={loading}
              className={
                fieldErrors.image
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }
            />
            {/* ✅ Hiển thị lỗi */}
            {fieldErrors.image && (
              <p className='text-sm text-red-500 flex items-center gap-1'>
                <span className='inline-block w-1 h-1 rounded-full bg-red-500'></span>
                {fieldErrors.image}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className='flex justify-end gap-2 pt-4'>
            <Button variant='outline' onClick={onClose} disabled={loading}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !name.trim()}>
              {loading ? 'Đang tạo...' : 'Tạo danh mục'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
