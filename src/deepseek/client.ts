import * as https from 'https';

const API_URL = 'https://api.moonshot.ai/v1/chat/completions';

interface Message {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

async function callApi(messages: Message[]): Promise<string> {
  return new Promise((resolve) => {
    const data = JSON.stringify({
      model: 'kimi-k2-0711-preview',
      messages,
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
            resolve(`API Error: ${parsed.error.message}`);
          } else if (
            parsed.choices &&
            parsed.choices.length > 0 &&
            parsed.choices[0].message &&
            parsed.choices[0].message.content
          ) {
            resolve(parsed.choices[0].message.content);
          } else {
            resolve('Error: Unexpected API response format');
          }
        } catch (e) {
          console.error('Error parsing DeepSeek response:', e);
          resolve('Error: Failed to parse API response');
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en DeepSeek:', error);
      resolve('Error al obtener sugerencias de DeepSeek');
    });

    req.write(data);
    req.end();
  });
}

export async function getSuggestions(code: string): Promise<string[]> {
  const response = await callApi([{ role: 'user', content: code }]);
  return [response];
}

export async function getLesson(level: 'principiante' | 'intermedio'): Promise<string> {
  const prompt = level === 'principiante'
    ? 'Eres una inteligencia artificial asistente experta en enseñar programación en Python. Atiendes a usuarios que no pueden escribir mensajes, solo seleccionan si están en nivel principiante o intermedio. Tu objetivo es ayudarles a desarrollar buena lógica de programación y a aprender a escribir código funcional y correcto. Responde con un mensaje inicial para un estudiante principiante: explica conceptos básicos de programación estructurada y lógica en Python con lenguaje simple, ejemplos muy sencillos paso a paso y un pequeño ejercicio.'
    : 'Eres una inteligencia artificial asistente experta en enseñar programación en Python. Atiendes a usuarios que no pueden escribir mensajes, solo seleccionan si están en nivel principiante o intermedio. Tu objetivo es ayudarles a desarrollar buena lógica de programación y a aprender a escribir código funcional y correcto. Responde con un mensaje inicial para un estudiante intermedio: refuerza conocimientos básicos, introduce programación orientada a objetos y funciones de orden superior, plantea mini-ejercicios que desarrollen la lógica y ofrece ejemplos prácticos.';

  return callApi([{ role: 'user', content: prompt }]);
}

