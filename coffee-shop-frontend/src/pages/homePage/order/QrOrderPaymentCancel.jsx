import React, { useEffect } from "react";
import { XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function QrOrderPaymentCancel() {
  useEffect(() => {
    // Xoá cart khỏi sessionStorage vì khách đã huỷ — không cần gọi backend
    sessionStorage.removeItem("qr_pending_cart");
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 px-4 py-12 items-center justify-center">
      <Card className="w-full max-w-md p-8 shadow-xl border-none bg-white dark:bg-gray-900 rounded-3xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
            <XCircle className="w-16 h-16 text-red-500" strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Thanh toán thất bại
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Giao dịch của bạn đã bị hủy hoặc không thể hoàn tất. Vui lòng thử lại hoặc liên hệ với nhân viên để được hỗ trợ.
            </p>
          </div>

          <div className="w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
              <Badge className="bg-red-100 text-red-700 border-none">Đã hủy</Badge>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
