import urllib.request
import json

api_key = "AIzaSyBjHKrIbSjYnz4d4niI-nXGy8dEWzoYRRE"
url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"

payload = {
    "contents": [
        {
            "parts": [
                {"text": "You are a Highly accurate sentiment analysis API. POSITIVE, NEGATIVE, or NEUTRAL."},
                {"text": "This is a bag of tweets for which I would like to have sentiment analysis done. Keep it brief and just give me the overall sentiment.\\n\\n[Tweet 1]: Hello"}
            ]
        }
    ],
    "generationConfig": {
        "temperature": 0.1,
        "maxOutputTokens": 10
    }
}

req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Response:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Error Body:", e.read().decode('utf-8'))
except Exception as e:
    print("Error:", str(e))
