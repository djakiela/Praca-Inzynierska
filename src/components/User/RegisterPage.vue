<template>
  <body class="page">
    <div class="content">
      <h1>Rejestracja</h1>
      <form @submit.prevent="registerWithEmail">
        <section>
          <label for="username">Nazwa użytkownika:</label>
          <input type="text" v-model="username" required />
        </section>
        <section>
          <label for="email">Email:</label>
          <input type="email" v-model="email" required />
        </section>
        <section>
          <label for="phonenumber">Numer telefonu:</label>
          <input
            type="phonenumber"
            v-model="phonenumber"
            inputmode="numeric"
            maxlength="9"
            @input="validatePhoneNumber"
            required
          />
        </section>
        <section>
          <label for="password">Hasło:</label>
          <input type="password" v-model="password" required />
        </section>
        <section class="terms-checkbox">
          <input type="checkbox" v-model="termsAccepted" required />
          <label for="terms"
            >Akceptuję
            <router-link to="/terms" class="link">regulamin</router-link></label
          >
        </section>
        <button type="submit" class="r-button">Zarejestruj</button>
      </form>
      <button @click="registerWithGoogle" class="g-button">
        Zarejestruj się przez Google
      </button>
      <p class="login-link">
        Masz konto?
        <router-link to="/login" class="links">Zaloguj się</router-link>
      </p>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <AlertPage
        v-if="showAlert"
        :message="alertMessage"
        @close="handleAlertClose"
      />
    </div>
  </body>
</template>

<script>
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import AlertPage from "@/components/common/AlertPage.vue";

export default {
  name: "RegisterPage",
  components: { AlertPage },
  data() {
    return {
      username: "",
      email: "",
      password: "",
      phonenumber: "",
      termsAccepted: false,
      errorMessage: "",
      showAlert: false,
      alertMessage: "",
    };
  },
  methods: {
    validatePhoneNumber() {
      this.phonenumber = this.phonenumber.replace(/\D/g, "");
    },

    async registerWithEmail() {
      if (!this.termsAccepted) {
        this.errorMessage = "Musisz zaakceptować regulamin.";
        return;
      }
      const auth = getAuth();
      const db = getFirestore();
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          this.email,
          this.password,
        );
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          userId: user.uid,
          username: this.username,
          email: this.email,
          phonenumber: this.phonenumber,
        });
        await setDoc(doc(db, "roles", user.uid), {
          role: "user",
        });

        console.log("User registered:", user);
        this.alertMessage = "Rejestracja zakończona sukcesem!";
        this.showAlert = true;
        this.errorMessage = "";
      } catch (error) {
        this.errorMessage =
          "Błąd podczas rejestracji: " +
          this.translateFirebaseError(error.code);
      }
    },
    async registerWithGoogle() {
      const provider = new GoogleAuthProvider();
      const auth = getAuth();
      const db = getFirestore();
      try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await setDoc(doc(db, "users", user.uid), {
          userId: user.uid,
          username: user.displayName,
          email: user.email,
          phonenumber: "",
        });
        await setDoc(doc(db, "roles", user.uid), {
          role: "user",
        });

        console.log("User registered with Google:", user);
        this.alertMessage = "Rejestracja zakończona sukcesem!";
        this.showAlert = true;
        this.errorMessage = "";
      } catch (error) {
        this.errorMessage =
          "Błąd podczas rejestracji przez Google: " +
          this.translateFirebaseError(error.code);
      }
    },
    handleAlertClose() {
      this.showAlert = false;
      this.$router.push("/");
    },
    translateFirebaseError(code) {
      switch (code) {
        case "auth/email-already-in-use":
          return "Ten email jest już używany.";
        case "auth/invalid-email":
          return "Nieprawidłowy email.";
        case "auth/operation-not-allowed":
          return "Operacja niedozwolona.";
        case "auth/weak-password":
          return "Słabe hasło.";
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

.page form {
  display: flex;
  flex-direction: column;
}

.page form div {
  margin-bottom: 10px;
  text-align: left;
}

.page form label {
  font-weight: bold;
  margin-bottom: 0.4rem;
  display: block;
  color: #ffbb40;
}

.page form input {
  width: 100%;
  padding: 0.6rem;
  background: #2b2b2b !important;
  border: 1px solid #444 !important;
  border-radius: 8px;
  font-size: 1rem;
  color: white !important;
  outline: none;
  transition: border-color 0.2s ease;
  margin-bottom: 10px;
}

.page form input:-webkit-autofill,
.page form input:-webkit-autofill:hover,
.page form input:-webkit-autofill:focus,
.page form input:-webkit-autofill:active {
  background-color: #2b2b2b !important;
  -webkit-box-shadow: 0 0 0px 1000px #2b2b2b inset !important;
  -webkit-text-fill-color: white !important;
}

.page form input:focus {
  border-color: #ffb300 !important;
  background: #333 !important;
}

.terms-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terms-checkbox input[type="checkbox"] {
  margin: 0;
  width: 20px;
  height: 15px;
}

.terms-checkbox label {
  color: #ffbb40;
  margin: 0;
  font-size: 1rem;
  color: #ffbb40;
  display: flex;
  align-items: center;
  margin-top: 6px;
}

.r-button {
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

.r-button:hover {
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

.login-link {
  color: #ffbb40;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.links {
  color: #ffb300;
  font-weight: bold;
}

.link {
  color: #ffb300;
  text-decoration: underline;
}

.error {
  color: red;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
