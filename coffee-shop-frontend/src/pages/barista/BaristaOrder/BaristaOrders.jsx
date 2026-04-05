import { useState, useMemo } from 'react';
import { 
  PackageCheck, 
  Clock, 
  CheckCircle, 
  Package, 
  Truck, 
  Users, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import { orders } from '../../../lib/mockData';
import { toast } from 'sonner';
import BaristaViewRecipe from './BaristaViewRecipe';

export function BaristaOrders() {
  const [orderList, setOrderList] = useState(orders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [viewRecipeItem, setViewRecipeItem] = useState(null);

  // Grouping logic for "New Orders"
  const activeOrders = useMemo(() => 
    orderList.filter(o => o.status !== 'completed' && o.status !== 'cancelled'),
    [orderList]
  );

  const deliveryOrders = activeOrders.filter(o => o.type === 'delivery');
  const dineInOrders = activeOrders.filter(o => o.type === 'dine-in' || o.type === 'at-table');
  const takeawayOrders = activeOrders.filter(o => o.type === 'takeaway');

  const completedOrders = useMemo(() => 
    orderList.filter(o => o.status === 'completed'),
    [orderList]
  );

  const handleUpdateStatus = (orderId, newStatus) => {
    setOrderList(prev => 
      prev.map(o => o.id === orderId ? { ...o, status: newStatus, updatedAt: new Date().toISOString() } : o)
    );
    toast.success(`Cập nhật đơn #${orderId} sang ${newStatus}`);
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(null);
    }
  };

  const OrderCard = ({ order }) => (
    <Card 
      key={order.id} 
      className="mb-3 hover:shadow-md transition-all border-border cursor-pointer group overflow-hidden"
      onClick={() => setSelectedOrder(order)}
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex flex-col">
          <h3 className="font-bold text-base">Đơn #{order.id}</h3>
          <p className="text-xs font-semibold text-primary mt-0.5">
            {Number(order.total).toLocaleString()} đ
          </p>
          <div className="flex items-center gap-1.5 mt-1 opacity-70">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">
              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        
        <Button 
          size="sm" 
          variant="secondary"
          className="h-8 px-4 rounded-lg bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all font-bold text-xs shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleUpdateStatus(order.id, 'completed');
          }}
        >
          Xác nhận
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
        {columnOrders.length > 0 ? (
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
    <div className="h-full flex flex-col p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Quản lý pha chế</h1>
        <div className="flex items-center gap-2 text-sm bg-card px-4 py-2 rounded-full border border-border shadow-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="font-medium">Đang hoạt động</span>
        </div>
      </div>

      <Tabs defaultValue="new" className="flex-1 flex flex-col space-y-6">
        <TabsList className="bg-muted p-1 h-14 rounded-2xl w-fit">
          <TabsTrigger value="new" className="px-8 h-full rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-base font-bold">
            Tất cả đơn mới ({activeOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="px-8 h-full rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm text-base font-bold">
            Tất cả đơn đã xong
          </TabsTrigger>
        </TabsList>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {completedOrders.map(order => (
                <Card key={order.id} className="opacity-75 bg-muted/50 border-border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold"># {order.id}</h4>
                      <Badge variant="secondary">Hoàn thành</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                       {new Date(order.updatedAt || order.createdAt).toLocaleString()}
                    </p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="font-semibold">{Number(order.total).toLocaleString()} đ</span>
                      <Button size="xs" variant="ghost" onClick={() => setSelectedOrder(order)}>
                        Chi tiết <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
                  {selectedOrder && new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Badge>
              </div>
              <p className="opacity-80 text-sm">Loại đơn: {selectedOrder?.type === 'delivery' ? 'Giao hàng' : selectedOrder?.type === 'dine-in' || selectedOrder?.type === 'at-table' ? 'Tại bàn' : 'Mang về'}</p>
            </DialogHeader>
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-bold text-lg flex items-center gap-2 border-b pb-2">
                  <Package className="w-5 h-5 text-primary" />
                  Món trong đơn
                </h4>
                {selectedOrder?.items.map((item, idx) => (
                  <div key={idx} className="bg-muted/30 p-4 rounded-2xl space-y-2 group relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{item.product.name}</p>
                        <Badge variant="outline" className="mt-1 bg-background">Size {item.size}</Badge>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-black text-xl text-primary">x {item.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 rounded-full border-primary/30 text-primary hover:bg-primary hover:text-white"
                          onClick={() => setViewRecipeItem(item)}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Công thức
                        </Button>
                      </div>
                    </div>
                    {item.toppings.length > 0 && (
                      <div className="pt-2 border-t border-dashed">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Topping:</p>
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

              <div className="space-y-3 bg-orange-50 p-6 rounded-3xl border border-orange-100 shadow-inner">
                <h4 className="font-bold text-orange-900 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Ghi chú
                </h4>
                <div className="text-orange-800 text-sm italic py-2 line-height-relaxed">
                  {selectedOrder?.note || "(Trống)"}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-background border-t border-border mt-auto sm:justify-center">
            {selectedOrder?.status !== 'completed' && (
              <Button 
                className="w-full h-16 text-xl font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-transform"
                onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
              >
                Xác nhận hoàn thành
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="ghost" className="w-full mt-2 h-12 rounded-xl text-muted-foreground font-medium">Đóng</Button>
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
