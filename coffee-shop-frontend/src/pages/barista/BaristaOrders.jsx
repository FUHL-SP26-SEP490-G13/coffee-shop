import { useState } from 'react';
import { PackageCheck, Clock, CheckCircle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { orders } from '../../lib/mockData';
import { toast } from 'sonner';

export function BaristaOrders() {
  const [orderList, setOrderList] = useState(orders);

  const takeawayOrders = orderList
    .filter((order) => order.type === 'takeaway' && order.status !== 'completed' && order.status !== 'cancelled')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const otherOrders = orderList
    .filter((order) => order.type !== 'takeaway' && order.status !== 'completed' && order.status !== 'cancelled')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const completedOrders = orderList
    .filter((order) => order.status === 'completed')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleStartOrder = (orderId) => {
    setOrderList(
      orderList.map((order) => (order.id === orderId ? { ...order, status: 'preparing' } : order))
    );
    toast.success('Order started');
  };

  const handleCompleteOrder = (orderId) => {
    setOrderList(
      orderList.map((order) => (order.id === orderId ? { ...order, status: 'ready' } : order))
    );
    toast.success('Order ready for pickup');
  };

  const handleMarkAsCompleted = (orderId) => {
    setOrderList(
      orderList.map((order) => (order.id === orderId ? { ...order, status: 'completed' } : order))
    );
    toast.success('Order completed');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'preparing':
        return 'default';
      case 'ready':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusClassName = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-700 border-transparent';
      case 'ready':
        return 'bg-green-500/10 text-green-700 border-transparent';
      default:
        return '';
    }
  };

  const OrderCard = ({ order, priority = false }) => (
    <Card key={order.id} className={priority ? 'border-primary' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                priority ? 'bg-primary text-primary-foreground' : 'bg-accent'
              }`}
            >
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">Order #{order.id}</CardTitle>
                {priority && <Badge variant="destructive">Priority</Badge>}
              </div>
              <p className="text-sm text-muted-foreground capitalize">{order.type}</p>
            </div>
          </div>
          <Badge variant={getStatusColor(order.status)} className={`capitalize ${getStatusClassName(order.status)}`}>
            {order.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {item.quantity}x {item.product.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {item.size}
                  </Badge>
                </div>
                <span className="text-muted-foreground">
                  ${(item.product.prices[item.size] * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
            {order.items.some((item) => item.toppings.length > 0) && (
              <div className="pl-4 space-y-1">
                {order.items.map(
                  (item) =>
                    item.toppings.length > 0 && (
                      <div key={item.id} className="text-xs text-muted-foreground">
                        + {item.toppings.map((t) => t.name).join(', ')}
                      </div>
                    )
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Clock className="w-3 h-3" />
            <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
            <span className="ml-auto font-medium text-foreground">Total: ${order.total.toFixed(2)}</span>
          </div>

          <div className="flex gap-2">
            {order.status === 'pending' && (
              <Button onClick={() => handleStartOrder(order.id)} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Start Order
              </Button>
            )}
            {order.status === 'preparing' && (
              <Button onClick={() => handleCompleteOrder(order.id)} className="flex-1">
                <PackageCheck className="w-4 h-4 mr-2" />
                Mark as Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button onClick={() => handleMarkAsCompleted(order.id)} className="flex-1" variant="outline">
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Order
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold">Order Management</h1>
        <p className="text-muted-foreground mt-1">Process and manage customer orders</p>
      </div>

      <Tabs defaultValue="takeaway" className="space-y-6">
        <TabsList>
          <TabsTrigger value="takeaway" className="relative">
            Takeaway Orders
            {takeawayOrders.length > 0 && (
              <Badge className="ml-2 h-5 w-5 flex items-center justify-center p-0">{takeawayOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="other">
            Other Orders
            {otherOrders.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 flex items-center justify-center p-0">
                {otherOrders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="takeaway" className="space-y-4">
          {takeawayOrders.length > 0 ? (
            takeawayOrders.map((order) => <OrderCard key={order.id} order={order} priority />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <PackageCheck className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No takeaway orders to process</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          {otherOrders.length > 0 ? (
            otherOrders.map((order) => <OrderCard key={order.id} order={order} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No other orders to process</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedOrders.length > 0 ? (
            completedOrders.map((order) => <OrderCard key={order.id} order={order} />)
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed orders yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
