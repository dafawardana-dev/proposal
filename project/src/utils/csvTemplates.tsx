export type TemplateType = "mahasiswa" | "prodi" | "konsentrasi" | "dosen";

interface TemplateConfig {
  headers: string[];
  filename: string;
  exampleRow?: string[];
}

const TEMPLATES: Record<TemplateType, TemplateConfig> = {  
mahasiswa: {
  headers: ["nim", "nama_mahasiswa", "tempat_lahir", "tgl_lahir", "jk", "tahun_masuk", "prodi", "konsentrasi", "judul_skripsi"],
  filename: "template_mahasiswa.csv",
  exampleRow: ["1101010004", "Lina Budiarti", "11.01", "1981-11-26", "P", "2020", "10101", "101011", "Sistem Rekomendasi"],
},
  prodi: {
    headers: ["code", "name"],
    filename: "template_prodi.csv",
    exampleRow: ["10101", "Teknik Informatika"],
  },
  konsentrasi: {
    headers: ["code", "name"],
    filename: "template_konsentrasi.csv",
    exampleRow: ["101011", "Kecerdasan Buatan"],
  },
  dosen: {
    headers: [
      "kode_dosen",          
      "nidn",               
      "nama_dosen",
      "gelar_depan",
      "gelar_belakang",
      "jk",                 
      "tempat_lahir",       
      "tgl_lahir",           
      "kode_unit",         
      "status_aktif",
      "jabatan_fungsional"
    ],
    filename: "template_dosen.csv",
    exampleRow: [
      "DSN001",
      "0012345678",
      "Budi Santoso",
      "Dr.",
      "M.Kom.",
      "L",
      "Surabaya",
      "1980-01-01",
      "10101",
      "Aktif",
      "Lektor Kepala"
    ],
  },
};

export const downloadCsvTemplate = (type: TemplateType) => {
  const config = TEMPLATES[type];
  let csvContent = config.headers.join(",") + "\n";

  if (config.exampleRow) {
    csvContent += config.exampleRow.join(",") + "\n";
  }

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = config.filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};