import { CheckCircle2, X } from "lucide-react";
import { cartService } from "@/services/cartService";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";

export default function CartSuccessModal({ addedCartItem, onClose }) {
  const navigate = useNavigate();

  if (!addedCartItem) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl w-[400px] max-w-full overflow-hidden shadow-2xl flex flex-col pointer-events-auto transform animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-5 py-4 flex items-center justify-between border-b border-emerald-100 dark:border-emerald-800/30">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white dark:text-gray-900" />
            <span className="font-semibold text-[15px]">Thêm vào giỏ hàng thành công</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex gap-4 items-start">
          <img src={addedCartItem.image} alt={addedCartItem.name} className="w-16 h-20 object-contain rounded-md mix-blend-multiply dark:mix-blend-normal shrink-0 mt-1" />
          <div className="flex flex-col flex-1 gap-0.5 min-w-0">
            <span className="font-bold text-gray-800 dark:text-gray-100 text-[14px] uppercase leading-relaxed line-clamp-2 mb-1">{addedCartItem.name}</span>
            <span className="text-gray-600 dark:text-gray-300 text-[13px] font-medium">Size: {addedCartItem.size}</span>
            {addedCartItem.toppings?.length > 0 && (
              <div className="mt-1 text-gray-500 dark:text-gray-400 text-[13px] max-h-[100px] overflow-y-auto custom-scrollbar pr-2">
                 <span className="block mb-0.5 font-medium text-gray-600 dark:text-gray-300">Tùy chọn thêm:</span>
                 <ul className="list-disc pl-4 space-y-0.5">
                   {addedCartItem.toppings.map((t, idx) => (
                     <li key={idx} className="truncate">{t.name}</li>
                   ))}
                 </ul>
              </div>
            )}
          </div>
        </div>

        <div className="w-[calc(100%-40px)] h-[1px] bg-gray-100 dark:bg-gray-800 mx-auto"></div>

        {/* Summary */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-gray-800 dark:text-gray-200 font-medium text-[15px]">Giỏ hàng hiện có</span>
          <div className="flex items-end gap-2 sm:flex-col sm:gap-0 sm:items-end">
            <span className="text-amber-600 font-bold text-[18px] leading-none">{cartService.getTotalAmount().toLocaleString('vi-VN')}đ</span>
            <span className="text-gray-400 text-[13px] font-medium leading-loose mt-0 sm:mt-1">
              ({cartService.getCart().reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)}) sản phẩm
            </span>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="p-5 pt-0 flex gap-3">
          <button 
            className="flex-1 py-3 rounded-xl border-2 border-amber-600 text-amber-600 font-bold text-[14px] hover:bg-amber-50 dark:hover:bg-amber-900/20 active:scale-95 transition-all" 
            onClick={() => {onClose(); navigate("/checkout");}}
          >
            Thanh toán
          </button>
          <button 
            className="flex-1 py-3 rounded-xl bg-amber-600 text-white font-bold text-[14px] hover:bg-amber-700 active:scale-95 transition-all shadow-md shadow-amber-600/20" 
            onClick={() => {onClose(); navigate("/checkout");}}
          >
            Xem giỏ hàng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
