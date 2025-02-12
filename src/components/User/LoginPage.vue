<template>
  <body class="page">
    <div class="content">
      <h1>Logowanie</h1>
      <form @submit.prevent="login" class="card">
        <section class="inputs">
          <label for="email">Email:</label>
          <input type="email" v-model="email" required />
        </section>
        <section class="inputs">
          <label for="password">Hasło:</label>
          <input type="password" v-model="password" required />
        </section>
        <button type="submit" class="l-button">Zaloguj</button>
      </form>
      <button @click="logingoogle" class="g-button">
        <i></i> Zaloguj przez Google
      </button>
      <router-link to="/forgot-password" class="forgot-password-link"
        >Przypomnij hasło</router-link
      >
      <p class="register-link">
        Nie masz konta?
        <router-link to="/register" class="register"
          >Zarejestruj się</router-link
        >
      </p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </div>
  </body>
</template>

<script>
import {
  getAuth,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

export default {
  name: "LoginPage",
  data() {
    return {
      email: "",
      password: "",
      errorMessage: "",
    };
  },
  methods: {
    async login() {
      const auth = getAuth();
      try {
        await signInWithEmailAndPassword(auth, this.email, this.password);
        this.$router.push("/");
      } catch (error) {
        this.errorMessage =
          "Błąd podczas logowania: " + this.translateFirebaseError(error.code);
      }
    },
    async logingoogle() {
      const provider = new GoogleAuthProvider();
      const auth = getAuth();
      try {
        await signInWithPopup(auth, provider);
        this.$router.push("/");
      } catch (error) {
        this.errorMessage =
          "Błąd podczas logowania przez Google: " + error.message;
      }
    },
    translateFirebaseError(code) {
      switch (code) {
        case "auth/user-not-found":
          return "Nie znaleziono użytkownika.";
        case "auth/wrong-password":
          return "Nieprawidłowe hasło.";
        case "auth/invalid-email":
          return "Nieprawidłowy email.";
        default:
          return "Wystąpił błąd.";
      }
    },
  },
};
</script>

<style scoped>
.page {
  align-content: center;
  display: flex;
  justify-content: center;
  font-family: Arial, Helvetica, sans-serif;
  height: 100vh;
  display: flex;
  align-items: center;
}

.content {
  background: rgba(51, 51, 51, 0.9);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  text-align: center;
  width: 350px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.content:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}

.content h1 {
  margin-bottom: 1.5rem;
  color: #ffb300;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 0px 0px 8px rgba(255, 179, 0, 0.8);
}

.card {
  display: flex;
  flex-direction: column;
}

.inputs {
  margin-bottom: 1.2rem;
  text-align: left;
}

.inputs label {
  font-weight: bold;
  margin-bottom: 0.4rem;
  display: block;
  color: #ffbb40;
}

.inputs input {
  width: 94%;
  padding: 0.6rem;
  background: #2b2b2b !important;
  border: 1px solid #444;
  border-radius: 8px;
  font-size: 1rem;
  color: white !important;
  outline: none;
  transition: border-color 0.2s ease;
}

.inputs input:-webkit-autofill,
.inputs input:-webkit-autofill:hover,
.inputs input:-webkit-autofill:focus,
.inputs input:-webkit-autofill:active {
  background-color: #2b2b2b !important;
  -webkit-box-shadow: 0 0 0px 1000px #2b2b2b inset !important;
  -webkit-text-fill-color: white !important;
}

.inputs input:focus {
  border-color: #ffb300;
}

.l-button {
  width: 100%;
  padding: 0.8rem;
  background-color: #ffb300;
  color: black;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
}

.l-button:hover {
  background-color: #ffbb40;
  transform: translateY(-3px);
}

.g-button {
  width: 100%;
  padding: 0.8rem;
  background-color: #de9b00;
  color: black;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 0.5rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
}

.g-button:hover {
  background-color: #ffae40;
  transform: translateY(-3px);
}

.forgot-password-link {
  color: #ffbb40;
  display: block;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.forgot-password-link:hover {
  text-decoration: underline;
}

.register-link {
  color: #ffbb40;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.register {
  color: #ffb300;
  font-weight: bold;
}

.error {
  color: red;
  margin-top: 1rem;
  font-size: 0.9rem;
}

body {
  margin: 0;
}
</style>
