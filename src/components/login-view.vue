
<template>
  <div class="mainarea">
    <h1>{{ msg }}</h1>
    <!--<img id="image"  src="../assets/transport1.png">-->
    <h3>CarMeet Club</h3>
    <p >
      Bienvenido a la CarMeet Club, escriba su nombre de usuario y contraseña o cree una
      cuenta nueva:
    </p>
    <p id="notifications">{{ notification }}</p>
    <input v-model="username" type="text" placeholder="Nombre o correo..." />
<input v-model="password" type="password" placeholder="Contraseña..." />
    <button @click="login">Iniciar sesión</button>
    <button @click="newUser">Crear cuenta</button>
    <!--
    <h3>Installed CLI Plugins</h3>
    <ul>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-babel" target="_blank" rel="noopener">babel</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint" target="_blank" rel="noopener">eslint</a></li>
    </ul>-->
  </div>
</template>

<script>
import { loginSchema } from "../schemas/loginSchema";
export default {
  name: "login-view",
  props: {
    msg: String,
  },
  data() {
    return {
      username: "",
      password: "",
      notification: ""
    };
  },
methods: {
  async login() {
//ZOD PARA VALIDACIÓN
    const result = loginSchema.safeParse({
      username: this.username,
      password: this.password
    });

    if (!result.success) {
      this.notification = result.error.issues[0].message;
      return;
    }
//ZOD SUCCESS
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result.data)
      });

      if (!res.ok) {
        const error = await res.json();
        this.notification = error.error || "Error, compruebe sus datos";
        return;
      }

      const response = await res.json();
      const user = response.user;

      // Guardar datos en localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('isLoggedIn', 'true');

      // Limpiar campos
      this.username = "";
      this.password = "";
      this.notification = "";

      this.$emit("login", user);

    } catch (error) {
      //ZOD ERROR
      console.error(error);
      this.notification = 'Error conectando con servidor';
    }
  },

  newUser() {
    this.$emit("newUser");
  }
},
};
</script>


<style scoped>
.app-container{height: 100vh;
}
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden; 
}

.mainarea {
  overflow: hidden;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  row-gap: 0.8rem;
  width: 80vw;
  max-width: 40rem;
  height: calc(80vh);

  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.12),
    rgba(255,255,255,0.05)
  );
  background-color: #00000005;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 3px solid rgba(175, 175, 175, 0.2);
  border-radius: 3rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  
  align-items: center;
  justify-content: center;
  color: rgb(255, 255, 255);
  padding: 2rem;
  -webkit-app-region: no-drag;
}
.glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);

  border-radius: 1rem;
  color: white;
}
#image{width: 9rem; 
  height: 9rem; 
  object-fit: contain;
    margin-top: -3rem;
  margin-bottom: -3rem;
}
#notifications{
color:rgb(255, 0, 0);
 margin-top: -0.5rem; 
  margin-bottom: -0.02rem;
padding: 0;
}

h3{  font-family: "Inter", sans-serif;
  color:rgb(255, 255, 255);
font-size: 1.7rem;}
input {
  font-family: "Inter", sans-serif;
  width: 80%;
  max-width: 300px;
  height: 2.8rem;
  padding: 0 1rem;

  outline: none;
  transition: all 0.25s ease;

  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  color: white;
}
input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

input:focus {
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.15);
}
button {
  font-family: "Inter", sans-serif;
  width: 80%;
  max-width: 300px;
  padding: 0.9rem;

  cursor: pointer;
  transition: all 0.25s ease;

  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  color: white;

  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

button:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

p{width: 80%;
 text-align: center;}
a {
  color: #ffffff;
}
@media (max-width: 700px) {
  .mainarea {
    width: 90%;
    margin-top: -5rem;
    
  }}
</style>
