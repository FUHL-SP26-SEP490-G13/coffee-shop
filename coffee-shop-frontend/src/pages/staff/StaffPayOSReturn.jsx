import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import orderService from "@/services/orderOnlineService";
import takeawayService from "@/services/takeAwayService";
import authenticationService from '@/services/authenticationService';
import { toast } from 'sonner';
import { ReceiptModal } from './TakeAwayOrder/ReceiptModal';

const STATUS_MAP = {
  PAID: { label: "Đã thanh toán", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Đã huỷ", color: "bg-red-100 text-red-700" },
  PENDING: { label: "Đang chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
};

export default function StaffPayOSReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const code       = searchParams.get("code");
  const cancel     = searchParams.get("cancel");
  const status     = searchParams.get("status");
  const orderCode  = searchParams.get("orderCode");
  const payosId    = searchParams.get("id");
  const origin     = searchParams.get("origin") || "/staff/pos"; // Default to Dine-in POS

  const isCancelled = cancel === "true" || status === "CANCELLED";
  const isSuccess   = !isCancelled && (code === "00" || status === "PAID");
  const isPending   = !isCancelled && !isSuccess;

  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [printerName, setPrinterName] = useState('Nhân viên');
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    authenticationService.getProfile().then((res) => {
      const user = res?.data?.id ? res.data : res?.data?.data || res?.data;
      const firstName = String(user?.first_name || '').trim();
      const lastName = String(user?.last_name || '').trim();
      const fullName = `${firstName} ${lastName}`.trim();
      setPrinterName(fullName || user?.username || user?.email || 'Nhân viên');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!orderCode || hasSaved) return;
    
    // Save transaction result to backend just like online orders
    orderService.savePayosReturn({ orderCode, payosId, status })
      .then(() => setHasSaved(true))
      .catch((err) => console.error("Lưu mã giao dịch thất bại:", err));
  }, [orderCode, payosId, status, hasSaved]);

  const handlePrintReceipt = async () => {
    setLoadingReceipt(true);
    try {
      // Use generic takeaway receipt endpoint which supports all staff order types
      const res = await takeawayService.getReceipt(orderCode);
      if (res.data?.receipt) {
        setViewingReceipt({
          ...res.data.receipt,
          printed_by: printerName,
          autoPrint: true
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi lấy dữ liệu in hóa đơn');
    } finally {
      setLoadingReceipt(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-auto bg-gray-50 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <Card className="w-full max-w-lg p-8 shadow-sm border-border space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
            {isSuccess && <CheckCircle2 className="w-20 h-20 text-green-500" strokeWidth={1.5} />}
            {isCancelled && <XCircle className="w-20 h-20 text-red-500" strokeWidth={1.5} />}
            {isPending && <Clock className="w-20 h-20 text-yellow-500" strokeWidth={1.5} />}

            <h1 className="text-2xl font-semibold text-gray-800 mt-2">
              {isSuccess  && "Thanh toán PAYOS thành công"}
              {isCancelled && "Thanh toán PAYOS đã huỷ"}
              {isPending  && "Đang chờ xác nhận thanh toán PAYOS"}
            </h1>
        </div>

        {(orderCode || payosId || status) && (
            <div className="rounded-lg bg-white border border-gray-100 divide-y divide-gray-100 text-sm shadow-sm mt-4">
                {orderCode && <InfoRow label="Mã đơn hàng" value={`#${orderCode}`} />}
                {status && (
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-gray-500 font-medium">Trạng thái</span>
                    <Badge className={STATUS_MAP[status]?.color || "bg-gray-100 text-gray-600"}>
                    {STATUS_MAP[status]?.label || status}
                    </Badge>
                </div>
                )}
            </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button asChild variant="outline" className="flex-1 h-12 gap-2 text-base">
                <Link to={origin}>
                  <ArrowLeft className="w-5 h-5" />
                  Quay lại POS
                </Link>
            </Button>
            {isSuccess && (
                <Button onClick={handlePrintReceipt} disabled={loadingReceipt} className="flex-1 h-12 gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base">
                    <Printer className="w-5 h-5" />
                    In hóa đơn
                </Button>
            )}
        </div>
      </Card>

      {viewingReceipt && (
        <ReceiptModal
          autoPrint={viewingReceipt.autoPrint}
          order={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-gray-500 font-medium">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
