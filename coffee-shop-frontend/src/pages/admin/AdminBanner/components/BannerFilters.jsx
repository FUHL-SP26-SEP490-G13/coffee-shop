import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function BannerFilters({
  keyword,
  setKeyword,
  status,
  setStatus,
  setPage,
}) {
  return (
    <div className="flex gap-3 flex-col sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tiêu đề..."
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPage(1);
          }}
          className="pl-9"
        />
      </div>

      <select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
        className="border rounded-md px-3 py-2 text-sm"
      >
        <option value="">Tất cả trạng thái</option>
        <option value="active">Còn hạn</option>
        <option value="upcoming">Chưa diễn ra</option>
        <option value="expired">Hết hạn</option>
      </select>
    </div>
  );
}
