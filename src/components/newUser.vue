<template>
  <div class="mainarea">
    <!--<h1>{{ msg }}</h1>
    <img id="image"  src="../assets/transport.png">-->
    <h3>CarMeet Club</h3>
    <p >
      Cree su nuevo usuario en CarMeet Club
    </p>
    <p id="notifications">{{ notification }}</p>
    <input v-model="username" type="text" placeholder="Nombre de usuario..." />
    <input v-model="email" type="email" placeholder="Correo electrónico..." />
    <input v-model="password" type="password" placeholder="Contraseña..." />
    <input v-model="confirmpassword" type="password" placeholder="Vuelva a escribir su contraseña" />
    <button @click="createUser">Crear cuenta</button>
    <button @click="$emit('back')">Atrás</button>

    <!--
    <h3>Installed CLI Plugins</h3>
    <ul>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-babel" target="_blank" rel="noopener">babel</a></li>
      <li><a href="https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue/cli-plugin-eslint" target="_blank" rel="noopener">eslint</a></li>
    </ul>-->
  </div>
</template>

<script>
export default {
  name: "new-user-view",
  props: {
    msg: String,
  },
data() {
  return {
    username: "",
    email: "",
    password: "",
    confirmpassword: "",
    notification: ""
  };
},
methods: {
  async createUser() {

  if (this.password !== this.confirmpassword) {
    this.notification = "Las contraseñas no coinciden";
    return;
  }

  if (!this.username || !this.email || !this.password) {
    this.notification = "Rellene todos los campos";
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.email)) {
    this.notification = "Ingrese un correo válido";
    return;
  }

  try {

    const res = await fetch("http://localhost:5000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: this.username,
        email: this.email,
        password: this.password,
        location: {
          city: this.city,
          country: this.country
        }
      })
    });

    if (!res.ok) {
      const error = await res.json();
      this.notification = error.error || "Error creando usuario";
      return;
    }

    this.notification = "Usuario creado correctamente";

    this.username = "";
    this.email = "";
    this.password = "";
    this.confirmpassword = "";
    this.city = "";
    this.country = "";

    // Emit evento para que main.vue sepa que se creó el usuario
    setTimeout(() => {
      this.$emit("userCreated");
    }, 1500);

  } catch (error) {
    console.error(error);
    this.notification = "Error conectando con servidor";
  }
},

  async login() {
    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password
        })
      });


      if (!res.ok) {
        this.notification =  "Error, compruebe sus datos";
        return;
      }

      const user = await res.json();

      console.log('Login correcto', user);

      this.$emit("login", user);

    } catch (error) {
      console.error(error);
      alert('Error conectando con servidor');
    }
  }
},
};
</script>

<style scoped>
.mainarea {
  margin: 1rem;
  overflow: hidden;
  display: flex;
  justify-content: flex-start;
  flex-direction: column;
  row-gap: 0.8rem;
  width: 80vw;
  max-width: 40rem;
  height: calc(80vh);
  max-height: 100vh;

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
  color:red;
 margin-top: -0.5rem; 
  margin-bottom: -0.02rem;
padding: 0;
}

h3{  font-family: "Inter", sans-serif;
  color:rgb(255, 255, 255);
font-size: 1.7rem;}
input {
  font-family: "Inter", sans-serif;
  width: 60%;
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
  width: 45%;
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

p{width: 80%;}
a {
  color: #ffffff;
}
@media (max-width: 700px) {
  .mainarea {
    width: 90%;
    margin-top: -5rem;
    
  }}
</style>
