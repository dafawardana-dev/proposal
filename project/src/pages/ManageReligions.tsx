import React, { useEffect, useState } from "react";
import { apiRequest } from "../utils/api";
import { DataGrid } from "../components/ui/DataGrid";
import { Card, CardBody } from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Modal, ConfirmModal } from "../components/ui/Modal";

interface Religion {
  id: string;
  name: string;
}

export default function ManageReligions() {
  const { user } = useAuth();
  const [religions, setReligions] = useState<Religion[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentReligion, setCurrentReligion] = useState<Religion | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [formError, setFormError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const canManage = user.role?.permissions.some(
    (p) => p.codename === "can_crud_religions"
  );

  const fetchReligions = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await apiRequest(`/religions/?page=${page}`);

      if (Array.isArray(response)) {
        setReligions(response);
        setTotalPages(1);
      } else if (response?.results !== undefined) {
        setReligions(response.results);
        setTotalPages(Math.ceil((response.count || 0) / 10));
      } else if (response?.data?.results !== undefined) {
        setReligions(response.data.results);
        setTotalPages(Math.ceil((response.data.count || 0) / 10));
      } else {
        setReligions([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Gagal mengambil data agama", err);
      setReligions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReligions(currentPage);
  }, [currentPage]);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ name: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (religion: Religion) => {
    setModalMode("edit");
    setCurrentReligion(religion);
    setFormData({ name: religion.name });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await apiRequest(`/religions/${confirmDeleteId}/`, { method: "DELETE" });
      fetchReligions(currentPage);
      setConfirmDeleteId(null);
    } catch (err) {
      alert("Gagal menghapus data");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Nama agama wajib diisi");
      return;
    }

    try {
      if (modalMode === "add") {
        await apiRequest("/religions/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else if (modalMode === "edit" && currentReligion) {
        await apiRequest(`/religions/${currentReligion.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setIsModalOpen(false);
      fetchReligions(currentPage);
    } catch (err) {
      alert("Gagal menyimpan data");
      console.error(err);
    }
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
    { key: "name", header: "Nama Agama" },
    {
      key: "actions",
      header: "Aksi",
      render: (religion: Religion) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(religion)}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition dark:hover:bg-blue-900/30"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteClick(religion.id)}
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Daftar Agama
            </h2>
            <button
              onClick={openAddModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              <Plus size={16} />
              Tambah Data
            </button>
          </div>

          <DataGrid
            columns={columns}
            data={religions}
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
        title={modalMode === "add" ? "Tambah Agama" : "Edit Agama"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Agama
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Masukkan nama agama"
            />
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
        title="Hapus Agama"
        message="Apakah Anda yakin ingin menghapus agama ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}