# vue-electron-app

## Project setup
```
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

-Lanzar app:
node .\serverVueElectron.js
npm run electron:serve   



### Build final de la aplicación:
npm run electron:build   

-Credenciales para iniciar sesión:
        ADMIN:   nombre: "a" CONTRAEÑA: "a"
        USUARIO: nombre: "e" CONTRAEÑA: "e"

-Enunciado:

Crear una plataforma en móvil. ma para gestionar actividades y reservas tanto desde escritorio como en movil
Backend: Mongo (obligatorio) y API en tecnología libre.
frontend: App de escritorio (Electron y Vue JS), App movil (flutter y Material Design)
funcionalidades:
- nombre, desc, fecha y hora, plazas máximas nombre,
- Gestionar actividades y reservas
- Login y registro (identificación de red)
Comprobar asistencia (admin)
Evitar reservas duplicadas.
Roles:
-Admin- Crear, Modificar y Eliminar actividades, Ver reservas y Comprobar asistencia.
Usuario - Iniciar sesión, ver actividades (listado) y cancelar, reservar y comprobar reservas.
No cancela: asiste
Cancela antes de 15min: Cancelación
Cancela en un plazo de 15min: No asistencia
Cosas que suman:
- Validaciones en backend (+1pt)
Cosas que restan:
- No controlar reservas duplicadas (-1pt)
Extras:
Hacer un README.md decente
Funcionamiento y errores.
Dos diagramas de casos de uso

-Estructura:
 login-view - (login) - mainMenu
                        mainMenuAdmin - attendanceActivity
                                        editActivity
                                        newActivity
              newUser

-Estructura mongodb:


BASE DE DATOS MONGODB

    CUENTA: 
                _id: 69912d506caa1971e542031d
                nombreCorreo: "a"
                password "hash de bcrypt"
                admin: true false
                __v: 0
    
    ACTIVIDADES: 
                _id:69910d6fb43329c1d8d9b49f
                nombre: "Coches clasicos"
                descripcion:"Quedada Lago de Castiñeiras"
                duracion: 60
                plazasMaximas: 30
                fecha: 2026-02-22T09:00:00.000+00:00

                usuarios: Array 
                createdAt:2026-02-15T00:03:59.009+00:00
                __v: 4

-Errores encontrados:
        En esta aplicacion me encotnre con multiples errores, el principal fue adaptarme al framework vue y sus sistema de vistas, teniendo problemas cada vez que creaba una 
        vista nueva al tener que enlazar la id como 6 veces entre la ventana actual, App.vue y la ventana nueva, perdiendo mucho tiempo con errores simples al poner la id erronea en algun punto.

        Al principio me encontre con problemas para crear el scrollarea con los elementos, dandone numerosos pantallazos con erroes al no obtener los datos correctamente.

        Queria crear los botones de minimizar y cerrar la ventana dentro de App.vue para que fuese mas limpio e intuitivo, lo que acabo siendo muy complicado de implementar debido a que en App es sencillo,     <button class="defaultbutton" @click="minimizeWindow">_</button> <button class="defaultbutton" @click="closeWindow">X</button> pero en background.js necesite añadir otros elementos al ipcMain que no sabía.
        Otro de mis problemas principales fue que al ir realizando la aplicacion necesite cambiar la estructura de datos de mongo multiples veces al añadir nuevas funciones, como por ejemplo el que me resulto mas compicado, mostrar el estado de el usuario dentro del evento para indicar si esta pendiente, apuntado o fallo en asistir al evento. Otro problema fue derivado de eso, al tener que re estructurar toda la base de datos para ello y para calcular si quedaban 15 min para el evento.

        Otro problema fue al ordenar los elementos, debido a que los obtenia directamente de la base de datos y los mostraba, por lo que necesite reestructurar todo para ello, añadiendolos a un array y ordenandolos para luego insertarlos.

        A la hora de actualizar la informacion de la cantidad de miembros en la quedada, no encontre un metodo adecuado para actualizar solo el numero, por lo que actualizo la ventana entera, lo que genera un parpadeo y no queda bien en tema visual.

        Problemas con el boton de inscribir al principio debido a que no sabia como alternar el tipo de boton con la funcion de inscribir y salir en el mismo, despues me enontre con problemas de nuevo al cambiar la estructura de la base de datos para añadir el estado del usuario, teniendo que reestructurar parte del trabajo. 
        La app indica numerosos errores de rendimiento y en algunos elementos indica que el nivel de complejidad es demasiado alto.

        En conclusión mis problemas principales fueron no estrucutrar correctamente desde un principio, haciendo primero una estructura base en mongo pero al añadir opciones tuve que cambiar gran parte de la app, si estructurase correctamente desde un principio no perdería tanto tiempo en ello teniendo que retroceder a cada paso.
        
-Estilos:
        Cree un css inspirado en el estilo Glass de algunas aplicaciones nuevas, usando el efecto backdrop-filter: blur para los fondos transparentes.
        El fondo de la aplicaicon lo cree en la web https://www.fffuel.co/dddepth/
        


