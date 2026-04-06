import React, { useEffect, useState } from "react";
import recipeService from "@/services/recipeService";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function BaristaViewRecipe({ product, size, open, onClose }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !product?.id || !size) return;
    setLoading(true);
    // Find the productSizeId if possible, or fetch by product and filter
    // If our order item already has size information, we can try fetching by size name or id
    // Assuming size.id is available in the order item if it was fetched from DB.
    // If not, we might need more logic. 
    const fetchRecipe = async () => {
      try {
        // If size has an id (real data)
        const sizeId = size.id;
        if (sizeId) {
          const res = await recipeService.getByProductSize(sizeId);
          setRecipes(res?.data || []);
        } else {
          // If no size ID (mock data), we might just show a placeholder
          // or try a fallback if size name is "M", "S", "L" etc.
          setRecipes([]);
        }
      } catch (err) {
        console.error("Failed to fetch recipe:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [open, product, size]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogTitle>Công thức: {product?.name} ({size?.size || size})</DialogTitle>
        <div className="py-4">
          {loading ? (
            <div className="text-center py-4 text-muted-foreground animate-pulse">Đang tải công thức...</div>
          ) : recipes.length > 0 ? (
            <ul className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
              {recipes.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{item.ingredient_name}</span>
                  <span className="text-muted-foreground font-mono bg-background px-2 py-1 rounded-md border border-border">
                    {item.quantity} {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
              Chưa có công thức chi tiết cho kích thước này.
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" className="w-full">Đóng</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
