import { ingredients } from '../../lib/mockData';
import { AlertTriangle, Package } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';

export function StaffInventory() {
  const lowStockItems = ingredients.filter((i) => i.quantity <= i.minQuantity);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl mb-6">Inventory Stock</h2>

      {lowStockItems.length > 0 && (
        <Card className="p-4 mb-6 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-700" />
            <span className="text-sm">Low Stock Alert</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {lowStockItems.length} items need restocking
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        {ingredients.map((ingredient) => {
          const stockPercentage = (ingredient.quantity / (ingredient.minQuantity * 2)) * 100;
          const isLowStock = ingredient.quantity <= ingredient.minQuantity;

          return (
            <Card key={ingredient.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm">{ingredient.name}</h3>
                </div>
                {isLowStock && (
                  <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                    Low
                  </Badge>
                )}
              </div>

              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Stock</span>
                  <span>
                    {ingredient.quantity} {ingredient.unit}
                  </span>
                </div>
                <Progress
                  value={stockPercentage}
                  className={isLowStock ? '[&>div]:bg-yellow-500' : '[&>div]:bg-primary'}
                />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Min: {ingredient.minQuantity} {ingredient.unit}</span>
                <span>${ingredient.price}/{ingredient.unit}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
