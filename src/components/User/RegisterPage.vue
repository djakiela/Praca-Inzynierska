<template>
  <div class="register-page">
    <div class="r-card">
      <h1>Rejestracja</h1>
      <form @submit.prevent="registerWithEmail">
        <div>
          <label for="username">Nazwa użytkownika:</label>
          <input type="text" v-model="username" required />
        </div>
        <div>
          <label for="email">Email:</label>
          <input type="email" v-model="email" required />
        </div>
        <div>
          <label for="password">Hasło:</label>
          <input type="password" v-model="password" required />
        </div>
        <div class="terms-checkbox">
          <input type="checkbox" v-model="termsAccepted" required />
          <label for="terms"
            >Akceptuję
            <router-link to="/terms" class="link">regulamin</router-link></label
          >
        </div>
        <button type="submit" class="register-btn">Zarejestruj</button>
      </form>
      <button @click="registerWithGoogle" class="google-btn">
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
  </div>
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
      termsAccepted: false,
      errorMessage: "",
      showAlert: false,
      alertMessage: "",
    };
  },
  methods: {
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
          this.password
        );
        const user = userCredential.user;
        await setDoc(doc(db, "users", user.uid), {
          username: this.username,
          email: this.email,
        });
        await setDoc(doc(db, "roles", user.uid), {
          role: "user", // or "admin" based on the user role
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
          username: user.displayName,
          email: user.email,
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
.register-page {
  align-content: center;
  display: center;
  justify-content: center;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  height: 53.3em;
}

.r-card {
  background-color: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 320px;
  height: 500px;
  margin: 0 auto;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.r-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.register-page h1 {
  text-align: center;
  color: #333;
}
.register-page form div {
  margin-bottom: 10px;
  text-align: left;
}
.register-page form label {
  display: block;
  margin-bottom: 5px;
}
.register-page form input[type="email"],
.register-page form input[type="password"],
.register-page form input[type="text"] {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
}
.terms-checkbox {
  display: flex;
  align-items: center;
}
.terms-checkbox input[type="checkbox"] {
  margin-right: 5px;
  margin-bottom: 7px;
  width: 20px;
  height: 15px;
}
.terms-checkbox label {
  margin-bottom: 0;
}

.register-btn {
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

.register-btn:hover {
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

.login-link {
  color: #54626f;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.links {
  color: #54626f;
}

.link {
  color: black;
}

.error {
  color: red;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
