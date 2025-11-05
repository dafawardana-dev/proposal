// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { apiRequest } from '../utils/api';

type AuthContextType = {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await apiRequest('/users/me/');
      const mappedUser: User = {
        id: String(userData.id),
        email: userData.email,
        name: `${userData.first_name} ${userData.last_name}`.trim() || userData.username,
        role: {
          id: String(userData.role.id),
          name: userData.role.name,
          description: userData.role.description || '',
          permissions: userData.role.permissions || []
        },
        divisionId: userData.division?.id ? String(userData.division.id) : '',
        divisionName: userData.division?.name || '',
        createdAt: userData.date_joined,
      };
      setUser(mappedUser);
      localStorage.setItem('user', JSON.stringify(mappedUser));
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      // Login dengan TokenAuthentication → respons: { token: "..." }
      const response = await apiRequest('/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      // Simpan token
      localStorage.setItem('authToken', response.token);

      // Ambil data user
      const userData = await apiRequest('/users/me/');
      const mappedUser: User = {
        id: String(userData.id),
        email: userData.email,
        name: `${userData.first_name} ${userData.last_name}`.trim() || userData.username,
        role: {
          id: String(userData.role.id),
          name: userData.role.name,
          description: userData.role.description || '',
          permissions: userData.role.permissions || []
        },
        divisionId: userData.division?.id ? String(userData.division.id) : '',
        divisionName: userData.division?.name || '',
        createdAt: userData.date_joined,
      };

      setUser(mappedUser);
      localStorage.setItem('user', JSON.stringify(mappedUser));
    } catch (err: any) {
      // Hapus token jika gagal
      localStorage.removeItem('authToken');
      throw new Error(err.message || 'Login gagal. Periksa username dan password.');
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await apiRequest('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      localStorage.setItem('authToken', response.token);
      const mappedUser: User = {
        id: String(response.id),
        email: response.email,
        name: `${response.first_name} ${response.last_name}`.trim() || response.username,
        role: response.role,
        divisionId: String(response.division.id),
        divisionName: response.division.name,
        createdAt: response.date_joined,
      };
      setUser(mappedUser);
      localStorage.setItem('user', JSON.stringify(mappedUser));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  
  const isAdmin = context.user?.role?.name === "Super Admin";
  const isMahasiswa = context.user?.is_mahasiswa;
  const isDosen = context.user?.role?.name === "Dosen";

  return {
    ...context,
    isAdmin,
    isMahasiswa,
    isDosen
  };
};