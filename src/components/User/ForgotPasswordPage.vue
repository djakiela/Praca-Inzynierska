<template>
  <div class="fpass-page">
    <div class="fpass-card">
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
    </div>
  </div>
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
  align-content: center;
  display: center;
  justify-content: center;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  height: 53.3em;
}

.fpass-page h1 {
  text-align: center;
  color: #333;
}
.fpass-page form div {
  margin-bottom: 10px;
}
.fpass-page form label {
  display: block;
  margin-bottom: 5px;
  text-align: left;
}
.fpass-page form input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.fpass-card {
  background-color: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 320px;
  height: 350px;
  margin: 0 auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.fpass-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.btn-passchange {
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

.btn-passchange:hover {
  background-color: #00b3b8;
  transform: translateY(-3px);
}

.btn-link {
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

.btn-link:hover {
  background-color: #006b7f;
  transform: translateY(-3px);
}

.message {
  color: green;
  text-align: center;
  margin-top: 10px;
}
.error {
  color: red;
  text-align: center;
  margin-top: 10px;
}
</style>
