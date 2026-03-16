/**
 * Gemini API Integration for Sentiment Analysis
 */

const MODEL_NAME = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// The predefined prompt structure
const SYSTEM_PROMPT = `
You are a highly accurate sentiment analysis API. 
Your task is to evaluate the sentiment of the provided social media text.
You MUST respond with exactly one word from the following options: POSITIVE, NEGATIVE, or NEUTRAL.
Do not include any other text, explanations, or punctuation.
If the text cannot be understood, default to NEUTRAL.
`;

/**
 * Evaluates the sentiment of a single text string using Gemini.
 * @param {string} text 
 * @param {string} apiKey 
 * @returns {Promise<string>} 'positive', 'negative', 'neutral', or 'error'
 */
export async function evaluateSentiment(text, apiKey) {
  if (!apiKey) {
    throw new Error('API Key is missing. Please configure it in Settings.');
  }

  const payload = {
    contents: [
      {
        parts: [
          { text: SYSTEM_PROMPT },
          { text: `\n\nText to analyze:\n"${text}"` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1, // Low temperature for deterministic output
      maxOutputTokens: 10,
    }
  };

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the result
    if (data.candidates && data.candidates.length > 0) {
      const resultText = data.candidates[0].content.parts[0].text.trim().toLowerCase();
      
      // Clean up the model output just in case (e.g., if it adds a period)
      if (resultText.includes('positive')) return 'positive';
      if (resultText.includes('negative')) return 'negative';
      return 'neutral';
    } else {
      console.error('Unexpected response format:', data);
      return 'error';
    }
  } catch (error) {
    console.error('Failed to evaluate sentiment:', error);
    return 'error';
  }
}

/**
 * Evaluates the aggregated sentiment of a batch of texts using Gemini.
 * @param {Array<string>} texts - Array of text strings
 * @param {string} apiKey 
 * @returns {Promise<string>} 'positive', 'negative', 'neutral', or 'error'
 */
export async function evaluateAggregatedSentiment(texts, apiKey) {
  if (!apiKey) {
    throw new Error('API Key is missing. Please configure it in Settings.');
  }

  const combinedText = texts.map((t, i) => `[Tweet ${i+1}]: ${t}`).join('\n');
  const userPrompt = `This is a bag of tweets for which I would like to have sentiment analysis done. Keep it brief and just give me the overall sentiment.\n\n${combinedText}`;

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
      temperature: 0.1, // Low temperature for deterministic output
      maxOutputTokens: 10,
    }
  };

  try {
    const response = await fetch(`${API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse the result
    if (data.candidates && data.candidates.length > 0) {
      const resultText = data.candidates[0].content.parts[0].text.trim().toLowerCase();
      
      // Clean up the model output just in case (e.g., if it adds a period)
      if (resultText.includes('positive')) return 'positive';
      if (resultText.includes('negative')) return 'negative';
      return 'neutral';
    } else {
      console.error('Unexpected response format:', data);
      return 'error';
    }
  } catch (error) {
    console.error('Failed to evaluate sentiment:', error);
    return 'error';
  }
}
