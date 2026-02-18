const downloadExcelFromBuffer = async (fileBuffer, filename) => {
  const byteArray = Array.isArray(fileBuffer)
    ? Uint8Array.from(fileBuffer)
    : new Uint8Array(fileBuffer || []);

  const blob = new Blob([byteArray], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);

  return {
    success: true,
    error: "",
  };
};

export default downloadExcelFromBuffer;
