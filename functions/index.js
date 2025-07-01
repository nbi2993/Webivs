const GEMINI_API_KEY = functions.config().gemini.key || process.env.GEMINI_API_KEY;

// Khởi tạo model AI của Google
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Định nghĩa route /api/chat
app.post("/chat", async (req, res) => {
  try {
    const { history, message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Cấu trúc lại history cho phù hợp với yêu cầu của Gemini API
    const chatHistory = (history || []).map(item => ({
      role: item.role,
      parts: [{ text: item.parts[0].text }],
    }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, response: text });

  } catch (error) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

// Xuất Express app thành một Firebase Function có tên là 'api'
exports.api = functions.region('asia-southeast1').https.onRequest(app);
