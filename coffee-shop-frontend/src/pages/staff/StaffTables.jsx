import React, { useState, useEffect } from "react";
import {
  Search,
  Table as TableIcon,
  Loader2,
  LayoutGrid,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
// import ReservationModal from "../admin/AdminTables/ReservationModal";

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
          {/* Area display if a specific area is selected */}
          {selectedAreaId !== "all" && currentAreaObj && (
            <div className="flex items-center justify-between bg-card border rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border flex-shrink-0 flex items-center justify-center">
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
                  <h3 className="font-semibold text-lg">
                    {currentAreaObj.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredTables.length} bàn trong khu vực này
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Đang tải...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {paginatedTables.length > 0 ? (
                paginatedTables.map((table) => (
                  <Card
                    key={table.id}
                    className="relative group p-6 flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl bg-card border-border/50 hover:border-primary/50 cursor-default overflow-hidden"
                  >
                    {/* Status Indicator Bar */}
                    <div
                      className={`absolute top-0 left-0 w-full h-1 ${table.status === "available"
                          ? "bg-green-500"
                          : table.status === "occupied"
                            ? "bg-blue-500"
                            : "bg-amber-500"
                        }`}
                    />

                    {/* Table Identity */}
                    <div
                      className={`min-w-[4rem] h-16 px-4 rounded-2xl flex flex-col items-center justify-center transition-colors duration-300 ${table.status === "available"
                          ? "bg-green-50"
                          : table.status === "occupied"
                            ? "bg-blue-50"
                            : "bg-amber-50"
                        }`}
                    >
                      <span
                        className={`text-xl font-black tracking-tighter whitespace-nowrap ${table.status === "available"
                            ? "text-green-700"
                            : table.status === "occupied"
                              ? "text-blue-700"
                              : "text-amber-700"
                          }`}
                      >
                        {table.code?.replace("TB-", "")}
                      </span>
                    </div>

                    <div className="text-center space-y-1">
                      <h3 className="text-sm font-bold text-foreground flex items-center justify-center gap-1">
                        Bàn {table.code}
                      </h3>
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest text-center">
                        {table.area_name}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${table.status === "available"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : table.status === "occupied"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full animate-pulse ${table.status === "available"
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

                    {/* Staff Status Actions */}
                    <div className="flex gap-2 w-full justify-center mt-2 z-10 transition-all duration-300">
                      {table.status === "available" && (
                        <>
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(table, "occupied"); }}>Có khách</Button>
                          {/* <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleReserveTable(table); }}>Đã đặt</Button> */}
                        </>
                      )}
                      {table.status === "reserved" && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(table, "occupied"); }}>Có khách</Button>
                      )}
                      {table.status === "occupied" && (
                        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleStatusChange(table, "available"); }}>Trống</Button>
                      )}
                    </div>
                  </Card>
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
          )}

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
        </TabsContent>
      </Tabs>

      {/* <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        table={tableToReserve}
        onSuccess={fetchData}
      /> */}
    </div>
  );
}
