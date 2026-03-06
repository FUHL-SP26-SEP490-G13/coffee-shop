// import { useState, useEffect } from 'react';
// import { toast } from 'sonner';
// import productService from '../../../../services/productService';

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from '../../../../components/ui/dialog';
// import { Button } from '../../../../components/ui/button';

// export default function DeleteProduct({ open, onClose, onSuccess, product }) {
//   const [loading, setLoading] = useState(false);

//   // Reset loading khi đóng dialog
//   useEffect(() => {
//     if (!open) {
//       setLoading(false);
//     }
//   }, [open]);

//   const handleDelete = async () => {
//     if (!product?.id) {
//       toast.error('Không tìm thấy sản phẩm');
//       return;
//     }

//     try {
//       setLoading(true);

//       const res = await productService.delete(product.id);

//       // Lấy message từ BE
//       const message = res?.data?.message || 'Xóa sản phẩm thành công';

//       toast.success(message);

//       onSuccess?.();
//       onClose();
//     } catch (err) {
//       console.error('Delete product error:', err);

//       const errorMsg = err.response?.data?.message || 'Xóa sản phẩm thất bại';

//       toast.error(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Dialog
//       open={open}
//       onOpenChange={(isOpen) => {
//         if (!isOpen) onClose();
//       }}
//     >
//       <DialogContent className='max-w-md'>
//         <DialogHeader>
//           <DialogTitle className='text-red-600'>Xóa sản phẩm</DialogTitle>
//         </DialogHeader>

//         <div className='space-y-6'>
//           <div className='bg-red-50 border border-red-200 rounded-lg p-4 text-sm'>
//             <p>
//               Bạn có chắc chắn muốn xóa sản phẩm{' '}
//               <span className='font-semibold text-red-600'>
//                 {product?.name}
//               </span>{' '}
//               không?
//             </p>
//             <p className='mt-2 text-red-500 text-xs'>
//               Hành động này không thể hoàn tác.
//             </p>
//           </div>

//           <div className='flex justify-end gap-3'>
//             <Button variant='outline' onClick={onClose} disabled={loading}>
//               Hủy
//             </Button>

//             <Button
//               variant='destructive'
//               onClick={handleDelete}
//               disabled={loading}
//             >
//               {loading ? 'Đang xóa...' : 'Xóa'}
//             </Button>
//           </div>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }



import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { AlertTriangle } from 'lucide-react';
import productService from '../../../../services/productService';


export default function DeleteProduct({
  product,
  open,
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);

      const response = await productService.delete(product.id);

      // ✅ Kiểm tra response từ BE
      if (response.success) {
        toast.success(response.message || 'Xóa danh mục thành công!');

        if (onSuccess) {
          await onSuccess();
        }

        onClose();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      
      // ✅ Lấy message từ BE
      const errorMessage = 
        err.response?.data?.message || 
        err.message ||
        'Có lỗi xảy ra khi xóa danh mục';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Xóa sản phẩm
          </DialogTitle>
          <DialogDescription>
            Hành động này không thể hoàn tác
          </DialogDescription>
        </DialogHeader>

        <p className="text-sm">
          Bạn có chắc chắn muốn xóa sản phẩm{' '}
          <span className="font-semibold">"{product.name}"</span>?
        </p>

        <div className='flex justify-end gap-2 mt-4'>
          <Button 
            variant='outline' 
            onClick={onClose}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button 
            variant='destructive' 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Đang xóa...' : 'Xóa'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}