import { X } from 'lucide-react';

const fmt = (n) => Number(n).toLocaleString('vi-VN') + 'đ';

export function ToppingPicker({ selected, onChange, toppings = [] }) {
  if (toppings.length === 0) {
    return (
      <p className="text-xs text-gray-400 text-center py-2">
        Không có topping
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {toppings.map((t) => {
        const found = selected.find((s) => s.topping_id === t.id);
        return (
          <div
            key={t.id}
            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{t.name}</p>
              <p className="text-xs text-amber-600">+{fmt(t.price)}</p>
            </div>

            {found ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() =>
                    onChange(
                      selected
                        .map((s) =>
                          s.topping_id === t.id
                            ? { ...s, quantity: Math.max(1, s.quantity - 1) }
                            : s,
                        )
                        .filter(
                          (s) => !(s.topping_id === t.id && s.quantity === 0),
                        ),
                    )
                  }
                  className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold hover:bg-amber-200"
                >
                  −
                </button>
                <span className="text-sm font-semibold w-4 text-center">
                  {found.quantity}
                </span>
                <button
                  onClick={() =>
                    onChange(
                      selected.map((s) =>
                        s.topping_id === t.id
                          ? { ...s, quantity: s.quantity + 1 }
                          : s,
                      ),
                    )
                  }
                  className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold hover:bg-amber-600"
                >
                  +
                </button>
                <button
                  onClick={() =>
                    onChange(selected.filter((s) => s.topping_id !== t.id))
                  }
                  className="w-5 h-5 rounded-full bg-red-100 text-red-500 flex items-center justify-center ml-1 hover:bg-red-200"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <button
                onClick={() =>
                  onChange([
                    ...selected,
                    {
                      topping_id: t.id,
                      quantity:   1,
                      price:      Number(t.price),
                      name:       t.name,
                    },
                  ])
                }
                className="text-xs px-2.5 py-1 rounded-full bg-amber-500 text-white font-medium hover:bg-amber-600"
              >
                Thêm
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}