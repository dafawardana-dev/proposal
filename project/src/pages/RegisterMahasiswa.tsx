// src/pages/RegisterMahasiswa.tsx
import { useState, useEffect } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { apiRequest } from "../utils/api";
import { useNavigate } from "react-router-dom";
import { WilayahPicker, Wilayah } from "../components/WilayahPicker";

interface DropdownOption {
  id: number;
  name: string;
}

export default function RegisterMahasiswa() {
  const navigate = useNavigate();

  const [selectedWilayahPath, setSelectedWilayahPath] = useState<Wilayah[] | null>(null);

  const [formData, setFormData] = useState({
    nim: "",
    nama_mahasiswa: "",
    alamat: "",
    tgl_lahir: "",
    jk: "L" as "L" | "P",
    tahun_masuk: new Date().getFullYear(),
    tempat_lahir_id: null as number | null,
    prodi_id: 0,
    konsentrasi_id: 0,
    judul_skripsi: "BELUM ADA",
    password: "",
    confirmPassword: "",
  });

  const [prodiOptions, setProdiOptions] = useState<DropdownOption[]>([]);
  const [konsentrasiOptions, setKonsentrasiOptions] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownError, setDropdownError] = useState<string | null>(null);
  const [dropdownLoading, setDropdownLoading] = useState(true);

  // Fetch dropdown
  useEffect(() => {
    const fetchDropdowns = async () => {
      setDropdownLoading(true);
      setDropdownError(null);
      try {
        const prodiRes = await apiRequest("/prodis/dropdown/");
        const konsentrasiRes = await apiRequest("/konsentrasi-utama/dropdown/");
        if (Array.isArray(prodiRes) && Array.isArray(konsentrasiRes)) {
          setProdiOptions(prodiRes);
          setKonsentrasiOptions(konsentrasiRes);
        } else {
          throw new Error("Format respons tidak valid");
        }
      } catch (err: any) {
        setDropdownError(err.message?.includes("404")
          ? "Data master belum tersedia. Hubungi administrator."
          : "Gagal memuat data pilihan dari server."
        );
      } finally {
        setDropdownLoading(false);
      }
    };
    fetchDropdowns();
  }, []);

  const handleWilayahChange = (path: Wilayah[] | null) => {
    setSelectedWilayahPath(path);
    const idDesa = path && path.length === 4 ? path[3].id : null;
    setFormData((prev) => ({ ...prev, tempat_lahir_id: idDesa }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validasi password
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan Konfirmasi Password tidak cocok.");
      setLoading(false);
      return;
    }
    if (formData.password.length < 8) {
      setError("Password minimal 8 karakter.");
      setLoading(false);
      return;
    }

    try {
      if (!/^\d{9,15}$/.test(formData.nim)) throw new Error("NIM harus 9–15 digit angka");
      if (!formData.nama_mahasiswa.trim()) throw new Error("Nama lengkap wajib diisi");
      if (!formData.tempat_lahir_id || !selectedWilayahPath || selectedWilayahPath.length < 4) {
        throw new Error("Tempat lahir wajib dipilih sampai Desa/Kelurahan");
      }

      const payload = {
        nim: formData.nim,
        nama_mahasiswa: formData.nama_mahasiswa.trim(),
        alamat: formData.alamat.trim(),
        tempat_lahir: formData.tempat_lahir_id,
        tgl_lahir: formData.tgl_lahir,
        jk: formData.jk,
        tahun_masuk: formData.tahun_masuk,
        prodi: formData.prodi_id,
        judul_skripsi: formData.judul_skripsi,
        password: formData.password,
        password2: formData.confirmPassword,
        ...(formData.konsentrasi_id > 0 && { konsentrasi: formData.konsentrasi_id }),
      };
      
      await apiRequest("/register-mahasiswa/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      alert("Registrasi berhasil! Silakan login dengan NIM dan password Anda.");
      navigate("/login");
    } catch (err: any) {
      console.error("Error registrasi:", err);
      const errorMessage = err?.response?.detail || err?.message || "Gagal registrasi. Coba lagi.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <Card className="w-full max-w-2xl">
        <CardBody>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Registrasi Mahasiswa Baru</h1>
            <p className="text-gray-600">Isi data diri dan buat password akun Anda</p>
          </div>

          {dropdownError && <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-lg">{dropdownError}</div>}
          {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* NIM & Nama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="NIM *"
                type="text"
                value={formData.nim}
                onChange={(e) => setFormData({ ...formData, nim: e.target.value.replace(/\D/g, "").substring(0, 15) })}
                placeholder="Contoh: 230101001"
                required
              />
              <Input
                label="Nama Lengkap *"
                value={formData.nama_mahasiswa}
                onChange={(e) => setFormData({ ...formData, nama_mahasiswa: e.target.value })}
                placeholder="Nama sesuai KTP"
                required
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password *"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimal 8 karakter"
                required
              />
              <Input
                label="Konfirmasi Password *"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Ulangi password"
                required
              />
            </div>

            {/* Tempat Lahir, Alamat, Tanggal Lahir */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <WilayahPicker
                  value={selectedWilayahPath}
                  onChange={handleWilayahChange}
                  error={!formData.tempat_lahir_id && error ? "Tempat lahir wajib dipilih sampai Desa/Kelurahan" : ""}
                />
              </div>
              <Input
                label="Alamat Domisili*"
                value={formData.alamat}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Alamat lengkap"
                required
              />
              <Input
                type="date"
                label="Tanggal Lahir *"
                value={formData.tgl_lahir}
                onChange={(e) => setFormData({ ...formData, tgl_lahir: e.target.value })}
                required
              />
            </div>

            {/* Jenis Kelamin, Tahun Angkatan, Prodi, Konsentrasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin *</label>
                <div className="flex gap-4 p-2 border border-gray-300 rounded-lg bg-white h-[42px] items-center">
                  <label className="flex items-center text-sm">
                    <input type="radio" name="jk" value="L" checked={formData.jk === "L"} onChange={() => setFormData({ ...formData, jk: "L" })} className="mr-2" />
                    Laki-laki
                  </label>
                  <label className="flex items-center text-sm">
                    <input type="radio" name="jk" value="P" checked={formData.jk === "P"} onChange={() => setFormData({ ...formData, jk: "P" })} className="mr-2" />
                    Perempuan
                  </label>
                </div>
              </div>

              <Input
                type="number"
                label="Tahun Angkatan *"
                value={formData.tahun_masuk}
                onChange={(e) => setFormData({ ...formData, tahun_masuk: Number(e.target.value) })}
                min="2000"
                max={new Date().getFullYear()}
                required
              />

              <Select
                label="Program Studi *"
                value={formData.prodi_id}
                onChange={(e) => setFormData({ ...formData, prodi_id: Number(e.target.value) })}
                options={prodiOptions.length > 0 ? prodiOptions.map(p => ({ value: p.id, label: p.name })) : [{ value: 0, label: dropdownLoading ? "Memuat..." : "Data tidak tersedia" }]}
                required
                disabled={dropdownLoading || prodiOptions.length === 0}
              />

              <Select
                label="Konsentrasi"
                value={formData.konsentrasi_id}
                onChange={(e) => setFormData({ ...formData, konsentrasi_id: Number(e.target.value) })}
                options={[{ value: 0, label: "Pilih (Opsional)" }, ...konsentrasiOptions.map(k => ({ value: k.id, label: k.name }))] }
                disabled={dropdownLoading}
              />
            </div>

            <div className="pt-4">
              <Button type="submit" disabled={loading || dropdownLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                {loading ? "Mendaftar..." : "Daftar Sekarang"}
              </Button>
              <p className="text-center text-gray-600 mt-4 text-sm">
                Sudah punya akun?{" "}
                <button type="button" onClick={() => navigate("/login")} className="text-blue-600 hover:underline font-medium">
                  Login di sini
                </button>
              </p>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}