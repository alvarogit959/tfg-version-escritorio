==== **Lanzar el server primero!** ======
El server está incluido dentro de este repositorio como **serverCarmeet.js**, lanzandolo como "**node .\serverCarmeet.js**"

El documento pdf para la **presentación del proyecto** está dentro de "**Documentación del proyecto**"

Este es el documento principal donde tengo la **documentación** en latex/pdf del proyecto dentro de la carpeta "**Documentación del proyecto**".

Para la version de **movil**, es la direccion: https://github.com/alvarogit959/carmeet-phone

Link Drive de los **instaladores como .exe**, arreglé algunos bugs despues de crear los .exe por lo que recomiendo mas crearlos de nuevo: https://drive.google.com/drive/folders/1pB5D6lEBgyw6MmiKzaDXcIjlvWkjMGZJ?usp=drive_link

Si quieres verlo desde Visual studio simplemente usar: **npm run electron:serve**

Link del **video de la aplicación** funcionando como .exe: https://youtu.be/CoYdliQ5uD4

Lanzar los dos exe al mismo tiempo puede ser incompatible al usar tecnologías como mapbox que solo permiten una request al mismo tiempo en la versión gratuita.

El resto del readme son comandos que puede necesitar para funcionar si se lanza la app como "serve" y no estan instalados previamente.

```
# vue-electron-app

## Project setup
-Comandos necesarios para su funcionamiento:

npm install

npm install -g @vue/cli

npm install --save-dev electron   

vue add electron-builder  

npm install cors mongoose

npm install bcrypt

npm install vue-router

npm install leaflet

npm install socket.io

npm install socket.io-client

npm install mapbox-gl
-Lanzar app:
node .\serverVueElectron.js
npm run electron:serve   

C:\Users\delva\Desktop\Clases\SEGUNDOAÑO\segundoCuatrimestre\vue-electron-app\event-images\default.jpg

### Build final de la aplicación:
npm run electron:build   

-Credenciales para iniciar sesión:
        ADMIN:   nombre: "a" CONTRAEÑA: "a"
        USUARIO: nombre: "e" CONTRAEÑA: "e"

 https://www.fffuel.co/dddepth/
        


