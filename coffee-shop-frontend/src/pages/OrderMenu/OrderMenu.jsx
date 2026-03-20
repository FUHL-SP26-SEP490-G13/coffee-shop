
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function CartBar({ count, onClick }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 border-t border-border shadow-lg px-4 py-3 flex items-center justify-between max-w-lg mx-auto w-full">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center justify-center rounded-full bg-primary text-white w-8 h-8 text-lg font-bold">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437m0 0A48.108 48.108 0 0116.5 6.75c2.185 0 4.313.144 6.428.427a1.125 1.125 0 01.972 1.12v9.383a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25V5.272z" />
          </svg>
        </span>
        <span className="font-semibold text-base">{count} món đã chọn</span>
      </div>
      <Button size="lg" className="rounded-full px-6 font-bold shadow-md" onClick={onClick}>
        Xem giỏ hàng
      </Button>
    </div>
  );
}

export default function OrderMenu() {
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table");
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    // TODO: Gọi API lấy menu thực tế
    setTimeout(() => {
      setMenu([
        { id: 1, name: "Cà phê sữa", price: 29000, img: "/assets/menu/cf-sua.jpg" },
        { id: 2, name: "Trà đào", price: 35000, img: "/assets/menu/tra-dao.jpg" },
        { id: 3, name: "Bạc xỉu", price: 32000, img: "/assets/menu/bac-xiu.jpg" },
      ]);
      setLoading(false);
    }, 500);
  }, []);


  const handleSelect = (item) => {
    setSelected((prev) => {
      if (prev.find((i) => i.id === item.id)) return prev;
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const handleUnselect = (item) => {
    setSelected((prev) => prev.filter((i) => i.id !== item.id));
  };

  const handleCartClick = () => setShowCart(true);
  const handleCloseCart = () => setShowCart(false);

  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white flex flex-col pb-24">
      {/* Header nổi */}
      <header className="sticky top-0 z-10 bg-white/95 border-b border-border py-4 px-4 flex flex-col items-center shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Menu bàn {tableId}</h1>
        <div className="text-sm text-muted-foreground">Chạm để chọn món yêu thích!</div>
      </header>

      <main className="flex-1 w-full px-2 pt-2 pb-4">
        {loading ? (
          <div className="text-center py-10 text-lg animate-pulse">Đang tải menu...</div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {menu.map((item) => {
              const isSelected = selected.some((i) => i.id === item.id);
              return (
                <Card
                  key={item.id}
                  className={`relative flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 ${isSelected ? "border-primary bg-primary/5 shadow-lg scale-105" : "hover:border-primary/60"}`}
                  onClick={() => handleSelect(item)}
                >
                  {item.img && (
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-xl mb-2 shadow-sm border"
                      loading="lazy"
                    />
                  )}
                  <div className="font-semibold text-lg text-center mb-1">{item.name}</div>
                  <div className="text-base text-primary font-bold mb-2">{item.price.toLocaleString()}đ</div>
                  {isSelected ? (
                    <Button
                      size="sm"
                      className="rounded-full px-6 font-bold w-full bg-destructive text-white"
                      onClick={e => { e.stopPropagation(); handleUnselect(item); }}
                    >
                      Huỷ
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-full px-6 font-bold w-full bg-secondary text-primary"
                      onClick={e => { e.stopPropagation(); handleSelect(item); }}
                    >
                      Chọn
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom cart bar */}
      {selected.length > 0 && (
        <CartBar count={selected.length} onClick={handleCartClick} />
      )}

      {/* Cart modal (simple) */}
      {showCart && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl shadow-xl w-full max-w-lg p-6 animate-in slide-in-from-bottom-10 fade-in">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-lg">Giỏ hàng ({selected.length})</div>
              <button className="text-2xl px-2" onClick={handleCloseCart}>&times;</button>
            </div>
            <div className="divide-y">
              {selected.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold">{item.name}</div>
                    <div className="text-sm text-muted-foreground">{item.price.toLocaleString()}đ</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">x{item.qty}</span>
                    <Button size="icon-xs" variant="destructive" className="ml-2" onClick={() => handleUnselect(item)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.53-10.47a.75.75 0 00-1.06-1.06L10 8.94 7.53 6.47a.75.75 0 10-1.06 1.06L8.94 10l-2.47 2.47a.75.75 0 101.06 1.06L10 11.06l2.47 2.47a.75.75 0 101.06-1.06L11.06 10l2.47-2.47z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-6 rounded-full py-3 text-lg font-bold" size="lg" onClick={() => alert("Chức năng đặt món sẽ sớm có!")}>Đặt món</Button>
          </div>
        </div>
      )}
    </div>
  );
}
