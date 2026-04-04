import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Check } from "lucide-react";
import { adminFlashSaleService } from "@/services/adminFlashSaleService";
import productService from "@/services/productService";

export default function AdminFlashSaleModal({ isOpen, onClose, saleData, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    start_time: "",
    end_time: "",
    discount_percent: 10,
    status: "active",
    productIds: []
  });

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const res = await productService.getAll({ limit: 1000 });
        setProducts(res?.data?.items || res?.data || []);
      } catch (error) {
        console.error("Fetch products error", error);
      }
    };
    if (isOpen) {
      fetchAllProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (saleData) {
        // Format ISO string to datetime-local format (YYYY-MM-DDTHH:mm)
        const formatForInput = (dateString) => {
          if (!dateString) return "";
          const d = new Date(dateString);
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        };
        setFormData({
          title: saleData.title || "",
          start_time: formatForInput(saleData.start_time),
          end_time: formatForInput(saleData.end_time),
          discount_percent: saleData.discount_percent || 10,
          status: saleData.status || "active",
          productIds: saleData.product_ids || []
        });
      } else {
        setFormData({
          title: "",
          start_time: "",
          end_time: "",
          discount_percent: 10,
          status: "active",
          productIds: []
        });
      }
    }
  }, [isOpen, saleData]);

  if (!isOpen) return null;

  const handleToggleProduct = (productId) => {
    setFormData(prev => {
      const isSelected = prev.productIds.includes(productId);
      if (isSelected) {
        return { ...prev, productIds: prev.productIds.filter(id => id !== productId) };
      } else {
        return { ...prev, productIds: [...prev.productIds, productId] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.start_time || !formData.end_time) {
      return toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc!");
    }
    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      return toast.error("Thời gian kết thúc phải sau thời gian bắt đầu!");
    }
    if (formData.productIds.length === 0) {
      return toast.error("Vui lòng chọn ít nhất 1 sản phẩm tham gia Flash Sale!");
    }

    let loadingToastId = null;
    try {
      setLoading(true);
      loadingToastId = toast.loading("Đang lưu...");
      
      const payload = {
        ...formData,
        // Convert local datetime to UTC standard format before sending to backend if necessary
        // Backend typically accepts YYYY-MM-DD HH:mm:ss or ISO
      };

      if (saleData?.id) {
        await adminFlashSaleService.update(saleData.id, payload);
        toast.success("Cập nhật thành công!", { id: loadingToastId });
      } else {
        await adminFlashSaleService.create(payload);
        toast.success("Tạo mới thành công!", { id: loadingToastId });
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!", { id: loadingToastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 dark:border-gray-800 w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {saleData ? "Chỉnh sửa Flash Sale" : "Tạo mới Flash Sale"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:bg-gray-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          {/* Left Column: Basic Info */}
          <div className="w-full md:w-1/3 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tên chiến dịch *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border rounded-xl focus:ring-amber-500 focus:border-amber-500 outline-none"
                placeholder="Ví dụ: Giờ Vàng Ngày Lễ..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Bắt đầu *</label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-2 border rounded-xl focus:ring-amber-500 focus:border-amber-500 outline-none"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Kết thúc *</label>
              <input
                type="datetime-local"
                required
                className="w-full px-4 py-2 border rounded-xl focus:ring-amber-500 focus:border-amber-500 outline-none"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Phần trăm giảm giá (%) *</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                className="w-full px-4 py-2 border rounded-xl focus:ring-amber-500 focus:border-amber-500 outline-none"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: Number(e.target.value) })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Trạng thái</label>
              <select
                className="w-full px-4 py-2 border rounded-xl focus:ring-amber-500 focus:border-amber-500 outline-none"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Kích hoạt</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>

          {/* Right Column: Product Picker */}
          <div className="w-full md:w-2/3 flex flex-col border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Chọn sản phẩm tham gia</h3>
              <span className="text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded-md font-medium">
                Đã chọn: {formData.productIds.length} món
              </span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto bg-white dark:bg-gray-900 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px]">
              {products.length === 0 ? (
                <p className="text-sm text-gray-500 text-center col-span-2 py-8">Đang tải danh sách sản phẩm...</p>
              ) : (
                products.map(product => {
                  const isSelected = formData.productIds.includes(product.id);
                  return (
                    <div 
                      key={product.id}
                      onClick={() => handleToggleProduct(product.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? "border-amber-500 bg-amber-50/50" 
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                        isSelected ? "bg-amber-500 border-amber-500" : "bg-white dark:bg-gray-900 dark:border-gray-800 border-gray-300"
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                        {product.images && product.images[0] ? (
                          <img src={product.images[0].image_url} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category_name || "Thức uống"}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800 flex justify-end gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 dark:border-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-800"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
          >
            {loading ? "Đang lưu..." : (saleData ? "Cập nhật chiến dịch" : "Tạo chiến dịch")}
          </button>
        </div>
      </div>
    </div>
  );
}
