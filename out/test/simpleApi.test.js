"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const client_js_1 = require("../deepseek/client.js"); // Importa la función getSuggestions
const dotenv = __importStar(require("dotenv"));
dotenv.config(); // Carga las variables de entorno desde .env
describe('Test de integración con la API DeepSeek (Simplificado)', function () {
    this.timeout(15000); // Timeout aumentado para llamadas a la API
    it('debería devolver un arreglo de sugerencias o un mensaje de error bien formateado', async () => {
        const codigoPrueba = 'def example_function():\n    pass\n'; // Código simple de prueba
        const inicio = Date.now();
        const sugerencias = await (0, client_js_1.getSuggestions)(codigoPrueba);
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
//# sourceMappingURL=simpleApi.test.js.map