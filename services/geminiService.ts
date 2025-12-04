import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ExtractedRow {
  [key: string]: string | number | null;
}

export const extractTableFromPdf = async (base64Data: string): Promise<ExtractedRow[]> => {
  try {
    const modelId = "gemini-2.5-flash"; // Excellent for multimodal document understanding

    const prompt = `
      Bạn là một chuyên gia xử lý dữ liệu. Nhiệm vụ của bạn là phân tích file PDF được cung cấp.
      1. Tìm các bảng dữ liệu chính hoặc danh sách có cấu trúc trong tài liệu.
      2. Trích xuất toàn bộ dữ liệu đó.
      3. Trả về kết quả dưới dạng một mảng JSON các đối tượng (JSON Array of Objects).
      4. Các khóa (keys) của đối tượng phải là tiêu đề cột của bảng. Nếu bảng không có tiêu đề, hãy tự đặt tên hợp lý (ví dụ: Cot1, Cot2).
      5. Giữ nguyên định dạng dữ liệu (số, ngày tháng, tiền tệ) và giữ nguyên Tiếng Việt.
      6. Nếu có nhiều bảng, hãy gộp chúng lại nếu cấu trúc giống nhau, hoặc chỉ lấy bảng quan trọng nhất chứa nhiều dữ liệu nhất.
      7. Chỉ trả về JSON thuần, không markdown.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Data,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        // We allow loose schema to let the model define columns based on the PDF content
      },
    });

    if (!response.text) {
      throw new Error("Không nhận được phản hồi từ Gemini.");
    }

    const data = JSON.parse(response.text);

    if (Array.isArray(data)) {
      return data as ExtractedRow[];
    } else if (typeof data === 'object' && data !== null) {
      // Sometimes models wrap the array in a key like "data": [...]
      const values = Object.values(data);
      const arrayFound = values.find(v => Array.isArray(v));
      if (arrayFound) return arrayFound as ExtractedRow[];
    }

    throw new Error("Cấu trúc dữ liệu trả về không hợp lệ.");

  } catch (error) {
    console.error("Error extracting data:", error);
    throw error;
  }
};