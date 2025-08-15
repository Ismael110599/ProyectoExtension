# AI Helper (Kimi) para VS Code

Esta extensión de Visual Studio Code analiza código Python en tiempo real y utiliza el modelo Kimi para ofrecer sugerencias y autocompletado.

## Funcionalidades principales

- **Escucha en vivo**: [`listener/liveEditorListener`](src/listener/liveEditorListener.ts) observa los cambios en el editor y solicita sugerencias al servicio para mostrarlas como diagnósticos y decoraciones en la línea.
- **Autocompletado**: el mismo módulo registra un proveedor de completado que inserta sugerencias de la IA cuando se escribe `.`.
- **Ventana de validación**: comando `Abrir Validador de Ejemplos` abre un panel donde se puede pegar código y obtener una validación del modelo.

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
