import React, { useState } from 'react';
import { FileSpreadsheet, Wand2, Download } from 'lucide-react';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import { extractTableFromPdf, ExtractedRow } from './services/geminiService';
import { fileToBase64, downloadAsCSV } from './utils/fileUtils';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ExtractedRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    try {
      const base64 = await fileToBase64(selectedFile);
      const extractedData = await extractTableFromPdf(base64);
      setData(extractedData);
    } catch (err: any) {
      console.error(err);
      setError("Có lỗi xảy ra khi xử lý file. Vui lòng thử lại hoặc kiểm tra xem file có bị hỏng không.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setData(null);
    setError(null);
  };

  const handleDownload = () => {
    if (data && file) {
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      downloadAsCSV(data, `${fileNameWithoutExt}_extracted`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
              PDF to Excel AI
            </h1>
          </div>
          <div className="text-sm font-medium text-gray-500 hidden sm:flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-purple-500" />
            <span>AI Powered Extraction</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro Section */}
        {!data && !isLoading && (
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Chuyển đổi PDF sang Excel <br className="hidden sm:block" />
              <span className="text-blue-600">trong tích tắc</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Tải lên báo cáo tài chính, hóa đơn, hoặc danh sách nhân sự. 
              AI sẽ tự động nhận diện bảng biểu và xuất ra file Excel chuẩn xác cho bạn.
            </p>
          </div>
        )}

        {/* Upload Section */}
        {!data && (
          <div className="transition-all duration-500 ease-in-out">
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
            
            {error && (
              <div className="mt-6 max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center animate-pulse">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {data && (
          <DataPreview 
            data={data} 
            fileName={file?.name || "document.pdf"} 
            onReset={handleReset}
            onDownload={handleDownload}
          />
        )}
        
        {/* Features / Benefits (Only shown on start) */}
        {!data && !isLoading && (
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Định dạng bảng thông minh</h3>
              <p className="text-gray-500 text-sm">Tự động phát hiện tiêu đề cột và hàng, xử lý cả các bảng phức tạp hoặc bị gộp ô.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Wand2 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Công nghệ Gemini 2.5</h3>
              <p className="text-gray-500 text-sm">Sử dụng model AI mới nhất của Google để đọc hiểu tài liệu như con người.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Download className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Xuất Excel (CSV) chuẩn</h3>
              <p className="text-gray-500 text-sm">File xuất ra hỗ trợ đầy đủ tiếng Việt (UTF-8) và tương thích mọi phiên bản Excel.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;