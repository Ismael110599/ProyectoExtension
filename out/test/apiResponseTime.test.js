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
describe('DeepSeek API Integration Test (Simplified)', function () {
    this.timeout(15000); // Increased timeout for API calls
    it('should return an array of suggestions or an API error message', async () => {
        const testCode = 'def hello_world():\n    print("Hello, world!")\n    '; // Test code to send to DeepSeek
        const suggestions = await (0, client_js_1.getSuggestions)(testCode);
        console.log('📨 Sugerencias/Errores recibidos:', suggestions);
        assert.ok(Array.isArray(suggestions), 'The response should be an array.');
        assert.ok(suggestions.length > 0, 'The response array should not be empty.');
        // This test will pass if it gets suggestions or a well-formatted API error message.
        // The content of the suggestion/error will be logged for manual inspection.
    });
});
//# sourceMappingURL=apiResponseTime.test.js.map