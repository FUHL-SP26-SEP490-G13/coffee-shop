import { useEffect, useState } from "react";
import newsletterService from "@/services/newsletterService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Mail, Search, Copy } from "lucide-react";

export default function AdminNewsletter() {
  const [emails, setEmails] = useState([]);
  const [filteredEmails, setFilteredEmails] = useState([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await newsletterService.getAll();
      const data = res.data || [];
      setEmails(data);
      setFilteredEmails(data);
    } catch (err) {
      console.error(err);
      setEmails([]);
      setFilteredEmails([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let result = [...emails];

    // Lọc theo email
    if (search.trim()) {
      const keyword = search.toLowerCase();
      result = result.filter((item) =>
        item.email.toLowerCase().includes(keyword)
      );
    }

    // Lọc theo ngày bắt đầu
    if (startDate) {
      const start = new Date(startDate);
      result = result.filter((item) => new Date(item.created_at) >= start);
    }

    // Lọc theo ngày kết thúc
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      result = result.filter((item) => new Date(item.created_at) <= end);
    }

    setFilteredEmails(result);
  }, [search, startDate, endDate, emails]);

  // 📋 Copy email
  const handleCopy = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      alert("Đã copy email!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa email này?")) return;

    try {
      await newsletterService.delete(id);

      const updated = emails.filter((e) => e.id !== id);
      setEmails(updated);
      setFilteredEmails(updated);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6 flex items-center gap-3">
        <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-semibold">Quản lý email đăng ký</h1>
      </div>

      <Card className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* FILTER SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Từ ngày"
          />

          <Input
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="Đến ngày"
          />

        </div>

        {/* TABLE */}
        {loading ? (
          <p className="text-center py-8 text-muted-foreground">Đang tải...</p>
        ) : filteredEmails.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Không có email nào phù hợp.</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Email</th>
                    <th className="text-left py-3 px-4 font-medium whitespace-nowrap">Ngày đăng ký</th>
                    <th className="text-right py-3 px-4 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmails.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4 break-all">{item.email}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(item.email)}
                          >
                            <Copy className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Copy</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4 sm:mr-1" />
                            <span className="hidden sm:inline">Xóa</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
