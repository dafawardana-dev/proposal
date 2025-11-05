import { Upload, Download } from 'lucide-react';
import { ChangeEventHandler } from 'react';

interface DataActionsProps {
  onFileUpload: ChangeEventHandler<HTMLInputElement>;
  onDownloadTemplate: () => void;
  templateLabel?: string;
}

export const DataActions = ({
  onFileUpload,
  onDownloadTemplate,
  templateLabel = "Template"
}: DataActionsProps) => {
  return (
    <div className="relative group">
      <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium">
        <Upload size={16} />
        Pilih Aksi
        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block z-10">
        <label className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <Upload size={14} className="inline mr-2" />
          Upload Data
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={onFileUpload}
            className="hidden"
          />
        </label>
        <button
          onClick={onDownloadTemplate}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
        >
          <Download size={14} className="inline mr-2" />
          Download {templateLabel}
        </button>
      </div>
    </div>
  );
};