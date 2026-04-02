import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Clock, Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import orderService from "@/services/orderOnlineService";
import staffOrderService from "@/services/orderService";
import takeawayService from "@/services/takeAwayService";
import tableService from "@/services/tableService";
import authenticationService from '@/services/authenticationService';
import { toast } from 'sonner';
import { ReceiptModal } from './TakeAwayOrder/ReceiptModal';

const STATUS_MAP = {
  PAID: { label: "Đã thanh toán", color: "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" },
  CANCELLED: { label: "Đã huỷ", color: "bg-red-100 dark:bg-red-900/40 text-red-700" },
  PENDING: { label: "Đang chờ xử lý", color: "bg-yellow-100 text-yellow-700" },
};

export default function StaffPayOSReturn() {
  const [searchParams] = useSearchParams();

  const code       = searchParams.get("code");
  const cancel     = searchParams.get("cancel");
  const status     = searchParams.get("status");
  const orderCode  = searchParams.get("orderCode");
  const payosId    = searchParams.get("id");
  const debtPay    = searchParams.get("debtPay") === "1";
  const tableId    = Number(searchParams.get("tableId") || 0);
  const tableCode  = searchParams.get("tableCode") || "";
  const debtAmount = Number(searchParams.get("debtAmount") || 0);
  const orderId    = Number(searchParams.get("orderId") || 0);
  const origin     = searchParams.get("origin") || "/staff/pos"; // Default to Dine-in POS

  const isCancelled = cancel === "true" || status === "CANCELLED";
  const isSuccess   = !isCancelled && (code === "00" || status === "PAID");
  const isPending   = !isCancelled && !isSuccess;

  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [printerName, setPrinterName] = useState('Nhân viên');
  const [loadingReceipt, setLoadingReceipt] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSettlingDebt, setIsSettlingDebt] = useState(false);
  const [settledDebtAmount, setSettledDebtAmount] = useState(0);
  const [hasSettledDebt, setHasSettledDebt] = useState(false);
  const [debtReceiptTemplate, setDebtReceiptTemplate] = useState(null);

  const buildDebtReceiptOrder = async ({
    tableId,
    tableCode,
    paymentMethod,
    fallbackAmount = 0,
    orderId = null,
  }) => {
    const unpaidRes = await tableService.getUnpaidOrders(tableId);
    let unpaidOrders = unpaidRes?.data || [];

    if (orderId) {
      unpaidOrders = unpaidOrders.filter((o) => Number(o.id) === Number(orderId));
    }

    const detailedOrders = await Promise.all(
      unpaidOrders.map(async (order) => {
        try {
          const detailRes = await staffOrderService.getOrderDetailForStaff(order.id);
          return detailRes?.data || null;
        } catch {
          return null;
        }
      })
    );

    const validOrders = detailedOrders.filter(Boolean);
    const orderIds = (validOrders.length > 0 ? validOrders : unpaidOrders)
      .map((order) => Number(order.id || 0))
      .filter((id) => id > 0);

    if (orderIds.length === 0) {
      throw new Error("Không lấy được mã đơn hàng");
    }

    const orderCodeText =
      orderIds.length > 0
        ? orderIds.length === 1
          ? `#${orderIds[0]}`
          : orderIds.map((id) => `#${id}`).join(", ")
        : orderId
          ? `#${Number(orderId)}`
          : "#N/A";

    let items = validOrders.flatMap((order) =>
      (order.items || []).map((item) => ({
        product_name: item.name || item.product_name || "",
        size: item.size || "M",
        quantity: Number(item.quantity || 0),
        unit_price: Number(item.price || item.unit_price || 0),
        toppings: (item.toppings || []).map((t) => ({
          name: t.name,
          quantity: Number(t.quantity || 0),
          price: Number(t.price || 0),
        })),
        note: item.note || "",
      }))
    );

    const totalAmountFromOrders = validOrders.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    );
    const totalAmount = Number(totalAmountFromOrders || fallbackAmount || 0);
    items = items.filter((item) => item.product_name && item.quantity > 0 && item.unit_price >= 0);

    if (items.length === 0) {
      throw new Error("Không lấy được tên sản phẩm đã bán");
    }

    return {
      order_id: orderIds[0] || Number(orderId || Date.now()),
      order_code: orderCodeText,
      created_at: new Date().toISOString(),
      order_type: "dine-in",
      receiver_name: `Khách bàn ${tableCode || tableId}`,
      payment_method: paymentMethod,
      printed_by: printerName,
      items,
      total_amount: totalAmount,
      payment: {
        method: paymentMethod,
        status: "paid",
      },
      autoPrint: true,
    };
  };

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
    if (!orderCode || hasSaved || debtPay) return;
    
    // Save transaction result to backend just like online orders
    orderService.savePayosReturn({ orderCode, payosId, status, cancel })
      .then(() => setHasSaved(true))
      .catch((err) => console.error("Lưu mã giao dịch thất bại:", err));
  }, [orderCode, payosId, status, cancel, hasSaved, debtPay]);

  useEffect(() => {
    if (!debtPay || !isSuccess || hasSettledDebt || !tableId) return;

    const settleDebt = async () => {
      setIsSettlingDebt(true);
      try {
        const receiptOrder = await buildDebtReceiptOrder({
          tableId,
          tableCode,
          paymentMethod: "payos",
          fallbackAmount: debtAmount,
          orderId: orderId > 0 ? orderId : null,
        });

        const payload = { payment_method: "payos" };
        if (orderId > 0) payload.order_ids = [orderId];

        const res = await tableService.settleDebt(tableId, payload);
        setSettledDebtAmount(Number(res?.data?.debt_amount || debtAmount || 0));
        setDebtReceiptTemplate(receiptOrder);
        setHasSettledDebt(true);
      } catch (err) {
        toast.error(err?.response?.data?.message || "Không thể chốt thanh toán sau PayOS");
      } finally {
        setIsSettlingDebt(false);
      }
    };

    settleDebt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debtPay, isSuccess, hasSettledDebt, tableId, tableCode, orderId, debtAmount, printerName]);

  const handlePrintReceipt = async () => {
    setLoadingReceipt(true);
    try {
      if (debtPay) {
        const receiptOrder = debtReceiptTemplate || await buildDebtReceiptOrder({
          tableId,
          tableCode,
          paymentMethod: "payos",
          fallbackAmount: settledDebtAmount || debtAmount,
          orderId: orderId > 0 ? orderId : null,
        });
        setViewingReceipt(receiptOrder);
        return;
      }

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
    <div className="flex-1 p-6 md:p-8 overflow-auto bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center min-h-[calc(100vh-80px)]">
      <Card className="w-full max-w-lg p-8 shadow-sm dark:shadow-none border-border space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
            {isSuccess && <CheckCircle2 className="w-20 h-20 text-green-500" strokeWidth={1.5} />}
            {isCancelled && <XCircle className="w-20 h-20 text-red-500" strokeWidth={1.5} />}
            {isPending && <Clock className="w-20 h-20 text-yellow-500" strokeWidth={1.5} />}

            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-2">
              {isSuccess  && "Thanh toán PAYOS thành công"}
              {isCancelled && "Thanh toán PAYOS đã huỷ"}
              {isPending  && "Đang chờ xác nhận thanh toán PAYOS"}
            </h1>
        </div>

        {(orderCode || payosId || status) && (
            <div className="rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 text-sm shadow-sm dark:shadow-none mt-4">
                {orderCode && <InfoRow label="Mã đơn hàng" value={`#${orderCode}`} />}
            {debtPay && tableId > 0 && <InfoRow label="Bàn" value={tableCode || `#${tableId}`} />}
                {status && (
                <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">Trạng thái</span>
                    <Badge className={STATUS_MAP[status]?.color || "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}>
                    {STATUS_MAP[status]?.label || status}
                    </Badge>
                </div>
                )}
            </div>
        )}

        {debtPay && isSuccess && (
          <div className="rounded-lg border border-blue-100 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
            {isSettlingDebt
              ? "Đang chốt thanh toán sau PayOS..."
              : "Đã chốt thanh toán thành công. Bạn có thể in hóa đơn."}
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
                <Button onClick={handlePrintReceipt} disabled={loadingReceipt || (debtPay && (isSettlingDebt || !hasSettledDebt))} className="flex-1 h-12 gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base">
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
      <span className="text-gray-500 dark:text-gray-400 font-medium">{label}</span>
      <span className="font-semibold text-gray-800 dark:text-gray-200">{value}</span>
    </div>
  );
}
