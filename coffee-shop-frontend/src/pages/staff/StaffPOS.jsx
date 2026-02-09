import { useState } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
import { products, tables } from '../../lib/mockData';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

export function StaffPOS() {
  const [selectedTable, setSelectedTable] = useState('');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.productId === product.id && item.size === 'M');
    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === existingItem.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      const newItem = {
        id: `${product.id}-${Date.now()}`,
        productId: product.id,
        product,
        size: 'M',
        quantity: 1,
        toppings: [],
      };
      setCart([...cart, newItem]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(
      cart
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce((acc, item) => {
    const price = item.product.prices[item.size];
    return acc + price * item.quantity;
  }, 0);

  const handlePlaceOrder = () => {
    if (!selectedTable) {
      toast.error('Please select a table');
      return;
    }
    toast.success('Order placed successfully!');
    setCart([]);
    setSelectedTable('');
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 grid grid-cols-3 gap-4 h-screen">
      {/* Products */}
      <div className="col-span-2 overflow-y-auto">
        <h2 className="text-xl mb-4">Point of Sale</h2>
        
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mb-4"
        />

        <div className="grid grid-cols-3 gap-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="bg-card rounded-xl p-3 border border-border hover:shadow-md transition-all text-left"
            >
              <div className="aspect-square bg-secondary rounded-lg mb-2 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-sm mb-1 line-clamp-1">{product.name}</h3>
              <p className="text-primary">${product.prices.M.toFixed(2)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-card rounded-xl p-4 border border-border flex flex-col">
        <div className="mb-4">
          <label className="text-sm mb-2 block">Table</label>
          <Select value={selectedTable} onValueChange={setSelectedTable}>
            <SelectTrigger>
              <SelectValue placeholder="Select table" />
            </SelectTrigger>
            <SelectContent>
              {tables
                .filter((t) => t.status === 'available')
                .map((table) => (
                  <SelectItem key={table.id} value={table.id}>
                    Table {table.number} ({table.capacity} seats)
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto mb-4">
          {cart.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 text-sm">
              Add items to start order
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="bg-secondary rounded-lg p-2">
                  <div className="text-sm mb-1 line-clamp-1">{item.product.name}</div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 rounded bg-card flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 rounded bg-card flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-sm text-primary">
                      ${(item.product.prices[item.size] * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="text-primary text-lg">${total.toFixed(2)}</span>
          </div>
          <Button onClick={handlePlaceOrder} className="w-full" disabled={cart.length === 0}>
            Place Order
          </Button>
        </div>
      </div>
    </div>
  );
}
