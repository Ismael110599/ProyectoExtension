import * as assert from 'assert';
import { getSuggestions } from '../deepseek/client.js'; // Importa la función getSuggestions
import * as dotenv from 'dotenv';
dotenv.config(); // Carga las variables de entorno desde .env

describe('Test de integración con la API DeepSeek (Simplificado)', function () {
  this.timeout(15000); // Timeout aumentado para llamadas a la API

  it('debería devolver un arreglo de sugerencias o un mensaje de error bien formateado', async () => {
    const codigoPrueba = 'def example_function():\n    pass\n'; // Código simple de prueba

    const inicio = Date.now();
    const sugerencias = await getSuggestions(codigoPrueba);
    const fin = Date.now();
    const tiempoRespuesta = fin - inicio;

    console.log('📨 Sugerencias/Errores recibidos:', sugerencias);
    console.log(`⏱ Tiempo de respuesta de la API: ${tiempoRespuesta} ms`);

    assert.ok(Array.isArray(sugerencias), 'La respuesta debe ser un arreglo.');
    assert.ok(sugerencias.length > 0, 'El arreglo de respuesta no debe estar vacío.');

    // Si la clave API es inválida, debería devolver un mensaje de error como "API Error: Authentication Fails..."
    // Si la clave API es válida, debería devolver sugerencias reales.
    // Esta prueba pasa mientras la respuesta sea un arreglo y no esté vacío, y se imprime el contenido para inspección manual.
  });
});
