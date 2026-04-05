import { useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { ToppingPicker } from './ToppingPicker';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';
const uid = () => Math.random().toString(36).slice(2, 9);
const SIZE_ORDER = { S: 1, M: 2, L: 3 };

// Vì tất cả sản phẩm được filter có size trước khi render,
// trường hợp sizes rỗng gần như không xảy ra — nhưng giữ guard để an toàn.
export function ProductModal({ product, toppings = [], initialItem = null, onClose, onAdd }) {
  if (!product.sizes || product.sizes.length === 0) {
    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
        <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-none w-full max-w-sm overflow-hidden'>
          <div className='bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white flex justify-between items-start'>
            <div>
              <h3 className='font-bold text-lg'>{product.name}</h3>
              <p className='text-amber-100 text-sm'>{product.category}</p>
            </div>
            <button
              onClick={onClose}
              className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 text-white'
            >
              <X size={16} />
            </button>
          </div>
          <div className='p-6 text-center'>
            <p className='text-gray-500 dark:text-gray-400 text-sm'>
              Sản phẩm này chưa có size, không thể đặt.
            </p>
          </div>
          <div className='px-5 pb-5'>
            <button
              onClick={onClose}
              className='w-full py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-semibold hover:bg-gray-200 dark:bg-gray-700'
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProductModalInner
      product={product}
      toppings={toppings}
      initialItem={initialItem}
      onClose={onClose}
      onAdd={onAdd}
    />
  );
}

// Inner — chứa toàn bộ hooks
function ProductModalInner({ product, toppings, initialItem, onClose, onAdd }) {
  const sortedSizes = useMemo(() => {
    return [...product.sizes].sort((a, b) => {
      if (SIZE_ORDER[a.size] && SIZE_ORDER[b.size]) {
        return SIZE_ORDER[a.size] - SIZE_ORDER[b.size];
      }
      return a.price - b.price;
    });
  }, [product.sizes]);

  const [selectedSize, setSelectedSize] = useState(() => {
    if (initialItem && initialItem.size) {
      return sortedSizes.find((s) => s.size === initialItem.size) || sortedSizes[0];
    }
    return sortedSizes.find((s) => s.size === 'M') || sortedSizes[0];
  });
  const [selectedToppings, setSelectedToppings] = useState(() => initialItem?.toppings || []);
  const [note, setNote] = useState(() => initialItem?.note || '');

  const toppingTotal = selectedToppings.reduce(
    (s, t) => s + t.price * t.quantity,
    0,
  );
  const total = Number(selectedSize.price) + toppingTotal;

  const handleAdd = () => {
    onAdd({
      product_id: product.id,
      product_size_id: selectedSize.id,
      size: selectedSize.size,
      price: selectedSize.price,
      productName: product.name,
      quantity: initialItem ? initialItem.quantity : 1,
      note,
      toppings: selectedToppings,
      _uid: initialItem ? initialItem.id : uid(),
    });
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
      <div className='bg-white dark:bg-gray-900 rounded-2xl shadow-2xl dark:shadow-none w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
        {/* Header */}
        <div className='bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white'>
          <div className='flex justify-between items-start'>
            <div>
              <h3 className='font-bold text-lg'>{product.name}</h3>
              <p className='text-amber-100 text-sm'>{product.category}</p>
            </div>
            <button
              onClick={onClose}
              className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 text-white'
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className='p-5 space-y-4 max-h-[60vh] overflow-y-auto'>
          {/* Size */}
          <div>
            <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2'>
              Chọn size
            </p>
            <div className='flex gap-2'>
              {sortedSizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSize(s)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${selectedSize.id === s.id
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:border-gray-600'
                    }`}
                >
                  <div>{s.size}</div>
                  <div className='text-xs mt-0.5'>{fmt(s.price)}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Toppings */}
          <div>
            <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2'>
              Topping
            </p>
            <ToppingPicker
              selected={selectedToppings}
              onChange={setSelectedToppings}
              toppings={toppings}
            />
          </div>

          {/* Note */}
          <div>
            <p className='text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2'>
              Ghi chú
            </p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Ít đường, nhiều đá...'
              className='w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
            />
          </div>
        </div>

        {/* Footer */}
        <div className='p-5 border-t flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50'
          >
            Hủy
          </button>
          <button
            onClick={handleAdd}
            className='flex-[2] py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 flex items-center justify-center gap-2'
          >
            <Plus size={16} />
            {initialItem ? 'Cập nhật' : 'Thêm'} · {fmt(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
