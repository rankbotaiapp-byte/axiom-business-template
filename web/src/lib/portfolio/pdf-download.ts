import type { ExecutionExport } from "./record-model";

export async function downloadExecutionPdf(model: ExecutionExport): Promise<void> {
  const { executionPdfInstance } = await import("./pdf-document");
  const blob = await executionPdfInstance(model).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = model.filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
