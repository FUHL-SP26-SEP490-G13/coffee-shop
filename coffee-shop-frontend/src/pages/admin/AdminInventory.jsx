import { ingredients } from '../../lib/mockData';
import { AlertTriangle, Plus } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Progress } from '../../components/ui/progress';

export function AdminInventory() {
  const lowStockItems = ingredients.filter((i) => i.quantity <= i.minQuantity);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl mb-1">Inventory Management</h2>
          <p className="text-sm text-muted-foreground">Track and manage ingredient stock levels</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Ingredient
        </Button>
      </div>

      {lowStockItems.length > 0 && (
        <Card className="p-4 mb-6 bg-yellow-500/10 border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-700" />
            <span className="text-sm">Low Stock Alert</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {lowStockItems.length} items are running low and need restocking
          </p>
        </Card>
      )}

      <div className="bg-card rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ingredient</TableHead>
              <TableHead>Current Stock</TableHead>
              <TableHead>Min Required</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((ingredient) => {
              const stockPercentage = (ingredient.quantity / (ingredient.minQuantity * 2)) * 100;
              const isLowStock = ingredient.quantity <= ingredient.minQuantity;

              return (
                <TableRow key={ingredient.id}>
                  <TableCell>{ingredient.name}</TableCell>
                  <TableCell>
                    {ingredient.quantity} {ingredient.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ingredient.minQuantity} {ingredient.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    ${ingredient.price}/{ingredient.unit}
                  </TableCell>
                  <TableCell>
                    <div className="w-32">
                      <Progress
                        value={stockPercentage}
                        className={isLowStock ? '[&>div]:bg-yellow-500' : '[&>div]:bg-primary'}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {isLowStock ? (
                      <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                        In Stock
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Restock
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
