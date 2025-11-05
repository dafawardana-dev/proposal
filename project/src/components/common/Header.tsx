// src/components/common/Header.tsx
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

export const Header = ({ onMenuClick, title }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            ) : (
              <Sun className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};