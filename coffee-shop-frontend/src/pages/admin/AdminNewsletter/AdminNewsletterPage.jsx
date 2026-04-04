import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Mailbox,
  Search,
  Filter,
  RefreshCw,
  Send,
  MoreVertical,
  Plus
} from "lucide-react";
import newsletterService from "@/services/newsletterService";
import BroadcastEmailModal from "./BroadcastEmailModal";
import { Button } from "@/components/ui/button";
import socket from "@/lib/socket";

function AdminNewsletterPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [filters, setFilters] = useState({
    keyword: "",
    status: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSubscribers = async (page = 1) => {
    try {
      setIsLoading(true);
      const res = await newsletterService.getAll({
        page,
        limit: pagination.limit,
        keyword: filters.keyword,
        status: filters.status,
      });
      setSubscribers(res.data);
      setPagination(res.pagination);
    } catch (error) {
      toast.error("Không thể tải danh sách email đăng ký");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, [filters.status]);

  useEffect(() => {
    // Lắng nghe sự kiện có người đăng ký mới (chạy ngầm)
    const handleNewSubscription = (data) => {
      // Nếu đang ở trang đầu, có thể tự động reload lại data để show dòng mới nhất
      if (pagination.page === 1) {
        fetchSubscribers(1);
      }
    };

    socket.on("new_newsletter_subscription", handleNewSubscription);

    return () => {
      socket.off("new_newsletter_subscription", handleNewSubscription);
    };
  }, [pagination.page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSubscribers(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchSubscribers(newPage);
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await newsletterService.toggleActive(id);
      toast.success(
        currentStatus === 1 ? "Đã tắt nhận tin" : "Đã bật lại nhận tin"
      );
      fetchSubscribers(pagination.page);
    } catch (error) {
      toast.error("Chuyển trạng thái thất bại");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold">Quản lý email marketing</h2>
            </div>
          </div>

          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo chiến dịch
          </Button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-border flex flex-col sm:flex-row justify-between gap-4">
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
          <input
            type="text"
            placeholder="Tìm kiếm bằng email..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-border dark:bg-background dark:text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            value={filters.keyword}
            onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
          />
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </form>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            className="px-3 py-2 border dark:border-border dark:bg-background dark:text-foreground rounded-lg focus:outline-none focus:border-amber-500"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="1">Đang nhận tin</option>
            <option value="0">Đã hủy/Tắt nhận tin</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-muted/50 text-gray-500 dark:text-muted-foreground text-sm border-b dark:border-border">
                <th className="px-6 py-4 font-medium text-center">STT</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Tình trạng</th>
                <th className="px-6 py-4 font-medium">Ngày đăng ký</th>
                <th className="px-6 py-4 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : subscribers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500 dark:text-muted-foreground">
                    Không có dữ liệu đăng ký nào.
                  </td>
                </tr>
              ) : (
                subscribers.map((item, index) => {
                  const stt = (pagination.page - 1) * pagination.limit + index + 1;
                  return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-muted-foreground text-center">
                      {stt}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-card-foreground">
                      {item.email}
                    </td>
                    <td className="px-6 py-4">
                      {item.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Đang nhận tin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(item.id, item.is_active)}
                        className={`text-sm tracking-wide font-medium \${
                          item.is_active 
                          ? "text-red-600 hover:text-red-800" 
                          : "text-amber-600 hover:text-amber-800"
                        }`}
                      >
                        {item.is_active ? "Dừng gửi" : "Mở lại"}
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t dark:border-border">
            <span className="text-sm text-gray-500 dark:text-muted-foreground">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
              {Math.min(
                pagination.page * pagination.limit,
                pagination.total
              )}{" "}
              trên {pagination.total} Email
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="px-3 py-1 border dark:border-border rounded hover:bg-gray-50 dark:hover:bg-muted/50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="px-3 py-1 border dark:border-border rounded hover:bg-gray-50 dark:hover:bg-muted/50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <BroadcastEmailModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

export default AdminNewsletterPage;
