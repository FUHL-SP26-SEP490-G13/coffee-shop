import { useState, useEffect } from 'react';
import categoryService from '../../../../services/categoryService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';

export default function UpdateCategory({ category, open, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setPreview(category.image_url);
      setRemoveImage(false);
      setImage(null);
    }
  }, [category]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setRemoveImage(false); // nếu upload mới thì không phải remove
  };

  const handleRemoveImage = () => {
    setImage(null);
    setPreview(null);
    setRemoveImage(true);
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      const formData = new FormData();

      if (name) {
        formData.append('name', name);
      }

      if (image) {
        formData.append('image', image);
      }

      if (removeImage) {
        formData.append('remove_image', 'true');
      }

      await categoryService.update(category.id, formData);

      await onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            <label className='text-sm font-medium'>Tên danh mục</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Ảnh */}
          <div className='space-y-2'>
            <label className='text-sm font-medium'>Hình ảnh</label>

            {preview ? (
              <div className='relative w-28 h-28'>
                <img
                  src={preview}
                  alt='category'
                  className='w-full h-full object-cover rounded-lg border'
                />

                <button
                  type='button'
                  onClick={handleRemoveImage}
                  className='absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow'
                >
                  X
                </button>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>Không có ảnh</p>
            )}

            <Input type='file' onChange={handleImageChange} />
          </div>

          {/* Buttons */}
          <div className='flex justify-end gap-2 pt-4'>
            <Button variant='outline' onClick={onClose}>
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
