import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AiAssistantWidget from "@/components/layout/AiAssistantWidget";
import { MapPin, Phone, Clock } from "lucide-react";

const CITIES = [
  { id: "HCM", name: "Hồ Chí Minh" },
  { id: "HN", name: "Hà Nội" }
];

const STORES = [
  {
    id: "s1",
    city_id: "HCM",
    name: "Cửa hàng Coffee - Xô Viết Nghệ Tĩnh",
    address: "432A Xô Viết Nghệ Tĩnh, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh",
    phone: "0949 560 480",
    hours: [
      "07h00 – 20h00 (Thứ 2 - Thứ 7)",
      "08h00 – 17h00 (Chủ nhật)"
    ],
    map_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.0603602739345!2d106.71159347570377!3d10.80668908934375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528a34b22c363%3A0xc6ad50f002d06173!2zNDMyYSBYw7QgVmnhur90IE5naOG7hyBUxKluaCwgUGjGsOG7nW5nIDI1LCBCw6xuaCBUaOG6oW5oLCBI4buTIENow60gTWluaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1709400000000!5m2!1svi!2s"
  },
  {
    id: "s2",
    city_id: "HCM",
    name: "Cửa hàng Coffee - Nguyễn Gia Trí",
    address: "10 Nguyễn Gia Trí, Phường 25, Quận Bình Thạnh, TP. Hồ Chí Minh",
    phone: "0335 124 555",
    hours: [
      "07h00 – 22h00 (Thứ 2 - Thứ 7)",
      "07h00 – 22h00 (Chủ nhật)"
    ],
    map_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.064!2d106.71!3d10.80!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTAXwrA0OCcwMC4wIk4gMTA2wrA0MicwMC4wIkU!5e0!3m2!1svi!2s!4v1709400000001!5m2!1svi!2s"
  },
  {
    id: "s3",
    city_id: "HN",
    name: "Cửa hàng Coffee - Hoàn Kiếm",
    address: "123 Bà Triệu, Quận Hoàn Kiếm, Hà Nội",
    phone: "024 3825 0000",
    hours: [
      "08h00 – 22h00 (Thứ 2 - Chủ nhật)"
    ],
    map_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.3!2d105.8!3d21.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDAwJzAwLjAiTiAxMDXwrDQ4JzAwLjAiRQ!5e0!3m2!1svi!2s!4v1709400000002!5m2!1svi!2s"
  }
];

export default function StoreLocatorPage() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0].id);
  const cityStores = STORES.filter((s) => s.city_id === selectedCity);
  const [selectedStore, setSelectedStore] = useState(cityStores[0]);

  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    const newStores = STORES.filter((s) => s.city_id === cityId);
    if (newStores.length > 0) {
      setSelectedStore(newStores[0]);
    } else {
      setSelectedStore(null);
    }
  };

  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    const store = cityStores.find((s) => s.id === storeId);
    if (store) setSelectedStore(store);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5F0]">
      <Header />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 fade-in-up">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-[#7B4B36] mb-10" style={{ fontFamily: 'serif' }}>
          Hệ thống cửa hàng
        </h1>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-auto lg:h-[600px]">
          {/* Left panel */}
          <div className="w-full lg:w-[400px] shrink-0 bg-white rounded-2xl border border-amber-100 shadow-sm p-6 lg:p-8 flex flex-col items-start relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 opacity-50 pointer-events-none" />
            
            <h2 className="text-2xl font-bold text-[#7B4B36] mb-8 relative z-10" style={{ fontFamily: 'serif' }}>Tìm cửa hàng</h2>
            
            <div className="space-y-6 flex-1 w-full relative z-10">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn tỉnh thành</label>
                <select 
                  value={selectedCity}
                  onChange={handleCityChange}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-sm bg-gray-50 text-gray-800"
                >
                  {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chọn cửa hàng</label>
                <select 
                  value={selectedStore?.id || ""}
                  onChange={handleStoreChange}
                  disabled={cityStores.length === 0}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition shadow-sm bg-gray-50 text-gray-800"
                >
                  {cityStores.length === 0 && <option value="">Không có cửa hàng nào</option>}
                  {cityStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {selectedStore && (
                <div className="pt-6 mt-6 border-t border-amber-100 space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900 mb-0.5 text-sm uppercase tracking-wide">Địa chỉ</p>
                      <p className="text-gray-700 text-sm leading-relaxed">{selectedStore.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 mt-4">
                    <Phone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-gray-700 text-sm leading-relaxed"><span className="font-semibold text-gray-900">Liên hệ:</span> {selectedStore.phone}</p>
                  </div>
                  
                  <div className="flex items-start gap-3 mt-4">
                    <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900 block mb-1">Giờ hoạt động:</span>
                      {selectedStore.hours.map((h, idx) => <span key={idx} className="block">{h}</span>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right panel (Map) */}
          <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-sm h-[450px] lg:h-full border border-gray-200 relative p-2">
            <div className="w-full h-full rounded-xl overflow-hidden relative bg-gray-50">
              {selectedStore ? (
                <iframe 
                  key={selectedStore.map_url}
                  src={selectedStore.map_url} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen="" 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 w-full h-full transition-opacity duration-500 animate-in fade-in"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-4">
                  <MapPin className="w-12 h-12 text-gray-300" />
                  <p>Vui lòng chọn cửa hàng để xem bản đồ</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <AiAssistantWidget />
      
      <style>{`
        .fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
