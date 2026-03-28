import React, { useState, useEffect } from "react";
import {
  Search,
  Table as TableIcon,
  Loader2,
  LayoutGrid,
  MapPin,
  ReceiptText,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import tableService from "@/services/tableService";
import areaService from "@/services/areaService";
import { POSModal } from "./POSModal";
// import ReservationModal from "../admin/AdminTables/ReservationModal";

function TableCard({ table, onOpenPOS, onViewOrder, onStatusChange, onTransfer }) {
  return (
    <Card
      onClick={() => onOpenPOS(table)}
      className="relative group p-5 flex flex-col items-center justify-center gap-3 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-card border-border/50 hover:border-primary/50 cursor-pointer overflow-hidden"
    >
      {table.status === "occupied" && (
        <button
          onClick={(e) => onViewOrder(e, table)}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-black/5 text-muted-foreground transition-colors z-20"
          title="Xem đơn hàng"
        >
          <ReceiptText className="w-4 h-4 text-blue-600" />
        </button>
      )}

      {/* Status Indicator Bar */}
      <div
        className={`absolute top-0 left-0 w-full h-1 ${
          table.status === "available"
            ? "bg-green-500"
            : table.status === "occupied"
            ? "bg-blue-500"
            : "bg-amber-500"
        }`}
      />

      {/* Table Number Badge */}
      <div
        className={`min-w-[4rem] h-14 px-4 rounded-2xl flex flex-col items-center justify-center transition-colors duration-300 ${
          table.status === "available"
            ? "bg-green-50"
            : table.status === "occupied"
            ? "bg-blue-50"
            : "bg-amber-50"
        }`}
      >
        <span
          className={`text-xl font-black tracking-tighter whitespace-nowrap ${
            table.status === "available"
              ? "text-green-700"
              : table.status === "occupied"
              ? "text-blue-700"
              : "text-amber-700"
          }`}
        >
          {table.code?.replace("TB-", "")}
        </span>
      </div>

      <div className="text-center space-y-0.5">
        <h3 className="text-sm font-bold text-foreground">Bàn {table.code}</h3>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
          {table.area_name}
        </p>
      </div>

      {/* Status Badge */}
      <div
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
          table.status === "available"
            ? "bg-green-50 text-green-700 border-green-200"
            : table.status === "occupied"
            ? "bg-blue-50 text-blue-700 border-blue-200"
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            table.status === "available"
              ? "bg-green-500"
              : table.status === "occupied"
              ? "bg-blue-500"
              : "bg-amber-500"
          }`}
        />
        {table.status === "available"
          ? "Trống"
          : table.status === "occupied"
          ? "Có khách"
          : "Đã đặt"}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 w-full justify-center mt-1 z-10">
        {table.status === "available" && (
          <Button
            size="sm"
            className="h-7 text-xs px-3"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(table, "occupied");
            }}
          >
            Có khách
          </Button>
        )}
        {table.status === "reserved" && (
          <Button
            size="sm"
            className="h-7 text-xs px-3"
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(table, "occupied");
            }}
          >
            Có khách
          </Button>
        )}
        {table.status === "occupied" && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-3"
              onClick={(e) => {
                e.stopPropagation();
                onStatusChange(table, "available");
              }}
            >
              Trống
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
              onClick={(e) => {
                e.stopPropagation();
                onTransfer(table);
              }}
              title="Chuyển bàn"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function StaffTables() {
  const [tables, setTables] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Reservation Modal States
  // const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  // const [tableToReserve, setTableToReserve] = useState(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const limit = 12;

  // POS Modal States
  const [selectedTableForPOS, setSelectedTableForPOS] = useState(null);
  const [isPOSModalOpen, setIsPOSModalOpen] = useState(false);

  // Order Modal States
  const [selectedTableForOrder, setSelectedTableForOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Transfer Modal States
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [tableToTransfer, setTableToTransfer] = useState(null);
  const [transferTargetId, setTransferTargetId] = useState(null);
  const [transferring, setTransferring] = useState(false);
  const [transferAreaFilter, setTransferAreaFilter] = useState("all");

  const handleOpenPOS = (table) => {
    setSelectedTableForPOS(table);
    setIsPOSModalOpen(true);
  };

  const handleOpenTransfer = (table) => {
    setTableToTransfer(table);
    setTransferTargetId(null);
    setTransferAreaFilter("all");
    setIsTransferModalOpen(true);
  };

  const handleConfirmTransfer = async () => {
    if (!tableToTransfer || !transferTargetId) return;
    setTransferring(true);
    try {
      const res = await tableService.transfer(tableToTransfer.id, transferTargetId);
      toast.success(res.message || "Chuyển bàn thành công!");
      setIsTransferModalOpen(false);
      setTableToTransfer(null);
      setTransferTargetId(null);
      fetchData();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Chuyển bàn thất bại"
      );
    } finally {
      setTransferring(false);
    }
  };

  const handleViewOrder = async (e, table) => {
    e.stopPropagation();
    setSelectedTableForOrder(table);
    setIsOrderModalOpen(true);
    setLoadingOrder(true);
    try {
      const res = await tableService.getActiveOrder(table.id);
      setActiveOrder(res.data);
    } catch (err) {
      toast.error("Không thể tải thông tin đơn hàng");
      setActiveOrder(null);
    } finally {
      setLoadingOrder(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tablesRes, areasRes] = await Promise.all([
        tableService.getAll({ status: selectedStatus }),
        areaService.getAll(),
      ]);
      setTables(tablesRes.data || []);
      setAreas(areasRes.data || []);
    } catch (error) {
      toast.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus]);

  // -- TABLE HANDLERS --
  const handleStatusChange = async (table, newStatus) => {
    try {
      await tableService.update(table.id, { status: newStatus });
      toast.success("Cập nhật trạng thái thành công");
      fetchData();
    } catch (error) {
      toast.error(error.message || "Cập nhật thất bại");
    }
  };

  // const handleReserveTable = (table) => {
  //   setTableToReserve(table);
  //   setIsReservationModalOpen(true);
  // };

  const filteredTables = tables.filter((table) => {
    const matchesSearch = table.code
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesArea =
      selectedAreaId === "all" || table.area_id.toString() === selectedAreaId;
    return matchesSearch && matchesArea;
  });

  const totalPages = Math.ceil(filteredTables.length / limit);
  const paginatedTables = filteredTables.slice(
    (page - 1) * limit,
    page * limit,
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedAreaId]);

  const currentAreaObj = areas.find((a) => a.id.toString() === selectedAreaId);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <LayoutGrid className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Theo dõi & Đặt Bàn</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* FILTERS & STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-4 lg:col-span-3 flex flex-col md:flex-row gap-4 items-center bg-white/50 backdrop-blur-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tìm theo mã bàn (VD: TB-01)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full bg-white/50"
            />
          </div>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-10 w-full md:w-64 bg-white/50">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="available">Trống</SelectItem>
              <SelectItem value="occupied">Có khách</SelectItem>
              {/* <SelectItem value="reserved">Đã đặt</SelectItem> */}
            </SelectContent>
          </Select>
        </Card>

        <Card className="p-4 flex flex-col justify-center bg-primary/5 border-primary/20">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground font-medium">
              Tổng số bàn:
            </span>
            <span className="font-bold text-primary">
              {filteredTables.length}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-muted-foreground font-medium">
              Đang trống:
            </span>
            <span className="font-bold text-green-600">
              {filteredTables.filter((t) => t.status === "available").length}
            </span>
          </div>
        </Card>
      </div>

      {/* TABS FOR AREAS AND TABLES GRID */}
      <Tabs
        value={selectedAreaId}
        onValueChange={setSelectedAreaId}
        className="w-full"
      >
        <div className="overflow-x-auto pb-2 mb-4">
          <TabsList className="inline-flex h-11 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="all" className="px-4 py-2">
              Tất cả khu vực
            </TabsTrigger>
            {areas.map((area) => (
              <TabsTrigger
                key={area.id}
                value={area.id.toString()}
                className="px-4 py-2"
              >
                {area.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value={selectedAreaId} className="mt-0">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : selectedAreaId === "all" ? (
            /* === ALL AREAS: Grouped by area === */
            <div className="space-y-8">
              {filteredTables.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-4 bg-muted/30 rounded-3xl border-2 border-dashed">
                  <TableIcon className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground font-medium text-lg">
                    Không tìm thấy bàn nào phù hợp
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedAreaId("all");
                      setSelectedStatus("all");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              ) : (
                areas.map((area) => {
                  const areaTables = filteredTables.filter(
                    (t) => t.area_id.toString() === area.id.toString()
                  );
                  if (areaTables.length === 0) return null;
                  const availableCount = areaTables.filter((t) => t.status === "available").length;
                  const occupiedCount = areaTables.filter((t) => t.status === "occupied").length;
                  return (
                    <div key={area.id}>
                      {/* Area Header */}
                      <div className="flex items-center justify-between bg-card border rounded-xl px-4 py-3 mb-4 shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg overflow-hidden bg-muted border flex-shrink-0 flex items-center justify-center">
                            {area.image ? (
                              <img
                                src={area.image}
                                alt={area.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <MapPin className="w-4 h-4 opacity-50 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <h2 className="font-bold text-base text-foreground">{area.name}</h2>
                            <p className="text-xs text-muted-foreground">{areaTables.length} bàn</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-medium">
                          <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            {availableCount} trống
                          </span>
                          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                            {occupiedCount} có khách
                          </span>
                        </div>
                      </div>

                      {/* Tables Grid for this area */}
                      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {areaTables.map((table) => (
                          <TableCard
                            key={table.id}
                            table={table}
                            onOpenPOS={handleOpenPOS}
                            onViewOrder={handleViewOrder}
                            onStatusChange={handleStatusChange}
                            onTransfer={handleOpenTransfer}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* === SPECIFIC AREA === */
            <div>
              {/* Area Info Banner */}
              {currentAreaObj && (
                <div className="flex items-center justify-between bg-card border rounded-xl p-4 mb-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border flex-shrink-0 flex items-center justify-center">
                      {currentAreaObj.image ? (
                        <img
                          src={currentAreaObj.image}
                          alt={currentAreaObj.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <MapPin className="w-6 h-6 opacity-50 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{currentAreaObj.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {filteredTables.length} bàn trong khu vực này
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium">
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                      {filteredTables.filter((t) => t.status === "available").length} trống
                    </span>
                    <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                      {filteredTables.filter((t) => t.status === "occupied").length} có khách
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {paginatedTables.length > 0 ? (
                  paginatedTables.map((table) => (
                    <TableCard
                      key={table.id}
                      table={table}
                      onOpenPOS={handleOpenPOS}
                      onViewOrder={handleViewOrder}
                      onStatusChange={handleStatusChange}
                      onTransfer={handleOpenTransfer}
                    />
                  ))
                ) : (
                  <div className="col-span-full p-20 text-center flex flex-col items-center gap-4 bg-muted/30 rounded-3xl border-2 border-dashed">
                    <TableIcon className="w-12 h-12 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium text-lg">
                      Không tìm thấy bàn nào phù hợp
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setSelectedAreaId("all");
                        setSelectedStatus("all");
                      }}
                    >
                      Xóa bộ lọc
                    </Button>
                  </div>
                )}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-4 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Trước
                  </Button>
                  <div className="flex items-center text-sm font-medium">
                    Trang {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        table={tableToReserve}
        onSuccess={fetchData}
      /> */}

      {/* POS Modal */}
      <POSModal
        isOpen={isPOSModalOpen}
        onClose={() => {
          setIsPOSModalOpen(false);
          setSelectedTableForPOS(null);
          fetchData();
        }}
        table={selectedTableForPOS}
        onTableStatusChange={(tableId, newStatus) => {
          setTables((prev) =>
            prev.map((t) => (t.id === tableId ? { ...t, status: newStatus } : t))
          );
        }}
      />

      {/* Transfer Table Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={(open) => { if (!open) { setIsTransferModalOpen(false); setTableToTransfer(null); setTransferTargetId(null); } }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
              Chuyển bàn {tableToTransfer ? `— Bàn ${tableToTransfer.code}` : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* From table info */}
            <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-4 py-3">
              <div className="bg-blue-100 text-blue-700 font-bold text-sm rounded-lg px-3 py-2">
                {tableToTransfer?.code}
              </div>
              <div>
                <p className="text-sm font-medium">Bàn hiện tại</p>
                <p className="text-xs text-muted-foreground">{tableToTransfer?.area_name}</p>
              </div>
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground mx-auto" />
              <div className="flex-1 text-right">
                {transferTargetId ? (() => {
                  const t = tables.find(x => x.id === transferTargetId);
                  return t ? (
                    <div className="inline-flex flex-col items-end">
                      <span className="text-sm font-bold text-indigo-700">{t.code}</span>
                      <span className="text-xs text-muted-foreground">{t.area_name}</span>
                    </div>
                  ) : null;
                })() : (
                  <span className="text-xs text-muted-foreground italic">Chưa chọn bàn đích</span>
                )}
              </div>
            </div>

            {/* Filter by area */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium shrink-0">Khu vực:</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setTransferAreaFilter("all")}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    transferAreaFilter === "all"
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "border-border text-muted-foreground hover:border-indigo-400"
                  }`}
                >
                  Tất cả
                </button>
                {areas.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setTransferAreaFilter(a.id.toString())}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      transferAreaFilter === a.id.toString()
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-border text-muted-foreground hover:border-indigo-400"
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Available tables grid */}
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
              {tables
                .filter(
                  (t) =>
                    t.status === "available" &&
                    t.id !== tableToTransfer?.id &&
                    (transferAreaFilter === "all" || t.area_id.toString() === transferAreaFilter)
                )
                .map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTransferTargetId(t.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      transferTargetId === t.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-border hover:border-indigo-300 bg-card"
                    }`}
                  >
                    <span className={`text-base font-black ${
                      transferTargetId === t.id ? "text-indigo-700" : "text-foreground"
                    }`}>
                      {t.code?.replace("TB-", "")}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 text-center leading-tight">
                      {t.area_name}
                    </span>
                  </button>
                ))}
              {tables.filter(
                (t) =>
                  t.status === "available" &&
                  t.id !== tableToTransfer?.id &&
                  (transferAreaFilter === "all" || t.area_id.toString() === transferAreaFilter)
              ).length === 0 && (
                <div className="col-span-4 py-8 text-center text-muted-foreground text-sm">
                  Không có bàn trống nào
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsTransferModalOpen(false)} disabled={transferring}>
              Hủy
            </Button>
            <Button
              disabled={!transferTargetId || transferring}
              onClick={handleConfirmTransfer}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {transferring ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang chuyển...</>
              ) : (
                <><ArrowLeftRight className="w-4 h-4 mr-2" />Xác nhận chuyển bàn</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Info Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Đơn hàng - {selectedTableForOrder ? `Bàn ${selectedTableForOrder.code}` : ''}</DialogTitle>
          </DialogHeader>
          {loadingOrder ? (
            <div className="py-8 flex justify-center text-primary">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : activeOrder ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="flex justify-between items-center border-b pb-3">
                <span className="font-semibold text-lg">Mã đơn: #{activeOrder.id}</span>
                <span className="text-muted-foreground text-sm">{new Date(activeOrder.created_at).toLocaleString('vi-VN')}</span>
              </div>
              <div className="space-y-4">
                {activeOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm">
                    <div className="flex-1">
                      <p className="font-medium text-base">{item.quantity} x {item.name}</p>
                      <p className="text-muted-foreground">Size {item.size}</p>
                      {item.toppings?.length > 0 && (
                        <div className="mt-1 pl-2 border-l-2 border-muted space-y-1">
                          {item.toppings.map((t, tidx) => (
                            <p key={tidx} className="text-xs text-muted-foreground">
                              + {t.name} (x{t.quantity})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="font-medium whitespace-nowrap ml-4 mt-1">
                      {parseInt(item.price * item.quantity).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                <span>Tổng cộng:</span>
                <span className="text-primary">{parseInt(activeOrder.total_amount).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <ReceiptText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Chưa có đơn hàng nào cho bàn này</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
