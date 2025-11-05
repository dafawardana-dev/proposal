import React, { useEffect, useState } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataGrid } from "../components/ui/DataGrid";
import { Modal, ConfirmModal } from "../components/ui/Modal";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

interface EducationLevel {
  id: string;
  code: string;
}

const EDUCATION_LEVELS = [
  { value: "SD", label: "Sekolah Dasar" },
  { value: "SMP", label: "Sekolah Menengah Pertama" },
  { value: "SMA", label: "Sekolah Menengah Atas" },
  { value: "D2", label: "Diploma 2" },
  { value: "D3", label: "Diploma 3" },
  { value: "D4", label: "Diploma 4" },
  { value: "S1", label: "Strata 1" },
  { value: "S2", label: "Strata 2" },
  { value: "S3", label: "Strata 3" },
  { value: "PROF", label: "Profesor" },
];

export default function ManageEducations() {
  const { user } = useAuth();
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentItem, setCurrentItem] = useState<EducationLevel | null>(null);
  const [formData, setFormData] = useState({ code: "SD" });
  const [formError, setFormError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = user?.role?.permissions.some(
    (p) => p.codename === "can_crud_educations"
  );

  const fetchEducationLevels = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await apiRequest(`/education-levels/?page=${page}`);

      if (Array.isArray(response)) {
        setEducationLevels(response);
        setTotalPages(1);
      } else if (response?.results !== undefined) {
        setEducationLevels(response.results);
        setTotalPages(Math.ceil((response.count || 0) / 10));
      } else if (response?.data?.results !== undefined) {
        setEducationLevels(response.data.results);
        setTotalPages(Math.ceil((response.data.count || 0) / 10));
      } else {
        setEducationLevels([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Gagal mengambil data jenjang pendidikan", err);
      setEducationLevels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducationLevels(currentPage);
  }, [currentPage]);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ code: "SD" });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: EducationLevel) => {
    setModalMode("edit");
    setCurrentItem(item);
    setFormData({ code: item.code });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await apiRequest(`/education-levels/${confirmDeleteId}/`, { method: "DELETE" });
      fetchEducationLevels(currentPage);
      setConfirmDeleteId(null);
    } catch (err) {
      alert("Gagal menghapus data");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code) {
      setFormError("Jenjang pendidikan wajib dipilih");
      return;
    }

    try {
      if (modalMode === "add") {
        await apiRequest("/education-levels/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: formData.code }),
        });
      } else if (modalMode === "edit" && currentItem) {
        await apiRequest(`/education-levels/${currentItem.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: formData.code }),
        });
      }
      setIsModalOpen(false);
      fetchEducationLevels(currentPage);
    } catch (err) {
      alert("Gagal menyimpan data");
      console.error(err);
    }
  };

  const getEducationLabel = (code: string) => {
    return EDUCATION_LEVELS.find((level) => level.value === code)?.label || code;
  };

  if (!canManage) {
    return (
      <Card>
        <CardBody>
          <p className="text-yellow-600">Anda tidak punya akses mengelola</p>
        </CardBody>
      </Card>
    );
  }

  const columns = [
    {
      key: "code",
      header: "Jenjang Pendidikan",
      render: (item: EducationLevel) => getEducationLabel(item.code),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item: EducationLevel) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(item)}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition dark:hover:bg-blue-900/30"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(item.id)}
            className="p-1.5 text-red-600 hover:bg-red-100 rounded transition dark:hover:bg-red-900/30"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <Card className="rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Daftar Jenjang Pendidikan
            </h2>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium w-full sm:w-auto"
            >
              <Plus size={16} />
              Tambah Data
            </button>
          </div>

          <DataGrid
            columns={columns}
            data={educationLevels}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </CardBody>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === "add" ? "Tambah Jenjang Pendidikan" : "Edit Jenjang Pendidikan"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Jenjang Pendidikan
            </label>
            <select
              value={formData.code}
              onChange={(e) => setFormData({ code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              {EDUCATION_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
            {formError && <p className="mt-1 text-sm text-red-500">{formError}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Jenjang Pendidikan"
        message="Apakah Anda yakin ingin menghapus jenjang pendidikan ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}