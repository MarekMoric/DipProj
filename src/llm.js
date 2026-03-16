/**
 * Gemini API Integration for Sentiment Analysis
 */

const MODEL_NAME = 'gemini-2.5-flash';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`;

// The predefined prompt structure
const SYSTEM_PROMPT = `
You are a highly accurate sentiment analysis API. 
Your task is to evaluate the sentiment of the provided social media text.
If provided with a collection or "bag" of texts, you MUST evaluate the OVERALL aggregated sentiment of the entire collection combined.
You MUST respond with a JSON object containing exactly two keys:
1. "sentiment": One of the following exact options: POSITIVE, NEGATIVE, or NEUTRAL.
2. "explanation": A brief, 1-3 sentence explanation of why you assigned this sentiment based on the text (or aggregated text).
Do not include any other text, markdown formatting (like \`\`\`json), or explanations outside of the JSON block.
If the text cannot be understood, default "sentiment" to NEUTRAL and provide an appropriate "explanation".
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
  const userPrompt = `Please analyze the following collection of tweets and determine the single overall, aggregated sentiment for the entire group. Do not analyze each one individually. Provide one aggregated sentiment and a brief explanation.\n\n${combinedText}`;

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
      const resultText = data.candidates[0].content.parts[0].text.trim();
      
      // Strip markdown backticks if present
      let cleanText = resultText;
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
      }
      
      try {
        const parsedResult = JSON.parse(cleanText);
        const sentiment = parsedResult.sentiment?.toLowerCase() || 'neutral';
        const explanation = parsedResult.explanation || 'No explanation provided.';
        
        let finalSentiment = 'neutral';
        if (sentiment.includes('positive')) finalSentiment = 'positive';
        if (sentiment.includes('negative')) finalSentiment = 'negative';

        return { sentiment: finalSentiment, explanation };
      } catch (parseError) {
        console.error('Failed to parse JSON response from LLM.');
        console.error('Raw resultText:', resultText);
        console.error('Tried to parse:', cleanText);
        return { sentiment: 'error', explanation: 'Failed to understand LLM response format.' };
      }
    } else {
      console.error('Unexpected response format:', data);
      return { sentiment: 'error', explanation: 'Unexpected LLM API response.' };
    }
  } catch (error) {
    console.error('Failed to evaluate sentiment:', error);
    return { sentiment: 'error', explanation: 'A network or API error occurred.' };
  }
}
