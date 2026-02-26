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

  // 🔎 Lọc
  const handleFilter = () => {
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
  };

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
    <div className="max-w-6xl">
      <div className="mb-6 flex items-center gap-3">
        <Mail className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-semibold mb-1">Quản lý email đăng ký</h1>
      </div>

      <Card className="p-6 space-y-6">
        {/* FILTER SECTION */}
        <div className="grid md:grid-cols-4 gap-3">
          <Input
            placeholder="Tìm kiếm email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <Button onClick={handleFilter} className="gap-2">
            <Search className="w-4 h-4" />
            Lọc
          </Button>
        </div>

        {/* TABLE */}
        {loading ? (
          <p>Đang tải...</p>
        ) : filteredEmails.length === 0 ? (
          <p>Không có email nào phù hợp.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Ngày đăng ký</th>
                <th className="text-right py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">{item.email}</td>
                  <td className="py-2">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopy(item.email)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Xóa
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
