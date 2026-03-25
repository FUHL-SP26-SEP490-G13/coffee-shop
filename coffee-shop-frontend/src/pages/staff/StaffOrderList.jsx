import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, ShoppingBag, Truck, Bell, Printer, Table, Table2, Coffee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import socket from '@/lib/socket';
import baristaDBService from '@/services/baristaDBService';
import orderOnlineService from '@/services/orderOnlineService';
import authenticationService from '@/services/authenticationService';
import { ReceiptModal } from './TakeAwayOrder/ReceiptModal';

const ACTIVE_STATUSES = ['pending', 'preparing', 'served'];

const statusLabelMap = {
  pending: 'Chờ xử lý',
  preparing: 'Đang chuẩn bị',
  served: 'Sẵn sàng giao',
};

const statusClassMap = {
  pending: 'bg-amber-100 text-amber-700',
  preparing: 'bg-blue-100 text-blue-700',
  served: 'bg-emerald-100 text-emerald-700',
};

const orderTypeLabelMap = {
  delivery: 'Đơn giao hàng',
  'dine-in': 'Tại bàn',
  takeaway: 'Mang về',
};

const normalizeOrderType = (value) => {
  const type = String(value || '').toLowerCase();
  if (type === 'dinein') return 'dine-in';
  if (type === 'take-away') return 'takeaway';
  if (type === 'dine-in' || type === 'delivery' || type === 'takeaway') {
    return type;
  }
  return type;
};

const getOrderTypeLabel = (value) => {
  const type = normalizeOrderType(value);
  return orderTypeLabelMap[type] || type || '--';
};

const isDeliveryOrder = (order) => normalizeOrderType(order?.order_type) === 'delivery';

const money = (value) => Number(value || 0).toLocaleString('vi-VN') + ' đ';

const getDisplayName = (user) => {
  const firstName = String(user?.first_name || '').trim();
  const lastName = String(user?.last_name || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || user?.username || user?.email || 'Nhân viên';
};

const isOrderPaid = (order) => {
  const paymentStatus = String(
    order?.payment_status || order?.payment?.status || ''
  ).toLowerCase();
  if (paymentStatus === 'paid') return true;

  return (
    order?.is_paid === true ||
    order?.is_paid === 1 ||
    order?.is_paid === '1'
  );
};

const dateTime = (value) => {
  if (!value) return '--';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '--';

  return parsed.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export function OrderDelivery() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [cancelingId, setCancelingId] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeOrderType, setActiveOrderType] = useState('delivery');
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [viewingReceipt, setViewingReceipt] = useState(null);
  const [printerName, setPrinterName] = useState('Nhân viên');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await baristaDBService.getActiveOrders();
      const list = res?.data?.data || res?.data || [];

      const activeOrders = (Array.isArray(list) ? list : [])
        .filter((order) => ACTIVE_STATUSES.includes(order?.status))
        .sort(
          (a, b) =>
            new Date(b?.created_at || 0).getTime() -
            new Date(a?.created_at || 0).getTime()
        );

      setOrders(activeOrders);
    } catch (error) {
      toast.error('Không tải được danh sách Order List');
      console.error('Load order list failed:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authenticationService.getProfile();
        const user = res?.data?.id ? res.data : res?.data?.data || res?.data;
        setPrinterName(getDisplayName(user));
      } catch {
        setPrinterName('Nhân viên');
      }
    };

    loadProfile();
  }, []);

  // Socket listener for new delivery orders
  useEffect(() => {
    const handleNewDeliveryOrder = (data) => {
      setNewOrderCount((prev) => prev + 1);
      toast.success(`🔔 Có đơn giao hàng mới! (#${data.order_id})`);
      // Auto-reload orders
      loadOrders();
    };

    if (!socket.connected) {
      socket.connect();
    }

    socket.on('new-delivery-order', handleNewDeliveryOrder);

    return () => {
      socket.off('new-delivery-order', handleNewDeliveryOrder);
    };
  }, [loadOrders]);

  const orderTypeCounts = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const type = normalizeOrderType(order?.order_type);
        if (type in acc) {
          acc[type] += 1;
        }
        return acc;
      },
      { delivery: 0, 'dine-in': 0, takeaway: 0 }
    );
  }, [orders]);

  const ordersByType = useMemo(() => {
    return orders.filter(
      (order) => normalizeOrderType(order?.order_type) === activeOrderType
    );
  }, [orders, activeOrderType]);

  const counts = useMemo(() => {
    return ordersByType.reduce(
      (acc, order) => {
        const status = order?.status;
        if (ACTIVE_STATUSES.includes(status)) {
          acc[status] += 1;
        }
        return acc;
      },
      { pending: 0, preparing: 0, served: 0 }
    );
  }, [ordersByType]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') {
      return ordersByType;
    }

    return ordersByType.filter((order) => order.status === activeTab);
  }, [ordersByType, activeTab]);

  const handleConfirmOrder = async (order) => {
    setConfirmingId(order.id);
    try {
      await orderOnlineService.confirmPreparing(order.id);
      if (Number(order.is_paid) === 0) {
        toast.success('Đã xác nhận với khách hàng, chuyển đơn sang đang chuẩn bị');
      } else {
        toast.success('Đã chuyển đơn sang trạng thái đang chuẩn bị');
      }
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể xác nhận đơn');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    setCancelingId(orderId);
    try {
      await orderOnlineService.cancelByStaff(orderId);
      toast.success('Đã hủy đơn giao hàng');
      await loadOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Không thể hủy đơn');
    } finally {
      setCancelingId(null);
    }
  };

  const openDetailModal = async (order) => {
    setIsDetailOpen(true);

    if (!isDeliveryOrder(order)) {
      setDetailLoading(false);
      setSelectedOrder(order);
      return;
    }

    setDetailLoading(true);
    try {
      const res = await orderOnlineService.getStaffOrderDetail(order.id);
      setSelectedOrder(res?.data?.data || res?.data || null);
    } catch (error) {
      setSelectedOrder(null);
      toast.error(
        error?.response?.data?.message || 'Không tải được chi tiết đơn giao'
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handlePrintReceipt = async (orderId) => {
    try {
      const res = await orderOnlineService.getStaffOrderDetail(orderId);
      const orderData = res?.data?.data || res?.data;
      if (orderData) {
        setViewingReceipt({
          ...orderData,
          order_id: orderData.id,
          order_code: `DL-${String(orderData.id).padStart(6, '0')}`,
          total_amount: orderData.total_amount,
          receiver_name: orderData.receiver_name,
          receiver_phone: orderData.receiver_phone,
          printed_by: printerName,
        });
      } else {
        toast.error('Không tải được chi tiết hóa đơn');
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Lỗi tải hóa đơn');
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Order List</h2>
          {newOrderCount > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              {newOrderCount} đơn mới
            </Badge>
          )}
        </div>

        <Button 
          onClick={() => {
            setNewOrderCount(0);
            loadOrders();
          }} 
          disabled={loading} 
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeOrderType === 'delivery' ? 'default' : 'outline'}
          onClick={() => {
            setActiveOrderType('delivery');
            setActiveTab('all');
          }}
        >
          <Truck className="mr-1 h-3 w-3" />
          ĐƠN GIAO HÀNG ({orderTypeCounts.delivery})
        </Button>
        <Button
          variant={activeOrderType === 'dine-in' ? 'default' : 'outline'}
          onClick={() => {
            setActiveOrderType('dine-in');
            setActiveTab('all');
          }}
        >
          <Coffee className="mr-1 h-3 w-3" />

          ĐƠN TẠI BÀN ({orderTypeCounts['dine-in']})
        </Button>
        <Button
          variant={activeOrderType === 'takeaway' ? 'default' : 'outline'}
          onClick={() => {
            setActiveOrderType('takeaway');
            setActiveTab('all');
          }}
        >
          <ShoppingBag className="mr-1 h-3 w-3" />

          ĐƠN MANG ĐI ({orderTypeCounts.takeaway})
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Chờ xử lý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{counts.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Đang chuẩn bị
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{counts.preparing}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sẵn sàng giao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{counts.served}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Tất cả ({ordersByType.length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ xử lý ({counts.pending})</TabsTrigger>
          <TabsTrigger value="preparing">Đang chuẩn bị ({counts.preparing})</TabsTrigger>
          <TabsTrigger value="served">Sẵn sàng giao ({counts.served})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredOrders.map((order) => {
            const paid = isOrderPaid(order);
            const deliveryOrder = isDeliveryOrder(order);
            const isUnpaidPending = order.status === 'pending' && !paid;
            const isPending = order.status === 'pending';

            return (
              <Card key={order.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {deliveryOrder ? (
                        <Truck className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Coffee className="h-4 w-4 text-muted-foreground" />
                      )}
                      <p className="font-medium">Đơn #{order.id}</p>
                      <Badge variant="secondary">{getOrderTypeLabel(order.order_type)}</Badge>
                      <Badge className={statusClassMap[order.status] || ''}>
                        {statusLabelMap[order.status] || order.status}
                      </Badge>
                      <Badge variant={paid ? 'default' : 'outline'}>
                        {paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">{dateTime(order.created_at)}</div>
                  </div>

                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    <p>
                      Tổng món: <span className="font-medium text-foreground">{order.itemCount || 0}</span>
                    </p>
                    <p>
                      Tổng tiền: <span className="font-medium text-foreground">{money(order.total_amount)}</span>
                    </p>
                  </div>

                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    <div className="space-y-2 rounded-md border p-3">
                      {order.items.map((item, idx) => (
                        <div
                          key={`${order.id}-${item.productName || item.name || idx}-${idx}`}
                          className="flex items-start justify-between gap-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">{item.productName || item.name || item.product_name || 'Sản phẩm'}</p>
                            <p className="text-muted-foreground">
                              Size {item.size} • x{item.quantity}
                            </p>
                            {Array.isArray(item.toppings) && item.toppings.length > 0 ? (
                              <p className="text-muted-foreground">
                                Topping: {item.toppings
                                  .map((top) => `${top.name} x${top.quantity || 1}`)
                                  .join(', ')}
                              </p>
                            ) : null}
                            {item.note ? (
                              <p className="text-muted-foreground">Ghi chú: {item.note}</p>
                            ) : null}
                          </div>
                          <p className="text-muted-foreground">{money(item.price || item.total_price)}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" onClick={() => openDetailModal(order)}>
                      Xem chi tiết
                    </Button>

                    {deliveryOrder && isUnpaidPending ? (
                      <>
                        <Button
                          variant="destructive"
                          onClick={() => handleCancelOrder(order.id)}
                          disabled={cancelingId === order.id}
                        >
                          {cancelingId === order.id ? 'Đang hủy...' : 'Hủy đơn'}
                        </Button>
                        <Button
                          onClick={() => handleConfirmOrder(order)}
                          disabled={confirmingId === order.id}
                        >
                          {confirmingId === order.id ? 'Đang xác nhận...' : 'Xác nhận với khách hàng'}
                        </Button>
                      </>
                    ) : deliveryOrder && isPending ? (
                      <Button
                        onClick={() => handleConfirmOrder(order)}
                        disabled={confirmingId === order.id}
                      >
                        {confirmingId === order.id ? 'Đang xác nhận...' : 'Xác nhận chuẩn bị'}
                      </Button>
                    ) : deliveryOrder && order.status === 'served' ? (
                      <Button
                        onClick={() => handlePrintReceipt(order.id)}
                        className="gap-2"
                      >
                        <Printer size={16} />
                        In hóa đơn
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {!loading && filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Không có đơn {getOrderTypeLabel(activeOrderType)} trong trạng thái đã chọn.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Chi tiết đơn {getOrderTypeLabel(selectedOrder?.order_type)} #{selectedOrder?.id || '--'}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <p className="text-sm text-muted-foreground">Đang tải chi tiết...</p>
          ) : selectedOrder ? (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              <div className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-2">
                <p>
                  Người nhận: <span className="font-medium">{selectedOrder.receiver_name || '--'}</span>
                </p>
                <p>
                  Số điện thoại: <span className="font-medium">{selectedOrder.receiver_phone || '--'}</span>
                </p>
                <p>
                  Email: <span className="font-medium">{selectedOrder.receiver_email || '--'}</span>
                </p>
                <p>
                  Địa chỉ: <span className="font-medium">{selectedOrder.address || '--'}</span>
                </p>
                <p>
                  Phương thức thanh toán:{' '}
                  <span className="font-medium">
                    {selectedOrder.payment_method === 'payos'
                      ? 'PayOS'
                      : selectedOrder.payment_method === 'cash'
                        ? 'Tiền mặt'
                        : '--'}
                  </span>
                </p>
                <p>
                  Trạng thái thanh toán:{' '}
                  <span className="font-medium">
                    {isOrderPaid(selectedOrder) ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </p>
                {selectedOrder.note ? (
                  <p className="sm:col-span-2">
                    Ghi chú đơn hàng: <span className="font-medium">{selectedOrder.note}</span>
                  </p>
                ) : null}
                {isDeliveryOrder(selectedOrder) && selectedOrder.receiver_name && (
                  <div className="sm:col-span-2 border-t pt-3 mt-3">
                    <button
                      onClick={() => {
                        setViewingReceipt({
                          ...selectedOrder,
                          order_id: selectedOrder.id,
                          order_code: `DL-${String(selectedOrder.id).padStart(6, '0')}`,
                          total_amount: selectedOrder.total_amount,
                          receiver_name: selectedOrder.receiver_name,
                          receiver_phone: selectedOrder.receiver_phone,
                          printed_by: printerName,
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium"
                    >
                      <Printer size={16} />
                      In hóa đơn
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2 rounded-md border p-3">
                <p className="text-sm font-semibold">Danh sách món và topping</p>
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item) => (
                    <div
                      key={`${selectedOrder.id}-${item.id || item.product_name || item.name}`}
                      className="rounded-md border p-2 text-sm"
                    >
                      <p className="font-medium">{item.name || item.productName || item.product_name || 'Sản phẩm'}</p>
                      <p className="text-muted-foreground">
                        Size {item.size} • x{item.quantity} • {money(item.price || item.total_price)}
                      </p>
                      {Array.isArray(item.toppings) && item.toppings.length > 0 ? (
                        <p className="text-muted-foreground">
                          Topping: {item.toppings
                            .map((top) => `${top.name} x${top.quantity || 1}`)
                            .join(', ')}
                        </p>
                      ) : (
                        <p className="text-muted-foreground">Không có topping</p>
                      )}
                      {item.note ? (
                        <p className="text-muted-foreground">Ghi chú: {item.note}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Đơn chưa có sản phẩm.</p>
                )}
              </div>

              <div className="flex justify-end">
                <p className="text-sm">
                  Tổng tiền: <span className="font-semibold">{money(selectedOrder.total_amount)}</span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Không có dữ liệu chi tiết.</p>
          )}
        </DialogContent>
      </Dialog>

      {viewingReceipt && (
        <ReceiptModal
          order={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
        />
      )}
    </div>
  );
}
