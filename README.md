# AI Helper (DeepSeek) para VS Code

Esta extensión de Visual Studio Code analiza código Python en tiempo real y utiliza el modelo Kimi de DeepSeek para ofrecer sugerencias, autocompletado y un chat interactivo.

## Funcionalidades principales

- **Escucha en vivo**: [`listener/liveEditorListener`](src/listener/liveEditorListener.ts) observa los cambios en el editor y solicita sugerencias al servicio para mostrarlas como diagnósticos y decoraciones en la línea.
- **Autocompletado**: el mismo módulo registra un proveedor de completado que inserta sugerencias de la IA cuando se escribe `.`.
- **Ventana de validación**: comando `Abrir Validador de Ejemplos` abre un panel donde se puede pegar código y obtener una validación del modelo.
- **Chat de ayuda**: el comando `Abrir Chat AI` muestra una ventana donde se conversa con la IA y las respuestas se entregan en texto plano para facilitar su lectura.

## Estructura del código

```
src/
  extension.ts               # Punto de entrada de la extensión
  deepseek/
    client.ts                # Cliente HTTPS y formateo de respuestas
  listener/
    liveEditorListener.ts    # Sugerencias en vivo y autocompletado para Python
  panel/
    chatPanel.ts             # Panel de chat sencillo con respuestas en texto plano
    examplePanel.ts          # Validador de ejemplos de código
  views/
    TutorViewProvider.ts     # Vista lateral con tutor interactivo
  utils/
    logger.ts                # Función de logging
  test/
    simpleApi.test.ts        # Prueba de integración de la API

media/
  app.js                     # Lógica del chat del tutor
  format.js                  # Formateo de mensajes (separa texto y código)
  tutor.css                  # Estilos de la vista del tutor
  tutor.svg                  # Icono de la extensión
```

## Scripts disponibles

- `npm run lint`: ejecuta ESLint sobre `src`.
- `npm test`: compila y ejecuta las pruebas con Mocha.

## Notas

Este proyecto está en desarrollo y se proporciona sin garantía alguna.
