import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReputationScoreDialog({
  open,
  onClose,
  currentScore = 50,
  reputationRules = [],
}) {
  const safeScore = Number.isFinite(Number(currentScore))
    ? Number(currentScore)
    : 50;

  const dynamicRules = Array.isArray(reputationRules) && reputationRules.length > 0
    ? [...reputationRules]
        .sort((a, b) => a.minScore - b.minScore)
        .map((rule, index, arr) => {
          const nextRule = arr[index + 1];
          const isLast = index === arr.length - 1;
          const max = isLast ? Number.POSITIVE_INFINITY : nextRule.minScore - 1;
          const min = rule.minScore;

          let scoreRange = "";
          if (isLast) scoreRange = `Từ ${min} điểm`;
          else scoreRange = `${min} - ${max} điểm`;

          let cashLimit = "";
          let paymentMethods = "";
          if (rule.maxCash === 0) {
              cashLimit = "Không cho phép (0đ)";
              paymentMethods = "Chỉ PayOS";
          } else if (rule.maxCash === null) {
              cashLimit = "Không giới hạn";
              paymentMethods = "Tiền mặt hoặc PayOS";
          } else {
              cashLimit = `<= ${rule.maxCash.toLocaleString("vi-VN")}đ`;
              paymentMethods = "Tiền mặt hoặc PayOS";
          }

          let note = "";
          if (rule.maxCash === 0) note = "Bắt buộc thanh toán trực tuyến";
          else if (rule.maxCash === null) note = "Ưu tiên mức uy tín cao";
          else note = "Vượt mức tự chuyển PayOS";

          return { min, max, scoreRange, cashLimit, paymentMethods, note };
        })
    : [
        {
          min: 0,
          max: Number.POSITIVE_INFINITY,
          scoreRange: "Mọi điểm số",
          cashLimit: "Không giới hạn",
          paymentMethods: "Tất cả phương thức",
          note: "Chưa cấu hình hạn mức",
        },
      ];

  const activeRule = dynamicRules.find(
    (rule) => safeScore >= rule.min && safeScore <= rule.max,
  ) || dynamicRules[dynamicRules.length - 1];

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent className="max-h-[90vh] overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Xét điểm uy tín</DialogTitle>
          <DialogDescription>
            Điểm uy tín ảnh hưởng đến giới hạn thanh toán tiền mặt ở bước
            checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[calc(90vh-140px)] space-y-5 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium text-gray-600">Điểm hiện tại</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {safeScore}/100
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-600">Mức áp dụng</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {activeRule?.scoreRange || "Đang cập nhật"}
              </p>
              <p className="mt-1 text-xs text-gray-600">
                {activeRule?.cashLimit || "-"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Bảng đối chiếu phương thức thanh toán
            </p>
            <div className="overflow-x-auto rounded-xl border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">
                      Khoảng điểm
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Giới hạn tiền mặt
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Phương thức khả dụng
                    </th>
                    <th className="text-left px-3 py-2 font-semibold">
                      Ghi chú
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dynamicRules.map((row, index) => {
                    const isActive =
                      safeScore >= row.min && safeScore <= row.max;

                    return (
                      <tr
                        key={row.scoreRange}
                        className={`border-t ${
                          isActive
                            ? "bg-amber-50"
                            : index % 2
                              ? "bg-gray-50/60"
                              : "bg-white"
                        }`}
                      >
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {row.scoreRange}
                          {isActive && (
                            <Badge className="ml-2 border border-amber-300 bg-white text-amber-700">
                              Mức của bạn
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {row.cashLimit}
                        </td>
                        <td className="px-3 py-2 text-gray-700">
                          {row.paymentMethods}
                        </td>
                        <td className="px-3 py-2 text-gray-600">{row.note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2">
              Quy định chi tiết
            </p>
            <div className="rounded-xl border bg-white p-4 space-y-2">
              <p className="text-sm text-gray-700">
                1. Số điện thoại mới sẽ khởi tạo ở mức 50 điểm.
              </p>
              <p className="text-sm text-gray-700">
                2. Đơn hoàn tất đúng quy trình sẽ giúp tăng điểm uy tín (tối đa
                là 100).
              </p>
              <p className="text-sm text-gray-700">
                3. Hủy đơn khi đơn đã chuẩn bị xong, đang trong quá trình giao
                hoặc vi phạm chính sách có thể làm giảm điểm.
              </p>
              <p className="text-sm text-gray-700">
                4. Nếu bạn hủy đơn khi đơn vẫn đang ở trạng thái chờ hoặc đang
                chuẩn bị, điểm uy tín sẽ không bị ảnh hưởng. Tuy nhiên, nếu bạn
                hủy đơn sau khi đơn đã được chuẩn bị xong hoặc đang trong quá
                trình giao hàng, điểm uy tín của bạn có thể bị giảm đáng kể do
                ảnh hưởng đến trải nghiệm của người bán, doanh thu của quán và
                các khách hàng khác.
              </p>
              <p className="text-sm text-gray-700">
                5. Nếu tài khoản bị đóng băng, hệ thống sẽ chỉ cho phép bạn dùng
                PayOS để đảm bảo an toàn giao dịch.
              </p>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              Hãy là 1 khách hàng uy tín để được trải nghiệm thanh toán linh
              hoạt và nhiều ưu đãi hấp dẫn hơn nhé! Nếu có thắc mắc về điểm uy
              tín, vui lòng liên hệ bộ phận chăm sóc khách hàng của chúng tôi để
              được hỗ trợ.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
