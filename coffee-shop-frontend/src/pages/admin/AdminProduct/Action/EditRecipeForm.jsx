import React, { useState } from "react";
import recipeService from "@/services/recipeService";
import ingredientService from "@/services/ingredientService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function EditRecipeForm({ recipe, sizeId, onSuccess, onCancel }) {
  const [ingredientId, setIngredientId] = useState(recipe.ingredient_id);
  const [quantity, setQuantity] = useState(recipe.quantity);
  const [ingredients, setIngredients] = useState([]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    ingredientService.getAll().then(res => {
      setIngredients(res?.data || []);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await recipeService.updateRecipe(recipe.id, {
        ingredient_id: ingredientId,
        quantity: quantity,
      });
      onSuccess();
    } catch (err) {
      alert("Cập nhật công thức thất bại!");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-2 border rounded p-3 bg-muted/50">
      <div className="flex items-center gap-2">
        <Select value={String(ingredientId)} onValueChange={val => setIngredientId(Number(val))}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Chọn nguyên liệu..." />
          </SelectTrigger>
          <SelectContent>
            {ingredients.map(ing => (
              <SelectItem key={ing.id} value={String(ing.id)}>{ing.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="number"
          min={0}
          step={0.1}
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="w-28"
          placeholder="Số lượng"
        />
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>Huỷ</Button>
      </div>
    </div>
  );
}
