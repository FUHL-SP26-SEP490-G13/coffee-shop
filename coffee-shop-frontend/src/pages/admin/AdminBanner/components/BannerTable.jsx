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
              <th className="text-center py-3 px-4 font-medium w-[60px]">STT</th>
              <th className="text-center py-3 px-4 font-medium min-w-[110px]">Ảnh</th>
              <th className="text-left py-3 px-4 font-medium min-w-[180px]">Tiêu đề</th>
              <th className="text-center py-3 px-4 font-medium min-w-[160px]">Thời gian</th>
              <th className="text-center py-3 px-4 font-medium min-w-[130px]">Trạng thái</th>
              <th className="text-center py-3 px-4 font-medium min-w-[140px]">Hành động</th>
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
                  <td className="py-3 px-4 text-center font-medium">{stt}</td>
                  <td className="py-3 px-4 text-center">
                    <img
                      src={b.image_url}
                      alt={b.title}
                      className="w-24 h-12 object-cover rounded-md border mx-auto"
                    />
                  </td>

                  <td className="py-3 px-4">{b.title}</td>

                  <td className="py-3 px-4 text-center text-muted-foreground whitespace-nowrap">
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
                      className={`${bannerStatus.className} inline-flex min-w-[110px] justify-center`}
                    >
                      {bannerStatus.text}
                    </Badge>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex gap-2 justify-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Chỉnh sửa"
                        onClick={() => onEdit(b)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        title="Xóa"
                        className="text-destructive hover:text-red-600"
                        onClick={() => onDelete(b.id)}
                      >
                        <Trash2 className="w-4 h-4" />
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
