import React, { useEffect, useState } from "react";
import recipeService from "@/services/recipeService";
import productSizeService from "@/services/productSizeService";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import EditRecipeForm from "./EditRecipeForm";

export default function ViewRecipeModal({ product, open, onClose }) {
  const [sizes, setSizes] = useState([]);
  const [recipesBySize, setRecipesBySize] = useState({});
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState({}); // { [recipeId]: true }

  useEffect(() => {
    if (!open || !product?.id) return;
    setLoading(true);
    productSizeService.getByProduct(product.id).then(async res => {
      const sizeList = res?.data || [];
      setSizes(sizeList);
      // Lấy công thức cho tất cả size song song
      const recipeResults = await Promise.all(
        sizeList.map(size => recipeService.getByProductSize(size.id))
      );
      const recipesMap = {};
      sizeList.forEach((size, idx) => {
        recipesMap[size.id] = recipeResults[idx]?.data || [];
      });
      setRecipesBySize(recipesMap);
      setLoading(false);
    });
  }, [open, product]);

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent>
        <DialogTitle>Xem công thức cho: {product?.name}</DialogTitle>
        <div className="mb-4 space-y-4">
          {loading ? (
            <div>Đang tải công thức...</div>
          ) : (
            sizes.length === 0 ? (
              <div>Không có size nào cho sản phẩm này.</div>
            ) : (
              sizes.map(size => (
                <div key={size.id} className="mb-4">
                  <div className="font-medium mb-1">
                    {size.size} - {Number(size.price).toLocaleString()}đ
                  </div>
                  {recipesBySize[size.id]?.length > 0 ? (
                    <ul className="space-y-1">
                      {recipesBySize[size.id].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          {editing[item.id] ? (
                            <EditRecipeForm
                              recipe={item}
                              sizeId={size.id}
                              onSuccess={async () => {
                                setEditing(e => ({ ...e, [item.id]: false }));
                                // reload all recipes for this size
                                const res = await recipeService.getByProductSize(size.id);
                                setRecipesBySize(prev => ({ ...prev, [size.id]: res?.data || [] }));
                              }}
                              onCancel={() => setEditing(e => ({ ...e, [item.id]: false }))}
                            />
                          ) : (
                            <>
                              <span>{item.ingredient_name}</span>
                              <span className="text-muted-foreground">x {item.quantity} {item.unit}</span>
                              <Button size="xs" variant="outline" onClick={() => setEditing(e => ({ ...e, [item.id]: true }))}>Edit</Button>
                              <Button size="xs" variant="destructive" onClick={async () => {
                                if (window.confirm('Bạn có chắc muốn xóa nguyên liệu này khỏi công thức?')) {
                                  await recipeService.deleteIngredient(item.id);
                                  const res = await recipeService.getByProductSize(size.id);
                                  setRecipesBySize(prev => ({ ...prev, [size.id]: res?.data || [] }));
                                }
                              }}>Xóa</Button>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-muted-foreground">Chưa có công thức cho size này.</div>
                  )}
                </div>
              ))
            )
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Đóng</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}