# Oír la luz

**Oír la luz** es una herramienta web para **visualizar el sonido y explorar cómo una imagen en movimiento puede convertirse en sonido**. Funciona con un video, con la cámara web o con una escena de ejemplo. Tiene **cuatro modos de disparo**: zonas que suenan cuando algo cambia dentro de ellas, una línea fija que suena cuando algo la cruza, varias líneas con voces distintas y un escáner que recorre la imagen como una partitura.

La desarrollamos para el curso *Dispositivos periféricos y plataformas para la interacción digital* (DPPI 2026, Escuela de Diseño UDP). Es la demo del **Ejercicio 03 · Escuchar la imagen**.

## Objetivo

La herramienta persigue dos objetivos.

1. **Visualizar el sonido.** Cada variable que se ve en clase (forma de onda, armónicos, attack, release, filtro, reverb, volumen) tiene una representación visible que cambia en tiempo real. Lo que se oye también se puede ver.
2. **Abrir otras posibilidades.** La herramienta es un punto de partida, no un instrumento cerrado. Hoy las zonas tocan notas sintetizadas, pero la misma estructura sirve para que suenen aves, autos, lluvia, animales, voces o cualquier grabación. La idea es que cada proyecto explore qué significa **sonorizar una experiencia**: qué fenómeno escuchamos, con qué sonido lo representamos y qué relación construimos entre ambos. La sección [Usar otros sonidos](#usar-otros-sonidos) explica cómo hacerlo.

## La cadena

```
luz → cámara → píxel → cambio → regla → nota → sonido
```

La máquina no reconoce autos, manos ni personas. Solo compara cada fotograma con el anterior y cuenta cuántos píxeles cambiaron (o, en el modo escáner, cuánta luz hay). Todo lo demás es una **regla que diseñamos** (el *mapping*): qué zona produce qué sonido, con qué intensidad y en qué lugar del espacio.

## Cuatro modos de disparo

La misma imagen puede sonar de maneras muy distintas según la regla. El panel **01 · Modo** cambia la regla sin tocar el resto de la herramienta.

| Modo | Qué suena | Regla | Controles propios |
|---|---|---|---|
| **Zonas** | Cada celda de una grilla, cuando algo se mueve dentro de ella | zona → nota · fila → octava | Columnas, filas (panel 03) |
| **Línea fija** | Una línea vertical quieta, cuando algo del video la cruza | altura del cruce → nota · posición de la línea → pan | Posición, tramos, dirección → octava |
| **Varias líneas** | Entre 2 y 4 líneas, cada una con su propia voz | línea → voz (forma de onda, envolvente, octava, filtro) · altura → nota | Cantidad de líneas, tramos, dirección → octava |
| **Escáner** | Una línea que recorre la imagen de izquierda a derecha | altura → nota · brillo → volumen · tiempo → recorrido | Duración de la vuelta, pasos, brillo mínimo, invertir |

### Línea fija

La línea no se mueve: es el video el que la toca. La línea se divide en **tramos** (3–12); cada tramo es una nota de la escala y el de arriba es el más agudo. Un tramo suena cuando los píxeles que cambian sobre la línea (una franja de 3 px en la imagen de análisis) superan la sensibilidad. Con **dirección → octava** activado, lo que cruza de derecha a izquierda suena una octava más grave: la dirección se calcula con el centro de los píxeles que cambian alrededor de la línea, comparado con el fotograma anterior.

Sirve para preguntas como *¿qué suena cuando alguien cruza una puerta?* o *¿cuántos autos pasan por esta esquina?*

### Varias líneas

Cada línea tiene un color y una voz propia. En este modo la forma de onda, el attack, el release y el pasa-bajos del panel Sonido no se usan, porque cada línea trae los suyos; la reverb y el volumen sí aplican.

| Línea | Voz | Forma de onda | Attack · Release | Octava | Filtro | En un proyecto podría ser |
|---|---|---|---|---|---|---|
| 1 · neón | golpe | cuadrada | 3 ms · 180 ms | +1 | pasa-bajos 5000 Hz | `ave.wav` |
| 2 · blanca | estela | seno | 90 ms · 2400 ms | 0 | — | `auto.wav` |
| 3 · violeta | lejano | sierra | 20 ms · 1000 ms | −1 | pasa-bajos 650 Hz | `lluvia.wav` |
| 4 · cian | brillo | triangular | 2 ms · 600 ms | +2 | — | `campana.wav` |

Las voces están en la constante `VOICES` al inicio de `script.js`; cambiarlas es la manera más rápida de probar envolventes distintas.

### Escáner

Funciona como las sonificaciones de imágenes astronómicas de la NASA. Una línea recorre la imagen en una **vuelta** (2–20 s) dividida en **pasos** (8–32). En cada paso, la columna bajo la línea se divide en tramos y suenan los tramos cuyo brillo promedio supera el **brillo mínimo** (como máximo 4 a la vez, los más claros). La altura da la nota y el brillo el volumen. No necesita movimiento: funciona con una imagen quieta. **Invertir** lee lo oscuro en vez de lo claro, útil para fondos blancos.

### Pedirle otros modos a la IA

Estos modos son ejemplos. Otras reglas posibles para pedir en vibecoding: el **color** (lo rojo suena grave, lo azul agudo), el **tamaño** (lo grande suena fuerte), la **cantidad** (mientras más cambio en toda la imagen, más densa la lluvia), el **cuerpo** (con MediaPipe, cada mano o dedo es un instrumento) o el **tiempo** (lo que queda quieto mucho rato también suena).

---

## Cómo abrirlo

### En el computador (recomendado para clases)

La cámara y el controlador MIDI solo funcionan si la página se abre desde un servidor local, en Chrome o Edge.

**Windows (PowerShell)**

```
Set-Location "ruta\a\oir-la-luz"
py -m http.server 8123
```

**macOS (Terminal)**

```
cd ruta/a/oir-la-luz
python3 -m http.server 8123
```

Luego:

1. Abrir **http://localhost:8123** en Chrome o Edge.
2. Presionar **▶ Activar sonido** en la barra superior. El navegador no deja sonar audio sin un clic.
3. Para cerrar el servidor, presionar `Ctrl + C` en la terminal.

Si no ves los cambios después de actualizar los archivos, recarga con `Ctrl + F5` o usa otro puerto (por ejemplo `8124`).

### En GitHub Pages

En el repositorio: **Settings → Pages → Deploy from a branch → `main` → `/ (root)`**. Pages usa HTTPS, así que la cámara y el MIDI también funcionan desde el enlace publicado.

---

## La interfaz

La interfaz sigue el sistema visual de *Lo que queda* (Computación Avanzada 2026): barras fijas arriba y abajo, escenario a pantalla completa, dock numerado a la derecha, líneas de 1 px, sin esquinas redondeadas y un grano fino. La paleta es azul noche con amarillo neón como único acento. El título usa Anaktoria.

| Lugar | Qué contiene |
|---|---|
| **Barra superior** | Activar / apagar sonido · Pantalla completa (solo el escenario; `Esc` para salir) |
| **Escenario** | El video con las zonas, líneas o el escáner. Arriba a la izquierda el título y la fuente; abajo a la izquierda la última nota, su frecuencia, dónde sonó y el porcentaje de cambio (o de brillo) |
| **Dock 01–08** | Paneles de parámetros (se abren hacia la izquierda; `Esc` los cierra) |
| **Ventana 09 · Señal** | Forma de onda, armónicos, envolvente y partitura |
| **Barra inferior, izquierda** | Fuente: Ejemplo, Cámara (con *Apagar cámara*), Video (con *Play*, *Pausa*, *Loop* y *Cambiar*) |
| **Barra inferior, derecha** | Capas que se encienden y apagan: **Líneas**, **Notas**, **Partículas**, **Señal** |

### Capas del escenario

- **Tono azul.** La zona que suena se tiñe de azul y se desvanece. Siempre está activo; su intensidad se ajusta en el panel 02.
- **Líneas.** En el modo Zonas: la grilla de 1 px, el marco neón de la zona que suena y una barra fina que muestra cuánto cambio hay en cada zona respecto de la sensibilidad. En los otros modos: las líneas de disparo, sus tramos y el cabezal del escáner.
- **Notas.** El nombre de la nota de cada zona.
- **Partículas.** Puntos breves donde hay cambio, sin estela: violeta si el cambio es suave, neón si es brusco.
- **Señal.** La ventana 09.

Al apagar Líneas, Notas, Partículas y Señal queda **solo el video, el sonido y el tono azul** sobre lo que cambia.

### Paneles del dock

| Panel | Controles |
|---|---|
| **01 · Modo** | Zonas, Línea fija, Varias líneas o Escáner, con los controles propios de cada uno |
| **02 · Visualización** | Fondo: *Video* o *Máquina* (la máscara de píxeles que cambiaron: todo lo que el sistema "ve") · Intensidad del tono azul · Oscurecer el video |
| **03 · Teclas** | Columnas (3–12) · Filas (1–3), solo para Zonas · Escala (pentatónica mayor, pentatónica menor, mayor, cromática) · Nota base |
| **04 · Detección** | Umbral por píxel · Sensibilidad por zona · Tiempo mínimo entre repeticiones |
| **05 · Sonido** | Forma de onda (seno, triangular, cuadrada, sierra) · Attack · Release · Pasa-bajos · Reverb · Volumen |
| **06 · Mapping** | Intensidad del movimiento → volumen · Posición horizontal → pan · Espejo de la cámara |
| **07 · Grabar** | Grabar lo que suena y descargarlo · Descargar la última nota aislada |
| **08 · MIDI** | Conectar un controlador · Asignar perillas a sliders · Borrar asignaciones |

---

## Cómo funciona por dentro

### 1. Fuente

- **Ejemplo:** una calle sintética dibujada en un canvas, con autos en tres carriles y un pájaro. Toca sola, sin cámara.
- **Cámara:** `getUserMedia` a 640 × 360. Con *espejo* activado la imagen se invierte horizontalmente, como un espejo.
- **Video:** cualquier archivo de video del computador, que se reproduce en silencio y en loop.

### 2. Detección (diferencia entre fotogramas)

Es el mismo principio del Sistema B de *Dos realidades*.

1. Quince veces por segundo, la imagen se reduce a **128 × 72 píxeles** y se convierte a escala de grises (`0,3 R + 0,59 G + 0,11 B`).
2. Cada píxel se compara con el mismo píxel del fotograma anterior. Si la diferencia supera el **umbral por píxel** (por defecto 28 de 255), ese píxel "cambió".
3. Para cada zona se calcula el **porcentaje de píxeles que cambiaron**, suavizado con el valor anterior.
4. Si ese porcentaje supera la **sensibilidad** (por defecto 3 %) y pasó el **tiempo mínimo de repetición** (por defecto 320 ms) desde la última vez, la zona suena.

### 3. Mapping (la regla)

| Dato | Variable sonora |
|---|---|
| Zona (columna) | Nota de la escala elegida |
| Zona (fila) | Octava: la fila de arriba es la más aguda |
| Porcentaje de cambio | Volumen de la nota (si está activado) |
| Posición horizontal de la zona | Pan izquierda–derecha (si está activado) |

La nota se convierte en frecuencia con la fórmula de la afinación temperada, donde *n* es el número de nota MIDI y La4 = 69 = 440 Hz:

```
f = 440 · 2^((n − 69) / 12)
```

Por defecto la escala es **pentatónica**: cualquier combinación de notas suena consonante, algo útil cuando quien toca es un movimiento impreciso.

### 4. Síntesis (Web Audio API)

Cada nota se construye así:

```
oscilador → envolvente → pan → pasa-bajos → (seco + reverb) → volumen → compresor → salida
```

- **Oscilador:** seno, triangular, cuadrada o sierra.
- **Envolvente:** sube en el tiempo de **attack**, baja a un 60 % en ~80 ms, se mantiene 60 ms y cae con el **release**.
- **Pan:** `StereoPannerNode` según la columna.
- **Pasa-bajos:** filtro `lowpass` de 12 dB por octava; deja pasar las frecuencias bajo el **corte**.
- **Reverb:** convolución con una respuesta al impulso generada (ruido que decae en 2,6 s). El slider mezcla la señal seca con la reverberada.
- **Compresor:** evita que muchas notas juntas saturen.

### 5. Visualización de la señal (ventana 09)

| Gráfica | Qué muestra | Qué controles la cambian |
|---|---|---|
| **Forma de onda** | Dos ciclos y medio de la onda elegida. Sin sonido se dibuja la forma ideal; con sonido, la forma ideal queda tenue y encima aparece la señal real, sincronizada al inicio del ciclo y tomada después del filtro | Forma de onda · Pasa-bajos (la cuadrada y la sierra se suavizan) |
| **Armónicos** | Las intensidades teóricas de los armónicos: el seno tiene uno; la cuadrada solo impares (1/n); la triangular impares que caen rápido (1/n²); la sierra todos (1/n). La curva punteada es la respuesta del pasa-bajos; los armónicos sobre el corte se apagan | Forma de onda · Pasa-bajos |
| **Envolvente** | La forma de cada nota en el tiempo, con las marcas A y R. La zona violeta es la cola de reverb. La altura es el volumen. Una línea vertical sigue la última nota | Attack · Release · Reverb · Volumen |
| **Medidor** | El marco muestra el volumen elegido; el relleno, el nivel real que sale | Volumen |
| **Partitura** | Las notas de los últimos 10 s, en altura × tiempo | Todo lo que dispara notas |

Al mover un slider, la parte de la gráfica que controla se ilumina en blanco durante un segundo.

### 6. Grabar y descargar

- **Grabar:** usa `MediaRecorder` sobre la salida final.
- **Descargar última nota:** vuelve a tocar la última nota en una cadena aparte y la graba aislada.
- En la versión local los archivos se descargan en **WAV**. En el enlace publicado en Claude se descargan en **WebM**, porque esa vista no permite WAV.

### 7. Controlador MIDI (Web MIDI API)

1. Conectar el controlador por USB antes de abrir la página.
2. Panel **07** → **Conectar MIDI** → aceptar el permiso.
3. **Asignar** → abrir otro panel → tocar un slider → mover una perilla. Junto al nombre del slider aparece su número, por ejemplo `CC21`.
4. **Asignar** de nuevo para terminar.

Las asignaciones se guardan en el `localStorage` del navegador. Cada perilla (mensaje *Control Change*, 0–127) se escala al rango del slider.

---

## Parámetros y valores por defecto

| Parámetro | Rango | Por defecto |
|---|---|---|
| Columnas / Filas | 3–12 / 1–3 | 5 / 3 |
| Escala | 4 opciones | Pentatónica mayor |
| Nota base | Do3, Sol3, La3, Do4 | Do3 (131 Hz) |
| Umbral por píxel | 8–80 | 28 |
| Sensibilidad | 1–40 % | 3 % |
| Repetición | 60–1200 ms | 320 ms |
| Attack | 1–800 ms | 8 ms |
| Release | 40–3000 ms | 700 ms |
| Pasa-bajos | 200–12000 Hz | 3200 Hz |
| Reverb | 0–100 % | 30 % |
| Volumen | 0–100 % | 60 % |
| Tono azul | 0–60 % | 22 % |
| Modo | 4 opciones | Zonas |
| Posición de la línea fija | 5–95 % | 50 % |
| Cantidad de líneas | 2–4 | 3 |
| Tramos por línea | 3–12 | 7 |
| Vuelta del escáner | 2–20 s | 6 s |
| Pasos del escáner | 8–32 | 16 |
| Brillo mínimo | 30–240 | 90 |

---

## Archivos

```
oir-la-luz/
├── index.html          estructura de la interfaz
├── style.css           sistema visual
├── script.js           toda la lógica
├── fonts/
│   └── anaktoria.woff2 tipografía del título (subconjunto latino)
└── sonidos/
    └── LEEME.md        dónde poner sonidos propios
```

`script.js` está dividido en secciones comentadas:

| Sección | Qué hace |
|---|---|
| `dock` | Abre y cierra los paneles |
| `fuentes` | Ejemplo, cámara y video |
| `capas` | Botones Líneas, Notas, Partículas y Señal |
| `audio` | Cadena de Web Audio y función `voice()`, que toca una nota |
| `descargas` | Grabación, conversión a WAV y descarga |
| `detección` | Diferencia entre fotogramas, energía por zona y disparo de notas (`analyse()`, `fire()`); modos de línea (`lineDetect()`) y escáner (`scanTick()`) |
| `dibujo` | Escenario (`drawLines()`, `drawScanner()`), forma de onda, armónicos, envolvente y partitura |
| `controles` | Sliders y estado |
| `MIDI` | Conexión y asignación de perillas |
| `bucle` | El ciclo de animación |

---

## Usar otros sonidos

Hoy cada zona dispara un **oscilador**. Para que suene una grabación (un ave, un auto, la lluvia, un perro, una voz) hay que reemplazar ese oscilador por una **muestra de audio**. Las variables de la clase siguen funcionando: el filtro, la reverb, el pan y el volumen se aplican igual.

### 1. Conseguir los sonidos

- Formatos: **WAV**, **MP3** u **OGG**, cortos (de 0,3 a 5 s) y sin silencio al inicio.
- Fuentes con licencia abierta: [freesound.org](https://freesound.org) (revisar la licencia de cada archivo) o grabaciones propias con el celular.
- Guardarlos en la carpeta `sonidos/` con nombres simples: `ave.wav`, `auto.wav`, `lluvia.wav`.

### 2. Cargar los sonidos

En `script.js`, dentro de la sección `audio`, después de `initAudio()`:

```js
const BANCO = {};
async function cargarSonido(nombre, url) {
  const datos = await fetch(url).then((r) => r.arrayBuffer());
  BANCO[nombre] = await ac.decodeAudioData(datos);
}
async function cargarBanco() {
  await Promise.all([
    cargarSonido("ave", "sonidos/ave.wav"),
    cargarSonido("auto", "sonidos/auto.wav"),
    cargarSonido("lluvia", "sonidos/lluvia.wav"),
  ]);
}
```

Y llamar a `cargarBanco()` justo después de `initAudio()` en el botón de sonido.

### 3. Reproducir una muestra en vez de una nota

```js
function muestra(nombre, vel, pan, velocidad = 1) {
  if (!BANCO[nombre]) return;
  const src = ac.createBufferSource();
  src.buffer = BANCO[nombre];
  src.playbackRate.value = velocidad; // > 1 más agudo y rápido · < 1 más grave y lento
  const g = ac.createGain(); g.gain.value = 0.8 * vel;
  const p = ac.createStereoPanner(); p.pan.value = pan;
  src.connect(g); g.connect(p); p.connect(main.input); // pasa por el filtro y la reverb
  src.start();
}
```

### 4. Decidir la regla: qué zona suena a qué

En `analyse()`, cambiar la línea que llama a `voice(...)` por una regla propia. Algunos ejemplos:

```js
// a) cada fila es un tipo de sonido: arriba aves, al medio autos, abajo lluvia
const porFila = ["ave", "auto", "lluvia"];
muestra(porFila[r], vel, pan);

// b) un solo sonido que cambia de altura según la nota de la zona
muestra("ave", vel, pan, mtof(m) / mtof(S.root));

// c) mientras más cambio hay, más grave y lento (como algo que se acerca)
muestra("auto", vel, pan, 1.4 - energy[k] * 3);
```

### Ideas para explorar

Cada idea parte de una relación entre lo que se ve y lo que se escucha. La relación puede ser de **semejanza** (lo que se ve suena a sí mismo), de **contraste** (lo que se ve suena a otra cosa) o de **traducción** (un dato de la imagen controla una cualidad del sonido).

| Imagen (disparador) | Banco de sonidos | Relación | Parámetros que podrían cambiar |
|---|---|---|---|
| Una calle con autos y peatones | Bosque: aves, hojas, viento, insectos | Contraste: la ciudad recuerda lo que reemplazó | Más tráfico → más densidad de aves; la velocidad del auto controla el pan |
| Una bandada en migración | Cantos de pájaros de distintas especies | Semejanza: cada zona del cielo, una especie | La altura de la bandada controla el tono; el tamaño, el volumen |
| Olas en la orilla | Respiración humana | Traducción: el mar respira | El tamaño de la ola controla el attack; la espuma, el filtro |
| Una multitud en el metro | Lluvia, de llovizna a tormenta | Traducción: densidad de personas → densidad de gotas | La cantidad de cambio controla el volumen y la reverb |
| Una cocina mientras se prepara comida | Instrumentos de percusión | Semejanza rítmica: cada gesto, un golpe | Cada zona del mesón, un instrumento; la intensidad, el volumen |
| Un río o la lluvia sobre un vidrio | Notas de piano o campanas | Traducción: cada gota, una nota | La posición de la gota define la nota; el brillo, el pasa-bajos |
| La cámara apuntando a quien está frente a la pantalla | Animales: perros, grillos, ballenas | Escucha del cuerpo: cada parte del cuerpo, un animal | La posición horizontal controla el pan; la velocidad, la repetición |
| Un video de un lugar propio (la casa, el barrio) | Grabaciones reales de ese mismo lugar | Memoria: la imagen "recuerda" su sonido | El cambio brusco dispara sonidos lejanos con mucha reverb |
| Tráfico nocturno, luces de autos | Cantos de ballenas | Contraste: el flujo de luces como un océano | La duración del cambio controla el release; las luces rojas, el tono grave |

Otras posibilidades: sonido como advertencia (un sonido que solo aparece cuando el cambio es brusco), sonificación de datos (el movimiento de una esquina a lo largo del día) o paisaje sonoro invertido (un bosque que suena a ciudad).

Las preguntas de fondo son las del curso: **¿qué fenómeno seleccionamos?, ¿qué dato producimos realmente?, ¿qué regla traduce ese dato en sonido?, ¿qué queda fuera de la escucha del sistema?**

---

## Limitaciones

- La cámara y el MIDI necesitan `localhost` o HTTPS (GitHub Pages), y el MIDI solo funciona en Chrome o Edge.
- La detección es por cambio de brillo: no distingue qué cambió. La luz que parpadea, la cámara que se mueve o la compresión del video también "suenan".
- Con muchas zonas activas a la vez, la forma de onda real es la suma de varias notas y deja de verse limpia. Bajar la sensibilidad o subir el tiempo de repetición ayuda.
- Las barras de armónicos son teóricas; muestran cómo se comporta cada forma de onda, no un análisis del sonido real.

---

## Créditos

- Felipe Roa · Santiago Gaete · DPPI 2026 · Escuela de Diseño UDP.
- Sistema visual a partir de *Lo que queda* (Computación Avanzada 2026).
- Tipografía Anaktoria, de George Douros: uso libre, se permite redistribuir y modificar.
- IBM Plex Sans e IBM Plex Mono vía Google Fonts (SIL Open Font License).
- HTML, CSS y JavaScript sin frameworks: Web Audio API, MediaRecorder, Web MIDI API y Canvas 2D.
