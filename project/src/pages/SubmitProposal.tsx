import { useState } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { apiFormDataRequest } from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

export default function SubmitProposal() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ judul: "", deskripsi: "" });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validasi frontend
    if (!formData.judul.trim()) {
      setError("Judul wajib diisi");
      return;
    }
    if (formData.judul.trim().length < 5) {
      setError("Judul minimal 5 karakter");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('judul', formData.judul.trim());
    if (formData.deskripsi.trim()) {
      formDataToSend.append('deskripsi', formData.deskripsi.trim());
    }
    if (file) {
      formDataToSend.append('file', file);
    }

    try {
      setSubmitting(true);
      await apiFormDataRequest("/proposals/", formDataToSend, "POST");
      
      setSuccess(true);
      setFormData({ judul: "", deskripsi: "" });
      setFile(null);
    } catch (err: any) {
      let message = "Gagal mengajukan proposal. Coba lagi nanti.";
      
      // Tangani error dari backend
      if (err.data?.judul) {
        message = err.data.judul[0];
      } else if (err.data?.file) {
        message = err.data.file[0];
      } else if (err.data?.detail) {
        message = err.data.detail;
      } else if (err.message?.includes("413")) {
        message = "File terlalu besar! Maksimal 5 MB.";
      }
      
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        alert("Format file tidak didukung. Gunakan PDF, DOC, atau DOCX.");
        e.target.value = "";
        return;
      }
      // Validasi ukuran
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("File terlalu besar! Maksimal 5 MB.");
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Card>
        <CardBody>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Ajukan Judul Proposal
          </h2>

          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg">
               Proposal berhasil diajukan! Status akan diperbarui setelah direview.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
               {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Judul Proposal */}
            <div>
              <label htmlFor="judul" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Judul Proposal *
              </label>
              <input
                id="judul"
                type="text"
                value={formData.judul}
                onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Contoh: Sistem Prediksi Cuaca Berbasis AI"
                maxLength={300}
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Minimal 5 karakter, maksimal 300 karakter
              </p>
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="deskripsi" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deskripsi (Opsional)
              </label>
              <textarea
                id="deskripsi"
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Jelaskan latar belakang dan tujuan proposal Anda..."
                rows={4}
                maxLength={1000}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Maksimal 1000 karakter
              </p>
            </div>

            {/* Upload File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File Proposal (Opsional)
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600 dark:text-gray-400">
                    <label className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
                      <span>Upload file</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">atau seret ke sini</p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PDF, DOC, DOCX maksimal 5 MB
                  </p>
                  {file && (
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-2">
                      {file.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setFormData({ judul: "", deskripsi: "" });
                  setFile(null);
                  setError(null);
                  setSuccess(false);
                }}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengajukan...
                  </>
                ) : (
                  "Ajukan Proposal"
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}