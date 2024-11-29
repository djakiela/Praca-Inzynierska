<template>
  <div class="l-page">
    <div class="l-card">
      <h1>Logowanie</h1>
      <form @submit.prevent="login" class="l-form">
        <div class="inputs">
          <label for="email">Email:</label>
          <input type="email" v-model="email" required />
        </div>
        <div class="inputs">
          <label for="password">Hasło:</label>
          <input type="password" v-model="password" required />
        </div>
        <button type="submit" class="login-btn">Zaloguj</button>
      </form>
      <button @click="logingoogle" class="google-btn">
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
  </div>
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
body {
  margin: 0;
}

.l-page {
  align-content: center;
  display: center;
  justify-content: center;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  height: 53.3em;
}

.l-card {
  background-color: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 320px;
  height: 450px;
  margin: 0 auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.l-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.l-card h1 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 2rem;
  font-weight: 600;
}

.l-form {
  display: flex;
  flex-direction: column;
}

.inputs {
  margin-bottom: 1.2rem;
  text-align: left;
}

.inputs label {
  font-weight: 500;
  margin-bottom: 0.4rem;
  display: block;
  color: #54626f;
}

.inputs input {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.inputs input:focus {
  border-color: #3b444b;
}

.login-btn {
  width: 100%;
  padding: 0.8rem;
  background-color: #189ab4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 1rem;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.login-btn:hover {
  background-color: #00b3b8;
  transform: translateY(-3px);
}

.google-btn {
  width: 100%;
  padding: 0.8rem;
  background-color: #05445e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.google-btn:hover {
  background-color: #006b7f;
  transform: translateY(-3px);
}

.forgot-password-link {
  color: #54626f;
  display: block;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.forgot-password-link:hover {
  text-decoration: underline;
}

.register-link {
  color: #54626f;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.register {
  color: #54626f;
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
