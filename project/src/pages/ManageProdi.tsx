import React, { useState, useEffect } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataGrid } from "../components/ui/DataGrid";
import { Modal, ConfirmModal } from "../components/ui/Modal";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { apiRequest, apiFormDataRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { DataActions } from '../components/ui/DataActions';
import { downloadCsvTemplate } from '../utils/csvTemplates';

interface Prodi {
  id: string;
  code: string;
  name: string;
}

export default function ManageProdi() {
  const { user } = useAuth();
  const [prodis, setProdis] = useState<Prodi[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentProdi, setCurrentProdi] = useState<Prodi | null>(null);
  const [formData, setFormData] = useState({ code: "", name: "" });
  const [formError, setFormError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ 
    success: boolean; 
    message: string; 
    backendErrors: string[] 
  } | null>(null);

  const canManage = user?.role?.permissions.some(
    (p) => p.codename === "can_crud_prodis"
  );

  const fetchProdis = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      const url = `/prodis/?${params.toString()}`;
      const response = await apiRequest(url);

      if (Array.isArray(response)) {
        setProdis(response);
        setTotalPages(1);
      } else if (response?.results !== undefined) {
        setProdis(response.results);
        setTotalPages(Math.ceil((response.count || 0) / 10));
      } else {
        setProdis([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Gagal mengambil data prodi", err);
      setProdis([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => setCurrentPage(1), 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchProdis(currentPage);
  }, [currentPage, search]);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ code: "", name: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (prodi: Prodi) => {
    setModalMode("edit");
    setCurrentProdi(prodi);
    setFormData({ code: prodi.code, name: prodi.name });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setFormError("Kode dan Nama wajib diisi");
      return;
    }

    try {
      const payload = { code: formData.code, name: formData.name };
      if (modalMode === "add") {
        await apiRequest("/prodis/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (currentProdi) {
        await apiRequest(`/prodis/${currentProdi.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchProdis(currentPage);
    } catch (err: any) {
      const msg = err.data?.code?.[0] || err.data?.detail || "Gagal menyimpan data";
      setFormError(msg);
    }
  };

  const handleDeleteClick = (id: string) => setConfirmDeleteId(id);
  
  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await apiRequest(`/prodis/${confirmDeleteId}/`, { method: "DELETE" });
      fetchProdis(currentPage);
      setConfirmDeleteId(null);
    } catch (err) {
      alert("Gagal menghapus data");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadResult({ success: false, message: "File maksimal 10 MB", backendErrors: [] });
      e.target.value = "";
      return;
    }

    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !['xlsx', 'csv'].includes(ext)) {
      setUploadResult({ success: false, message: "Format file tidak didukung", backendErrors: [] });
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      setUploadResult(null);
      const response = await apiFormDataRequest('/prodis/upload/', formData, 'POST');

      let message = `Berhasil: ${response.created} baru, ${response.updated} diperbarui.`;
      if (response.errors?.length) message += ` ${response.errors.length} gagal.`;

      setUploadResult({ success: true, message, backendErrors: response.errors || [] });
      fetchProdis(currentPage);
    } catch (err: any) {
      setUploadResult({
        success: false,
        message: err.data?.error || "Gagal upload file",
        backendErrors: err.data?.errors || []
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = () => downloadCsvTemplate('prodi');

  if (!canManage) {
    return (
      <Card>
        <CardBody>
          <p className="text-yellow-600">Anda tidak punya akses mengelola program studi</p>
        </CardBody>
      </Card>
    );
  }

  const columns = [
    { key: "code", header: "Kode" },
    { key: "name", header: "Nama Program Studi" },
    {
      key: "actions",
      header: "Aksi",
      render: (prodi: Prodi) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(prodi)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDeleteClick(prodi.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded">
            <Trash2 size={16} />
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
              Daftar Program Studi
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari prodi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm w-64"
                />
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                <Plus size={16} />
                Tambah Data
              </button>
              <DataActions
                onFileUpload={handleFileUpload}
                onDownloadTemplate={handleDownloadTemplate}
                templateLabel="Template Prodi"
              />
            </div>
          </div>

          {uploading && (
            <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">
              Sedang memproses file... Mohon tunggu.
            </div>
          )}

          {uploadResult && (
            <div className={`mb-4 p-3 rounded-lg ${uploadResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              <p className="font-semibold">{uploadResult.message}</p>
              {uploadResult.backendErrors?.length > 0 && (
                <div className="mt-2 text-sm max-h-32 overflow-y-auto p-2 bg-white/50 rounded">
                  <p className="font-medium text-red-900">Detail Kesalahan:</p>
                  <ul className="list-disc list-inside space-y-0.5 mt-1">
                    {uploadResult.backendErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DataGrid
            columns={columns}
            data={prodis}
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
        title={modalMode === "add" ? "Tambah Program Studi" : "Edit Program Studi"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="p-3 bg-red-100 text-red-800 rounded-lg text-sm">{formError}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kode *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nama Program Studi *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              Batal
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Simpan
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Program Studi"
        message="Apakah Anda yakin ingin menghapus program studi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}