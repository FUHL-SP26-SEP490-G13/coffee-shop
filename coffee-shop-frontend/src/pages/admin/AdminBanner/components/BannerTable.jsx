import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";

export default function BannerTable({
  loading,
  banners,
  getBannerStatus,
  toDatetimeLocal,
  onEdit,
  onDelete,
  page,
  limit,
}) {
  if (loading) {
    return (
      <p className="text-center py-8 text-muted-foreground">Đang tải...</p>
    );
  }

  if (banners.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        Không có banner nào
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="text-left py-3 px-4 font-medium">STT</th>
              <th className="text-left py-3 px-4 font-medium">Ảnh</th>
              <th className="text-left py-3 px-4 font-medium">Tiêu đề</th>
              <th className="text-left py-3 px-4 font-medium">Thời gian</th>
              <th className="text-center py-3 px-4 font-medium">Trạng thái</th>
              <th className="text-right py-3 px-4 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {banners.map((b, index) => {
              const bannerStatus = getBannerStatus(b);
              const stt = (page - 1) * limit + index + 1;

              return (
                <tr
                  key={b.id}
                  className="border-b hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium">{stt}</td>
                  <td className="py-3 px-4">
                    <img
                      src={b.image_url}
                      alt={b.title}
                      className="w-24 h-12 object-cover rounded-md border"
                    />
                  </td>

                  <td className="py-3 px-4">{b.title}</td>

                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                    <div>
                      <div>
                        Bắt đầu:{" "}
                        {toDatetimeLocal(b.start_date).replace("T", " ")}
                      </div>
                      <div>
                        Kết thúc:{" "}
                        {toDatetimeLocal(b.end_date).replace("T", " ")}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <Badge
                      variant="secondary"
                      className={bannerStatus.className}
                    >
                      {bannerStatus.text}
                    </Badge>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(b)}
                      >
                        <Edit2 className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Sửa</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(b.id)}
                      >
                        <Trash2 className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">Xóa</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
