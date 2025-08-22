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

IMPORTANTE: 
- No incluyas texto fuera del JSON
- El campo "content" debe contener toda la explicación principal
- Usa "type": "code" si muestras código Python
- Usa "type": "text" para explicaciones generales
- Usa "type": "lesson" para contenido educativo estructurado
- Usa "type": "error" si hay un problema

Nivel del estudiante: ${level || 'principiante'}
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
- "code" si estás mostrando código Python
- "text" si es explicación general o conversación
- "lesson" si es contenido educativo estructurado
- "error" si hay un problema

Si revisas código, identifica errores y explica cómo corregirlos. 
Puedes incluir ejemplos de código corregido en el campo "content" usando formato markdown con triple backticks.`
      },
      {
        role: 'user',
        content: userMessage
      }
    ];
  }
}

// Prompt para respuestas en texto plano
function createTextPrompt(userMessage: string, level?: string): Message[] {
  return [
    {
      role: 'system',
      content:
        `Eres un asistente experto en Python. ` +
        `Responde en español latinoamericano de forma clara y didáctica. ` +
        `Proporciona la respuesta en texto plano, sin utilizar formato JSON ni envoltorios. ` +
        `Si detectas errores en el código o en la pregunta del usuario, explícalos y ofrece correcciones.` +
        (level ? ` Nivel del usuario: ${level}.` : ''),
    },
    { role: 'user', content: userMessage }
  ];
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

// ✅ FUNCIÓN PRINCIPAL CORREGIDA
export async function chat(messages: ChatMessage[]): Promise<AIResponse> {
  try {
    // Obtener el último mensaje del usuario para contexto
    const lastUserMessage = messages[messages.length - 1];
    const userLevel = inferLevelFromConversation(messages);

    // Crear prompt en texto plano
    const textPrompt = createTextPrompt(lastUserMessage?.content || '', userLevel);

    // Añadir contexto de conversación previa (sin el prompt de sistema)
    const conversationHistory = messages.slice(0, -1); // Todos menos el último
    const finalMessages = [
      textPrompt[0], // Sistema
      ...conversationHistory.slice(-4), // Últimos 4 mensajes de contexto
      textPrompt[1] // Usuario actual
    ];

    const rawResponse = await callApi(finalMessages);
    const parsedResponse = parseAIResponse(rawResponse);

    // ✅ Devolver el objeto AIResponse directamente, no como string
    return parsedResponse;

  } catch (error) {
    console.error('Error en chat:', error);
    return {
      type: 'error',
      content: `Error en el chat: ${(error as Error).message}`
    };
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

// ✅ FUNCIÓN DE FORMATEO MEJORADA
function formatResponseForDisplay(response: AIResponse): string {
  let result = response.content;

  // Agregar metadata formateada
  if (response.metadata) {
    // Agregar dificultad si existe
    if (response.metadata.difficulty) {
      const difficultyMap = {
        'beginner': 'Principiante',
        'intermediate': 'Intermedio',
        'advanced': 'Avanzado'
      };
      result += `\n\n(Dificultad: ${difficultyMap[response.metadata.difficulty] || response.metadata.difficulty})`;
    }

    // Agregar ejemplos si existen
    if (response.metadata.examples && response.metadata.examples.length > 0) {
      result += '\n\n📝 Ejemplos:';
      response.metadata.examples.forEach((example, index) => {
        result += `\n${index + 1}. ${example}`;
      });
    }

    // Agregar tips si existen
    if (response.metadata.tips && response.metadata.tips.length > 0) {
      result += '\n\n💡 Tips:';
      response.metadata.tips.forEach(tip => {
        result += `\n• ${tip}`;
      });
    }
  }

  return result.trim();
}

// =============================================================
//  Nuevos tipos para análisis académico
// =============================================================

export interface StudentActivity {
  nombre: string;
  nota: number;
  max_nota: number;
  porcentaje: number;
  tipo: string;
  comentario: string;
}

export interface StudentRecord {
  nombre_estudiante: string;
  curso: string;
  promedio?: number;
  actividades_con_nota?: number;
  total_actividades?: number;
  actividades?: StudentActivity[];
}

export interface AcademicReport {
  resumen_general: {
    promedio_grupo: number;
    total_estudiantes: number;
    nivel_riesgo_grupo: string;
    estado_general_grupo: string;
  };
  estudiantes: any[];
  recomendaciones_grupales: {
    mejoras_metodologicas: string[];
    recursos_sugeridos: string[];
    actividades_complementarias: string[];
  };
  [key: string]: any;
}

// Construcción del prompt avanzado para análisis FODA
function buildAcademicPrompt(nombreCarrera: string, datosNotas: StudentRecord[]): string {
  let prompt = (
    `Analizar detalladamente el desempeño académico de los estudiantes en la asignatura de ${nombreCarrera}. ` +
    `Utilizar como fuente de información las actividades registradas en la plataforma institucional LMS UIDE Canvas. ` +
    `Realizar un análisis FODA (Fortalezas, Oportunidades, Debilidades y Amenazas) basado en sus resultados, ` +
    `rúbricas de evaluación, comentarios recibidos, participación y progreso en cada componente. ` +
    `Presentar los hallazgos de forma clara, estructurada y categorizada por estudiante. ` +
    `Incluir recomendaciones específicas y accionables, orientadas a mejorar el proceso de enseñanza-aprendizaje, ` +
    `tanto a nivel individual como grupal.` +
    "\n\nIMPORTANTE: Tu respuesta DEBE ser un JSON válido con la siguiente estructura:\n" +
    "{\n" +
    '  "resumen_general": {\n' +
    '    "promedio_grupo": 0,\n' +
    '    "total_estudiantes": 0,\n' +
    '    "nivel_riesgo_grupo": "string",\n' +
    '    "estado_general_grupo": "string"\n' +
    '  },\n' +
    '  "estudiantes": [\n' +
    '    {\n' +
    '      "nombre": "string",\n' +
    '      "curso": "string",\n' +
    '      "promedio": 0,\n' +
    '      "nivel_riesgo": "string",\n' +
    '      "estado_general": "string",\n' +
    '      "probabilidad_aprobacion": 0,\n' +
    '      "analisis_especifico": {\n' +
    '        "fortalezas": ["string"],\n' +
    '        "debilidades": ["string"],\n' +
    '        "oportunidades": ["string"],\n' +
    '        "amenazas": ["string"]\n' +
    '      },\n' +
    '      "recomendaciones": {\n' +
    '        "inmediatas": ["string"],\n' +
    '        "corto_plazo": ["string"],\n' +
    '        "largo_plazo": ["string"]\n' +
    '      },\n' +
    '      "objetivo_recomendado": "string",\n' +
    '      "estrategia_sugerida": "string",\n' +
    '      "actividades_destacadas": [\n' +
    '        {\n' +
    '          "nombre": "string",\n' +
    '          "nota": 0,\n' +
    '          "max_nota": 0,\n' +
    '          "porcentaje": 0,\n' +
    '          "tipo": "string",\n' +
    '          "comentario": "string"\n' +
    '        }\n' +
    '      ]\n' +
    '    }\n' +
    '  ],\n' +
    '  "recomendaciones_grupales": {\n' +
    '    "mejoras_metodologicas": ["string"],\n' +
    '    "recursos_sugeridos": ["string"],\n' +
    '    "actividades_complementarias": ["string"]\n' +
    '  }\n' +
    "}\n\n" +
    "DATOS DEL ESTUDIANTE:\n"
  );

  for (const estudiante of datosNotas) {
    prompt += `\n👤 ESTUDIANTE: ${estudiante.nombre_estudiante}\n`;
    prompt += `📘 CURSO: ${estudiante.curso}\n`;
    prompt += `📊 PROMEDIO ACTUAL: ${estudiante.promedio ?? 0}%\n`;
    prompt += `📝 ACTIVIDADES EVALUADAS: ${estudiante.actividades_con_nota ?? 0}/${estudiante.total_actividades ?? 0}\n\n`;
    prompt += '📋 DETALLE DE ACTIVIDADES:\n';
    for (const act of estudiante.actividades || []) {
      const porcentaje = act.nota != null && act.max_nota ? (act.nota / act.max_nota) * 100 : 0;
      prompt += `  • ${act.nombre} (${act.tipo.toUpperCase()}): ${act.nota ?? 'N/A'}/${act.max_nota ?? 'N/A'} (${Math.round(porcentaje * 10) / 10}%)\n`;
    }
    prompt += '\n';
  }

  return prompt;
}

const systemAcademicPrompt =
  'Eres un experto analista educativo especializado en evaluación del rendimiento académico universitario. ' +
  'Tu análisis debe ser preciso, constructivo y motivacional. Utiliza un lenguaje claro y profesional, ' +
  'pero accesible para estudiantes y docentes. \n\nOBLIGATORIO: Tu respuesta DEBE ser un JSON válido con la estructura especificada. ' +
  'No incluyas texto adicional fuera del JSON. Asegúrate de que el JSON sea válido y completo.';

export async function analyzeAcademicPerformance(nombreCarrera: string, datosNotas: StudentRecord[]): Promise<AcademicReport | { error: string }> {
  try {
    const userPrompt = buildAcademicPrompt(nombreCarrera, datosNotas);
    const messages: Message[] = [
      { role: 'system', content: systemAcademicPrompt },
      { role: 'user', content: userPrompt }
    ];
    const raw = await callApi(messages);
    return JSON.parse(raw);
  } catch (error) {
    return { error: `Error en el análisis: ${(error as Error).message}` };
  }
}
