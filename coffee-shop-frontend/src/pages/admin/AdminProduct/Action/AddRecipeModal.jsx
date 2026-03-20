
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import ingredientService from "@/services/ingredientService";
import productSizeService from "@/services/productSizeService";
import recipeService from "@/services/recipeService";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";


const AddRecipeModal = ({ product, open, onClose, onSuccess }) => {

  const [sizes, setSizes] = useState([]);
  const [selectedSize, setSelectedSize] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [selected, setSelected] = useState([]); // [{ingredientId, name, quantity}]
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load sizes theo product
  useEffect(() => {
    if (!open || !product?.id) return;
    productSizeService.getByProduct(product.id).then(res => {
        console.log("size: " + res?.data?.length);
        
      setSizes(res?.data || []);
    });
    setSelectedSize("");
    setSelected([]);
  }, [open, product]);

  // Load ingredients
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    ingredientService.getAll().then(res => {
        console.log("ingredient: " , res?.data);
        
      setIngredients(res?.data || []);
      setLoading(false);
    });
  }, [open]);

  // Load recipe khi chọn size
  useEffect(() => {
    if (!selectedSize) return setSelected([]);
    recipeService.getByProductSize(selectedSize).then(res => {
      setSelected(
        (res?.data || []).map(r => ({
          ingredientId: r.ingredient_id,
          name: r.ingredient_name || "",
          quantity: r.quantity
        }))
      );
    });
  }, [selectedSize]);

  // Thay đổi số lượng nguyên liệu
  const handleQuantityChange = (ingredientId, name, value) => {
    setSelected(prev => {
      const exists = prev.find(i => i.ingredientId === ingredientId);
      if (exists) {
        return prev.map(i => i.ingredientId === ingredientId ? { ...i, quantity: value } : i);
      } else {
        return [...prev, { ingredientId, name, quantity: value }];
      }
    });
  };


  // Lưu recipe
  const handleSave = async () => {
    if (!selectedSize) return alert("Vui lòng chọn size!");
    setSaving(true);
    // Lọc các nguyên liệu có số lượng > 0
    let data = [];
    for (const item of selected) {
      if (!item.ingredientId || Number(item.quantity) <= 0) continue;
      data.push({ ingredient_id: item.ingredientId, quantity: item.quantity });
    }
    // Gửi từng nguyên liệu lên API
    for (const ing of data) {
      await recipeService.addIngredient(selectedSize, {
        ...ing,
        product_size_id: selectedSize
      });
    }
    setSaving(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogTitle>Thêm/Sửa công thức cho: {product?.name}</DialogTitle>
        <div className="mb-4 space-y-4">
          <div>
            <div className="font-medium mb-1">Chọn size</div>
            <Select value={selectedSize} onValueChange={setSelectedSize}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Chọn size..." />
              </SelectTrigger>
              <SelectContent>
                {sizes.map(size => (
                  <SelectItem key={size.id} value={String(size.id)}>
                    {size.size} - {Number(size.price).toLocaleString()}đ
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="font-medium mb-1">Chọn nguyên liệu và nhập số lượng</div>
            {loading ? (
              <div>Đang tải nguyên liệu...</div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {selected.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Select
                      value={item.ingredientId ? String(item.ingredientId) : ""}
                      onValueChange={val => {
                        const ing = ingredients.find(i => String(i.id) === val);
                        setSelected(prev => prev.map((s, i) => i === idx ? { ...s, ingredientId: ing.id, name: ing.name } : s));
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Chọn nguyên liệu..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ingredients.map(ing => (
                          <SelectItem key={ing.id} value={String(ing.id)}>{ing.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(() => {
                      const ingredient = ingredients.find(i => String(i.id) === String(item.ingredientId));
                      const unit = ingredient?.unit || "";
                      return (
                        <Input
                          type="number"
                          min={0}
                          step={0.1}
                          placeholder={unit ? `Số lượng (${unit})` : "Số lượng"}
                          value={item.quantity || ""}
                          onChange={e => setSelected(prev => prev.map((s, i) => i === idx ? { ...s, quantity: e.target.value } : s))}
                          className="w-28"
                        />
                      );
                    })()}
                    {(() => {
                      const ingredient = ingredients.find(i => String(i.id) === String(item.ingredientId));
                      return <span className="text-xs text-muted-foreground">{ingredient?.unit || ""}</span>;
                    })()}
                    <Button type="button" variant="ghost" size="icon-xs" onClick={() => setSelected(prev => prev.filter((_, i) => i !== idx))} title="Xóa dòng">✕</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="icon-xs" onClick={() => setSelected(prev => [...prev, { ingredientId: "", name: "", quantity: "" }])} title="Thêm nguyên liệu">＋</Button>
              </div>
            )}
            {/* Bỏ chức năng tạo mới nguyên liệu, chỉ cho chọn từ danh sách có sẵn */}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Đóng</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecipeModal;
