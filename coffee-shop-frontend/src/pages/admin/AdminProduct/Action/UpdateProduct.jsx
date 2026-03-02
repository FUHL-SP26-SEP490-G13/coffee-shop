import { useState, useEffect } from 'react';
import productService from '../../../../services/productService';
import categoryService from '../../../../services/categoryService';
import useFetch from '../../../../hooks/useFetch';

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

export default function UpdateProduct({ open, onClose, onSuccess, product }) {
  const productId = product?.id;

  console.log(product);

  /* ============================= */
  /* FETCH PRODUCT BY ID */
  /* ============================= */

  const {
    data: productData,
    loading: loadingProduct,
    execute: fetchProduct,
  } = useFetch(
    () => productService.getById(productId).then((res) => res.data),
    { immediate: false },
  );

  /* ============================= */
  /* FETCH CATEGORIES */
  /* ============================= */

  const { data: categories, loading: loadingCategories } = useFetch(
    () => categoryService.getAll().then((res) => res.data),
    { immediate: open },
  );

  /* ============================= */
  /* FORM STATE */
  /* ============================= */

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [sizes, setSizes] = useState([]);
  const [status, setStatus] = useState('available');

  const [oldImages, setOldImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  const [loading, setLoading] = useState(false);

  /* ============================= */
  /* LOAD PRODUCT WHEN OPEN */
  /* ============================= */

  useEffect(() => {
    if (open && productId) {
      fetchProduct();
    }
  }, [open, productId]);

  /* ============================= */
  /* FILL FORM WHEN PRODUCT LOADED */
  /* ============================= */

  useEffect(() => {
    if (productData) {
      setName(productData.name || '');
      setCategoryId(productData.category_id || '');
      setDescription(productData.description || '');
      setSizes(productData.sizes || []);
      setStatus(productData.status || 'available');

      const imageUrls = productData.images?.map((img) => img.image_url) || [];
      setOldImages(productData.images || []);
      setPreviewImages(imageUrls);
    }
  }, [productData]);

  /* ============================= */
  /* SIZE HANDLING */
  /* ============================= */

  const handleSizeChange = (index, value) => {
    const updated = [...sizes];
    updated[index].price = value;
    setSizes(updated);
  };

  const handleAddSize = () => {
    setSizes([...sizes, { size: 'New', price: '' }]);
  };

  /* ============================= */
  /* IMAGE HANDLING */
  /* ============================= */

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    setNewImages((prev) => [...prev, ...files]);

    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...previews]);
  };

  const handleRemoveImage = (index) => {
    const updatedPreview = [...previewImages];
    updatedPreview.splice(index, 1);
    setPreviewImages(updatedPreview);

    if (index < oldImages.length) {
      const updatedOld = [...oldImages];
      updatedOld.splice(index, 1);
      setOldImages(updatedOld);
    } else {
      const newIndex = index - oldImages.length;
      const updatedNew = [...newImages];
      updatedNew.splice(newIndex, 1);
      setNewImages(updatedNew);
    }
  };

  /* ============================= */
  /* SUBMIT */
  /* ============================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('category_id', categoryId);
      formData.append('description', description);
      formData.append('status', status);
      formData.append('sizes', JSON.stringify(sizes));
      formData.append('oldImages', JSON.stringify(oldImages));

      newImages.forEach((file) => {
        formData.append('images', file);
      });

      await productService.update(productId, formData);

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Update product error:', err);
    } finally {
      setLoading(false);
    }
  };


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
          {/* NAME + STATUS */}
          <div className='grid grid-cols-3 gap-4'>
            <div className='col-span-2 space-y-2'>
              <label className='text-sm font-medium'>Tên sản phẩm</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium'>Trạng thái</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='available'>Hoạt động</SelectItem>
                  <SelectItem value='unavailable'>Ngưng bán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CATEGORY */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Danh mục</label>
            <Select
              value={String(categoryId)}
              onValueChange={setCategoryId}
              disabled={loadingCategories}
            >
              <SelectTrigger>
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

          {/* DESCRIPTION */}
          <div>
            <label className='text-sm font-medium'>Mô tả</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* IMAGES */}
          <div className='space-y-3'>
            <label className='text-sm font-medium'>Hình ảnh</label>
            <Input
              type='file'
              multiple
              accept='image/*'
              onChange={handleImageChange}
            />

            {previewImages.length > 0 && (
              <div className='grid grid-cols-5 gap-3'>
                {previewImages.map((img, index) => (
                  <div key={index} className='relative group'>
                    <img
                      src={img}
                      alt=''
                      className='w-full h-24 object-cover rounded-lg border'
                    />
                    <button
                      type='button'
                      onClick={() => handleRemoveImage(index)}
                      className='absolute top-1 right-1 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition'
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIZE & PRICE */}
          <div className='space-y-4'>
            <div className='flex justify-between'>
              <h3 className='font-medium'>Kích cỡ & Giá</h3>
              <span className='text-xs bg-muted px-3 py-1 rounded-full'>
                {sizes.length} size
              </span>
            </div>

            {sizes.map((size, index) => (
              <div
                key={index}
                className='flex items-center gap-4 bg-muted/40 p-4 rounded-xl'
              >
                <Input
                  type='text'
                  value={size.size}
                  onChange={(e) => {
                    const updated = [...sizes];
                    updated[index].size = e.target.value;
                    setSizes(updated);
                  }}
                />

                <Input
                  type='number'
                  value={size.price}
                  onChange={(e) => handleSizeChange(index, e.target.value)}
                />

                <span>đ</span>
              </div>
            ))}

            <button
              type='button'
              onClick={handleAddSize}
              className='w-full border-2 border-dashed rounded-xl py-3 hover:bg-muted transition'
            >
              + Thêm kích cỡ
            </button>
          </div>

          {/* ACTION */}
          <div className='flex justify-end gap-3 pt-4'>
            <Button type='button' variant='outline' onClick={onClose}>
              Hủy
            </Button>

            <Button type='submit' disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
