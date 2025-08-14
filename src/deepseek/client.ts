import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config(); // Cargar variables desde .env

const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat'; // Modelo responsivo de DeepSeek

let apiKey = process.env.DEEPSEEK_API_KEY || '';

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

async function callApi(messages: Message[]): Promise<string> {
  return new Promise((resolve) => {
    if (!apiKey) {
      resolve('Error: falta la API key de DeepSeek');
      return;
    }

    const data = JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
    });

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
Ejercicio: implementa un generador que produzca números pares.`
};

export async function getLesson(level: LessonLevel): Promise<string> {
  if (lessonCache[level]) {
    return lessonCache[level];
  }
  const prompt = level === 'principiante'
    ? 'Eres una inteligencia artificial asistente experta en enseñar programación en Python. Atiendes a usuarios que no pueden escribir mensajes, solo seleccionan si están en nivel principiante o intermedio. Tu objetivo es ayudarles a desarrollar buena lógica de programación y a aprender a escribir código funcional y correcto. Responde con un mensaje inicial para un estudiante principiante: explica conceptos básicos de programación estructurada y lógica en Python con lenguaje simple, ejemplos muy sencillos paso a paso y un pequeño ejercicio.'
    : 'Eres una inteligencia artificial asistente experta en enseñar programación en Python. Atiendes a usuarios que no pueden escribir mensajes, solo seleccionan si están en nivel principiante o intermedio. Tu objetivo es ayudarles a desarrollar buena lógica de programación y a aprender a escribir código funcional y correcto. Responde con un mensaje inicial para un estudiante intermedio: refuerza conocimientos básicos, introduce programación orientada a objetos y funciones de orden superior, plantea mini-ejercicios que desarrollen la lógica y ofrece ejemplos prácticos.';
  
  const content = await callApi([{ role: 'user', content: prompt }]);
  lessonCache[level] = content;
  return content;
}
