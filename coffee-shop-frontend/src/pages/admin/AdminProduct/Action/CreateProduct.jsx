import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import productService from '../../../../services/productService';
import categoryService from '../../../../services/categoryService';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';

import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';

export default function CreateProduct({ open, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('available');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ================================
  // LOAD CATEGORIES
  // ================================
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await categoryService.getAll();
        const activeCategories = res.data.filter((c) => c.is_deleted === 0);
        setCategories(activeCategories);
      } catch (err) {
        console.error('Load categories error:', err);
        toast.error('Không thể tải danh mục');
      } finally {
        setLoadingCategories(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  // ================================
  // Upload multiple images (max 5)
  // ================================
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    // Check total images
    if (images.length + files.length > 3) {
      toast.error('Tối đa chỉ được upload 3 ảnh');
      return;
    }

    setImages((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleRemoveImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ================================
  // Submit
  // ================================
  const resetForm = () => {
    setName('');
    setCode('');
    setCategoryId('');
    setStatus('available');
    setDescription('');
    setImages([]);
    setPreviews([]);
  };

  const handleSubmit = async () => {
    // Validation
    const trimmedName = name.trim();
    const trimmedCode = code.trim();
    const trimmedDescription = description.trim();
    const parsedCategoryId = Number(categoryId);

    if (!trimmedName) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      toast.error('Tên sản phẩm phải từ 2 đến 100 ký tự');
      return;
    }

    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    if (!Number.isInteger(parsedCategoryId) || parsedCategoryId <= 0) {
      toast.error('Danh mục không hợp lệ');
      return;
    }

    if (!['available', 'unavailable'].includes(status)) {
      toast.error('Trạng thái sản phẩm không hợp lệ');
      return;
    }

    if (!trimmedCode) {
      toast.error('Vui lòng nhập mã code');
      return;
    }

    if (!/^[A-Z]{1,5}-[0-9]{1,5}$/.test(trimmedCode)) {
      toast.error('Code phải có định dạng: CHỮ HOA - SỐ (VD: CF-001)');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('name', trimmedName);
      formData.append('code', trimmedCode);
      formData.append('category_id', String(parsedCategoryId));
      formData.append('status', status);
      formData.append('description', trimmedDescription);

      // Append images (ảnh đầu tiên sẽ là thumbnail)
      images.forEach((img) => {
        formData.append('images', img);
      });

      await productService.create(formData);

      toast.success('Tạo sản phẩm thành công');
      onSuccess();
      resetForm();
    } catch (err) {
      console.error('Create product error:', err);
      const errorMsg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        'Tạo sản phẩm thất bại';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm mới</DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Tên + Code */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                <span className='text-red-500'>* </span>Tên sản phẩm
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='VD: Cà phê sữa đá'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                <span className='text-red-500'>* </span>Mã code
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder='VD: CF-01'
              />
            </div>
          </div>

          {/* Danh mục + Trạng thái */}
          <div className='grid grid-cols-2 gap-4'>
            {/* Category */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                <span className='text-red-500'>* </span>Danh mục
              </label>

              <Select
                value={categoryId}
                onValueChange={(val) => setCategoryId(val)}
                disabled={loadingCategories}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue
                    placeholder={
                      loadingCategories
                        ? 'Đang tải danh mục...'
                        : 'Chọn danh mục'
                    }
                  />
                </SelectTrigger>

                <SelectContent className='max-h-60 overflow-y-auto'>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                <span className='text-red-500'>* </span>Trạng thái
              </label>

              <Select value={status} onValueChange={(val) => setStatus(val)}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='available'>Đang bán</SelectItem>
                  <SelectItem value='unavailable'>Ngừng bán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Upload ảnh */}
          <div className='space-y-3'>
            <label className='text-sm font-medium'>
              Hình ảnh <span className='text-muted-foreground'>(Tối đa 3)</span>
            </label>

            <Input
              type='file'
              multiple
              accept='image/*'
              onChange={handleImageChange}
              disabled={images.length >= 3}
            />

            {images.length >= 3 && (
              <p className='text-xs text-amber-600'>Đã đạt giới hạn 3 ảnh</p>
            )}

            {previews.length > 0 && (
              <div className='flex flex-wrap gap-3'>
                {previews.map((src, index) => (
                  <div key={index} className='relative w-24 h-24'>
                    <img
                      src={src}
                      alt='preview'
                      className='w-full h-full object-cover rounded-lg border'
                    />
                    {index === 0 && (
                      <span className='absolute top-0 left-0 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-br'>
                        Thumbnail
                      </span>
                    )}
                    <button
                      type='button'
                      onClick={() => handleRemoveImage(index)}
                      className='absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center'
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mô tả */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Mô tả</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Mô tả ngắn về sản phẩm...'
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className='flex justify-end gap-3 pt-2'>
            <Button variant='outline' onClick={onClose} disabled={submitting}>
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className='cursor-pointer'
            >
              {submitting ? 'Đang tạo...' : 'Tạo sản phẩm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
