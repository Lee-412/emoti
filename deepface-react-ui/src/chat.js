import qaData from './chatbot_qa_10k.json';

export const askBot = async (prompt) => {
  const input = prompt.trim().toLowerCase();

  // Duyệt toàn bộ key
  for (const key of Object.keys(qaData)) {
    const pureKey = key.split('#')[0].trim().toLowerCase();

    // So sánh: nếu câu hỏi chứa đoạn key bất kỳ
    if (
      input.includes(pureKey) ||
      pureKey.includes(input) || // để user gõ ngắn cũng match
      input.startsWith(pureKey) ||
      input.endsWith(pureKey)
    ) {
      return qaData[key];
    }
  }

  return "Xin lỗi, tôi chưa hiểu câu hỏi đó 😥";
};
