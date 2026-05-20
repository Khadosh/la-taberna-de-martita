# Propuesta: Dados Compartidos e Interactivos (1-Way Player-to-DM)

Este documento detalla el diseño propuesto para implementar tiradas de dados en tiempo real y click-to-roll interactivo desde la hoja de personaje en el futuro.

---

## 🎯 Resumen del Flujo

1. **Click-to-Roll en la Hoja**: Al hacer click en modificadores de características (FUE, DES, etc.), pericias (Sigilo, Atletismo) o tiradas de salvación en la hoja de personaje, se abrirá el modal de dados 3D cargando automáticamente el d20, el bonificador y la etiqueta correspondiente (ej. *Sigilo*).
2. **Animación 3D Local**: La simulación física de dados en Three.js (`DiceArena.tsx`) se ejecuta en el navegador del jugador local.
3. **Broadcast de 1 Vía (Player-to-DM)**: Al detenerse la física, si el tirador es un jugador en una campaña, el total y desglose de la tirada se transmiten vía **Supabase Realtime Broadcast** al canal `campaign-rolls-${campaignId}`.
4. **Tiradas del DM Privadas**: Si el tirador es el Dungeon Master, la tirada es puramente local y secreta; no se realiza ningún broadcast.
5. **Feed en el Tablero de Combate del DM**: La pantalla de Combate del DM (`$campaignId.lucha.tsx`) se suscribe a este canal Realtime y muestra las tiradas recibidas de sus jugadores en una tercera columna a la derecha ("Registro de Tiradas").

---

## 🛠️ Detalles de Implementación Planificados

### 1. Extensión del Módulo de Dados

* **`DiceModule` (index.tsx)**:
  Aceptará propiedades para sincronización:
  ```ts
  interface DiceModuleProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId?: string | null;
    characterName?: string | null;
    isDm?: boolean;
    initialRoll?: {
      notation: string;
      vantage: 'advantage' | 'disadvantage' | 'none';
      label: string;
    } | null;
  }
  ```
* **`UIOverlay` (UIOverlay.tsx)**:
  * Al recibir `initialRoll` en el montaje, parseará la notación usando `parseNotation()` y disparará `start-roll` con un delay de 300ms.
  * Al capturar el evento `roll-finished`, si `campaignId` está presente e `isDm` es falso, transmitirá por Supabase Realtime:
    ```ts
    const channel = supabase.channel(`campaign-rolls-${campaignId}`)
    channel.send({
      type: 'broadcast',
      event: 'dice-roll',
      payload: {
        characterName,
        notation,
        label,
        total,
        results,
        isCrit,
        isCritFail,
        vantage,
        timestamp: new Date().toISOString()
      }
    })
    ```

### 2. Panel del DM (`$campaignId.lucha.tsx`)

* Suscripción en `useEffect` al canal `campaign-rolls-${campaignId}`.
* Acumular tiradas en un estado `rollsLog` de hasta 30 elementos.
* Renderizar en la tercera columna derecha del tablero el Registro de Tiradas:
  * Mostrar tarjetas de tirada con el nombre del personaje, la etiqueta, la fórmula, el total y el desglose de los dados.
  * Resaltar Nat 20 con color verde brillante ("¡Crítico!") y Nat 1 con rojo ("¡Pifia!").
  * Botón para limpiar el log de tiradas del DM.

### 3. Click-to-Roll en la Hoja de Personaje

* Agregar callback `onRoll(notation, label)` a `TabResumen` y `TabPericias`.
* En la hoja principal (`$characterId.tsx`), definir `triggerSheetRoll(notation, label)` para setear `initialRoll` y abrir el modal.
* **Resumen**: Características (FUE, DES, etc.) y botón GACO o Iniciativa llaman a `onRoll`.
* **Pericias**: Cada fila de habilidad y tirada de salvación se convierte en un botón interactivo que llama a `onRoll`.
