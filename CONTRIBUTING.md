# Cómo contribuir a SuperPaco

¡Cualquiera puede proponer cambios!

1. Haz un *fork* del repositorio.
2. Crea una rama para tu cambio: `git checkout -b mi-mejora`.
3. Haz tus cambios y un commit con un mensaje claro.
4. Sube la rama a tu fork y abre un *Pull Request* contra `main`.

## Reglas de seguridad

- No incluyas contraseñas, tokens, claves de API ni datos personales en el código.
- Usa variables de entorno (`.env`, que está ignorado por git) y documenta
  las nuevas variables en `.env.example` con valores de ejemplo.
- Si encuentras un dato sensible expuesto, avisa abriendo un *issue* sin copiar el dato.
