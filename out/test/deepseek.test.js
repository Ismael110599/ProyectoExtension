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
describe('DeepSeek Client - getSuggestions', function () {
    this.timeout(15000); // Aumenta el timeout para las llamadas a la API
    it('debería devolver un array de sugerencias para un código válido', async () => {
        const testCode = 'def factorial(n):\n    if n == 0:\n        return 1\n    else:\n        return n * factorial(n-1)\n';
        const suggestions = await (0, client_js_1.getSuggestions)(testCode);
        assert.ok(Array.isArray(suggestions), 'La respuesta debería ser un array');
        assert.ok(suggestions.length > 0, 'Debería haber recibido al menos una sugerencia');
        assert.ok(!suggestions[0].includes('Error de la API:'), 'No debería haber un mensaje de error en las sugerencias');
    });
    it('debería manejar errores de la API (por ejemplo, clave inválida)', async () => {
        // Guarda la clave original para restaurarla después
        const originalApiKey = process.env.DEEPSEEK_API_KEY;
        // Establece una clave inválida para esta prueba
        process.env.DEEPSEEK_API_KEY = 'invalid_key';
        const testCode = 'print("hello")';
        const suggestions = await (0, client_js_1.getSuggestions)(testCode);
        assert.ok(Array.isArray(suggestions), 'La respuesta debería ser un array incluso en caso de error');
        assert.ok(suggestions[0].includes('Error de la API: Authentication Fails'), 'Debería indicar un error de autenticación de la API');
        // Restaura la clave original
        process.env.DEEPSEEK_API_KEY = originalApiKey;
    });
    // Puedes añadir más tests aquí, por ejemplo, para códigos muy largos, o para diferentes tipos de errores
});
//# sourceMappingURL=deepseek.test.js.map