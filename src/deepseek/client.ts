import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config(); // Cargar variables desde .env

const API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const MODEL = 'kimi-k2-0715'; // Modelo recomendado de Kimi

let apiKey = process.env.KIMI_API_KEY || '';

export function setApiKey(key: string) {
  apiKey = key;
}

export function hasApiKey(): boolean {
  return apiKey.length > 0;
}

interface Message {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

type LessonLevel = 'principiante' | 'intermedio';

async function callApi(
  messages: Message[],
  opts: { apiKey?: string; model?: string } = {}
): Promise<string> {
  return new Promise((resolve) => {
    const usedKey = opts.apiKey || apiKey;
    const usedModel = opts.model || MODEL;
    if (!usedKey) {
      resolve('Error: falta la API key de Kimi');
      return;
    }

    const data = JSON.stringify({
      model: usedModel,
      messages,
      stream: false,
    });

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${usedKey}`,
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
          console.error('Error parsing Kimi response:', e);
          resolve('Error: Failed to parse API response');
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en Kimi:', error);
      resolve('Error al obtener sugerencias de Kimi');
    });

    req.write(data);
    req.end();
  });
}

export async function getSuggestions(code: string): Promise<string[]> {
  const response = await callApi([
    {
      role: 'system',
      content: 'Responde únicamente en español latinoamericano.',
    },
    { role: 'user', content: code },
  ]);
  return [response];
}

export type ChatMessage = Message;
export async function chat(messages: ChatMessage[]): Promise<string> {
  return callApi(messages);
}

const lessonCache: Record<LessonLevel, string> = {
  principiante: `Bienvenido al nivel principiante.
1. Repasa la sintaxis básica de Python.
2. Escribe un programa que imprima "Hola Mundo".
3. Declara una variable y muestra su valor.
Ejercicio: crea una función que sume dos números e imprime el resultado.`,
  intermedio: `Bienvenido al nivel intermedio.
1. Revisa listas y bucles.
2. Practica funciones y argumentos.
3. Crea una clase "Persona" con un método "saludar".
Ejercicio: implementa un generador que produzca números pares.`,
};

export async function getLesson(level: LessonLevel): Promise<string> {
  if (lessonCache[level]) {
    return lessonCache[level];
  }

  const prompt = level === 'principiante'
    ? `Eres una inteligencia artificial experta en revisar código en Python para estudiantes principiantes.
El estudiante solo enviará fragmentos de código y tu tarea será revisarlos, identificar errores, explicar su causa y sugerir cómo corregirlos.
Habla en español latinoamericano, usando un lenguaje claro y sencillo.
Evita generar código nuevo; en su lugar, describe los cambios que el estudiante debe realizar.
Enfócate en variables, tipos de datos, operaciones básicas, condicionales y ciclos, ofreciendo recomendaciones fáciles de entender.`

    : `Eres una inteligencia artificial experta en revisar código en Python para estudiantes intermedios.
El estudiante solo enviará fragmentos de código y tu tarea será revisarlos, identificar errores, malas prácticas o posibles mejoras, y explicar claramente cómo solucionarlos.
Habla en español latinoamericano, de manera cercana y profesional.
No generes código nuevo; describe los cambios que el estudiante debe aplicar.
Incluye observaciones sobre programación orientada a objetos, funciones de orden superior, manejo de listas y diccionarios, y optimización de código cuando sea necesario.`;

  // Llamada a la API de Kimi con tu API key y lógica existente
  const content = await callApi(
    [{ role: 'user', content: prompt }],
    {
      apiKey: process.env.KIMI_API_KEY,
      model: 'kimi-k2-0715',
    }
  );

  lessonCache[level] = content;
  return content;
}
