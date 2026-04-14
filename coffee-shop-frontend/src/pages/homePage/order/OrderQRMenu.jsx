import React, { useEffect, useState } from "react";
import categoryService from "@/services/categoryService";
import toppingService from "@/services/toppingService";
import productService from "@/services/productService";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function CartBar({ count, onClick }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white dark:bg-gray-900/95 border-t shadow-lg px-4 py-3 flex items-center justify-between max-w-lg mx-auto w-full">
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
  const navigate = useNavigate();
  const tableId = searchParams.get("table");

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [toppingsList, setToppingsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [warningMessage, setWarningMessage] = useState("");

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
    setSelected((prev) => [
      ...prev,
      {
        cartKey: Date.now() + Math.random(),
        id: item.id ?? item._id,
        name: item.name || "Không tên",
        qty: 1,
      },
    ]);
  };

  const handleUnselect = (index) => {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white dark:bg-gray-900 flex flex-col pb-24">
      {/* HEADER + CATEGORY */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b py-4 px-4 shadow-sm">
        <h1 className="text-xl font-bold text-center mb-2">Menu bàn {tableId}</h1>
        {/* CATEGORY SCROLL */}
        <div className="overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
          <div className="flex gap-2 w-max">
            <button
              className={`px-4 py-2 rounded-full border font-semibold whitespace-nowrap transition ${selectedCategory === 'all' ? 'bg-primary text-white border-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-primary/10'}`}
              onClick={() => setSelectedCategory('all')}
            >
              Tất cả
            </button>
            {categories.map(cat => (
              <button
                key={cat.id || cat._id}
                className={`px-4 py-2 rounded-full border font-semibold whitespace-nowrap transition ${selectedCategory === (cat.id || cat._id) ? 'bg-primary text-white border-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-primary/10'}`}
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
                const itemQty = selected.filter((i) => i.id === id).length;

                const img =
                  item?.images?.[0]?.image_url ||
                  item.img ||
                  "/assets/menu/default.jpg";

                return (
                  <Card
                    key={id}
                    className={`p-4 text-center border-2 rounded-xl relative ${
                      itemQty > 0 ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => handleSelect(item)}
                  >
                    {itemQty > 0 && (
                      <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                        {itemQty}
                      </div>
                    )}
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
                        handleSelect(item);
                      }}
                    >
                      Thêm
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
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg mx-auto rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 relative">
            <button onClick={() => setShowCart(false)} className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-red-500 transition">&times;</button>
            <h2 className="font-bold text-xl mb-4 text-center tracking-tight">🛒 Giỏ hàng</h2>
            <div className="divide-y divide-gray-200 max-h-[60vh] overflow-y-auto mb-4">
              {selected.map((item, idx) => {
                const menuItem = menu.find(m => m.id === item.id || m._id === item.id);
                const sizes = menuItem?.sizes || [];
                const availableToppings = toppingsList.filter(t => {
                  let ids = t.category_ids || [];
                  if (typeof ids === 'string') {
                    try { ids = JSON.parse(ids); } catch(e) { ids = []; }
                  }
                  return Array.isArray(ids) && ids.includes(menuItem?.category_id);
                });
                const toppings = Array.isArray(menuItem?.toppings) && menuItem.toppings.length > 0 ? menuItem.toppings : availableToppings;
                return (
                  <div key={item.cartKey || idx} className="py-4">
                    <div className="flex items-center justify-between mb-2">
                       <div className="font-semibold text-base">{item.name}</div>
                       <button onClick={() => handleUnselect(idx)} className="text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50 transition">Xoá</button>
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
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 my-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                              className="flex items-center gap-2 text-sm border rounded-lg px-2 py-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-950 box-border w-full"
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
                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 my-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
            <Button 
              className="w-full mt-2 py-3 rounded-full text-lg font-bold bg-primary text-white hover:bg-primary/90 transition"
              onClick={() => {
                const missingSizeItem = selected.find(item => {
                  const menuItem = menu.find(m => m.id === item.id || m._id === item.id);
                  return menuItem && Array.isArray(menuItem.sizes) && menuItem.sizes.length > 0 && !item.size;
                });

                if (missingSizeItem) {
                  return setWarningMessage(`Vui lòng chọn size cho món: ${missingSizeItem.name}`);
                }

                navigate("/order/confirm", { state: { selected, tableId, menu } });
              }}
            >
              Đặt món
            </Button>
          </div>
        </div>
      )}
      {/* WARNING MODAL */}
      {warningMessage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chú ý</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{warningMessage}</p>
            <Button 
              className="w-full py-3 rounded-full text-base font-bold bg-primary text-white hover:bg-primary/90" 
              onClick={() => setWarningMessage("")}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}