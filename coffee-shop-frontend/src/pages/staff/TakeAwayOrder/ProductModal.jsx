import { useMemo, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { ToppingPicker } from './ToppingPicker';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';
const uid = () => Math.random().toString(36).slice(2, 9);

const SIZE_ORDER = { S: 1, M: 2, L: 3 };

export function ProductModal({ product, toppings = [], onClose, onAdd }) {
  // console.log(toppings)

  //sort sizes
  const sortedSizes = useMemo(() => {
    return [...product.sizes].sort((a, b) => {
      // Ưu tiên sort theo S M L
      if (SIZE_ORDER[a.size] && SIZE_ORDER[b.size]) {
        return SIZE_ORDER[a.size] - SIZE_ORDER[b.size];
      }
      // sort theo giá
      return a.price - b.price;
    });
  }, [product.sizes]);

  // Default chọn size
  const [selectedSize, setSelectedSize] = useState(() => {
    return sortedSizes.find((s) => s.size === 'M') || sortedSizes[0];
  });

  const [selectedToppings, setSelectedToppings] = useState([]);
  const [note, setNote] = useState('');

  // Tính tiền
  const toppingTotal = selectedToppings.reduce(
    (s, t) => s + t.price * t.quantity,
    0,
  );

  const total = selectedSize.price + toppingTotal;

  const handleAdd = () => {
    onAdd({
      product_size_id: selectedSize.id,
      size: selectedSize.size,
      price: selectedSize.price,
      productName: product.name,
      quantity: 1,
      note,
      toppings: selectedToppings,
      _uid: uid(),
    });
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200'>
        {/* Header */}
        <div className='bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white'>
          <div className='flex justify-between items-start'>
            <div>
              <h3 className='font-bold text-lg'>{product.name}</h3>
              <p className='text-amber-100 text-sm'>{product.category}</p>
            </div>
            <button
              onClick={onClose}
              className='w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30'
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className='p-5 space-y-4 max-h-[60vh] overflow-y-auto'>
          {/* Size */}
          <div>
            <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
              Chọn size
            </p>

            <div className='flex gap-2'>
              {sortedSizes.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSize(s)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    selectedSize.id === s.id
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
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
            <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
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
            <p className='text-xs font-semibold text-gray-500 uppercase mb-2'>
              Ghi chú
            </p>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='Ít đường, nhiều đá...'
              className='w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
            />
          </div>
        </div>

        {/* Footer */}
        <div className='p-5 border-t flex gap-3'>
          <button
            onClick={onClose}
            className='flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50'
          >
            Huỷ
          </button>

          <button
            onClick={handleAdd}
            className='flex-[2] py-3 rounded-xl bg-amber-500 text-white font-semibold text-sm hover:bg-amber-600 flex items-center justify-center gap-2'
          >
            <Plus size={16} />
            Thêm · {fmt(total)}
          </button>
        </div>
      </div>
    </div>
  );
}
