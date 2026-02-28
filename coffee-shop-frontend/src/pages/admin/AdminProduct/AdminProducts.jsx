import { useEffect, useState } from "react";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { products, categories } from "../../../lib/mockData";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Textarea } from "../../../components/ui/textarea";
import toppingService from "../../../services/toppingService";
import { set } from "date-fns";

export default function AdminProducts() {
  {/* Topping state*/}
  const [searchQuery, setSearchQuery] = useState("");
  const [showTopping, setShowTopping] = useState(false);
  const [isUpdateToppingOpen, setIsUpdateToppingOpen] = useState(false);
  const [updateToppingData, setUpdateToppingData] = useState(null);
  const [isDeleteToppingOpen, setIsDeleteToppingOpen] = useState(false);
  const [deleteToppingData, setDeleteToppingData] = useState(null);
  const [toppings, setToppings] = useState([]);

  // states used for "add topping" dialog
  const [isAddToppingOpen, setIsAddToppingOpen] = useState(false);
  const [newToppingName, setNewToppingName] = useState("");
  const [newToppingPrice, setNewToppingPrice] = useState("");

  {/*Product state */}

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " VND";
  };

  // fetch helper can be reused after creation
  const fetchToppings = async () => {
    try {
      const response = await toppingService.getAll();
      if (response && response.data) {
        setToppings(response.data);
      } else {
        console.error("Invalid response structure:", response);
      }
      console.log("Fetched toppings:", response);
    } catch (error) {
      console.error("Error fetching toppings:", error);
    }
  };

  useEffect(() => {
    fetchToppings();
  }, []);

  // if the user switches back to products while the dialog is open, make sure it closes
  useEffect(() => {
    if (!showTopping) {
      setIsAddToppingOpen(false);
    }
  }, [showTopping]);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredToppings = toppings.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl mb-1">
            {showTopping ? "Toppings" : "Products"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage your coffee shop menu
          </p>
        </div>
      </div>

      {/* SWITCH BUTTON */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={!showTopping ? "default" : "outline"}
          onClick={() => setShowTopping(false)}
        >
          Products
        </Button>

        <Button
          variant={showTopping ? "default" : "outline"}
          onClick={() => setShowTopping(true)}
        >
          Toppings
        </Button>
      </div>

      {/* SEARCH */}
      <div className="d-flex mb-4 justify-items-between align-items-center">
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm mr-2"
        />

        {/* giữ nguyên Add Product */}
        {!showTopping && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input placeholder="e.g., Cappuccino" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories
                        .filter((c) => c.id !== "1")
                        .map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Textarea placeholder="Product description" />
                </div>
                <div className="space-y-2">
                  <Label>Small Price ($)</Label>
                  <Input type="number" placeholder="0.00" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>Medium Price ($)</Label>
                  <Input type="number" placeholder="0.00" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>Large Price ($)</Label>
                  <Input type="number" placeholder="0.00" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input placeholder="https://..." />
                </div>
                <div className="col-span-2 flex justify-end gap-2 pt-4">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Product</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* PRODUCT TABLE (giữ nguyên) */}
        {!showTopping && (
          <div className="bg-card rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Topping</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Prices</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const category = categories.find(
                    (c) => c.id === product.categoryId,
                  );
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover bg-secondary"
                          />
                          <div>
                            <div className="text-sm">{product.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {product.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary">{category?.name}</Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          S: ${product.prices.S} • M: ${product.prices.M} • L: $
                          {product.prices.L}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            product.available
                              ? "bg-green-500/10 text-green-700 border-green-500/20"
                              : "bg-red-500/10 text-red-700 border-red-500/20"
                          }
                        >
                          {product.available ? "Available" : "Unavailable"}
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
        )}

        {/*================================ TOPPING ================================= */}

        {/* giữ nguyên Add Product */}
        {showTopping && (
          <Dialog open={isAddToppingOpen} onOpenChange={setIsAddToppingOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Topping
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Topping</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Topping Name</Label>
                  <Input
                    placeholder="e.g., Whipped Cream"
                    value={newToppingName}
                    onChange={(e) => setNewToppingName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (VNĐ)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={newToppingPrice}
                    onChange={(e) => setNewToppingPrice(e.target.value)}
                  />
                </div>
                <div className="col-span-2 flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsAddToppingOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      // create topping
                      if (!newToppingName.trim()) {
                        alert("Tên topping không được để trống");
                        return;
                      }
                      try {
                        const payload = {
                          name: newToppingName.trim(),
                          price: parseFloat(newToppingPrice) || 0,
                        };
                        const res = await toppingService.create(payload);
                        console.log("Created topping", res);
                        // refresh list
                        await fetchToppings();
                        setIsAddToppingOpen(false);
                        setNewToppingName("");
                        setNewToppingPrice("");
                      } catch (err) {
                        console.error("Error creating topping:", err);
                        alert(err?.response?.data?.message || err.message);
                      }
                    }}
                  >
                    Create Topping
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* TOPPING TABLE */}
      {showTopping && (
        <div className="bg-card rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Topping</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredToppings.map((topping) => (
                <TableRow key={topping.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {/* <img
                        src={topping.image}
                        alt={topping.name}
                        className="w-12 h-12 rounded-lg object-cover bg-secondary"
                      /> */}
                      <div>
                        <div className="text-sm">{topping.name}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {topping.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {formatVND(
                      Number.isInteger(topping.price)
                        ? topping.price
                        : parseFloat(topping.price) || 0,
                    )}
                  </TableCell>

                  {/* <TableCell>
                    <Badge
                      className={
                        topping.available
                          ? "bg-green-500/10 text-green-700 border-green-500/20"
                          : "bg-red-500/10 text-red-700 border-red-500/20"
                      }
                    >
                      {topping.available ? "Available" : "Unavailable"}
                    </Badge>
                  </TableCell> */}

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setUpdateToppingData({
                            ...topping,
                            price: String(topping.price),
                          });
                          setIsUpdateToppingOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={async () => {
                          setIsDeleteToppingOpen(true);
                          setDeleteToppingData(topping);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* DELETE TOPPING DIALOG */}
          <Dialog
            open={isDeleteToppingOpen}
            onOpenChange={setIsDeleteToppingOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Topping</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <p>Are you sure you want to delete this topping?</p>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDeleteToppingOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      await toppingService.delete(deleteToppingData.id);
                      fetchToppings();
                      setIsDeleteToppingOpen(false);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>



          {/* UPDATE TOPPING DIALOG */}
          <Dialog
            open={isUpdateToppingOpen}
            onOpenChange={setIsUpdateToppingOpen}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Update Topping</DialogTitle>
              </DialogHeader>

              {updateToppingData && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={updateToppingData.name}
                      onChange={(e) =>
                        setUpdateToppingData({
                          ...updateToppingData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Price (VNĐ)</Label>
                    <Input
                      type="number"
                      value={updateToppingData.price}
                      onChange={(e) =>
                        setUpdateToppingData({
                          ...updateToppingData,
                          price: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsUpdateToppingOpen(false)}
                    >
                      Cancel
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          const payload = {
                            name: updateToppingData.name.trim(),
                            price: Number(updateToppingData.price) || 0,
                          };

                          await toppingService.update(
                            updateToppingData.id,
                            payload,
                          );

                          await fetchToppings();

                          setIsUpdateToppingOpen(false);
                        } catch (err) {
                          console.error(err);
                          alert(err?.response?.data?.message || err.message);
                        }
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
