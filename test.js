const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const apiKey = "AIzaSyBjHKrIbSjYnz4d4niI-nXGy8dEWzoYRRE"; // User provided test key

const SYSTEM_PROMPT = "You are a Highly accurate sentiment analysis API. POSITIVE, NEGATIVE, or NEUTRAL.";
const userPrompt = "This is a bag of tweets for which I would like to have sentiment analysis done. Keep it brief and just give me the overall sentiment.\\n\\n[Tweet 1]: Hello";

const payload = {
  contents: [
    {
      parts: [
        { text: SYSTEM_PROMPT },
        { text: userPrompt }
      ]
    }
  ],
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 10,
  }
};

fetch(`${API_URL}?key=${apiKey}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(payload)
})
.then(async res => {
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response:", text);
})
.catch(err => {
  console.error("Fetch Error:", err);
});
