# AI Helper (DeepSeek) para VS Code

Esta extensión de Visual Studio Code analiza código Python en tiempo real y utiliza el modelo Kimi de DeepSeek para ofrecer sugerencias y autocompletado.

## Funcionalidades principales

- **Escucha en vivo**: [`listener/liveEditorListener`](src/listener/liveEditorListener.ts) observa los cambios en el editor y solicita sugerencias al servicio para mostrarlas como diagnósticos y decoraciones en la línea.
- **Autocompletado**: el mismo módulo registra un proveedor de completado que inserta sugerencias de la IA cuando se escribe `.`.
- **Ventana de validación**: comando `Abrir Validador de Ejemplos` abre un panel donde se puede pegar código y obtener una validación del modelo.
- **Tutor de Python**: un panel lateral tipo Copilot permite elegir entre nivel *Principiante* o *Intermedio* y recibe una primera lección generada por la IA.
- **Cliente de API**: [`deepseek/client`](src/deepseek/client.ts) envía el código al endpoint `https://api.moonshot.ai/v1/chat/completions` usando la variable de entorno `KIMI_API_KEY`.
- **Registro de eventos**: [`utils/logger`](src/utils/logger.ts) añade un prefijo uniforme a los mensajes de consola.

## Requisitos

- Node.js 20 o superior.
- Una clave válida de la API de Kimi (`KIMI_API_KEY`) definida en el entorno o en un archivo `.env`.
- VS Code 1.102+

## Uso

1. Instala las dependencias: `npm install`.
2. Compila la extensión: `npm run compile`.
3. Presiona `F5` en VS Code para abrir una ventana de desarrollo con la extensión.
4. Abre un archivo Python y comienza a escribir; aparecerán diagnósticos y sugerencias de completado.
5. Ejecuta el comando **Abrir Validador de Ejemplos** para probar fragmentos de código en una ventana dedicada.
6. Abre la vista **Tutor Python** desde la barra lateral y selecciona tu nivel para recibir una explicación guiada.

## Estructura del código

```
src/
  extension.ts              # Punto de entrada de la extensión
  listener/
    liveEditorListener.ts   # Suscribe eventos y autocompletado
  deepseek/
    client.ts               # Cliente HTTPS para el servicio de sugerencias
  utils/
    logger.ts               # Función de logging
  test/
    simpleApi.test.ts       # Prueba de integración de la API
```

## Scripts disponibles

- `npm run lint`: ejecuta ESLint sobre `src`.
- `npm test`: compila y ejecuta las pruebas con Mocha.

## Notas

Este proyecto está en desarrollo y se proporciona sin garantía alguna.
