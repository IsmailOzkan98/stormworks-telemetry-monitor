# THEME DEVELOPMENT STANDARD
**Estándar técnico de desarrollo de temas CSS y JavaScript**

Versión: 1.0

## 1. Objetivo

Establecer una arquitectura común para crear y adaptar temas visuales e interactivos del dashboard.

Cada tema debe mantener su propia identidad estética y funcional, respetando la estructura, el comportamiento y la lógica original de la aplicación.

---

# 2. ESTÁNDAR CSS

## 2.1. Arquitectura y orden

Todos los archivos CSS deben seguir este orden:

1. Identificación del tema y versión.
2. Variables semánticas de color.
3. Superficies y tarjetas.
4. Bordes y sombras.
5. Variables de texto.
6. Estados funcionales.
7. Gráficas y telemetría.
8. Efectos visuales.
9. Fondo general.
10. Cabeceras y navegación.
11. Mission Bar.
12. Paneles, tarjetas y métricas.
13. Diagnósticos e indicadores.
14. Monitor y Event Log.
15. System Information.
16. Recorder.
17. Telemetry.
18. Formularios y botones.
19. Scrollbar y footer.
20. Animaciones y efectos especiales.
21. Responsive y accesibilidad.

## 2.2. Variables obligatorias

Todos los temas deben conservar estas variables semánticas:

```css
:root {
    /* Backgrounds */
    --bg: ;
    --panel: ;
    --panel2: ;
    --card-bg: ;
    --card-bg-hover: ;

    /* Borders */
    --border: ;
    --border-strong: ;
    --border-subtle: ;

    /* Accents */
    --accent-primary: ;
    --accent-secondary: ;
    --accent-tertiary: ;

    /* Text */
    --text-primary: ;
    --text-secondary: ;
    --text-muted: ;

    /* Status */
    --status-success: ;
    --status-warning: ;
    --status-error: ;
    --status-info: ;
    --status-idle: ;

    /* Graphs */
    --graph-altitude: ;
    --graph-target: ;
    --graph-alt-error: ;
    --graph-vs-error: ;
}
```

Se permiten variables adicionales, pero no se deben renombrar ni eliminar las existentes.

## 2.3. Requisitos visuales

- Centralizar los colores y efectos importantes mediante variables.
- Mantener una identidad visual coherente en todos los componentes.
- Adaptar todos los componentes existentes al tema.
- Los efectos especiales deben ser configurables mediante variables.
- Evitar duplicaciones y reglas CSS innecesarias.
- Mantener legibilidad, contraste y rendimiento.
- Incluir diseño responsive y `prefers-reduced-motion`.

## 2.4. Restricciones

El CSS del tema no debe:

- Modificar el HTML.
- Cambiar clases o selectores existentes.
- Alterar dimensiones o distribución estructural.
- Modificar tipografías o tamaños definidos por el CSS estructural.
- Interferir con la funcionalidad de componentes.
- Cambiar el significado de los estados funcionales.

---

# 3. ESTÁNDAR JAVASCRIPT

## 3.1. Objetivo

Los scripts deben ser autónomos, encapsulados, modulares y reversibles.

Pueden implementar funcionalidades propias del tema, como:

- Paneles y controles interactivos.
- Selectores de personajes o estados.
- Sistemas de partículas y Canvas.
- Fondos y efectos ambientales.
- Boot sequences y terminales.
- HUD e indicadores.
- Notificaciones y alertas.
- Glitch, scanlines y efectos cinematográficos.
- Integración visual con componentes existentes.

## 3.2. Arquitectura obligatoria

Cada script debe contemplar, según sus necesidades:

1. Identificación y versión.
2. Encapsulación mediante IIFE y `"use strict"`.
3. Prevención de inicializaciones duplicadas.
4. Configuración centralizada.
5. Estado interno independiente.
6. Inyección de estilos aislados.
7. Creación segura de elementos dinámicos.
8. Funciones y subsistemas modulares.
9. Integración controlada con el dashboard.
10. Gestión de eventos y recursos.
11. Inicialización automática o controlada.
12. API pública cuando sea necesaria.
13. Destrucción y limpieza completa.

## 3.3. Clasificación de scripts

| Nivel | Tipo | Funcionalidad |
|---|---|---|
| 1 | Interacción | Paneles, controles y selectores |
| 2 | Ambiental | Partículas, fondos y efectos visuales |
| 3 | Cinematográfico | Boot, HUD, terminales y glitches |
| 4 | Integrado | Combinación de subsistemas y API completa |

Los niveles son orientativos. Un script puede combinar diferentes categorías.

## 3.4. Gestión de recursos

Todo recurso creado debe poder identificarse y liberarse:

- `setTimeout` y `setInterval`.
- `requestAnimationFrame`.
- Event listeners.
- `ResizeObserver` y otros observers.
- Elementos HTML dinámicos.
- Estilos CSS inyectados.
- Clases y variables CSS temporales.
- Animaciones y efectos activos.
- Recursos gráficos y Canvas.

Se recomienda utilizar `AbortController` y un gestor centralizado de recursos cuando la complejidad lo justifique.

## 3.5. Ciclo de vida

Los motores deben implementar las operaciones necesarias para controlar su funcionamiento:

```js
const ThemeEngine = {
    init() {
        // Inicialización.
    },

    start() {
        // Activación.
    },

    stop() {
        // Detención reversible.
    },

    restart() {
        // Reinicio.
    },

    destroy() {
        // Limpieza completa.
    }
};
```

No todos los scripts necesitan exponer todos estos métodos, pero los motores complejos deben permitir iniciar, detener y destruir sus subsistemas.

## 3.6. Compatibilidad y seguridad

- No modificar la lógica funcional original.
- No alterar cálculos, conexiones, telemetría ni registros.
- No sobrescribir funciones, prototipos o variables globales de la aplicación.
- Utilizar prefijos únicos para clases, IDs y variables.
- No insertar contenido dinámico no confiable mediante `innerHTML`.
- Comprobar la existencia de elementos antes de utilizarlos.
- Aislar los errores para evitar que un módulo inutilice el resto.
- Evitar dependencias externas innecesarias.

## 3.7. Rendimiento y accesibilidad

- Respetar `prefers-reduced-motion`.
- Pausar efectos costosos cuando la pestaña esté oculta.
- Limitar partículas, animaciones y operaciones de Canvas.
- Evitar listeners y temporizadores duplicados.
- Adaptar interfaces a dispositivos móviles.
- Mantener controles accesibles y estados comprensibles.

---

# 4. INTEGRACIÓN CSS + JAVASCRIPT

Los temas pueden ser de dos tipos:

**Tema visual:** utiliza exclusivamente CSS para modificar la apariencia.

**Tema interactivo:** combina CSS y JavaScript para incorporar funcionalidades y efectos propios.

En ambos casos:

- El CSS controla la presentación visual.
- El JavaScript controla las funcionalidades adicionales.
- Los dos deben utilizar nomenclatura y prefijos coherentes.
- Ninguno debe romper la estructura o lógica original del dashboard.
- La desactivación del tema debe restaurar el estado previo de la aplicación.

---

# 5. REQUISITOS DE ENTREGA

Al crear o adaptar un tema se debe entregar:

### CSS
- Archivo completo.
- Variables semánticas al principio.
- Todos los componentes adaptados.
- Sin duplicaciones estructurales.
- Responsive y accesibilidad.
- Compatibilidad con la estructura existente.

### JavaScript
- Script completo y autónomo.
- Identificación y versión.
- Configuración centralizada.
- Inicialización controlada.
- Gestión de eventos y recursos.
- API pública cuando corresponda.
- Limpieza y destrucción completa.
- Compatibilidad con CSS y dashboard.

### Revisión final

Antes de entregar, comprobar:

- [ ] No se ha modificado el HTML original.
- [ ] No se ha alterado la lógica de la aplicación.
- [ ] Se han conservado los selectores existentes.
- [ ] No existen conflictos entre CSS y JavaScript.
- [ ] Los recursos se liberan correctamente.
- [ ] Los efectos respetan la accesibilidad.
- [ ] El tema funciona en escritorio y móvil.
- [ ] La activación y desactivación son seguras.

---

**REGLA FUNDAMENTAL**

La identidad visual y las funcionalidades adicionales son libres. La estructura, la lógica y el funcionamiento original del dashboard deben permanecer intactos, salvo autorización expresa.