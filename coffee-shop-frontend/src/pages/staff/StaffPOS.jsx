import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Plus, Minus } from 'lucide-react';
import productService from '../../services/productService';
import tableService from '../../services/tableService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';

const getProductPrice = (product, size = 'M') => {
  const sizeItem = product.sizes?.find((s) => s.size === size);
  return sizeItem ? Number(sizeItem.price) : 0;
};

const getProductImage = (product) => {
  const thumbnail = product.images?.find((img) => img.isThumbnail === 1) || product.images?.[0];
  return thumbnail ? thumbnail.image_url : 'https://via.placeholder.com/150';
};

export function StaffPOS() {
  const [selectedTable, setSelectedTable] = useState('');
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, tablesRes] = await Promise.all([
          productService.getAll({ limit: 100 }),
          tableService.getAll()
        ]);
        setProducts(productsRes.data || []);
        setTables(tablesRes.data || []);
      } catch (error) {
        console.error("Error fetching POS data:", error);
        toast.error("Failed to load products or tables");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const addToCart = useCallback((product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id && item.size === 'M');
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === existingItem.id ? { ...item, quantity: item.quantity + 1 } : item
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
        return [...prevCart, newItem];
      }
    });
  }, []);

  const updateQuantity = useCallback((id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const total = cart.reduce((acc, item) => {
    const price = getProductPrice(item.product, item.size);
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

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const productGrid = useMemo(() => {
    return filteredProducts.map((product) => (
      <button
        key={product.id}
        onClick={() => addToCart(product)}
        className="bg-card rounded-xl p-3 border border-border hover:shadow-md transition-all text-left"
      >
        <div className="aspect-square bg-secondary rounded-lg mb-2 overflow-hidden">
          <img
            src={getProductImage(product)}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="text-sm mb-1 line-clamp-1">{product.name}</h3>
        <p className="text-primary">${getProductPrice(product, 'M').toFixed(2)}</p>
      </button>
    ));
  }, [filteredProducts, addToCart]);

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
          {productGrid}
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
                .filter((t) => t.code && (t.status === 'available' || t.status === 'occupied'))
                .map((table) => (
                  <SelectItem key={table.id} value={String(table.id)}>
                    {table.code}
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
                      ${(getProductPrice(item.product, item.size) * item.quantity).toFixed(2)}
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
