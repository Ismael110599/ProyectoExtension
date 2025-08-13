import * as https from 'https';

const API_URL = 'https://api.moonshot.ai/v1/chat/completions';

export async function getSuggestions(code: string): Promise<string[]> {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: "kimi-k2-0711-preview", // Kimi model
      messages: [{ role: "user", content: code }],
      stream: false,
    });

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.KIMI_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(API_URL, options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.error) {
            // If API returns an error object
            resolve([`API Error: ${parsed.error.message}`]);
          } else if (parsed.choices && parsed.choices.length > 0 && parsed.choices[0].message && parsed.choices[0].message.content) {
            // If API returns valid suggestions
            resolve([parsed.choices[0].message.content]);
          } else {
            // Unexpected successful response format
            resolve(['Error: Unexpected API response format']);
          }
        } catch (e) {
          // JSON parsing error
          console.error('Error parsing DeepSeek response:', e);
          resolve(['Error: Failed to parse API response']);
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en DeepSeek:', error);
      resolve(['Error al obtener sugerencias de DeepSeek']);
    });

    req.write(data);
    req.end();
  });
}
