import * as https from 'https';
import * as dotenv from 'dotenv';

dotenv.config(); // Cargar variables desde .env

const API_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat'; // Modelo responsivo de DeepSeek

let apiKey = process.env.DEEPSEEK_API_KEY || 'sk-6e0340ecb3cb4a62bed1b117238ee5f4';

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

type LessonLevel = 'principiante' | 'intermedio' | 'beginner' | 'intermediate';

// Estructura de respuesta AI esperada
export interface AIResponse {
  type: 'text' | 'code' | 'lesson' | 'error';
  content: string;
  metadata?: {
    language?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    topic?: string;
    examples?: string[];
    tips?: string[];
  };
}

// Función para validar si es JSON válido
function isValidJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

// Función para validar estructura de respuesta AI
function validateAIResponse(obj: any): obj is AIResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.type === 'string' &&
    ['text', 'code', 'lesson', 'error'].includes(obj.type) &&
    typeof obj.content === 'string'
  );
}

// Función para parsear respuesta de la AI
function parseAIResponse(rawResponse: string): AIResponse {
  // Intentar parsear como JSON
  if (isValidJSON(rawResponse)) {
    try {
      const parsed = JSON.parse(rawResponse);
      if (validateAIResponse(parsed)) {
        return parsed;
      } else {
        console.warn('Respuesta JSON no tiene la estructura esperada:', parsed);
        // Fallback: convertir a formato esperado
        return {
          type: 'text',
          content: typeof parsed === 'string' ? parsed : rawResponse
        };
      }
    } catch (error) {
      console.error('Error al parsear JSON:', error);
    }
  }

  // Fallback: tratar como texto plano
  return {
    type: 'text',
    content: rawResponse
  };
}

// Función para crear prompts que soliciten JSON
function createJSONPrompt(userMessage: string, level?: string, responseType: 'lesson' | 'chat' = 'chat'): Message[] {
  const baseJSONInstruction = `
IMPORTANTE: Responde SIEMPRE en formato JSON válido con esta estructura:
{
  "type": "text|code|lesson|error",
  "content": "tu respuesta aquí (puede usar markdown)",
  "metadata": {
    "language": "python" (si aplica),
    "difficulty": "${level || 'beginner'}",
    "topic": "tema principal" (opcional),
    "examples": ["ejemplo1", "ejemplo2"] (opcional para código),
    "tips": ["consejo1", "consejo2"] (opcional)
  }
}

Nivel del estudiante: ${level || 'no especificado'}
Responde en español latinoamericano, de manera clara y didáctica.
`;

  if (responseType === 'lesson') {
    return [
      {
        role: 'system',
        content: `${baseJSONInstruction}

Eres un tutor experto en Python. Genera una lección estructurada para el nivel ${level}. 
El tipo debe ser "lesson" y el contenido debe incluir explicaciones claras, ejemplos prácticos y ejercicios.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];
  } else {
    return [
      {
        role: 'system',
        content: `${baseJSONInstruction}

Eres un asistente experto en Python. Analiza el código o pregunta del estudiante y responde con:
- "code" si estás mostrando código
- "text" si es explicación general
- "lesson" si es contenido educativo estructurado
- "error" si hay un problema

Si revisas código, identifica errores y explica cómo corregirlos sin generar código completo nuevo.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];
  }
}

async function callApi(messages: Message[]): Promise<string> {
  return new Promise((resolve) => {
    if (!apiKey) {
      resolve(JSON.stringify({
        type: 'error',
        content: 'Error: falta la API key de DeepSeek'
      }));
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
            resolve(JSON.stringify({
              type: 'error',
              content: `API Error: ${parsed.error.message}`
            }));
          } else if (
            parsed.choices &&
            parsed.choices.length > 0 &&
            parsed.choices[0].message &&
            parsed.choices[0].message.content
          ) {
            resolve(parsed.choices[0].message.content);
          } else {
            resolve(JSON.stringify({
              type: 'error',
              content: 'Error: Unexpected API response format'
            }));
          }
        } catch (e) {
          console.error('Error parsing DeepSeek response:', e);
          resolve(JSON.stringify({
            type: 'error',
            content: 'Error: Failed to parse API response'
          }));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error en DeepSeek:', error);
      resolve(JSON.stringify({
        type: 'error',
        content: 'Error al conectar con DeepSeek'
      }));
    });

    req.write(data);
    req.end();
  });
}

export async function getSuggestions(code: string): Promise<string[]> {
  const messages = createJSONPrompt(`Revisa este código de Python: ${code}`, 'intermediate', 'chat');
  const response = await callApi(messages);
  const parsedResponse = parseAIResponse(response);
  return [formatResponseForDisplay(parsedResponse)];
}

export type ChatMessage = Message;

export async function chat(messages: ChatMessage[]): Promise<string> {
  try {
    // Obtener el último mensaje del usuario para contexto
    const lastUserMessage = messages[messages.length - 1];
    const userLevel = inferLevelFromConversation(messages);

    // Crear prompt con formato JSON
    const jsonMessages = createJSONPrompt(
      lastUserMessage?.content || '',
      userLevel,
      'chat'
    );

    // Añadir contexto de conversación previa (sin el prompt de sistema)
    const conversationHistory = messages.slice(0, -1); // Todos menos el último
    const finalMessages = [
      ...jsonMessages.slice(0, 1), // Sistema
      ...conversationHistory.slice(-4), // Últimos 4 mensajes de contexto
      ...jsonMessages.slice(1) // Usuario actual
    ];

    const rawResponse = await callApi(finalMessages);
    const parsedResponse = parseAIResponse(rawResponse);

    return formatResponseForDisplay(parsedResponse);

  } catch (error) {
    console.error('Error en chat:', error);
    return JSON.stringify({
      type: 'error',
      content: `Error en el chat: ${(error as Error).message}`
    });
  }
}

// Cache de lecciones actualizado
const lessonCache: Record<string, string> = {};

export async function getLesson(level: LessonLevel): Promise<string> {
  // Normalizar nivel
  const normalizedLevel = level === 'beginner' ? 'principiante' :
    level === 'intermediate' ? 'intermedio' : level;

  const cacheKey = `lesson_${normalizedLevel}`;

  if (lessonCache[cacheKey]) {
    return lessonCache[cacheKey];
  }

  try {
    const lessonPrompt = normalizedLevel === 'principiante'
      ? `Genera una lección de Python para principiantes que cubra:
- Sintaxis básica y variables
- Tipos de datos (int, str, bool)
- Operaciones básicas
- Estructura condicional simple (if/else)
- Un ejercicio práctico sencillo
Incluye ejemplos de código y consejos útiles.`

      : `Genera una lección de Python para nivel intermedio que cubra:
- Listas, diccionarios y métodos
- Funciones con parámetros y return
- Programación orientada a objetos básica (clases)
- Manejo de errores try/except
- Un ejercicio práctico con clase
Incluye ejemplos de código y mejores prácticas.`;

    const messages = createJSONPrompt(lessonPrompt, normalizedLevel, 'lesson');
    const rawResponse = await callApi(messages);
    const parsedResponse = parseAIResponse(rawResponse);

    const formattedLesson = formatResponseForDisplay(parsedResponse);
    lessonCache[cacheKey] = formattedLesson;

    return formattedLesson;

  } catch (error) {
    console.error('Error al obtener lección:', error);

    // Fallback a lecciones estáticas
    const fallbackLessons = {
      principiante: `# 🐍 Lección de Python - Nivel Principiante`,

      intermedio: `# 🐍 Lección de Python - Nivel Intermedio`
    };

    return fallbackLessons[normalizedLevel as keyof typeof fallbackLessons] ||
      'Error al cargar la lección. Intenta nuevamente.';
  }
}

// Función auxiliar para inferir nivel del usuario desde la conversación
function inferLevelFromConversation(messages: ChatMessage[]): string {
  // Buscar indicadores de nivel en los mensajes
  const conversationText = messages.map(m => m.content).join(' ').toLowerCase();

  if (conversationText.includes('principiante') || conversationText.includes('beginner')) {
    return 'principiante';
  }
  if (conversationText.includes('intermedio') || conversationText.includes('intermediate')) {
    return 'intermedio';
  }

  // Por defecto, asumir principiante
  return 'principiante';
}

// Función para formatear respuesta para mostrar
function formatResponseForDisplay(response: AIResponse): string {
  switch (response.type) {
    case 'code':
      let codeFormatted = response.content;
      if (response.metadata?.language) {
        // Si no está ya formateado con markdown, agregarlo
        if (!codeFormatted.includes('```')) {
          codeFormatted = `\`\`\`${response.metadata.language}\n${codeFormatted}\n\`\`\``;
        }
      }
      return codeFormatted;

    case 'lesson':
      let lessonFormatted = response.content;

      // Agregar ejemplos si existen
      if (response.metadata?.examples && response.metadata.examples.length > 0) {
        lessonFormatted += '\n\n## 📝 Ejemplos de Código:\n';
        response.metadata.examples.forEach((example, index) => {
          lessonFormatted += `\n${index + 1}. \`\`\`python\n${example}\n\`\`\``;
        });
      }

      // Agregar consejos si existen
      if (response.metadata?.tips && response.metadata.tips.length > 0) {
        lessonFormatted += '\n\n## 💡 Consejos Útiles:\n';
        response.metadata.tips.forEach(tip => {
          lessonFormatted += `\n- ${tip}`;
        });
      }

      return lessonFormatted;

    case 'error':
      return `❌ **Error**: ${response.content}`;

    default:
      return response.content;
  }
}