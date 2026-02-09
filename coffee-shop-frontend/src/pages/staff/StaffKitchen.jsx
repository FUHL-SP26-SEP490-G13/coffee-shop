import { orders } from '../../lib/mockData';
import { Clock, CheckCircle } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

export function StaffKitchen() {
  const activeOrders = orders.filter((o) => ['pending', 'preparing'].includes(o.status));

  const getStatusColor = (status) => {
    return status === 'pending' ? 'bg-yellow-500' : 'bg-blue-500';
  };

  const getTimePassed = (createdAt) => {
    const minutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
    return `${minutes} min ago`;
  };

  return (
    <div className="p-4">
      <h2 className="text-xl mb-6">Kitchen Display</h2>

      <div className="grid grid-cols-3 gap-4">
        {activeOrders.map((order) => (
          <div
            key={order.id}
            className="bg-card rounded-xl p-4 border-2 border-border shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg mb-1">Order #{order.id}</h3>
                {order.tableNumber && (
                  <Badge variant="outline">Table {order.tableNumber}</Badge>
                )}
              </div>
              <div className="text-right">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(order.status)} mb-1`}></div>
                <span className="text-xs text-muted-foreground">
                  {getTimePassed(order.createdAt)}
                </span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-secondary rounded-lg p-3"
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-sm">{item.product.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      x{item.quantity}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Size: {item.size}</div>
                  {item.toppings.length > 0 && (
                    <div className="text-xs text-accent-foreground bg-accent/20 rounded mt-1 px-2 py-1">
                      + {item.toppings.map((t) => t.name).join(', ')}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-xs italic text-muted-foreground mt-1">
                      Note: {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {order.status === 'pending' ? (
              <Button className="w-full" variant="outline">
                <Clock className="w-4 h-4 mr-2" />
                Start Preparing
              </Button>
            ) : (
              <Button className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Ready
              </Button>
            )}
          </div>
        ))}

        {activeOrders.length === 0 && (
          <div className="col-span-3 text-center py-12">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">All caught up! No pending orders.</p>
          </div>
        )}
      </div>
    </div>
  );
}
