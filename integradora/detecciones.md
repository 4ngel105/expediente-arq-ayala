# Parte 2
**Roberto Angel Ayala Lecoña**
## Violación 1 — SRP (Responsabilidad unica )
una sola clase calcula precios, persiste en base de datos, imprime el
vale y envía el correo, si cambia el formato del vale o si pasan
de correo a WhatsApp, siempre hay que abrir la misma clase.
## Violación 2 — OCP 
Agregar un tipo de menú nuevo obliga a modificar código ya probado en vez de extenderlo.
## Violación 3 — DIP 
La política de alto nivel instancia los detalles concretos: no se puede cambiar el canal ni probar sin BD y correo reales. en 
`new BaseDeDatosComedor()` y `new CorreoUniversitario()` dentro del método.