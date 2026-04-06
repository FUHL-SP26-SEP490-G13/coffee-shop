import { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  PackageCheck, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  Users, 
  ShoppingBag,
  ChevronRight,
  BookOpen,
  Loader2,
  RefreshCcw
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { toast } from 'sonner';
import BaristaViewRecipe from './BaristaViewRecipe';
import baristaDBService from '@/services/baristaDBService';
import socket from '@/lib/socket';

export function BaristaOrders() {
  const [orderList, setOrderList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewRecipeItem, setViewRecipeItem] = useState(null);
  const [activeTab, setActiveTab] = useState('new');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const statuses = activeTab === 'new' ? ['pending'] : ['completed'];
      const response = await baristaDBService.getActiveOrders(statuses);
      setOrderList(response.data || []);
    } catch (error) {
      console.error('Fetch orders error:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchOrders();

    // Socket listeners for real-time updates
    const handleNewOrder = () => {
      if (activeTab === 'new') fetchOrders();
    };

    socket.on('new-order', handleNewOrder);
    socket.on('new-dine-in-order', handleNewOrder);
    socket.on('order-online:new', handleNewOrder);
    socket.on('barista:notification', handleNewOrder);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('new-dine-in-order', handleNewOrder);
      socket.off('order-online:new', handleNewOrder);
      socket.off('barista:notification', handleNewOrder);
    };
  }, [fetchOrders, activeTab]);

  // Grouping logic for "New Orders"
  const deliveryOrders = useMemo(() => orderList.filter(o => o.order_type === 'delivery'), [orderList]);
  const dineInOrders = useMemo(() => orderList.filter(o => o.order_type === 'dine-in' || o.order_type === 'at-table'), [orderList]);
  const takeawayOrders = useMemo(() => orderList.filter(o => o.order_type === 'takeaway'), [orderList]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setActionLoadingId(orderId);
      await baristaDBService.updateOrderStatus(orderId, newStatus);
      toast.success(`Đơn #${orderId} đã hoàn thành!`);
      
      // Update local state to remove the completed order from the active list
      setOrderList(prev => prev.filter(o => o.id !== orderId));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Cập nhật trạng thái thất bại');
    } finally {
      setActionLoadingId(null);
    }
  };

  const OrderCard = ({ order }) => (
    <Card 
      key={order.id} 
      className="mb-3 hover:shadow-lg transition-all duration-300 border-border cursor-pointer group overflow-hidden p-0 relative"
      onClick={() => setSelectedOrder(order)}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="font-bold text-base group-hover:text-primary transition-colors">Đơn #{order.id}</h3>
          <p className="text-xs font-semibold text-primary mt-0.5">
            {Number(order.total_amount).toLocaleString()} đ
          </p>
          <div className="flex items-center gap-1.5 mt-1 opacity-70">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">
              {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        <Button 
          size="sm" 
          variant="secondary"
          disabled={actionLoadingId === order.id}
          className="h-8 px-4 rounded-lg bg-muted text-foreground transition-all duration-300 font-bold text-xs shadow-sm
            hover:bg-primary hover:text-primary-foreground hover:scale-105 active:scale-95
            group-hover:bg-primary/90 group-hover:text-primary-foreground"
          onClick={(e) => {
            e.stopPropagation();
            handleUpdateStatus(order.id, 'completed');
          }}
        >
          {actionLoadingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Xác nhận hoàn thành'}
        </Button>
      </CardContent>
    </Card>
  );

  const KanbanColumn = ({ title, count, icon: Icon, orders: columnOrders, colorClass }) => (
    <div className="flex flex-col h-full bg-muted/20 rounded-2xl border border-border p-4">
      <div className={`flex items-center gap-3 mb-6 p-4 rounded-xl shadow-sm bg-background border border-border`}>
        <div className={`p-2 rounded-lg ${colorClass} text-white`}>
          <Icon className="w-5 h-5" />
        </div>
        <h2 className="font-bold text-lg flex-1">{title} ({count})</h2>
      </div>
      <ScrollArea className="flex-1 pr-2">
        {loading ? (
          <div className="flex items-center justify-center h-full py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : columnOrders.length > 0 ? (
          columnOrders.map(order => <OrderCard key={order.id} order={order} />)
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic border-2 border-dashed border-border rounded-xl">
            <Package className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">Trống</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-0 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted p-1 h-14 rounded-2xl w-fit">
            <TabsTrigger value="new" className="px-8 h-full rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-base font-bold">
              Đơn hàng mới {activeTab === 'new' && `(${orderList.length})`}
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-8 h-full rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-base font-bold">
              Lịch sử hoàn thành
            </TabsTrigger>
          </TabsList>

          <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-2 rounded-xl h-12 px-6">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>

        <TabsContent value="new" className="flex-1 mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-280px)] min-h-[500px]">
            <KanbanColumn 
              title="Giao hàng" 
              count={deliveryOrders.length} 
              icon={Truck} 
              orders={deliveryOrders}
              colorClass="bg-blue-500"
            />
            <KanbanColumn 
              title="Tại bàn" 
              count={dineInOrders.length} 
              icon={Users} 
              orders={dineInOrders}
              colorClass="bg-orange-500"
            />
            <KanbanColumn 
              title="Mang về" 
              count={takeawayOrders.length} 
              icon={ShoppingBag} 
              orders={takeawayOrders}
              colorClass="bg-purple-500"
            />
          </div>
        </TabsContent>

        <TabsContent value="completed" className="flex-1 mt-0 outline-none">
          <ScrollArea className="h-[calc(100vh-280px)] pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
              </div>
            ) : orderList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orderList.map(order => (
                  <Card key={order.id} className="opacity-90 bg-card border-border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold"># {order.id}</h4>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
                          Xong
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                         {new Date(order.created_at).toLocaleString('vi-VN')}
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="font-bold text-primary">{Number(order.total_amount).toLocaleString()} đ</span>
                        <Button size="xs" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedOrder(order)}>
                          Chi tiết <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">
                <PackageCheck className="w-16 h-16 mb-4 opacity-10" />
                <p className="text-lg font-medium">Chưa có đơn hàng nào hoàn thành hôm nay</p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)}>
        <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <div className="bg-primary p-6 text-primary-foreground">
            <DialogHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-black">Chi tiết đơn #{selectedOrder?.id}</DialogTitle>
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none flex gap-2">
                  <Clock className="w-3 h-3" />
                  {selectedOrder && new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </div>
              <p className="opacity-80 text-sm italic">
                {selectedOrder?.order_type === 'delivery' ? 'Giao hàng tận nơi' : 
                 selectedOrder?.order_type === 'takeaway' ? 'Khách mang về' : 'Phục vụ tại bàn'}
              </p>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-lg flex items-center gap-2 border-b pb-2">
                  <Package className="w-5 h-5 text-primary" />
                  Món trong đơn ({selectedOrder?.items?.length || 0})
                </h4>
                {selectedOrder?.items?.map((item, idx) => (
                  <div key={idx} className="bg-muted/30 p-4 rounded-2xl space-y-2 group relative border border-transparent hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{item.productName}</p>
                        <Badge variant="outline" className="mt-1 bg-background">Size {item.size}</Badge>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-xl text-primary">x {item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-white"
                          onClick={() => setViewRecipeItem({ 
                            product: { id: item.productId, name: item.productName }, 
                            size: { id: item.productSizeId, size: item.size } 
                          })}
                        >
                          <BookOpen className="w-3 h-3 mr-1" />
                          Công thức
                        </Button>
                      </div>
                    </div>
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="pt-2 border-t border-dashed">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Topping thêm:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.toppings.map((t, tid) => (
                            <span key={tid} className="text-xs bg-background border border-border px-3 py-1 rounded-full shadow-sm">
                              {t.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3 bg-blue-50 p-6 rounded-3xl border border-blue-100 shadow-inner">
                <h4 className="font-bold text-blue-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5" />
                  Ghi chú từ khách
                </h4>
                <div className="text-blue-800 text-sm italic py-2 leading-relaxed">
                  {selectedOrder?.note || "Không có ghi chú"}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-background border-t border-border mt-auto sm:justify-center flex-col gap-2">
            {selectedOrder?.status === 'pending' && (
              <Button 
                className="w-full h-16 text-xl font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-transform"
                disabled={actionLoadingId === selectedOrder.id}
                onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
              >
                {actionLoadingId === selectedOrder.id ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Xác nhận hoàn thành'}
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="ghost" className="w-full h-12 rounded-xl text-muted-foreground font-medium">Đóng cửa sổ</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recipe Modal */}
      {viewRecipeItem && (
        <BaristaViewRecipe
          open={!!viewRecipeItem}
          product={viewRecipeItem.product}
          size={viewRecipeItem.size}
          onClose={() => setViewRecipeItem(null)}
        />
      )}
    </div>
  );
}
