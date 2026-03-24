import React, { useEffect, useState } from "react";
import categoryService from "@/services/categoryService";
import toppingService from "@/services/toppingService";
import productService from "@/services/productService";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function CartBar({ count, onClick }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 border-t shadow-lg px-4 py-3 flex items-center justify-between max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center rounded-full bg-primary text-white w-8 h-8 text-lg font-bold">
          🛒
        </span>
        <span className="font-semibold text-base">{count} món đã chọn</span>
      </div>
      <Button size="lg" className="rounded-full px-6 font-bold" onClick={onClick}>
        Xem giỏ hàng
      </Button>
    </div>
  );
}

export default function OrderQRMenu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [toppingsList, setToppingsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Lấy danh sách category
  useEffect(() => {
    categoryService.getAll().then(res => {
      setCategories(res?.data || res || []);
    }).catch(() => setCategories([]));
  }, []);

  // Lấy menu theo category, chỉ lấy sản phẩm available
  useEffect(() => {
    setLoading(true);
    const params = { status: 'available' };
    const fetchMenu = selectedCategory === 'all'
      ? productService.getAll(params)
      : productService.getByCategory(selectedCategory, params);
    fetchMenu
      .then((res) => {
        setMenu(res?.data || res || []);
      })
      .catch(() => setMenu([]))
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  // Lấy danh sách topping khi mở modal giỏ hàng
  useEffect(() => {
    if (showCart) {
      toppingService.getAll().then(res => {
        setToppingsList(res?.data || res || []);
      }).catch(() => setToppingsList([]));
    }
  }, [showCart]);

  // ✅ CHỌN MÓN (safe data)
  const handleSelect = (item) => {
    setSelected((prev) => {
      const id = item.id ?? item._id;
      if (prev.find((i) => i.id === id)) return prev;

      return [
        ...prev,
        {
          id,
          name: item.name || "Không tên",
          // Không set size mặc định, user sẽ chọn trong select
          qty: 1,
        },
      ];
    });
  };

  const handleUnselect = (item) => {
    setSelected((prev) => prev.filter((i) => i.id !== item.id));
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white flex flex-col pb-24">
      {/* HEADER + CATEGORY */}
      <header className="sticky top-0 z-10 bg-white border-b py-4 px-4 shadow-sm">
        <h1 className="text-xl font-bold text-center mb-2">Menu bàn {tableId}</h1>
        {/* CATEGORY SCROLL */}
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
          <div className="flex gap-2 w-max">
            <button
              className={`px-4 py-2 rounded-full border font-semibold whitespace-nowrap transition ${selectedCategory === 'all' ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-primary/10'}`}
              onClick={() => setSelectedCategory('all')}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.id || cat._id}
                className={`px-4 py-2 rounded-full border font-semibold whitespace-nowrap transition ${selectedCategory === (cat.id || cat._id) ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-primary/10'}`}
                onClick={() => setSelectedCategory(cat.id || cat._id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* MENU */}
      <main className="flex-1 px-2 py-4">
        {loading ? (
          <div className="text-center py-10">Đang tải...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {Array.isArray(menu) &&
              menu.map((item, index) => {
                const id = item.id ?? item._id ?? index;
                const isSelected = selected.some((i) => i.id === id);

                const img =
                  item?.images?.[0]?.image_url ||
                  item.img ||
                  "/assets/menu/default.jpg";

                return (
                  <Card
                    key={id}
                    className={`p-4 text-center border-2 rounded-xl ${
                      isSelected ? "border-primary bg-primary/10" : ""
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    <img
                      src={img}
                      alt={item.name}
                      className="w-20 h-20 mx-auto mb-2 rounded object-cover"
                    />
                    <div className="font-semibold">
                      {item.name || "Không tên"}
                    </div>

                    <Button
                      className="mt-2 w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        isSelected
                          ? handleUnselect({ id })
                          : handleSelect(item);
                      }}
                    >
                      {isSelected ? "Huỷ" : "Chọn"}
                    </Button>
                  </Card>
                );
              })}

            {menu.length === 0 && (
              <div className="col-span-2 text-center">
                Không có sản phẩm
              </div>
            )}
          </div>
        )}
      </main>

      {/* CART BAR */}
      {selected.length > 0 && (
        <CartBar count={selected.length} onClick={() => setShowCart(true)} />
      )}

      {/* CART MODAL */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg mx-auto rounded-2xl shadow-2xl border border-gray-200 p-6 animate-in slide-in-from-bottom-10 fade-in relative">
            <button onClick={() => setShowCart(false)} className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-red-500 transition">&times;</button>
            <h2 className="font-bold text-xl mb-4 text-center tracking-tight">🛒 Giỏ hàng</h2>
            <div className="divide-y divide-gray-200 max-h-[60vh] overflow-y-auto mb-4">
              {selected.map((item, idx) => {
                const menuItem = menu.find(m => m.id === item.id || m._id === item.id);
                const sizes = menuItem?.sizes || [];
                const toppings = Array.isArray(menuItem?.toppings) && menuItem.toppings.length > 0 ? menuItem.toppings : toppingsList;
                return (
                  <div key={item.id} className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-base">{item.name}</div>
                      <button onClick={() => handleUnselect(item)} className="text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50 transition">Xoá</button>
                    </div>
                    {/* Chọn size */}
                    {sizes.length > 0 && (
                      <select
                        value={item.size || ''}
                        onChange={e => {
                          const size = e.target.value;
                          setSelected(sel =>
                            sel.map((s, i) => i === idx ? { ...s, size } : s)
                          );
                        }}
                        className="block w-full border border-gray-300 rounded-lg px-3 py-2 my-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="" disabled>Chọn size</option>
                        {sizes.map(sz => (
                          <option key={sz.size} value={sz.size}>
                            {sz.size} ({Number(sz.price).toLocaleString()}đ)
                          </option>
                        ))}
                      </select>
                    )}
                    {/* Chọn topping */}
                    {toppings.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 my-2 w-full">
                        {toppings.map(tp => {
                          const toppingObj = (item.toppings || []).find(t => t.topping_id === tp.id);
                          return (
                            <label
                              key={tp.id}
                              className="flex items-center gap-2 text-sm border rounded-lg px-2 py-1 cursor-pointer hover:bg-gray-50 box-border w-full"
                              style={{ minWidth: 0 }}
                            >
                              <input
                                type="checkbox"
                                checked={!!toppingObj}
                                onChange={e => {
                                  setSelected(sel =>
                                    sel.map((s, i) => {
                                      if (i !== idx) return s;
                                      let nextToppings = Array.isArray(s.toppings) ? [...s.toppings] : [];
                                      if (e.target.checked) {
                                        nextToppings.push({ topping_id: tp.id, quantity: 1, price: tp.price });
                                      } else {
                                        nextToppings = nextToppings.filter(t => t.topping_id !== tp.id);
                                      }
                                      return { ...s, toppings: nextToppings };
                                    })
                                  );
                                }}
                              />
                              <span className="truncate">{tp.name}</span>
                              <span className="ml-auto text-primary font-semibold whitespace-nowrap">+{Number(tp.price).toLocaleString()}đ</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                    {/* Ghi chú */}
                    <input
                      type="text"
                      placeholder="Ghi chú cho món này"
                      value={item.note || ""}
                      onChange={e => {
                        setSelected(sel =>
                          sel.map((s, i) => i === idx ? { ...s, note: e.target.value } : s)
                        );
                      }}
                      className="block w-full border border-gray-300 rounded-lg px-3 py-2 my-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                );
              })}
            </div>
            {/* Tổng tiền */}
            <div className="flex items-center justify-between mt-4 mb-2 text-lg font-semibold">
              <span>Tổng tiền:</span>
              <span className="text-primary">
                {(() => {
                  // Tính tổng tiền: chỉ lấy giá theo size (product_size) và topping
                  let total = 0;
                  selected.forEach(item => {
                    const menuItem = menu.find(m => m.id === item.id || m._id === item.id);
                    let price = 0;
                    if (item.size && Array.isArray(menuItem?.sizes)) {
                      const sizeObj = menuItem.sizes.find(sz => sz.size === item.size);
                      if (sizeObj) price = Number(sizeObj.price);
                    }
                    let itemTotal = price * (item.qty || 1);
                    if (Array.isArray(item.toppings)) {
                      item.toppings.forEach(tp => {
                        itemTotal += (tp.price || 0) * (tp.quantity || 1);
                      });
                    }
                    total += itemTotal;
                  });
                  return total.toLocaleString() + 'đ';
                })()}
              </span>
            </div>
            <Button className="w-full mt-2 py-3 rounded-full text-lg font-bold bg-primary text-white hover:bg-primary/90 transition">
              Đặt món
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}