import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ManageUsers } from "./pages/ManageUsers";
import { Divisions } from "./pages/Divisions";
import ManageKonsentrasiUtama from "./pages/ManageKonsentrasiUtama";
import { ManageRoles } from "./pages/ManageRoles";
import { Settings } from "./pages/Settings";
import ManageReligions from "./pages/ManageReligions";
import ManageWilayah from "./pages/ManageWilayah";
import ManageEducations from "./pages/ManageEducations";
import ManageProdi from "./pages/ManageProdi";
import ManageMahasiswa from "./pages/ManageMahasiswa";
import ManageDosen from "./pages/ManageDosen";
import ManageProposal from "./pages/ManageProposal";
import SubmitProposal from "./pages/SubmitProposal";
import ProposalStatus from "./pages/ProposalStatus";
import RegisterMahasiswa from "./pages/RegisterMahasiswa";
import AktivasiAkun from "./pages/AktivasiAkun";
import ManageBimbingan from "./pages/ManageBimbingan";

export type PageType =
  | "dashboard"
  | "konsentrasi-utama"
  | "prodis"
  | "mahasiswa"
  | "dosen"
  | "religions"
  | "wilayah"
  | "educations"
  | "users"
  | "divisions"
  | "roles"
  | "submit-proposal"
  | "manage-proposals"
  | "proposal-status"
  | "bimbingan"
  | "settings";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500 dark:text-gray-300">Memeriksa otentikasi...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return <div className="min-h-screen">{children}</div>;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicLayout>
                  <Login />
                </PublicLayout>
              }
            />
            <Route
              path="/register-mahasiswa"
              element={
                <PublicLayout>
                  <RegisterMahasiswa />
                </PublicLayout>
              }
            />
            <Route
              path="/aktivasi-akun"
              element={
                <PublicLayout>
                  <AktivasiAkun />
                </PublicLayout>
              }
            />

            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="prodis/*" element={<ManageProdi />} />
              <Route path="bimbingan/*" element={<ManageBimbingan />} />
              <Route path="mahasiswa/*" element={<ManageMahasiswa />} />
              <Route path="dosen/*" element={<ManageDosen />} />
              <Route path="konsentrasi-utama/*" element={<ManageKonsentrasiUtama />} />
              <Route path="proposal-status" element={<ProposalStatus />} />
              <Route path="submit-proposal" element={<SubmitProposal />} />
              <Route path="manage-proposals/*" element={<ManageProposal />} />
              <Route path="religions/*" element={<ManageReligions />} />
              <Route path="wilayah/*" element={<ManageWilayah />} />
              <Route path="educations/*" element={<ManageEducations />} />
              <Route path="users/*" element={<ManageUsers />} />
              <Route path="divisions/*" element={<Divisions />} />
              <Route path="roles/*" element={<ManageRoles />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
