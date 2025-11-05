import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataGrid } from "../components/ui/DataGrid";
import { Modal, ConfirmModal } from "../components/ui/Modal";
import { Search, Plus, Pencil, Trash2, Upload } from "lucide-react";
import { apiRequest, apiFormDataRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { DataActions } from "../components/ui/DataActions";
import { downloadCsvTemplate } from "../utils/csvTemplates";

interface KonsentrasiUtama {
  id: number;
  code: string;
  name: string;
  // prodi: number | null;
  prodi_name: string;
}

interface ProdiOption {
  id: number;
  name: string;
}

export default function ManageKonsentrasiUtama() {
  const { user } = useAuth();
  const [konsentrasis, setKonsentrasis] = useState<KonsentrasiUtama[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentItem, setCurrentItem] = useState<KonsentrasiUtama | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    prodi_id: 0, 
  });
  const [formError, setFormError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    backendErrors: string[];
  } | null>(null);
  
  const [prodiOptions, setProdiOptions] = useState<ProdiOption[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  const canManage = user?.role?.permissions.some((p) => p.codename === "can_crud_konsentrasi_utama");
  
  const fetchProdiDropdown = async () => {
    try {
      setDropdownLoading(true);
      const response = await apiRequest("/prodis/dropdown/");
      if (Array.isArray(response)) {
        setProdiOptions(response);
      }
    } catch (err) {
      console.error("Gagal memuat dropdown prodi", err);
    } finally {
      setDropdownLoading(false);
    }
  };

  const fetchKonsentrasis = useCallback(async (searchTerm = "", page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      params.set("page", String(page));
      const url = `/konsentrasi-utama/?${params.toString()}`;
      const response = await apiRequest(url);

      if (Array.isArray(response)) {
        setKonsentrasis(response);
        setTotalPages(1);
      } else if (response?.results !== undefined) {
        setKonsentrasis(response.results);
        setTotalPages(Math.ceil((response.count || 0) / 10));
      } else {
        setKonsentrasis([]);
        setTotalPages(1);
      }
    } catch (err) {
      console.error("Gagal mengambil data konsentrasi", err);
      setKonsentrasis([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProdiDropdown(); 
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    fetchKonsentrasis(search, currentPage);
  }, [search, currentPage, fetchKonsentrasis]);

  const openAddModal = () => {
    setModalMode("add");
    setFormData({ code: "", name: "", prodi_id: 0 }); 
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (item: KonsentrasiUtama) => {
    setModalMode("edit");
    setCurrentItem(item);    
    const prodiId = prodiOptions.find((p) => p.name === item.prodi)?.id || 0;
    setFormData({
      code: item.code,
      name: item.name,
      prodi_id: prodiId, 
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await apiRequest(`/konsentrasi-utama/${confirmDeleteId}/`, { method: "DELETE" });
      fetchKonsentrasis(search, currentPage);
      setConfirmDeleteId(null);
    } catch (err) {
      alert("Gagal menghapus data");
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { code, name, prodi_id } = formData;

    if (!code.trim()) {
      setFormError("Kode konsentrasi wajib diisi");
      return;
    }
    if (!name.trim()) {
      setFormError("Nama konsentrasi wajib diisi");
      return;
    }
    if (!prodi_id) {
      setFormError("Program Studi wajib dipilih");
      return;
    }

    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        prodi_id: formData.prodi_id,
      };
      if (modalMode === "add") {
        await apiRequest("/konsentrasi-utama/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (currentItem) {
        await apiRequest(`/konsentrasi-utama/${currentItem.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchKonsentrasis(search, currentPage);
    } catch (err: any) {
      const errorMessage = err.data?.code?.[0] || err.data?.detail || "Gagal menyimpan data.";
      setFormError(errorMessage);
      console.error(err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadResult({ success: false, message: "File terlalu besar! Maksimal 10 MB.", backendErrors: [] });
      e.target.value = "";
      return;
    }

    const validExtensions = [".xlsx", ".csv"];
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension || !validExtensions.includes(`.${extension}`)) {
      setUploadResult({ success: false, message: "Format file tidak didukung. Gunakan .xlsx atau .csv", backendErrors: [] });
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setUploadResult(null);
      const response = await apiFormDataRequest("/konsentrasi-utama/upload/", formData, "POST");

      let message = `Berhasil: ${response.created} data baru, ${response.updated} diperbarui.`;
      if (response.errors && response.errors.length > 0) {
        message += ` ${response.errors.length} baris gagal diimpor.`;
      }

      setUploadResult({
        success: true,
        message: message,
        backendErrors: response.errors || [],
      });
      fetchKonsentrasis(search, currentPage);
    } catch (err: any) {
      console.error("Upload Error:", err);
      let message = "Gagal upload file. Periksa format header dan data.";
      let backendErrors: string[] = [];

      if (err.data && typeof err.data.error === "string") {
        message = err.data.error;
      } else if (err.data && Array.isArray(err.data.errors)) {
        backendErrors = err.data.errors;
      }

      setUploadResult({
        success: false,
        message,
        backendErrors,
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    downloadCsvTemplate("konsentrasi");
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
    { key: "code", header: "Kode", accessor: "code" },
    { key: "name", header: "Nama Konsentrasi", accessor: "name" },
    {
      key: "prodi_name",
      header: "Program Studi",      
      render: (item: KonsentrasiUtama) => item.prodi_name || "-",
    },
    {
      key: "actions",
      header: "Aksi",
      render: (item: KonsentrasiUtama) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition dark:hover:bg-blue-900/30" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleDeleteClick(item.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition dark:hover:bg-red-900/30" title="Hapus">
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
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Daftar Konsentrasi Utama</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari konsentrasi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm w-64"
                />
              </div>
              <button onClick={openAddModal} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                <Plus className="w-5 h-5" />
                Tambah Data
              </button>
              <DataActions onFileUpload={handleFileUpload} onDownloadTemplate={handleDownloadTemplate} templateLabel="Template Konsentrasi" />
            </div>
          </div>

          {uploading && <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg">Sedang memproses file... Mohon tunggu.</div>}

          {uploadResult && (
            <div className={`mb-4 p-3 rounded-lg ${uploadResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              <p className="font-semibold">{uploadResult.message}</p>
              {uploadResult.backendErrors && uploadResult.backendErrors.length > 0 && (
                <div className="mt-2 text-sm max-h-32 overflow-y-auto p-2 bg-white/50 rounded">
                  <p className="font-medium text-red-900">Detail Kesalahan ({uploadResult.backendErrors.length} baris):</p>
                  <ul className="list-disc list-inside space-y-0.5 mt-1">
                    {uploadResult.backendErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DataGrid columns={columns} data={konsentrasis} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} loading={loading} />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === "add" ? "Tambah Konsentrasi Utama" : "Edit Konsentrasi Utama"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Contoh: K01"
              required
            />
            {formError && <p className="mt-1 text-sm text-red-500">{formError}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Konsentrasi *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Contoh: Kecerdasan Buatan"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program Studi *</label>
            <select
              value={formData.prodi_id}
              onChange={(e) => setFormData({ ...formData, prodi_id: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value={0}>Pilih Program Studi</option>
              {prodiOptions.map((prodi) => (
                <option key={prodi.id} value={prodi.id}>
                  {prodi.name}
                </option>
              ))}
            </select>
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
        title="Hapus Konsentrasi Utama"
        message="Apakah Anda yakin ingin menghapus konsentrasi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
