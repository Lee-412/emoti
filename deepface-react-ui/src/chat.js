import stringSimilarity from 'string-similarity';

function removeDiacritics(str) {
  return str
    .normalize('NFD')                    // tách dấu
    .replace(/[\u0300-\u036f]/g, '')     // loại bỏ dấu
    .replace(/đ/g, 'd')                  // chuẩn hóa "đ"
    .replace(/Đ/g, 'D')
    .replace(/[^\w\s.,?!]/gi, '')        // giữ lại chữ, số, khoảng trắng, dấu câu cơ bản
    .toLowerCase();
}

export const askBot = async (prompt) => {
  const cleanedInput = removeDiacritics(prompt);

  try {
    // Gọi API server (giống backend bạn cung cấp)
    const response = await fetch(`http://localhost:8080/api/search?q=${cleanedInput}`);
    const data = await response.json();
    console.log("Response từ API:", data);
    
    if (data?.answer) {
      return data.answer;
    } else {
      return "Xin lỗi, tôi chưa hiểu câu hỏi đó 😥";
    }
  } catch (error) {
    console.error("Lỗi kết nối API:", error);
    return "Có lỗi xảy ra khi kết nối đến chatbot.";
  }
};
