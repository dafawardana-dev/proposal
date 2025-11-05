// src/layouts/DashboardLayout.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom"; 
import { Sidebar } from "../components/common/Sidebar";
import { Header } from "../components/common/Header";
import { useAuth } from "../contexts/AuthContext";
import { PageType } from "../App";

export const DashboardLayout = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<PageType>("dashboard");
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });
  
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);
  
  const updateMedia = useCallback(() => {
    setIsDesktop(window.innerWidth >= 1024);
  }, []);

  useEffect(() => {
    window.addEventListener("resize", updateMedia);
    return () => window.removeEventListener("resize", updateMedia);
  }, [updateMedia]);

  
  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setActiveTab("dashboard");
    else if (path.startsWith("/prodis")) setActiveTab("prodis");
    else if (path.startsWith("/mahasiswa")) setActiveTab("mahasiswa");
    else if (path.startsWith("/dosen")) setActiveTab("dosen");
    else if (path.startsWith("/konsentrasi-utama")) setActiveTab("konsentrasi-utama");
    else if (path.startsWith("/proposal-status")) setActiveTab("proposal-status");
    else if (path.startsWith("/submit-proposal")) setActiveTab("submit-proposal");
    else if (path.startsWith("/manage-proposals")) setActiveTab("manage-proposals");
    else if (path.startsWith("/bimbingan")) setActiveTab("bimbingan");
    else if (path.startsWith("/religions")) setActiveTab("religions");
    else if (path.startsWith("/wilayah")) setActiveTab("wilayah");
    else if (path.startsWith("/educations")) setActiveTab("educations");
    else if (path.startsWith("/users")) setActiveTab("users");
    else if (path.startsWith("/divisions")) setActiveTab("divisions");
    else if (path.startsWith("/roles")) setActiveTab("roles");
    else if (path.startsWith("/settings")) setActiveTab("settings");
    else setActiveTab("dashboard");
  }, [location.pathname]);

  const handleSidebarToggle = () => {
    if (isDesktop) {
      setSidebarCollapsed(!isSidebarCollapsed);
    } else {
      setMobileSidebarOpen(!isMobileSidebarOpen);
    }
  };

  const getPageTitle = (): string => {
    switch (activeTab) {
      case "dashboard": return "Dashboard";
      case "konsentrasi-utama": return "Kelola Konsentrasi";
      case "prodis": return "Kelola Prodi";
      case "mahasiswa": return "Kelola Mahasiswa";
      case "dosen": return "Kelola Dosen";
      case "proposal-status": return "Status Proposal";
      case "submit-proposal": return "Ajukan Judul Proposal";
      case "manage-proposals": return "Kelola Proposal";
      case "bimbingan": return "Kelola Bimbingan";
      case "religions": return "Kelola Agama";
      case "wilayah": return "Kelola Wilayah";
      case "educations": return "Kelola Jenjang Pendidikan";
      case "users": return "Kelola Pengguna";
      case "divisions": return "Kelola Divisi";
      case "roles": return "Kelola Role";
      case "settings": return "Pengaturan";
      default: return "Dashboard";
    }
  };

  const getMainContentClass = () => {
    if (isMobileSidebarOpen) return "pl-0";
    return isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar
        activeTab={activeTab}
        isOpen={isMobileSidebarOpen}
        isCollapsed={isSidebarCollapsed}
      />

      <div className={`flex-1 flex flex-col min-w-0 ${getMainContentClass()}`}>
        <Header onMenuClick={handleSidebarToggle} title={getPageTitle()} />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet /> 
        </main>
      </div>

      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
};