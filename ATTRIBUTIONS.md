# Atribuciones

La Taberna de Martita usa contenido y assets de terceros. Este archivo lista cada
fuente y reproduce las atribuciones que sus licencias exigen.

---

## Reglas de juego — System Reference Document 5.1

> This work includes material taken from the System Reference Document 5.1
> ("SRD 5.1") by Wizards of the Coast LLC and available at
> https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is
> licensed under the Creative Commons Attribution 4.0 International License
> available at https://creativecommons.org/licenses/by/4.0/legalcode.

Este proyecto no está afiliado con Wizards of the Coast ni con Hasbro, ni cuenta
con su respaldo. *Dungeons & Dragons* y *D&D* son marcas registradas de Wizards
of the Coast LLC. Solo se utiliza material publicado bajo el SRD 5.1; no se
incluye contenido de manuales fuera del SRD.

### Cómo llega el contenido del SRD a la app

| Fuente | Uso | Licencia |
|---|---|---|
| [dnd5eapi.co](https://www.dnd5eapi.co) | API primaria de razas, clases, trasfondos, equipo, hechizos y monstruos | MIT (el servicio); los datos que sirve son SRD 5.1 CC-BY-4.0 |
| [Open5e](https://open5e.com) | API de fallback | Datos SRD bajo CC-BY-4.0 / OGL según endpoint |

---

## Tipografías

| Fuente | Uso | Licencia |
|---|---|---|
| [Cinzel](https://fonts.google.com/specimen/Cinzel) | `--font-display`: títulos y nombres propios | SIL Open Font License 1.1 |

Georgia y las familias monoespaciadas del sistema se referencian por nombre; no
se distribuyen con el proyecto.

---

## Assets 3D

| Asset | Uso | Fuente / Licencia |
|---|---|---|
| `venice_sunset_1k.hdr` | Environment map del tirador de dados 3D | [Poly Haven](https://polyhaven.com) — CC0 |

---

## Íconos

Los íconos de equipo, trasfondos y escuelas de magia provienen de
[game-icons.net](https://game-icons.net), bajo
[Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/).

Se distribuyen en `public/assets/icons/game-icons/`, generados por
`scripts/build-game-icons.mjs`. Los SVGs se modifican respecto del original: se les
quita el rectángulo de fondo y el atributo `fill`, para poder usarlos como máscara
CSS y que hereden el color del tema. CC-BY 3.0 permite obras derivadas siempre que
se atribuya, que es lo que hace esta sección.

Autores de los 129 íconos efectivamente distribuidos, con la cantidad que aportó
cada uno:

| Autor | Íconos |
|---|---:|
| Lorc | 68 |
| Delapouite | 52 |
| sbed | 5 |
| Carl Olsen | 1 |
| Cathelineau | 1 |
| Lucas | 1 |
| Skoll | 1 |
| Willdabeast | 1 |
| Zajkonur | 1 |

Todos disponibles en [game-icons.net](https://game-icons.net) bajo CC-BY 3.0.

Cualquier asset agregado a `public/assets/` debe registrarse en este archivo junto
con su licencia **antes** de mergearse.

---

## Cómo agregar una fuente nueva

1. Verificar que la licencia permita uso y redistribución en un proyecto público.
2. Agregar la fila correspondiente en la tabla que aplique.
3. Si la licencia exige un texto de atribución literal (CC-BY, OFL), reproducirlo
   textualmente, no parafrasearlo.
