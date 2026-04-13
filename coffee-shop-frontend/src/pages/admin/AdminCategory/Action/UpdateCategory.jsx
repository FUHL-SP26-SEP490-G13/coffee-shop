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

export default function UpdateCategory({ category, open, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);

  // State lưu lỗi của từng field
  const [fieldErrors, setFieldErrors] = useState({});

  // Load initial data
  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setCode(category.code || '');
      setType(category.type || '');
      setPreview(category.image_url || null);
      setRemoveImage(false);
      setImage(null);
      setFieldErrors({});
    }
  }, [category]);

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
    setRemoveImage(false);
    // Clear error khi chọn ảnh hợp lệ
    setFieldErrors((prev) => ({ ...prev, image: null }));
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    setRemoveImage(true);
    setFieldErrors((prev) => ({ ...prev, image: null }));
  };

  const handleUpdate = async () => {
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

    const codePattern = /^[A-Z0-9-]+$/;

    if (!code.trim()) {
      errors.code = 'Vui lòng nhập mã code';
    } else if (code.trim().length < 2) {
      errors.code = 'Mã code phải có ít nhất 2 ký tự';
    } else if (!codePattern.test(code.trim().toUpperCase())) {
      errors.code = 'Code chỉ được chứa chữ in hoa, số và dấu "-"';
    }

    // Nếu có lỗi client-side, hiển thị ngay
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      // Luôn gửi name
      formData.append('name', name.trim());

      formData.append('code', code.trim().toUpperCase());

      // Gửi type. Nếu trống thì gửi string rỗng để BE cũng xóa hoặc cập nhật.
      formData.append('type', type.trim());

      // Nếu có upload ảnh mới
      if (image) {
        formData.append('image', image);
      }

      // Nếu muốn xóa ảnh
      if (removeImage) {
        formData.append('remove_image', 'true');
      }

      const response = await categoryService.update(category.id, formData);

      if (response.success) {
        toast.success(response.message || 'Cập nhật danh mục thành công!');

        if (onSuccess) {
          await onSuccess();
        }

        onClose();
      }
    } catch (err) {
      console.error('Error updating category:', err);

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
          'Có lỗi xảy ra khi cập nhật danh mục';

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

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-xl'>Cập nhật danh mục</DialogTitle>
        </DialogHeader>

        <div className='space-y-5 mt-4'>
          {/* Tên */}
          <div className='space-y-2'>
            <Label htmlFor='name'>
              Tên danh mục <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='name'
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
              placeholder='VD: CF, TEA-02...'
              value={code}
              onChange={(e) => {
                setCode(e.target.value);

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

          {/* Ảnh */}
          <div className='space-y-2'>
            <Label htmlFor='image'>Hình ảnh</Label>

            {preview ? (
              <div className='relative w-32 h-32'>
                <img
                  src={preview}
                  alt='category'
                  className='w-full h-full object-cover rounded-lg border'
                />

                <button
                  type='button'
                  onClick={handleRemoveImage}
                  disabled={loading}
                  className='absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition disabled:opacity-50'
                >
                  ×
                </button>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>Không có ảnh</p>
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
            {/* Hiển thị lỗi */}
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
            <Button
              onClick={handleUpdate}
              disabled={loading || !name.trim() || !code.trim()}
            >
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
