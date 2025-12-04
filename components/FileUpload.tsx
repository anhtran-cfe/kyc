import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isLoading }) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isLoading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        onFileSelect(file);
      } else {
        alert("Vui lòng chỉ tải lên file PDF.");
      }
    }
  }, [onFileSelect, isLoading]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`w-full max-w-2xl mx-auto border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 ease-in-out cursor-pointer group
        ${isLoading 
          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
          : 'border-blue-300 bg-blue-50/50 hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg'
        }`}
    >
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        id="pdf-upload"
        onChange={handleInputChange}
        disabled={isLoading}
      />
      <label htmlFor="pdf-upload" className={`cursor-pointer w-full h-full flex flex-col items-center justify-center ${isLoading ? 'pointer-events-none' : ''}`}>
        <div className={`p-4 rounded-full mb-4 transition-colors ${isLoading ? 'bg-gray-100' : 'bg-blue-100 group-hover:bg-blue-200'}`}>
          {isLoading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          ) : (
            <Upload className="w-8 h-8 text-blue-600" />
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          {isLoading ? 'Đang xử lý...' : 'Tải lên file PDF'}
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          {isLoading 
            ? 'Gemini đang đọc và trích xuất dữ liệu từ file của bạn. Vui lòng đợi trong giây lát.' 
            : 'Kéo thả file vào đây hoặc nhấp để chọn. Chỉ hỗ trợ định dạng PDF.'}
        </p>
      </label>
    </div>
  );
};

export default FileUpload;