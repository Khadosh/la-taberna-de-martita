# La Taberna de Martita vs. D&D Beyond

> **Estado: borrador de trabajo.** La estructura y el análisis están; faltan los
> incidentes concretos de mesa. Completá los `_(pendiente)_` mientras los recordás
> — se evaporan en semanas.

Contexto: entre `[fecha]` y `[fecha]` la mesa migró a D&D Beyond para usarlo en
sesiones reales y contrastarlo contra esta app. Este documento registra qué
resolvió mejor cada uno y por qué.

---

## La tesis

**D&D Beyond trata la ficha como un documento. Esta app la trata como una escena.**

El maniquí es el estado del equipo en el espacio, no una lista. Las plantillas de
área son el efecto del hechizo sobre el mapa, no "20 pies de radio" en una
descripción. El historial de combate es el estado en el tiempo, visible. La
resolución de ataque responde "necesitás 8 o más" en vez de darte los dos números
para que hagas la resta.

El patrón: **donde D&D Beyond te da los datos, esta app te da la respuesta.** En
una mesa en vivo, esa diferencia es el ritmo de la partida.

Lo mismo vale para los procesos, no solo para los números: subir de nivel es una
tanda de decisiones acopladas, y la diferencia entre un gestor donde hay que ir a
buscarlas y un flujo que te las presenta en orden.

Y un segundo patrón, que aparece en las herramientas del DM: **la app asume que el
DM está dirigiendo ahora, no preparando después.** El generador de encuentros y el
mostrar/ocultar por grupo existen porque en la mesa no hay tiempo para abrir otra
pestaña. Es la misma tesis vista desde la silla del DM.

Corolario: **D&D Beyond está optimizado para entre sesiones; esta app para la mesa
en vivo.** Construir personaje y consultar reglas es su terreno. Saber qué pasó
hace dos turnos, qué tengo equipado ahora y a quién agarra la bola de fuego es el
de acá.

## Por qué esto no es una lista de quejas

El [roadmap de desarrollo 2026 de D&D Beyond](https://www.dndbeyond.com/posts/2132-d-d-beyonds-2026-development-roadmap)
prioriza herramientas de preparación para DM: documentación de sesión, reglas y
lore embebidos, y tablas tirables para reducir el cambio de pestañas.

Es el mismo problema que este proyecto atacó por su cuenta. No es "su producto
está mal" — es haber llegado al mismo diagnóstico de forma independiente, con una
implementación funcionando.

---

## Hallazgos

Cada uno necesita **un incidente puntual de mesa**, no un adjetivo. Un momento
concreto es irrefutable y se cuenta en diez segundos; una opinión sobre
arquitectura de información se discute media hora.

### Nivel 1 — Se defienden solos porque se ven

Demostrables en el video sin explicación. Técnicamente no triviales.

#### Plantillas de área de efecto sobre el mapa

| | |
|---|---|
| Qué se intentó en la mesa | _(pendiente)_ |
| Dónde frenó D&D Beyond | _(pendiente — **verificar en su app antes de escribirlo**)_ |
| Cómo lo resuelve esta app | Proyección de esferas, cubos y líneas con detección automática de tokens alcanzados |
| Dónde vive | `src/components/tablero/` |

#### Maniquí de equipamiento (11 slots, drag & drop)

| | |
|---|---|
| Qué se intentó en la mesa | _(pendiente)_ |
| Dónde frenó D&D Beyond | _(pendiente — **verificar**)_ |
| Cómo lo resuelve esta app | Paper doll humanoide: el equipo se lee de un vistazo en vez de recorrer una lista |
| Dónde vive | `src/components/character-sheet/paper-doll.tsx` |

#### Resolución de ataque atacante → objetivo

Probablemente el más fuerte de todos: es el que mejor encarna la tesis. D&D Beyond
te da el bloque de estadísticas y vos hacés la cuenta — "su CA es 15, tengo +7,
necesito sacar 8". Esta app hace la cuenta por vos **para ese par concreto** y te
da la respuesta directa. Convierte una consulta más una operación mental en un
número.

| | |
|---|---|
| Qué se intentó en la mesa | _(pendiente)_ |
| Dónde frenó D&D Beyond | _(pendiente — **es la afirmación más fuerte de la lista; verificar con especial cuidado en su tracker de combate y en Maps antes de escribirla**)_ |
| Cómo lo resuelve esta app | Seleccionás atacante y objetivo, y muestra el d20 mínimo necesario, la probabilidad de acierto en porcentaje y el daño. Contempla tiradas de salvación con su CD y los bordes de la regla: 1 natural siempre falla, `nat20Always` cuando el 20 acierta sí o sí |
| Dónde vive | `src/components/combat/use-combat-board.ts:318` · `combat-popup.tsx` |

> Nota para la Fase 1: este cálculo hoy vive dentro de un hook, mezclado con estado
> de React. Es un candidato claro a mudarse al motor de reglas — y de los que mejor
> quedan como test contra el SRD.

#### Subida de nivel como flujo guiado

Subir de nivel en 5e no es un botón: es una tanda de decisiones acopladas —puntos
de golpe, subclase, mejora de característica o dote, conjuros nuevos, estilo de
combate, enemigo predilecto—. D&D Beyond las tiene, repartidas en un gestor de
personaje donde hay que ir a buscarlas. Acá aparecen todas juntas, en orden, en un
solo modal: **subís de nivel, ponés el HP y elegís lo que hay que elegir.**

El detalle que mejor lo muestra: al pedir los puntos de golpe no muestra un campo
vacío, muestra la decisión completa —*"Tirá 1d10 +3 CON = entre 4 y 13 PG.
Promedio: 9"*—. El SRD te deja elegir entre tirar y tomar el promedio; la app te da
los dos números para que elijas, en vez de que tengas que calcularlos.

| | |
|---|---|
| Qué se intentó en la mesa | _(pendiente)_ |
| Dónde frenó D&D Beyond | _(pendiente — **verificar en su gestor de personaje**)_ |
| Cómo lo resuelve esta app | Un modal que recorre las seis decisiones del nivel y no deja seguir hasta resolverlas, con el rango y el promedio de PG calculados |
| Dónde vive | `src/components/character-sheet/level-up-modal.tsx` |

> El aviso *"Hay N elecciones de clase pendientes"* de la hoja es la otra mitad de
> lo mismo: si quedó algo sin elegir, la ficha lo dice en vez de dejarlo pasar en
> silencio.

#### Generador procedural de encuentros

Se elige un arquetipo temático y el generador arma el encuentro entero: escala los
monstruos al nivel de la party, les asigna roles tácticos y los coloca sobre la
grilla. Lo que en la mesa es "pará, dejame armar esto" pasa a ser un click.

| | |
|---|---|
| Qué se intentó en la mesa | _(pendiente)_ |
| Dónde frenó D&D Beyond | _(pendiente — **verificar**)_ |
| Cómo lo resuelve esta app | 30 arquetipos (`src/data/encounter-archetypes.ts`), escalado por nivel de party, cuatro roles tácticos —cuerpo a cuerpo, distancia, magia y apoyo—, y botín tirado por bioma con 8 perfiles |
| Dónde vive | `src/components/tablero/use-encounter-generator.ts` · `src/loot/` |

#### Revelar y ocultar un grupo entero

El complemento del anterior y, en la mesa, quizá lo más útil de los dos: cada
encuentro generado recibe un identificador de grupo, y el DM lo muestra u oculta
completo. Es la emboscada: los goblins existen en el tablero, con sus posiciones y
sus puntos de golpe, pero los jugadores no los ven hasta que el DM decide.

Sin esto, un DM tiene dos malas opciones: colocar los enemigos a la vista y perder
la sorpresa, o colocarlos en el momento y frenar la escena.

| | |
|---|---|
| Qué se intentó en la mesa | _(pendiente)_ |
| Dónde frenó D&D Beyond | _(pendiente — **verificar**)_ |
| Cómo lo resuelve esta app | `spawn_group` (un UUID por encuentro generado) más un flag `hidden` por ficha, sincronizados en tiempo real: el DM las ve atenuadas, los jugadores no las ven |
| Dónde vive | `use-encounter-generator.ts:338` · `use-dm-tablero.ts:76` · migración `board_tokens_hidden` |

#### Historial en la pantalla de combate

| | |
|---|---|
| Qué se intentó en la mesa | _(pendiente)_ |
| Dónde frenó D&D Beyond | _(pendiente — **verificar**)_ |
| Cómo lo resuelve esta app | Feed de eventos del encuentro visible durante el combate |
| Dónde vive | `src/components/tablero/` |

### Nivel 2 — Reales, pero son arquitectura de información

Más subjetivos. Se vuelven fuertes **solo** si se atan a una tarea que se hizo
medible o notoriamente más rápida. Sin eso, se leen como preferencia personal.

| Hallazgo | Tarea concreta que mejoró | Estado |
|---|---|---|
| Hoja dividida por conceptos clave (Resumen · Pericias · Hechizos · Historia) | _(pendiente)_ | ⏳ |
| Presentación de objetos y sus descripciones | _(pendiente)_ | ⏳ |
| Presentación de hechizos | _(pendiente)_ | ⏳ |
| Sección de notas de sesión | _(pendiente)_ | ⏳ |

---

## Dónde D&D Beyond gana

**Esta sección no es opcional.** Sin ella, todo lo anterior se lee como orgullo de
autor. Con ella, se lee como criterio. Apuntá a tres o cuatro, honestas.

Candidatos evidentes a verificar y desarrollar:

- Cobertura de contenido: manuales completos con licencia vs. solo SRD 5.1
- Creación y subida de nivel de personaje, pulida durante años
- Mobile y accesibilidad
- Confiabilidad, escala y soporte
- Ecosistema: marketplace, compras, sincronización entre productos

| Dónde ganan | Por qué importa | Qué aprendí de eso |
|---|---|---|
| _(pendiente)_ | | |

---

## La asimetría (decila vos primero)

Varias ventajas de esta app existen **porque** es una mesa de cinco personas y no
un producto masivo:

- El maniquí es simple con 11 slots y objetos del SRD. Con miles de ítems de
  decenas de manuales, reglas raras de slots y variantes por edición, es otro
  problema.
- Se puede asumir que todos comparten contexto y una sesión en vivo. Un producto
  masivo no puede asumir nada del entorno de uso.
- No hay legacy: ni datos de quince años, ni compatibilidad hacia atrás, ni
  contratos de licencia.
- No hay obligaciones de accesibilidad, i18n, mobile ni soporte a escala.

Reconocer esto sin que te lo señalen es lo que separa una observación aguda de una
ingenua.

---

## Antes de usar esto en cualquier lado

- [ ] Verificar **en su app** cada afirmación sobre qué D&D Beyond no hace.
      Equivocarse en un hecho sobre su producto, en su entrevista, es caro.
- [ ] Completar al menos un incidente concreto por hallazgo de nivel 1
- [ ] Completar la sección de dónde ellos ganan (mínimo tres)
- [ ] Revisar el tono: "esto aprendí usándolo", nunca "esto está mal hecho"
- [ ] Fechar la comparación — su producto cambia, y una crítica sin fecha envejece
      mal

---

## Derivados

De este documento salen después:

- Una sección del `README.md`, mucho más corta y sin las partes internas
- El guion de la parte "por qué construí esto" del video de tres minutos
- Muy probablemente, las preguntas más interesantes para hacerles a ellos
