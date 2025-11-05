export type UserRole = 'admin' | 'staff' | 'operator';

// Tambahkan tipe Role dan Permission
export interface Permission {
  id: number;
  name: string;
  codename: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
}

export interface Division {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role; // Sekarang object Role (bukan UserRole string)
  divisionId: string;
  divisionName: string;
  avatar?: string; // Tambahkan field avatar jika diperlukan
  createdAt: string;
}

export interface Archive {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  fileType: string;
  fileSize: string;
  divisionId: string;
  divisionName: string;
  uploadedBy: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = 'light' | 'dark';