import { ExtractedRow } from "../services/geminiService";

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // Remove the "data:application/pdf;base64," prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const downloadAsCSV = (data: ExtractedRow[], filename: string) => {
  if (data.length === 0) return;

  // Get all unique headers
  const headers = Array.from(new Set(data.flatMap(row => Object.keys(row))));

  // Create CSV content
  const csvContent = [
    headers.join(","), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle strings that might contain commas or newlines
        if (typeof value === 'string') {
          const escaped = value.replace(/"/g, '""');
          return `"${escaped}"`;
        }
        return value ?? "";
      }).join(",")
    )
  ].join("\n");

  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};