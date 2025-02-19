<template>
  <body class="fpass-page">
    <main class="fpass-card">
      <h1>Przypomnienie Hasła</h1>
      <form @submit.prevent="sendPasswordReset">
        <div>
          <label for="email">Email:</label>
          <input type="email" v-model="email" required />
        </div>
        <button type="submit" class="btn-passchange">
          Wyślij link do zmiany hasła
        </button>
        <button @click="goBack" class="btn-link">Powrót do logowania</button>
      </form>
      <p v-if="message" class="message">{{ message }}</p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <AlertPage
        v-if="showAlert"
        :message="alertMessage"
        @close="handleAlertClose"
      />
    </main>
  </body>
</template>

<script>
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import AlertPage from "@/components/common/AlertPage.vue";

export default {
  name: "ForgotPasswordPage",
  components: { AlertPage },
  data() {
    return {
      email: "",
      message: "",
      errorMessage: "",
      showAlert: false,
      alertMessage: "",
    };
  },
  methods: {
    async sendPasswordReset() {
      const auth = getAuth();
      auth.languageCode = "pl";
      try {
        await sendPasswordResetEmail(auth, this.email);
        this.alertMessage =
          "Link do zmiany hasła został wysłany na podany adres e-mail.";
        this.showAlert = true;
      } catch (error) {
        this.errorMessage = "Błąd podczas wysyłania e-maila: " + error.message;
        this.message = "";
      }
    },
    goBack() {
      this.$router.push("/login");
    },
    handleAlertClose() {
      this.showAlert = false;
      this.$router.push("/login");
    },
  },
};
</script>

<style scoped>
.fpass-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #222;
  font-family: Arial, Helvetica, sans-serif;
}

.fpass-card {
  background: rgba(34, 34, 34, 0.9);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  text-align: center;
  width: 340px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.fpass-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.25);
}

.fpass-card h1 {
  color: #ffb300;
  text-shadow: 0px 0px 8px rgba(255, 179, 0, 0.8);
  font-size: 1.5rem;
}

form div {
  margin-bottom: 12px;
}

form label {
  display: block;
  margin-bottom: 5px;
  text-align: left;
  color: #ddd;
  font-weight: bold;
}

form input {
  width: 100%;
  padding: 10px;
  border: 1px solid #666;
  background-color: #333;
  color: white;
  border-radius: 5px;
  box-sizing: border-box;
}

form input:focus {
  border-color: #ffb300;
  outline: none;
  box-shadow: 0 0 5px rgba(255, 179, 0, 0.7);
}

.btn-passchange {
  width: 100%;
  padding: 12px;
  background-color: #ffb300;
  color: black;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  margin-top: 1rem;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
}

.btn-passchange:hover {
  background-color: #ffbb40;
  transform: translateY(-3px);
}

.btn-passchange:active {
  background-color: #de9b00;
  transform: scale(0.95);
}

.btn-link {
  width: 100%;
  padding: 12px;
  background-color: #444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn-link:hover {
  background-color: #666;
  transform: translateY(-3px);
}

.btn-link:active {
  background-color: #555;
}

.message {
  color: #ffbb40;
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
}

.error {
  color: red;
  text-align: center;
  margin-top: 10px;
  font-weight: bold;
}
</style>
