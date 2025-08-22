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
    concepts?: string[];
    examples?: string[];
    exercises?: string[];
    next_steps?: string[];
    common_mistakes?: string[];
    best_practices?: string[];
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

// Intentar extraer un JSON válido de un texto que pueda incluir
// bloques de código o contenido adicional
function extractJSONFromText(text: string): string | null {
  // Buscar JSON envuelto en bloque ```json
  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    return fencedMatch[1];
  }

  // Buscar el primer objeto JSON plausible en el texto
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return null;
}

// Función para parsear respuesta de la AI
function parseAIResponse(rawResponse: string): AIResponse {
  const tryParse = (text: string): AIResponse | null => {
    if (!isValidJSON(text)) {
      return null;
    }
    try {
      const parsed = JSON.parse(text);
      if (validateAIResponse(parsed)) {
        return parsed;
      }
      console.warn('Respuesta JSON no tiene la estructura esperada:', parsed);
      return {
        type: 'text',
        content: typeof parsed === 'string' ? parsed : rawResponse
      };
    } catch (error) {
      console.error('Error al parsear JSON:', error);
      return null;
    }
  };

  // Primer intento con la respuesta directa
  const direct = tryParse(rawResponse.trim());
  if (direct) {
    return direct;
  }

  // Intentar extraer JSON de bloques de código u otras formas
  const extracted = extractJSONFromText(rawResponse);
  if (extracted) {
    const parsed = tryParse(extracted);
    if (parsed) {
      return parsed;
    }
  }

  // Fallback: tratar como texto plano
  return {
    type: 'text',
    content: rawResponse
  };
}

// Función auxiliar para inferir el tema de la consulta
function inferTopicFromQuery(query: string): string {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('variable') || queryLower.includes('asignación')) {
    return 'variables y asignación';
  } else if (queryLower.includes('función') || queryLower.includes('def ')) {
    return 'funciones';
  } else if (queryLower.includes('clase') || queryLower.includes('objeto')) {
    return 'programación orientada a objetos';
  } else if (queryLower.includes('lista') || queryLower.includes('array')) {
    return 'estructuras de datos';
  } else if (queryLower.includes('if') || queryLower.includes('condición')) {
    return 'estructuras condicionales';
  } else if (queryLower.includes('for') || queryLower.includes('while')) {
    return 'bucles';
  } else if (queryLower.includes('error') || queryLower.includes('excepción')) {
    return 'manejo de errores';
  } else if (queryLower.includes('import') || queryLower.includes('módulo')) {
    return 'módulos y paquetes';
  }
  
  return 'conceptos generales de Python';
}

// Construir el prompt mejorado para el modelo con instrucciones JSON
const createProgrammingPrompt = (userQuery: string, context: {
  level: string;
  previousMessages?: Message[];
  codeSnippet?: string;
  specificTopic?: string;
}): Message[] => {
  const { level, previousMessages, codeSnippet, specificTopic } = context;
  
  const topic = specificTopic || inferTopicFromQuery(userQuery);
  
  const promptContent = (
    `Eres un tutor experto en programación Python especializado en enseñar desde conceptos básicos hasta avanzados. `
    + `Tu objetivo es ayudar a estudiantes a desarrollar su lógica de programación y estructura de código. `
    + `Debes explicar paso a paso, de manera clara y didáctica, adaptándote al nivel ${level} del estudiante.`
    + `\n\nANÁLISIS REQUERIDO:\n`
    + `1. Evaluar el nivel de comprensión del estudiante\n`
    + `2. Identificar conceptos clave que necesita reforzar\n`
    + `3. Proponer ejercicios progresivos adecuados a su nivel\n`
    + `4. Explicar patrones de código y buenas prácticas\n`
    + `5. Sugerir recursos de aprendizaje específicos\n`
    + `\nIMPORTANTE: Tu respuesta DEBE ser un JSON válido con la siguiente estructura:\n`
    + `{\n`
    + `  "type": "lesson|code|text|error",\n`
    + `  "content": "string",\n`
    + `  "metadata": {\n`
    + `    "language": "python",\n`
    + `    "difficulty": "beginner|intermediate|advanced",\n`
    + `    "topic": "string",\n`
    + `    "concepts": ["string"],\n`
    + `    "examples": ["string"],\n`
    + `    "exercises": ["string"],\n`
    + `    "next_steps": ["string"],\n`
    + `    "common_mistakes": ["string"],\n`
    + `    "best_practices": ["string"]\n`
    + `  }\n`
    + `}\n\n`
    + `CONTEXTO DEL ESTUDIANTE:\n`
    + `• Nivel: ${level}\n`
    + `• Tema específico: ${topic}\n`
    + `• Código proporcionado: ${codeSnippet ? 'Sí' : 'No'}\n\n`
    + `CONSULTA DEL ESTUDIANTE:\n${userQuery}`
  );

  const messages: Message[] = [
    {
      role: "system",
      content: (
        "Eres un tutor experto en Python con amplia experiencia en enseñanza programática. "
        + "Tu enfoque debe ser pedagógico, paciente y constructivo. "
        + "Explica conceptos complejos de manera simple usando analogías y ejemplos prácticos. "
        + "Fomenta el aprendizaje progresivo desde 'print(\"Hola mundo\")' hasta proyectos complejos. "
        + "\n\nOBLIGATORIO: Responde SIEMPRE en formato JSON válido con la estructura especificada. "
        + "No incluyas texto adicional fuera del JSON ni utilices bloques de código (```). "
        + "Asegúrate de que el JSON sea válido y completo. "
        + "Usa español latinoamericano claro y accesible."
      )
    },
    {
      role: "user",
      content: promptContent
    }
  ];

  // Añadir historial de conversación si existe
  if (previousMessages && previousMessages.length > 0) {
    // Mantener solo los últimos 3 mensajes para contexto (excluyendo mensajes de sistema)
    const recentMessages = previousMessages
      .filter(msg => msg.role !== 'system')
      .slice(-3);
    
    // Insertar después del mensaje de sistema
    messages.splice(1, 0, ...recentMessages);
  }

  return messages;
};

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
      temperature: 0.2, // Baja temperatura para respuestas más precisas
      max_tokens: 2048,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
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

export async function getProgrammingHelp(
  userQuery: string, 
  level: string = 'beginner', 
  codeSnippet?: string
): Promise<AIResponse> {
  const messages = createProgrammingPrompt(userQuery, {
    level,
    codeSnippet,
    specificTopic: inferTopicFromQuery(userQuery)
  });

  const rawResponse = await callApi(messages);
  return parseAIResponse(rawResponse);
}

export async function getSuggestions(code: string): Promise<string[]> {
  const messages = createProgrammingPrompt(
    `Revisa este código de Python y proporciona sugerencias de mejora: ${code}`,
    { level: 'intermedio', codeSnippet: code }
  );
  
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

    // Crear prompt con el nuevo formato
    const programmingMessages = createProgrammingPrompt(
      lastUserMessage?.content || '',
      { 
        level: userLevel,
        previousMessages: messages
      }
    );

    const rawResponse = await callApi(programmingMessages);
    const parsedResponse = parseAIResponse(rawResponse);

    return formatResponseForDisplay(parsedResponse);

  } catch (error) {
    console.error('Error en chat:', error);
    return `Error en el chat: ${(error as Error).message}`;
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

    const messages = createProgrammingPrompt(lessonPrompt, { level: normalizedLevel });
    const rawResponse = await callApi(messages);
    const parsedResponse = parseAIResponse(rawResponse);

    const formattedLesson = formatResponseForDisplay(parsedResponse);
    lessonCache[cacheKey] = formattedLesson;

    return formattedLesson;

  } catch (error) {
    console.error('Error al obtener lección:', error);

    // Fallback a lecciones estáticas
    const fallbackLessons = {
      principiante: `# 🐍 Lección de Python - Nivel Principiante\n\n## Conceptos Básicos\n\nPython es un lenguaje de programación fácil de aprender con una sintaxis clara y legible.\n\n### Hola Mundo\n\n\`\`\`python\nprint("¡Hola Mundo!")\n\`\`\`\n\n### Variables\n\n\`\`\`python\n# Declarar variables\nnombre = "Ana"\nedad = 25\nestatura = 1.65\n\nprint(f"Me llamo {nombre}, tengo {edad} años y mido {estatura}m")\n\`\`\``,

      intermedio: `# 🐍 Lección de Python - Nivel Intermedio\n\n## Funciones y Estructuras de Datos\n\n### Funciones\n\n\`\`\`python\ndef saludar(nombre):\n    return f"¡Hola {nombre}!"\n\n# Llamar a la función\nmensaje = saludar("Carlos")\nprint(mensaje)\n\`\`\`\n\n### Listas y Diccionarios\n\n\`\`\`python\n# Lista\nfrutas = ["manzana", "banana", "naranja"]\nfrutas.append("uva")\n\n# Diccionario\npersona = {\n    "nombre": "Ana",\n    "edad": 25,\n    "ciudad": "Madrid"\n}\n\nprint(frutas[0])  # manzana\nprint(persona["nombre"])  # Ana\n\`\`\``
    };

    return fallbackLessons[normalizedLevel as keyof typeof fallbackLessons] ||
      'Error al cargar la lección. Intenta nuevamente.';
  }
}

// Función auxiliar para inferir nivel del usuario desde la conversación
function inferLevelFromConversation(messages: ChatMessage[]): string {
  // Buscar indicadores de nivel en los mensajes
  const conversationText = messages.map(m => m.content).join(' ').toLowerCase();

  if (conversationText.includes('avanzado') || conversationText.includes('advanced')) {
    return 'avanzado';
  }
  if (conversationText.includes('intermedio') || conversationText.includes('intermediate')) {
    return 'intermedio';
  }
  if (conversationText.includes('principiante') || conversationText.includes('beginner') || conversationText.includes('básico')) {
    return 'principiante';
  }

  // Por defecto, asumir principiante
  return 'principiante';
}

// Función para formatear respuesta para mostrar
function formatResponseForDisplay(response: AIResponse): string {
  switch (response.type) {
    case 'code':
      let codeFormatted = response.content;
      if (response.metadata?.language && !codeFormatted.includes('```')) {
        codeFormatted = `\`\`\`${response.metadata.language}\n${codeFormatted}\n\`\`\``;
      }
      return codeFormatted;

    case 'lesson':
      let lessonFormatted = response.content;

      // Agregar metadatos educativos si existen
      if (response.metadata) {
        if (response.metadata.concepts && response.metadata.concepts.length > 0) {
          lessonFormatted += '\n\n## 🧠 Conceptos Clave:\n';
          response.metadata.concepts.forEach(concept => {
            lessonFormatted += `\n- ${concept}`;
          });
        }

        if (response.metadata.examples && response.metadata.examples.length > 0) {
          lessonFormatted += '\n\n## 📝 Ejemplos de Código:\n';
          response.metadata.examples.forEach((example, index) => {
            lessonFormatted += `\n${index + 1}. \`\`\`python\n${example}\n\`\`\``;
          });
        }

        if (response.metadata.exercises && response.metadata.exercises.length > 0) {
          lessonFormatted += '\n\n## 💪 Ejercicios Prácticos:\n';
          response.metadata.exercises.forEach((exercise, index) => {
            lessonFormatted += `\n${index + 1}. ${exercise}`;
          });
        }

        if (response.metadata.best_practices && response.metadata.best_practices.length > 0) {
          lessonFormatted += '\n\n## ✅ Mejores Prácticas:\n';
          response.metadata.best_practices.forEach(practice => {
            lessonFormatted += `\n- ${practice}`;
          });
        }

        if (response.metadata.common_mistakes && response.metadata.common_mistakes.length > 0) {
          lessonFormatted += '\n\n## ⚠️ Errores Comunes:\n';
          response.metadata.common_mistakes.forEach(mistake => {
            lessonFormatted += `\n- ${mistake}`;
          });
        }

        if (response.metadata.next_steps && response.metadata.next_steps.length > 0) {
          lessonFormatted += '\n\n## 🚀 Próximos Pasos:\n';
          response.metadata.next_steps.forEach(step => {
            lessonFormatted += `\n- ${step}`;
          });
        }
      }

      return lessonFormatted;

    case 'error':
      return `❌ **Error**: ${response.content}`;

    default:
      return response.content;
  }
}