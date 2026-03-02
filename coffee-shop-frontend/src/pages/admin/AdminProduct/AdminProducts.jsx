import { useState, useMemo, useCallback } from "react";
import { Plus, Edit, Trash2, Coffee } from "lucide-react";

import productService from "../../../services/productService";
import categoryService from "../../../services/categoryService";
import useFetch from "../../../hooks/useFetch";

import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

export default function AdminProducts() {
  const [searchQuery, setSearchQuery] = useState("");

  // ================================
  // Fetch Products
  // ================================
  const fetchProducts = useCallback(() => {
    return productService.getAll();
  }, []);

  const {
    data: response,
    execute: refetch,
  } = useFetch(fetchProducts);

  const products = useMemo(() => response?.data || [], [response]);

  // ================================
  // Fetch Categories
  // ================================
  const fetchCategories = useCallback(() => {
    return categoryService.getAll();
  }, []);

  const { data: categoryResponse } = useFetch(fetchCategories);

  const categories = categoryResponse?.data || [];

  // ================================
  // Search Filter
  // ================================
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];

    return products.filter((p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  // ================================
  // Delete Product
  // ================================
  const handleDelete = async (product) => {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await productService.delete(product.id);
      refetch();
    } catch (error) {
      console.error("Delete product error:", error);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
        <div className="flex items-center gap-3">
          <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-semibold">Quản lý sản phẩm</h1>
        </div>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className="mb-4">
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:max-w-sm"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Danh mục</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6">
                  Không có sản phẩm nào
                </TableCell>
              </TableRow>
            )}

            {filteredProducts.map((product) => {
              const category = categories.find(
                (c) => c.id === product.category_id
              );

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover bg-secondary"
                      />
                      <div>
                        <div className="text-sm font-medium">
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {product.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary">
                      {category?.name || "Không có"}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <div className="text-sm">
                      S: {product.price_small}đ •
                      M: {product.price_medium}đ •
                      L: {product.price_large}đ
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className={
                        product.status === 'available'
                          ? "bg-green-500/10 text-green-700 border-green-500/20"
                          : "bg-red-500/10 text-red-700 border-red-500/20"
                      }
                    >
                      {product.status === 'available'
                        ? "Đang bán"
                        : "Ngừng bán"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(product)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </div>
      </div>
    </div>
  );
}