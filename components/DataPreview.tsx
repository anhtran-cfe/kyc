import React from 'react';
import { ExtractedRow } from '../services/geminiService';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';

interface DataPreviewProps {
  data: ExtractedRow[];
  fileName: string;
  onReset: () => void;
  onDownload: () => void;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, fileName, onReset, onDownload }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-sm border border-gray-200 mt-6">
        <AlertCircle className="w-10 h-10 text-orange-400 mb-3" />
        <p className="text-gray-600 text-center">
          Không tìm thấy dữ liệu bảng nào trong file PDF này.<br/>
          Vui lòng thử lại với file khác rõ ràng hơn.
        </p>
        <button 
          onClick={onReset}
          className="mt-4 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const headers: string[] = Array.from(new Set(data.flatMap(row => Object.keys(row))));

  return (
    <div className="w-full mt-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-6 bg-green-500 rounded-full"></span>
            Kết quả trích xuất
          </h2>
          <p className="text-sm text-gray-500 mt-1">Từ file: <span className="font-medium text-gray-700">{fileName}</span> ({data.length} dòng)</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onReset}
            className="flex-1 sm:flex-none items-center justify-center flex gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
          <button
            onClick={onDownload}
            className="flex-1 sm:flex-none items-center justify-center flex gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-md transition-all"
          >
            <Download className="w-4 h-4" />
            Tải Excel (.csv)
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 w-12 text-center text-gray-400">#</th>
                {headers.map((header, idx) => (
                  <th key={idx} scope="col" className="px-6 py-3 font-semibold whitespace-nowrap">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, rowIdx) => (
                <tr key={rowIdx} className="bg-white hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 text-center text-gray-400 text-xs">{rowIdx + 1}</td>
                  {headers.map((header, colIdx) => (
                    <td key={`${rowIdx}-${colIdx}`} className="px-6 py-3 whitespace-nowrap text-gray-700">
                      {row[header] !== undefined && row[header] !== null ? String(row[header]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
           <span>Hiển thị tất cả {data.length} dòng</span>
           <span>Powered by Gemini 2.5 Flash</span>
        </div>
      </div>
    </div>
  );
};

export default DataPreview;