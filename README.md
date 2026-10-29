# Turbulencia armónica

**Turbulencia armónica** es una plataforma web para **escuchar el movimiento del aire**. Una pluma de humo, iluminada por una luz LED contra un fondo negro, se convierte en un coro: mientras el humo sube ordenado canta una sola voz; cuando el aire se rompe en remolinos, esa voz se abre en muchas.

Proyecto del Ejercicio 03 · *Escuchar la imagen* · DPPI 2026, Escuela de Diseño UDP. Construida a partir de *Oír la luz* ✏️ (enlace al repositorio original) (Felipe Roa · Santiago Gaete).

**Plataforma:** `https://<usuario>.github.io/<repositorio>/` · **Video:** `<enlace al video de 30–60 s>`

> ✏️ Las partes marcadas con ✏️ son para completar con tu propia voz: decisiones, proceso y reflexión.

---

## 1. Concepto y relación imagen–sonido

El aire es invisible. El humo lo hace visible: cada hilo de humo es una línea de corriente, un registro del movimiento del aire que lo transporta. Una pluma de humo que sube desde una vela pasa por estados reconocibles: primero sube **laminar**, recta y ordenada; luego empieza a **ondular** y a **quebrarse**; arriba **se dispersa** en remolinos.

La plataforma traduce ese recorrido a la **serie armónica**, la estructura física que ordena el sonido de una voz. La altura del humo es la altura del armónico: abajo suena el 2.º armónico de una fundamental grave, arriba el 5.º. El humo que sube recorre la serie armónica.

- **Pluma laminar → una sola voz.** Un hilo de humo ordenado canta un armónico puro, con la vocal cerrada (*u*).
- **Pluma dispersa → un coro.** Cuando el humo se abre en varios hilos, la voz se multiplica: entran unísonos levemente desafinados y luego la quinta, la tercera y la séptima natural, que son los armónicos siguientes. También aparece el aire, un soplo.
- **Pluma turbulenta → una voz que se agita.** Cuando el humo se mueve con violencia, la vocal se abre (*u → a*), el sonido se ilumina y la voz tiembla.

Es una relación de **traducción**: la imagen no "suena a sí misma" (el humo no tiene sonido), sino que un dato físico del aire —su orden o su desorden— controla una cualidad del sonido. El nombre lo dice: la turbulencia se vuelve armonía, y el desorden del aire se escucha como la apertura de un acorde.

Queremos que la persona escuche **lo que el aire hace y que el ojo normalmente no registra**: el instante exacto en que un flujo ordenado se rompe.

✏️ *Agrega por qué elegiste el humo y qué te interesa de esta relación.*

---

## 2. Banco de sonidos y disparador

### El disparador: tres lecturas del humo

La imagen se reduce a 192 × 108 píxeles en escala de grises y se divide en **siete bandas de altura**. Quince veces por segundo, en cada banda se miden tres datos:

| Dato | Cómo se calcula | Qué significa |
|---|---|---|
| **Densidad** | Porcentaje de píxeles más brillantes que el *umbral de humo* | Cuánto humo hay en esa altura |
| **Turbulencia** | De los píxeles de humo, porcentaje que cambió más que el *umbral de cambio* respecto del fotograma anterior | Cuánto se agita el humo |
| **Dispersión** | Combinación del ancho horizontal de la pluma (desviación estándar) y del número de hilos separados por fila | Si la pluma es un hilo sólido o se abrió en varios |

A diferencia de Oír la luz, que solo mide el **cambio** entre fotogramas, esta plataforma mide también la **presencia** del humo por brillo. Gracias a eso una pluma laminar, que casi no cambia, también suena.

### Calibración automática

Para que la plataforma funcione con cualquier video de humo sobre fondo negro, los primeros 3 s de cada fuente se usan para calibrar la lectura:

- **Umbral de humo:** el brillo que tiene el 90 % de la imagen (el fondo), más un margen. Así el ruido del sensor no "canta".
- **Recorte superior:** filas de arriba con brillos que no se mueven, como una luz o un reflejo, que no son humo.
- **Realce:** más fuerte cuanto más tenue es el humo (solo afecta a la imagen, no al sonido).

La regla se validó contra los cinco videos: los valores automáticos coinciden con los calibrados a mano. Se puede desactivar o repetir en *Lectura*.

### La regla (mapping)

| Dato de la imagen | Cualidad del sonido |
|---|---|
| Altura de la banda | Armónico: 2.º (abajo), 3.º, 4.º y 5.º (arriba) de la fundamental |
| Densidad | Volumen de la banda, con entrada y salida suaves |
| Dispersión | Cantidad de voces: 1 → unísonos → quinta → tercera → séptima natural, y aire |
| Turbulencia | Vocal (*u → a*), brillo del filtro, vibrato y reverberación |
| Posición horizontal del humo | Pan izquierda–derecha |
| Estallidos (saltos bruscos de turbulencia, como los del palito de madera) | Golpes corales cortos |
| Quiebre de la pluma (de laminar a turbulenta o dispersa) | Un glissando coral ascendente |
| Cantidad total de humo | Resonancia de una iglesia real (la "nave" donde canta el coro) |

Con la fundamental por defecto (Re2, 73 Hz) las bandas cantan Re3 (147 Hz), La3 (220 Hz), Re4 (294 Hz) y Fa#4 (367 Hz).

### Los sonidos

Cada banda tiene seis voces sostenidas que nunca se detienen: el humo abre o cierra su volumen. El banco tiene **11 sonidos recortados de 9 grabaciones** de [freesound.org](https://freesound.org), elegidas por su papel en la traducción:

- **Las voces del coro** son tramos de 2 a 6 s donde cada grabación sostiene una sola altura estable, detectada por autocorrelación. Cada banda usa la grabación más cercana a su armónico, así que cada altura del humo canta con un coro distinto: grave y oscuro abajo, claro arriba. La plataforma la afina con la velocidad de reproducción.
- **El aire** es un coro disperso y sin altura clara: aparece cuando la pluma se abre.
- **Los golpes** son *stings* corales cortos para los estallidos del palito.
- **El glissando** es un coro que sube en crescendo: suena cuando la pluma se quiebra.
- **La nave** es una grabación dentro de la iglesia de St. Pieter en Lovaina: el espacio real donde resuena el coro.

Todos los tramos se normalizaron en volumen y se convirtieron a MP3 (en total, cerca de 1 MB). Las grabaciones completas están en `sonidos/originales/`.

| Archivo | Uso en la plataforma | Grabación original | Autor | Licencia |
|---|---|---|---|---|
| `coro-0-profundo-mi2.mp3` | voz de coro, 83 Hz (para fundamentales graves) | [696518 · voice choir](https://freesound.org/s/696518/) | 7745 | ✏️ |
| `coro-1-grave-do-sost3.mp3` | voz de coro, 136 Hz (banda base) | [696518 · voice choir](https://freesound.org/s/696518/) | 7745 | ✏️ |
| `coro-2-medio-si3.mp3` | voz de coro, 248 Hz (ascenso) | [479941 · men choir](https://freesound.org/s/479941/) | liezen3 | ✏️ |
| `coro-3-alto-do4.mp3` | voz de coro, 263 Hz (quiebre) | [479941 · men choir](https://freesound.org/s/479941/) | liezen3 | ✏️ |
| `coro-4-claro-sol-sost4.mp3` | voz de coro, 424 Hz (disolución) | [54622 · redemption choir](https://freesound.org/s/54622/) | aarongnp | ✏️ |
| `aire-coro-disperso.mp3` | aire de la pluma dispersa | [535751 · scattered choir effect](https://freesound.org/s/535751/) | xhale303 | ✏️ |
| `acento-1-sting.mp3` | golpe coral (estallidos) | [578334 · choir sting 10](https://freesound.org/s/578334/) | nomiqbomi | ✏️ |
| `acento-2-golpe.mp3`, `acento-3-golpe.mp3` | golpes corales (estallidos) | [580497 · warrior 120 Gmin choir](https://freesound.org/s/580497/) | aliaref | ✏️ |
| `ascenso-glissando.mp3` | glissando del quiebre | [76328 · choir glissando crescendo](https://freesound.org/s/76328/) | timbre | ✏️ |
| `nave-st-pieterkerk.mp3` | resonancia de la nave | [787849 · choir St. Pieterkerk Leuven](https://freesound.org/s/787849/) | jonnibalonni | ✏️ |
| — | (descargado, no usado: altura inestable) | [51334 · 1](https://freesound.org/s/51334/) | pentm450 | ✏️ |
| voz sintética | respaldo si las muestras no cargan | síntesis de formantes en el navegador | propio | — |

✏️ *Completa la licencia de cada uno (aparece en su página de freesound) y cuenta cómo los elegiste.*

### Los videos

✏️ *Cómo grabaste los videos.* Montaje: una vela con un palito de maqueta junto a la mecha, parcialmente tapada con papel aluminio para limitar la ventilación y producir humo; luz LED lateral; fondo negro; cámara fija.

---

## 3. Parámetros y gráfica

### Parámetros

Cada control existe porque cambia la forma en que se lee o se escucha el aire:

| Panel | Parámetro | Por qué está |
|---|---|---|
| Lectura | Umbral de humo | Separa el humo del ruido del fondo negro; cada video y cada luz necesitan su propio valor |
| | Umbral de cambio | Define qué movimiento cuenta como turbulencia |
| | Densidad plena | Cuánto humo hace falta para que una banda cante entera |
| | Turbulencia | Sensibilidad a la agitación |
| | Respuesta | Qué tan rápido reacciona la lectura: lenta para escuchar la forma general, rápida para escuchar cada remolino |
| | Recortes | Dejan fuera la llama, la vela o reflejos que no son aire. El recorte superior se fija solo al calibrar (en Humo 1, 2 y 3 detecta una luz fija arriba) |
| Coro | Fundamental | Cambia la serie armónica completa sin romper sus relaciones |
| | Entrada / Salida | El humo aparece y se desvanece; el coro también. Son el *attack* y el *release* del concepto |
| | Brillo máx. | Hasta dónde se ilumina la voz cuando el aire se agita |
| | Nave | Reverberación larga: el espacio donde resuena el coro |
| | Peso base | Volumen de la banda más baja; sube hasta 100 % en la más alta, para que las voces graves no tapen a las agudas |
| | Volumen | — |
| Mapping | Activar o desactivar cada regla (voces, vocal, vibrato, pan, golpes, glissando, nave) | Permite escuchar cada traducción por separado |
| Vista | Máquina (barra inferior), Realce | Máquina muestra lo que el sistema lee: blanco = humo, ámbar = humo que se agita |
| Grabar | Grabar y descargar | Registrar lo que cantó el humo |

Se quitaron controles de Oír la luz que no tenían sentido aquí: forma de onda, escala, columnas, modos de línea y escáner, y MIDI.

### Gráfica

- **Nombre:** *Turbulencia armónica*, el concepto completo en dos palabras: el desorden del aire y el orden del sonido.
- **Color:** negro de cámara oscura (el fondo del montaje), blanco cálido del humo iluminado y un **ámbar de vela** como único acento. El ámbar marca siempre lo que se agita: la turbulencia en los medidores, el humo que cambia en la vista Máquina y las voces que se suman al coro.
- **Tipografía:** Anaktoria, una serif de inspiración clásica, para el nombre y el estado de la pluma, como en una partitura o un libro de coro. IBM Plex Mono para las mediciones, como en un instrumento de laboratorio. La tensión entre ambas es la del proyecto: medición científica del aire y canto.
- **Visualización:**
  - **Una sola composición para cualquier video:** el video ocupa la izquierda, limpio, sin texto encima; solo lleva las líneas de las siete bandas, un tinte ámbar donde el humo canta y un trazo horizontal que dibuja el ancho real de la pluma. Toda la lectura vive en una columna fija a la derecha, en el mismo orden que las bandas: el estado de la pluma, una fila por banda (armónico, nota, densidad, turbulencia, dispersión y voces), la serie armónica, la partitura y los controles plegables.
  - La **serie armónica**: una sola línea cuando la pluma es sólida y un abanico ámbar cuando se dispersa, junto al espectro real de lo que suena.
  - La **partitura del humo** registra los últimos 20 s: la opacidad es la densidad, el grosor es la dispersión y el color es la turbulencia.
  - El estado general se lee en palabras: *aire quieto*, *pluma laminar*, *pluma en quiebre*, *pluma turbulenta*, *pluma dispersa*.

✏️ *Agrega 2 o 3 capturas (por ejemplo en una carpeta `capturas/`):*

![Pluma laminar](capturas/laminar.png)
![Pluma dispersa](capturas/dispersa.png)

---

## 4. Reflexión

✏️ *Este apartado es tuyo. Algunas preguntas para partir:*

- ¿Qué descubriste al escuchar el humo? ¿Hubo momentos en que el sonido mostró algo que no habías visto?
- **Qué queda fuera de la escucha del sistema:**
  - El sistema no ve el aire, solo el humo iluminado. Donde no hay humo, el aire se mueve en silencio.
  - Lee brillo, no densidad real: una zona más iluminada parece "más humo".
  - No distingue un remolino de la cámara que se mueve o de la luz que parpadea.
  - Ve un plano, no el volumen tridimensional de la pluma.
- **Mejoras posibles** (elige y desarrolla al menos dos):
  1. Medir la **dirección** del movimiento (flujo óptico) para distinguir humo que sube de humo que cae, y asignarle otra voz.
  2. Detectar **remolinos** (rotación) como un evento propio, con su propio sonido.
  3. Un banco de coro grabado en **varias vocales y alturas**, para que el cambio *u → a* sea real y no solo un filtro.
  4. Calibración automática del umbral de humo a partir de los primeros segundos de cada video.
  5. Sensor de temperatura o de flujo de aire conectado por MIDI o serial, para comparar lo que muestra el humo con lo que mide un instrumento.

---

## Cómo usarla

1. Abrir la plataforma en Chrome o Edge (GitHub Pages o `py -m http.server 8123` → `http://localhost:8123`).
2. **▶ Activar sonido.**
3. Elegir un video en la barra inferior, abrir uno propio o usar la cámara.
4. No hace falta ajustar nada: al cargar cualquier video (uno incluido, uno propio o la cámara) la plataforma se calibra sola en 3 s.

## Archivos

```
index.html   interfaz
style.css    gráfica
script.js    lectura del humo, coro y visualización (configuración editable al inicio: VIDEOS, CORO, AIRE, ACENTOS)
fonts/       Anaktoria (George Douros, uso libre)
sonidos/     banco de sonidos
videos/      videos de humo
```

## Créditos

- ✏️ Tu nombre · DPPI 2026 · Escuela de Diseño UDP.
- Base: *Oír la luz*, de Felipe Roa y Santiago Gaete.
- Tipografía Anaktoria (George Douros), IBM Plex Sans y Mono (SIL Open Font License).
- HTML, CSS y JavaScript sin frameworks: Web Audio API, Canvas 2D y MediaRecorder.
