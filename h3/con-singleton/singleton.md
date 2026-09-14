# H3 · con-singleton — por qué SIGOT **no** lleva Singleton

**Decisión: no hay copia `con-singleton` con código.** Revisé los cuatro lugares de SIGOT donde el patrón tienta,
y en ninguno el problema real es el que Singleton resuelve.

---

## Qué promete Singleton

Dos cosas juntas:

1. **Una sola instancia** de la clase.
2. **Un punto de acceso global** a esa instancia (`Clase.getInstance()`).

La primera, a veces, la necesito. La segunda es la que me rompe el diseño, y en SIGOT la primera ya viene resuelta sin la segunda.

---

## Los cuatro candidatos que evalué

### 1. El generador de códigos de orden — el más tentador, y el más peligroso

El invariante 7 del H1 dice que *el código de orden es único e inmutable*. La tentación es un
`GeneradorDeCodigos.getInstance().siguiente()` para que "no haya dos OT-0001".

**No funciona en mi arquitectura.** SIGOT es una SPA de Angular: la recepcionista, el técnico y el jefe
trabajan cada uno en **su propio navegador**. Un Singleton garantiza una instancia **por pestaña**, no una en
todo el taller. Dos recepcionistas registrando a la vez generarían los dos `OT-0001`, cada una con su "único" generador.

La unicidad real la da el backend: una secuencia o una restricción `UNIQUE` en la base de datos, y la API
devuelve el código. Un Singleton acá no solo sobra: **da una falsa sensación de garantía**, y eso va directo
contra mi atributo crítico de **fiabilidad**.

> El contador `ultimoNumero` de las demos del H3 es un correlativo de juguete para que la salida sea legible.
> En producción ese número viene de la API.

### 2. El cliente del SEGIP

Tiene sentido **una sola conexión** compartida. Pero en [`../con-adapter/`](../con-adapter/) el valor del patrón
está en que `registrarCliente()` recibe un `VerificadorDeIdentidad` por parámetro, y la demo le pasa un
`ServicioSegipFalso` al que se le puede simular una caída.

Con `ServicioSegip.getInstance()`:

- el código cliente vuelve a nombrar la clase concreta, y se pierde el **DIP** que gané en el H2;
- el estado (`simularCaida(true)`) queda global y **se filtra de una prueba a la siguiente**;
- ya no puedo enchufar un verificador falso sin abrir la clase.

### 3. La configuración del taller (plazos, tarifas)

Son datos de solo lectura que se cargan una vez. Eso es un **valor**, no un objeto con comportamiento:
en Angular es un `InjectionToken` o `environment.ts`. No hace falta una clase que controle su propia instanciación.

### 4. La sesión del usuario (M0)

Quién está logueado y con qué rol. Hace falta una sola por pestaña, y eso Angular ya lo da con un
`AuthService` registrado con `providedIn: 'root'`.

---

## Resumen

| Candidato | ¿Necesita una sola instancia? | ¿Necesita acceso global? | Qué uso en su lugar |
|---|---|---|---|
| Generador de códigos | sí, **en todo el taller** (y Singleton solo da una por navegador) | no | secuencia / `UNIQUE` en la base de datos, vía la API |
| Cliente SEGIP | sí | **no**: rompería el DIP y las pruebas | `providedIn: 'root'` + inyectar el contrato |
| Configuración | es un valor | no | `InjectionToken` / `environment.ts` |
| Sesión de usuario | sí, por pestaña | no | `AuthService` con `providedIn: 'root'` |

**En SIGOT, "una sola instancia" es una decisión de *configuración* (la toma el inyector de Angular),
no una responsabilidad de la *clase*.** Poner esa responsabilidad dentro de la clase con Singleton
mezcla dos razones de cambio (SRP) y esconde dependencias detrás de un acceso global (DIP).

## Cuándo reabriría esta decisión

Si apareciera código que **no pasa por el inyector de Angular** y necesita compartir un recurso costoso:
por ejemplo, un *Web Worker* que procese el reporte de tiempos (RF6) y deba reutilizar una única caché en memoria.
Aun así, lo primero que probaría es pasarle la instancia explícitamente antes de recurrir a `getInstance()`.
