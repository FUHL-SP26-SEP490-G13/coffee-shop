import { Check } from 'lucide-react';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

export function ToppingPicker({ selected, onChange, toppings = [] }) {
  if (toppings.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-2">
        Không có topping
      </p>
    );
  }

  const toggle = (topping) => {
    const exists = selected.find((s) => s.topping_id === topping.id);
    if (exists) {
      // Bỏ chọn
      onChange(selected.filter((s) => s.topping_id !== topping.id));
    } else {
      // Chọn — quantity luôn = 1
      onChange([
        ...selected,
        {
          topping_id: topping.id,
          quantity: 1,
          price: Number(topping.price),
          name: topping.name,
        },
      ]);
    }
  };

  return (
    <div className="space-y-1.5">
      {toppings.map((t) => {
        const isSelected = selected.some((s) => s.topping_id === t.id);
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => toggle(t)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left
              ${isSelected
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-500/50'
                : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700'
              }`}
          >
            {/* Checkbox */}
            <div
              className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors
                ${isSelected
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
                }`}
            >
              {isSelected && <Check size={12} strokeWidth={3} />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${isSelected ? 'text-amber-800 dark:text-amber-300' : 'text-gray-800 dark:text-gray-200'}`}>
                {t.name}
              </p>
            </div>

            {/* Price */}
            <span className={`text-xs font-semibold flex-shrink-0 ${isSelected ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
              +{fmt(t.price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}