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
exports.getSuggestions = getSuggestions;
const https = __importStar(require("https"));
const API_URL = 'https://api.moonshot.ai/v1/chat/completions';
async function getSuggestions(code) {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            model: "kimi-k2-0711-preview", // Kimi model
            messages: [{ role: "user", content: code }],
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
                        // If API returns an error object
                        console.error('DeepSeek API Error:', parsed.error.message);
                        resolve([`API Error: ${parsed.error.message}`]);
                    }
                    else if (parsed.choices && parsed.choices.length > 0 && parsed.choices[0].message && parsed.choices[0].message.content) {
                        // If API returns valid suggestions
                        resolve([parsed.choices[0].message.content]);
                    }
                    else {
                        // Unexpected successful response format
                        console.error('Unexpected DeepSeek API response format:', body);
                        resolve(['Error: Unexpected API response format']);
                    }
                }
                catch (e) {
                    // JSON parsing error
                    console.error('Error parsing DeepSeek response:', e);
                    resolve(['Error: Failed to parse API response']);
                }
            });
        });
        req.on('error', (error) => {
            console.error('Error en DeepSeek:', error);
            resolve(['Error al obtener sugerencias de DeepSeek']);
        });
        req.write(data);
        req.end();
    });
}
//# sourceMappingURL=client.js.map