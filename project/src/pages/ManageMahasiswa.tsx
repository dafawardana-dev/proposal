import React, { useState, useEffect } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataGrid } from "../components/ui/DataGrid";
import { Modal, ConfirmModal } from "../components/ui/Modal";
import { Search, Plus, Pencil, Trash2, Upload, RotateCcw } from "lucide-react";
import { apiRequest, apiFormDataRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { DataActions } from "../components/ui/DataActions";
import { downloadCsvTemplate } from "../utils/csvTemplates";
import { WilayahPicker } from "../components/WilayahPicker";

interface Mahasiswa {
  id: string;
  nim: string;
  nama_mahasiswa: string;
  tempat_lahir: string;
  tgl_lahir: string;
  jk: string;
  tahun_masuk: number;
  prodi: string;
  konsentrasi?: string;
  judul_skripsi?: string;
}

interface DropdownOption {
  id: number;
  name: string;
}

const GENDER_LABELS: Record<string, string> = {
  L: "Laki-laki",
  P: "Perempuan",
};

export default function ManageMahasiswa() {
  const { user } = useAuth();
  const [mahasiswas, setMahasiswas] = useState<Mahasiswa[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [currentMahasiswa, setCurrentMahasiswa] = useState<Mahasiswa | null>(null);
  const [formData, setFormData] = useState({
    nim: "",
    nama_mahasiswa: "",
    tempat_lahir_id: null as number | null,
    tgl_lahir: "",
    jk: "L" as "L" | "P",
    tahun_masuk: new Date().getFullYear(),
    prodi_id: 0,
    konsentrasi_id: 0,
    judul_skripsi: "",
  });
  const [formError, setFormError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    backendErrors: string[];
  } | null>(null);

  const [prodiOptions, setProdiOptions] = useState<DropdownOption[]>([]);
  const [konsentrasiByProdi, setKonsentrasiByProdi] = useState<DropdownOption[]>([]);
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  const canManage = user?.role?.permissions.some((p) => p.codename === "can_crud_mahasiswa");

  const fetchMahasiswas = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      const url = `/mahasiswa/?${params.toString()}`;
      const response = await apiRequest(url);

      if (response?.results !== undefined) {
        const list = await Promise.all(
          response.results.map(async (m: any) => {
            if (!m.judul_skripsi || m.judul_skripsi === "BELUM ADA") {
              try {
                const proposal = await apiRequest(`/proposals/?mahasiswa_id=${m.id}&status=approved`);
                if (proposal.results?.length > 0) {
                  m.judul_skripsi = proposal.results[0].judul;
                }
              } catch (e) {
                console.warn(`Proposal tidak ditemukan untuk mahasiswa ${m.nama_mahasiswa}`);
              }
            }
            return m;
          })
        );
        setMahasiswas(list);
        setTotalPages(Math.ceil((response.count || 0) / 10));
      }
    } catch (err) {
      console.error("Gagal mengambil data mahasiswa", err);
      setMahasiswas([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMahasiswas = mahasiswas.filter((m) => {
    const term = search.toLowerCase();
    return (
      m.nim?.toLowerCase().includes(term) || m.nama_mahasiswa?.toLowerCase().includes(term) || m.prodi_nama?.toLowerCase().includes(term) || m.konsentrasi_nama?.toLowerCase().includes(term) || m.judul_skripsi?.toLowerCase().includes(term)
    );
  });

  const fetchDropdowns = async () => {
    setDropdownLoading(true);
    setDropdownError(null);
    try {
      const prodiRes = await apiRequest("/prodis/dropdown/");
      if (Array.isArray(prodiRes)) {
        setProdiOptions(prodiRes);
      } else {
        throw new Error("Format respons tidak valid");
      }
    } catch (err: any) {
      console.error("Gagal memuat dropdown", err);
      setDropdownError(err.message?.includes("404") ? "Data master Prodi/Konsentrasi belum tersedia. Hubungi admin." : "Gagal memuat data dropdown. Coba lagi nanti.");
    } finally {
      setDropdownLoading(false);
    }
  };

  const fetchKonsentrasiByProdi = async (prodiId: number) => {
    if (!prodiId) {
      setKonsentrasiByProdi([]);
      return;
    }
    try {
      const response = await apiRequest(`/konsentrasi-utama/?prodi_id=${prodiId}`);
      if (Array.isArray(response.results)) {
        setKonsentrasiByProdi(
          response.results.map((item: any) => ({
            id: item.id,
            name: item.nama,
          }))
        );
      } else if (Array.isArray(response)) {
        setKonsentrasiByProdi(
          response.map((item: any) => ({
            id: item.id,
            name: item.nama,
          }))
        );
      } else {
        setKonsentrasiByProdi([]);
      }
    } catch (err) {
      console.error("Gagal memuat konsentrasi berdasarkan prodi:", err);
      setKonsentrasiByProdi([]);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMahasiswas(1);
    }, 1000);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  useEffect(() => {
    fetchMahasiswas(currentPage);
  }, [currentPage, search]);

  // === MODAL FUNCTIONS ===
  const openAddModal = () => {
    setModalMode("add");
    setFormData({
      nim: "",
      nama_mahasiswa: "",
      tempat_lahir_id: null,
      tgl_lahir: "",
      jk: "L",
      tahun_masuk: new Date().getFullYear(),
      prodi_id: 0,
      konsentrasi_id: 0,
      judul_skripsi: "",
    });
    setKonsentrasiByProdi([]);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = async (mahasiswa: Mahasiswa) => {
    setModalMode("edit");
    setCurrentMahasiswa(mahasiswa);

    const prodiId = prodiOptions.find((p) => p.name === mahasiswa.prodi_nama)?.id || 0;

    await fetchKonsentrasiByProdi(prodiId);

    const konsentrasiId = konsentrasiOptions.find((k) => k.name === mahasiswa.konsentrasi_nama)?.id || konsentrasiByProdi.find((k) => k.name === mahasiswa.konsentrasi_nama)?.id || 0;

    setFormData({
      nim: mahasiswa.nim || "",
      nama_mahasiswa: mahasiswa.nama_mahasiswa || "",
      tempat_lahir_id: null,
      tgl_lahir: mahasiswa.tgl_lahir ? new Date(mahasiswa.tgl_lahir).toISOString().split("T")[0] : "",
      jk: mahasiswa.jk || "L",
      tahun_masuk: mahasiswa.tahun_masuk || new Date().getFullYear(),
      prodi_id: prodiId,
      konsentrasi_id: konsentrasiId,
      judul_skripsi: mahasiswa.judul_skripsi || "",
    });

    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { nim, nama_mahasiswa, prodi_id, konsentrasi_id } = formData;

    if (!nim.trim() || !nama_mahasiswa.trim()) {
      setFormError("NIM dan Nama mahasiswa wajib diisi.");
      return;
    }

    if (konsentrasi_id > 0 && prodi_id === 0) {
      setFormError("Pilih Program Studi terlebih dahulu sebelum memilih Konsentrasi.");
      return;
    }

    try {
      const payload: any = {
        nim: formData.nim,
        nama_mahasiswa: formData.nama_mahasiswa,
        tempat_lahir: formData.tempat_lahir_id,
        tgl_lahir: formData.tgl_lahir,
        jk: formData.jk,
        tahun_masuk: formData.tahun_masuk,
        prodi: formData.prodi_id,
      };

      if (formData.konsentrasi_id > 0) {
        payload.konsentrasi = formData.konsentrasi_id;
      }
      if (formData.judul_skripsi) {
        payload.judul_skripsi = formData.judul_skripsi;
      }

      if (modalMode === "add") {
        await apiRequest("/mahasiswa/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (modalMode === "edit" && currentMahasiswa) {
        await apiRequest(`/mahasiswa/${currentMahasiswa.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchMahasiswas(currentPage);
    } catch (err: any) {
      const errorData = err.data || {};
      const errorMessage = errorData.nim?.[0] || errorData.detail || "Gagal menyimpan data. Pastikan NIM unik.";
      setFormError(errorMessage);
      console.error(err);
    }
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await apiRequest(`/mahasiswa/${confirmDeleteId}/`, { method: "DELETE" });
      fetchMahasiswas(currentPage);
      setConfirmDeleteId(null);
    } catch (err) {
      alert("Gagal menghapus data");
      console.error(err);
    }
  };

  const handleFileUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
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

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    try {
      setUploading(true);
      setUploadResult(null);
      const response = await apiFormDataRequest("/mahasiswa/upload/", uploadFormData, "POST");
      let message = `Berhasil: ${response.created} data baru, ${response.updated} diperbarui.`;
      if (response.errors && response.errors.length > 0) {
        message += ` ${response.errors.length} baris gagal diimpor.`;
      }

      setUploadResult({
        success: true,
        message: message,
        backendErrors: response.errors || [],
      });
      fetchMahasiswas(currentPage);
    } catch (err: any) {
      console.error("Upload Error:", err);
      let message = "Gagal upload file. Periksa format header dan data.";
      let backendErrors: string[] = [];

      if (err.data && typeof err.data.error === "string") {
        message = err.data.error;
      } else if (err.data && Array.isArray(err.data.errors)) {
        backendErrors = err.data.errors;
      } else if (err.message?.includes("500")) {
        message = "Server error (500). Coba periksa data tanggal dan tipe angka.";
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
    downloadCsvTemplate("mahasiswa");
  };

  const columns = [
    { key: "nim", header: "NIM" },
    { key: "nama_mahasiswa", header: "Nama Mahasiswa" },
    {
      key: "tempat_lahir_nama",
      header: "Tempat Lahir",
      render: (m: any) => m.tempat_lahir_nama || "-",
    },
    { key: "tgl_lahir", header: "Tgl Lahir" },
    {
      key: "jk",
      header: "JK",
      render: (m: any) => GENDER_LABELS[m.jk] || m.jk,
    },
    { key: "tahun_masuk", header: "Angkatan" },
    {
      key: "prodi_nama",
      header: "Prodi",
      render: (m: any) => m.prodi_nama || "-",
    },
    {
      key: "konsentrasi_nama",
      header: "Konsentrasi",
      render: (m: any) => m.konsentrasi_nama || "-",
    },
    {
      key: "judul_skripsi",
      header: "Judul Skripsi",
      render: (m: any) => (m.judul_skripsi && m.judul_skripsi !== "BELUM ADA" ? <span className="text-gray-800 dark:text-gray-200">{m.judul_skripsi}</span> : <span className="text-gray-400 italic">Belum disetujui</span>),
    },
    {
      key: "actions",
      header: "Aksi",
      render: (mahasiswa: Mahasiswa) => (
        <div className="flex gap-2">
          <button onClick={() => openEditModal(mahasiswa)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition dark:hover:bg-blue-900/30" title="Edit">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => handleDeleteClick(mahasiswa.id)} className="p-1.5 text-red-600 hover:bg-red-100 rounded transition dark:hover:bg-red-900/30" title="Hapus">
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
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Daftar Mahasiswa</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari mahasiswa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm w-64"
                />
              </div>
              <button onClick={openAddModal} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                <Plus size={16} />
                Tambah Data
              </button>
              <DataActions onFileUpload={handleFileUpload} onDownloadTemplate={handleDownloadTemplate} templateLabel="Template Mahasiswa" />
            </div>
          </div>

          {/* Pesan Error Dropdown */}
          {dropdownError && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg flex justify-between items-start">
              <div>
                <p className="font-medium">{dropdownError}</p>
                <p className="text-sm mt-1">Data dropdown digunakan untuk memilih Program Studi dan Konsentrasi.</p>
              </div>
              <button onClick={fetchDropdowns} className="flex items-center gap-1 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 transition" title="Muat ulang data dropdown">
                <RotateCcw size={14} />
                Muat Ulang
              </button>
            </div>
          )}

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

          <DataGrid columns={columns} data={filteredMahasiswas} currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} loading={loading} />
        </CardBody>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === "add" ? "Tambah Mahasiswa" : "Edit Mahasiswa"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">NIM *</label>
              <input
                type="text"
                value={formData.nim}
                onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Mahasiswa *</label>
              <input
                type="text"
                value={formData.nama_mahasiswa}
                onChange={(e) => setFormData({ ...formData, nama_mahasiswa: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            <div className="md:col-span-2">
              <WilayahPicker
                value={formData.tempat_lahir_id}
                onChange={(id) => {
                  setFormData((prev) => ({ ...prev, tempat_lahir_id: id }));
                }}
                error={!formData.tempat_lahir_id && formError.includes("wajib") ? "Tempat lahir wajib dipilih" : ""}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Lahir *</label>
              <input
                type="date"
                value={formData.tgl_lahir}
                onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jenis Kelamin *</label>
              <select
                value={formData.jk}
                onChange={(e) => setFormData({ ...formData, jk: e.target.value as "L" | "P" })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tahun Angkatan *</label>
              <input
                type="number"
                min="2000"
                max={new Date().getFullYear()}
                value={formData.tahun_masuk}
                onChange={(e) => setFormData({ ...formData, tahun_masuk: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program Studi *</label>
              <select
                value={formData.prodi_id}
                onChange={(e) => {
                  const prodiId = Number(e.target.value);
                  setFormData({ ...formData, prodi_id: prodiId, konsentrasi_id: 0 });
                  fetchKonsentrasiByProdi(prodiId);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              >
                <option value={0}>Pilih Prodi</option>
                {prodiOptions.length > 0 ? (
                  prodiOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                ) : (
                  <option value={0} disabled>
                    {dropdownLoading ? "Memuat..." : "Data tidak tersedia"}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konsentrasi</label>
              <select
                value={formData.konsentrasi_id}
                onChange={(e) => setFormData({ ...formData, konsentrasi_id: Number(e.target.value) })}
                disabled={formData.prodi_id === 0}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={0}>Pilih Konsentrasi</option>
                {konsentrasiByProdi.length > 0 ? (
                  konsentrasiByProdi.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name}
                    </option>
                  ))
                ) : (
                  <option value={0} disabled>
                    {formData.prodi_id === 0 ? "Pilih Prodi terlebih dahulu" : "Tidak ada konsentrasi"}
                  </option>
                )}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Judul Skripsi/Proposal</label>
              <input
                type="text"
                value={formData.judul_skripsi}
                onChange={(e) => setFormData({ ...formData, judul_skripsi: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          {formError && <div className="text-red-600 text-sm">{formError}</div>}
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
        title="Hapus Mahasiswa"
        message="Apakah Anda yakin ingin menghapus mahasiswa ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
      />
    </div>
  );
}
