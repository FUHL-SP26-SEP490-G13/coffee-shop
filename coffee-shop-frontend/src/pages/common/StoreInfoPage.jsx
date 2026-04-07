import React, { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Loader2, MapPin, Phone, Clock, Mail } from "lucide-react";
import receiptSettingService from "@/services/receiptSettingService";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Link } from "react-router-dom";

export default function StoreInfoPage() {
  useDocumentTitle("Hệ thống cửa hàng");
  const [storeInfo, setStoreInfo] = useState({
    name: "Coffee Shop",
    address: "Đang cập nhật địa chỉ...",
    phone: "Đang cập nhật số điện thoại...",
    open_time: "07:00",
    close_time: "22:30"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await receiptSettingService.getSettings();
        const data = res?.data || {};
        
        setStoreInfo({
          name: data.store_name || "Coffee Shop",
          address: data.address || "123 Đường B, Quận C, TP. HCM",
          phone: data.phone || "09xxxxxxxxx",
          open_time: data.open_time || "07:00",
          close_time: data.close_time || "22:30"
        });
      } catch (error) {
        console.error("Lỗi lấy thông tin cửa hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
      <Header />

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-6 xl:px-8 pt-2 md:pt-4 pb-10 md:pb-16 mb-5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-base md:text-lg text-gray-500 dark:text-gray-400 font-medium mb-6">
              <Link to="/" className="hover:text-amber-600 transition">Trang chủ</Link>
              <span className="text-gray-400">/</span>
              <span className="text-amber-600 font-bold">Hệ thống cửa hàng</span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Store Information */}
            <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-700">
              <div>
                <h1 className="text-2xl md:text-3xl font-semibold text-amber-900 dark:text-amber-500" style={{ fontFamily: 'serif' }}>
                  Chào mừng bạn đến với <span className="text-amber-600">{storeInfo.name}</span>
                </h1>
                <p className="mt-4 text-base md:text-base text-gray-500 dark:text-gray-400">
                  Nơi thưởng thức cà phê và đồ uống tuyệt hảo với không gian thoải mái, ấm cúng dành cho mọi đối tượng.
                </p>
              </div>

              <div className="space-y-6 bg-amber-50 dark:bg-amber-900/10 p-6 md:p-8 rounded-3xl border border-amber-100 dark:border-amber-900/30">
                <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-100 mb-6">Thông tin liên hệ</h2>
                
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-500">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-1">Địa chỉ</h3>
                    <p className="text-base text-gray-700 dark:text-gray-300 font-medium">{storeInfo.address}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-500">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-1">Số điện thoại / Zalo</h3>
                    <p className="text-base text-gray-700 dark:text-gray-300 font-medium font-mono">{storeInfo.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 uppercase tracking-wider mb-1">Giờ mở cửa</h3>
                    <p className="text-base text-gray-700 dark:text-gray-300 font-medium">Từ {storeInfo.open_time} đến {storeInfo.close_time} hằng ngày</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map Embedded Image/Iframe Placeholder */}
            {/* For a real map, you can embed an iframe of Google Maps using the address query. I'm using an iframe search query based on address */}
            <div className="w-full h-[500px] md:h-[600px] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white dark:border-gray-800 animate-in slide-in-from-right-8 duration-1000">
              <iframe
                title="Bản đồ quán Coffee"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(storeInfo.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                allowFullScreen
              ></iframe>
            </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
