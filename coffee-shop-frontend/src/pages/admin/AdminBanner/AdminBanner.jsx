import { useEffect, useState } from "react";
import bannerService from "@/services/bannerService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus } from "lucide-react";
import { validateBannerForm } from "@/utils/bannerValidation";

import BannerFilters from "./components/BannerFilters";
import BannerTable from "./components/BannerTable";
import BannerPagination from "./components/BannerPagination";
import BannerFormDialog from "./components/BannerFormDialog";
import { toast } from "sonner";

export default function AdminBanner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    button_text: "",
    button_link: "",
    image: null,
    start_date: "",
    end_date: "",
  });

  const limit = 5;

  const resetForm = () => {
    setEditingBanner(null);
    setPreviewImage(null);
    setErrors({});
    setForm({
      title: "",
      subtitle: "",
      button_text: "",
      button_link: "",
      image: null,
      start_date: "",
      end_date: "",
    });
  };

  const toDatetimeLocal = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";

    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const getBannerStatus = (banner) => {
    const now = new Date();
    const start = new Date(banner.start_date);
    const end = new Date(banner.end_date);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return {
        text: "Không hợp lệ",
        className: "bg-red-500/10 text-red-700 border-red-500/20",
      };
    }

    if (now < start) {
      return {
        text: "Chưa bắt đầu",
        className: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
      };
    }

    if (now > end) {
      return {
        text: "Đã kết thúc",
        className: "bg-red-500/10 text-red-700 border-red-500/20",
      };
    }

    return {
      text: "Đang hoạt động",
      className: "bg-green-500/10 text-green-700 border-green-500/20",
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await bannerService.getAll({
        page,
        limit,
        keyword,
        status,
      });

      setBanners(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error("Lỗi load banner:", err);
      setError("Không thể tải danh sách banner");
      setBanners([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, keyword, status]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      server: "",
    }));
  };

  const handleSubmit = async () => {
    const newErrors = validateBannerForm(form, {
      requireImage: !editingBanner,
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("subtitle", form.subtitle.trim());
      fd.append("button_text", form.button_text.trim());
      fd.append("button_link", form.button_link.trim());
      fd.append("start_date", form.start_date);
      fd.append("end_date", form.end_date);
      fd.append("type", "banner");

      if (form.image) {
        fd.append("image", form.image);
      }

      const config = {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 0;
          if (!total) return;

          const percent = Math.round((progressEvent.loaded * 100) / total);
          setUploadProgress(percent);
        },
      };

      if (editingBanner) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await bannerService.update(editingBanner.id, fd, config);
        toast.success("Cập nhật quảng cáo thành công");
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await bannerService.create(fd, config);
        toast.success("Tạo quảng cáo thành công");
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      if (err.response?.data?.errors) {
        const backendErrors = {};
        err.response.data.errors.forEach((e) => {
          backendErrors[e.field] = e.message;
        });

        setErrors(backendErrors);

        const duplicatedTitleError = err.response.data.errors.find(
          (e) =>
            e.field === "title" && e.message === "Tiêu đề quảng cáo đã tồn tại"
        );

        if (duplicatedTitleError) {
          toast.error("Tiêu đề quảng cáo đã tồn tại");
        }
      } else if (err.response?.data?.message) {
        setErrors((prev) => ({
          ...prev,
          server: err.response.data.message,
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          server: "Có lỗi xảy ra!",
        }));
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa quảng cáo này?")) return;

    try {
      await bannerService.delete(id);
      toast.success("Xóa quảng cáo thành công");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setErrors({});
    setForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      button_text: banner.button_text || "",
      button_link: banner.button_link || "",
      image: null,
      start_date: toDatetimeLocal(banner.start_date),
      end_date: toDatetimeLocal(banner.end_date),
    });
    setPreviewImage(banner.image_url || null);
    setShowModal(true);
  };

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const totalPages = Math.ceil(total / limit);

  if (error && banners.length === 0) {
    return (
      <div className="p-6 text-center text-red-500">
        <p>Lỗi: {error}</p>

        <Button variant="outline" className="mt-4" onClick={fetchData}>
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-semibold">Quản lý quảng cáo</h2>
          </div>
        </div>

        <Button className="gap-2 w-full sm:w-auto" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" /> 
          Tạo mới
        </Button>
      </div>

      <Card className="p-4 sm:p-6 space-y-4">
        <BannerFilters
          keyword={keyword}
          setKeyword={setKeyword}
          status={status}
          setStatus={setStatus}
          setPage={setPage}
        />

        <BannerTable
          loading={loading}
          banners={banners}
          getBannerStatus={getBannerStatus}
          toDatetimeLocal={toDatetimeLocal}
          onEdit={handleEdit}
          onDelete={handleDelete}
          page={page}
          limit={limit}
        />

        {totalPages > 1 && (
          <BannerPagination
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        )}
      </Card>

      <BannerFormDialog
        open={showModal}
        onOpenChange={(open) => {
          setShowModal(open);
          if (!open) resetForm();
        }}
        editingBanner={editingBanner}
        form={form}
        setForm={setForm}
        previewImage={previewImage}
        setPreviewImage={setPreviewImage}
        errors={errors}
        setErrors={setErrors}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        submitting={submitting}
        uploadProgress={uploadProgress}
      />
    </div>
  );
}
