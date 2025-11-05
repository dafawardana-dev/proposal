import { useState } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { apiRequest } from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function AktivasiAkun() {
  const navigate = useNavigate();
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Password dan Konfirmasi Password tidak cocok.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password minimal harus 8 karakter.");
      setLoading(false);
      return;
    }
    
    if (!/^\d{9,15}$/.test(nim)) {
      setError("NIM harus berupa 9–15 digit angka.");
      setLoading(false);
      return;
    }

    try {      
      await apiRequest('/aktivasi-mahasiswa/', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nim: nim,
          password: password,
        })
      });

      alert(`Aktivasi akun untuk NIM ${nim} berhasil! Anda sudah bisa Login.`);
      navigate('/login');
    } catch (err: any) {
      const apiErrorMessage = err.response?.detail || err.message || "Aktivasi gagal. Pastikan NIM terdaftar dan belum diaktifkan.";
      setError(apiErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 font-sans">
      <Card className="w-full max-w-md">
        <CardBody>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">2. Aktivasi Akun Login</h1>
            <p className="text-gray-600">Buat password untuk NIM Anda dan selesaikan aktivasi (Tahap 2 dari 2).</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg shadow-md">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="NIM (Username Login) *"
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value.replace(/\D/g, '').substring(0, 15))}
              placeholder="Masukkan NIM yang sudah didaftarkan"
              required
            />
            <Input
              label="Password Baru *"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              required
            />
            <Input
              label="Konfirmasi Password *"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi Password"
              required
            />
            
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              {loading ? "Memproses Aktivasi..." : "Aktivasi Akun Sekarang"}
            </Button>
            
            <p className="text-center text-gray-600 mt-4 text-sm">
              <button 
                type="button" 
                onClick={() => navigate('/login')}
                className="text-blue-600 hover:underline font-medium"
              >
                Sudah aktif? Kembali ke Login
              </button>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
