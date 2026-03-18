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

// ===== CONSTANTS =====
const SIZE_ORDER = ['S', 'M', 'L'];

const sortSizes = (sizesArr) =>
  [...sizesArr].sort(
    (a, b) => SIZE_ORDER.indexOf(a.size) - SIZE_ORDER.indexOf(b.size)
  );

export default function UpdateProduct({ open, onClose, onSuccess, product }) {
  const productId = product?.id;

  // ===== FORM STATE =====
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('available');

  // ===== SIZES =====
  const [sizes, setSizes] = useState([]);
  const [deleteSizeIds, setDeleteSizeIds] = useState([]);

  // ===== IMAGES =====
  const [oldImages, setOldImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [deleteImageIds, setDeleteImageIds] = useState([]);

  // ===== CATEGORIES =====
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // ===== LOADING =====
  const [submitting, setSubmitting] = useState(false);

  // ===== LOAD CATEGORIES =====
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await categoryService.getAll();
        const active = res.data.filter((c) => c.is_deleted === 0);
        setCategories(active);
      } catch (err) {
        console.error('Load categories error:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (open) {
      fetchCategories();
    }
  }, [open]);

  // ===== FILL FORM =====
  useEffect(() => {
    if (open && product) {
      setName(product.name || '');
      setCode(product.code || '');
      setCategoryId(String(product.category_id) || '');
      setDescription(product.description || '');
      setStatus(product.status || 'available');
      setSizes(sortSizes(product.sizes || []));
      setOldImages(product.images || []);

      // Reset delete arrays
      setDeleteSizeIds([]);
      setDeleteImageIds([]);
      setNewImages([]);
    }
  }, [open, product]);

  // ===== SELECTED SIZES (for disabling options) =====
  const selectedSizeNames = sizes.map((s) => s.size);

  // ===== SIZE HANDLING =====
  const handleSizeChange = (index, field, value) => {
    const updated = [...sizes];
    updated[index] = { ...updated[index], [field]: value };

    // Re-sort only when the size label changes
    const sorted = field === 'size' ? sortSizes(updated) : updated;
    setSizes(sorted);
  };

  const handleAddSize = () => {
    if (sizes.length >= 3) {
      toast.error('Tối đa chỉ có 3 loại size (S, M, L)');
      return;
    }

    // Pick the first size not yet used
    const nextSize = SIZE_ORDER.find((s) => !selectedSizeNames.includes(s)) || 'S';
    const newSizes = sortSizes([...sizes, { size: nextSize, price: '' }]);
    setSizes(newSizes);
  };

  const handleRemoveSize = (index) => {
    const removed = sizes[index];

    if (removed && removed.id) {
      setDeleteSizeIds((prev) => [...prev, removed.id]);
    }

    const updated = [...sizes];
    updated.splice(index, 1);
    setSizes(updated);
  };

  // ===== IMAGE HANDLING =====
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalAfterAdd = oldImages.length + newImages.length + files.length;

    if (totalAfterAdd > 3) {
      toast.error('Tổng số ảnh không được vượt quá 3');
      return;
    }

    setNewImages((prev) => [...prev, ...files]);
  };

  const handleRemoveImage = (index, imageId) => {
    if (imageId) {
      setDeleteImageIds((prev) => [...prev, imageId]);
      setOldImages((prev) => prev.filter((img) => img.id !== imageId));
      toast.info('Ảnh sẽ được xóa khi lưu');
    } else {
      setNewImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // ===== PRICE VALIDATION =====
  const validatePrices = () => {
    const getPrice = (sizeName) => {
      const found = sizes.find((s) => s.size === sizeName);
      return found ? Number(found.price) : null;
    };

    const priceS = getPrice('S');
    const priceM = getPrice('M');
    const priceL = getPrice('L');

    // S + M → S < M
    if (priceS !== null && priceM !== null && priceS >= priceM) {
      toast.error('Giá size S phải nhỏ hơn size M');
      return false;
    }

    // M + L → M < L
    if (priceM !== null && priceL !== null && priceM >= priceL) {
      toast.error('Giá size M phải nhỏ hơn size L');
      return false;
    }

    // S + L (no M) → S < L
    if (priceS !== null && priceL !== null && priceS >= priceL) {
      toast.error('Giá size S phải nhỏ hơn size L');
      return false;
    }

    return true;
  };

  // ===== SUBMIT =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (!categoryId) {
      toast.error('Vui lòng chọn danh mục');
      return;
    }

    if (!code.trim()) {
      toast.error('Vui lòng nhập mã sản phẩm');
      return;
    }

    if (!/^[A-Z]{1,5}-[0-9]{1,5}$/.test(code.trim())) {
      toast.error('Code phải có định dạng: CHỮ HOA - SỐ (VD: CF-001)');
      return;
    }

    // Validate individual sizes
    const validSizes = ['S', 'M', 'L'];
    for (const size of sizes) {
      if (!validSizes.includes(size.size)) {
        toast.error(`Size "${size.size}" không hợp lệ. Chỉ chấp nhận S, M, L`);
        return;
      }

      if (!size.price || Number(size.price) <= 0) {
        toast.error(`Giá cho size ${size.size} phải là số dương`);
        return;
      }
    }

    // Check duplicate sizes
    const sizeNames = sizes.map((s) => s.size);
    if (sizeNames.length !== new Set(sizeNames).size) {
      toast.error('Không được có size trùng lặp');
      return;
    }

    // Validate price ordering across all combinations
    if (!validatePrices()) return;

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('code', code.trim());
      formData.append('category_id', categoryId);
      formData.append('description', description.trim());
      formData.append('status', status);

      if (sizes.length > 0) {
        formData.append('sizes', JSON.stringify(sizes));
      }

      if (deleteSizeIds.length > 0) {
        formData.append('deleteSizeIds', JSON.stringify(deleteSizeIds));
      }

      if (deleteImageIds.length > 0) {
        formData.append('deleteImageIds', JSON.stringify(deleteImageIds));
      }

      newImages.forEach((file) => {
        formData.append('images', file);
      });

      await productService.update(productId, formData);

      toast.success('Cập nhật sản phẩm thành công');
      onSuccess?.();
      onClose();
    } catch (err) {
      const res = err.response?.data;

      if (res?.errors && Array.isArray(res.errors)) {
        res.errors.forEach((e) => toast.error(e.message));
      } else if (res?.message) {
        toast.error(res.message);
      } else {
        toast.error('Cập nhật sản phẩm thất bại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // ===== IMAGE PREVIEW =====
  const getAllImagesForPreview = () => {
    const oldImagePreviews = oldImages.map((img) => ({
      id: img.id,
      url: img.image_url,
      isThumbnail: img.isThumbnail === 1,
      isOld: true,
    }));

    const newImagePreviews = newImages.map((file, index) => ({
      id: null,
      url: URL.createObjectURL(file),
      isThumbnail: false,
      isOld: false,
      index,
    }));

    return [...oldImagePreviews, ...newImagePreviews];
  };

  const imagePreviews = getAllImagesForPreview();

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* NAME + CODE */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                <span className='text-red-500'>*</span> Tên sản phẩm
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='VD: Cà phê sữa đá'
              />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                <span className='text-red-500'>*</span> Mã code
              </label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder='VD: CF-001'
              />
            </div>
          </div>

          {/* CATEGORY + STATUS */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                <span className='text-red-500'>*</span> Danh mục
              </label>
              <Select
                value={String(categoryId)}
                onValueChange={setCategoryId}
                disabled={loadingCategories}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Chọn danh mục' />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                <span className='text-red-500'>*</span> Trạng thái
              </label>
              <Select value={status} onValueChange={setStatus}>
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

          {/* DESCRIPTION */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Mô tả</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Mô tả ngắn về sản phẩm...'
              rows={3}
            />
          </div>

          {/* IMAGES */}
          <div className='space-y-3'>
            <label className='text-sm font-medium'>
              Hình ảnh{' '}
              <span className='text-muted-foreground'>
                ({imagePreviews.length}/3)
              </span>
            </label>

            <Input
              type='file'
              multiple
              accept='image/*'
              onChange={handleImageChange}
              disabled={imagePreviews.length >= 3}
            />

            {imagePreviews.length >= 3 && (
              <p className='text-xs text-amber-600'>Đã đạt giới hạn 3 ảnh</p>
            )}

            {imagePreviews.length > 0 && (
              <div className='grid grid-cols-5 gap-3'>
                {imagePreviews.map((img, index) => (
                  <div key={index} className='relative group'>
                    <img
                      src={img.url}
                      alt=''
                      className='w-full h-24 object-cover rounded-lg border'
                    />

                    {img.isThumbnail && (
                      <span className='absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded'>
                        Thumbnail
                      </span>
                    )}

                    <button
                      type='button'
                      onClick={() => handleRemoveImage(img.index, img.id)}
                      className='absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition'
                    >
                      X
                    </button>

                    {!img.isOld && (
                      <span className='absolute bottom-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded'>
                        Mới
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIZE & PRICE */}
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <h3 className='font-medium'>
                Kích cỡ & Giá{' '}
                <span className='text-muted-foreground text-sm'>
                  (Tối đa 3 loại)
                </span>
              </h3>
              <span className='text-xs bg-muted px-3 py-1 rounded-full'>
                {sizes.length} size
              </span>
            </div>

            {sizes.length === 0 && (
              <div className='bg-muted/40 rounded-lg p-4 text-center text-sm text-muted-foreground'>
                Chưa có kích cỡ nào. Nhấn "Thêm kích cỡ" để bắt đầu
              </div>
            )}

            {sizes.map((size, index) => (
              <div
                key={index}
                className='flex items-center gap-4 bg-muted/40 p-4 rounded-xl'
              >
                <Select
                  value={size.size}
                  onValueChange={(val) => handleSizeChange(index, 'size', val)}
                >
                  <SelectTrigger className='w-24'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_ORDER.map((s) => (
                      <SelectItem
                        key={s}
                        value={s}
                        // Disable if already used by ANOTHER row
                        disabled={
                          selectedSizeNames.includes(s) && size.size !== s
                        }
                      >
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type='number'
                  value={size.price}
                  onChange={(e) =>
                    handleSizeChange(index, 'price', e.target.value)
                  }
                  placeholder='Giá'
                  className='flex-1'
                  min={1}
                />

                <span className='text-sm'>đ</span>

                <button
                  type='button'
                  onClick={() => handleRemoveSize(index)}
                  className='text-red-500 hover:text-red-700 ml-auto'
                >
                  Xóa
                </button>
              </div>
            ))}

            <button
              type='button'
              onClick={handleAddSize}
              className='w-full border-2 border-dashed rounded-xl py-3 hover:bg-muted transition disabled:opacity-50 disabled:cursor-not-allowed'
              disabled={sizes.length >= 3}
            >
              + Thêm kích cỡ
            </button>
          </div>

          {/* ACTION */}
          <div className='flex justify-end gap-3 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={onClose}
              disabled={submitting}
            >
              Hủy
            </Button>

            <Button type='submit' disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}