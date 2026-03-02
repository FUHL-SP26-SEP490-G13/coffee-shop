import { useState, useMemo, useCallback } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

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
    loading,
    error,
    execute: refetch,
  } = useFetch(fetchProducts);

  const products = response?.data || [];

    console.log(products)

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
      refetchProducts();
    } catch (error) {
      console.error("Delete product error:", error);
    }
  };

  return (
    <div className="p-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl mb-1">Sản phẩm</h2>
          <p className="text-sm text-muted-foreground">
            Quản lý sản phẩm quán cà phê
          </p>
        </div>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Thêm sản phẩm
        </Button>
      </div>

      {/* ===== SEARCH ===== */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>


      {/* ===== TABLE ===== */}
      <div className="bg-card rounded-xl border border-border">
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
  );
}