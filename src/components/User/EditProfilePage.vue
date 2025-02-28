<template>
  <div class="edit-profile-page">
    <!-- Alert do wpisania aktualnego hasła -->
    <AlertPage3
      v-if="showAlert"
      :message="alertMessage"
      :showInput="true"
      @close="handleAlertClose"
    />

    <div class="profile-card">
      <h1>Edytuj Profil</h1>

      <!-- Sekcja Avatara -->
      <section class="avatar-container">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt="Avatar"
          class="avatar-circle"
        />
        <input type="file" @change="onFileChange" class="file-input" />
        <div class="avatar-buttons">
          <button @click="updateAvatar" class="update-avatar-btn">
            Zmień avatar
          </button>
          <button
            v-if="avatarUrl !== defaultAvatarUrl"
            @click="removeAvatar"
            class="remove-avatar-btn"
          >
            Usuń avatar
          </button>
        </div>
      </section>

      <!-- Sekcja Nazwy Użytkownika -->
      <form @submit.prevent="updateUsername" class="profile-form">
        <div class="inputs">
          <label for="username">Nazwa użytkownika:</label>
          <input
            type="text"
            v-model="username"
            @input="checkUsernameAvailability"
            required
          />
        </div>
        <div v-if="usernameError" class="error">{{ usernameError }}</div>
        <button type="submit" class="update-btn">
          Zmień nazwę użytkownika
        </button>
      </form>

      <!-- 🆕 Sekcja Numeru Telefonu -->
      <form @submit.prevent="updatePhoneNumber" class="profile-form">
        <div class="inputs">
          <label for="phoneNumber">Numer telefonu:</label>
          <input
            type="text"
            v-model="phonenumber"
            maxlength="9"
            @input="validatePhoneNumber"
            placeholder="Wpisz numer telefonu"
          />
        </div>
        <button type="submit" class="update-btn">Zmień numer telefonu</button>
      </form>

      <!-- Sekcja Hasła -->
      <form @submit.prevent="requestPasswordChange" class="profile-form">
        <div class="inputs">
          <label for="newPassword">Nowe Hasło:</label>
          <input
            type="password"
            v-model="newPassword"
            placeholder="Wpisz nowe hasło"
          />
        </div>
        <button type="submit" class="update-btn">Zmień hasło</button>
      </form>

      <!-- Komunikaty -->
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="success">{{ successMessage }}</p>
    </div>
  </div>
</template>

<script>
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  updateDoc,
  getDoc,
  query,
  collection,
  where,
  getDocs,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import AlertPage3 from "@/components/common/AlertPage3.vue";

export default {
  name: "EditProfilePage",
  components: {
    AlertPage3,
  },
  data() {
    return {
      email: "",
      username: "",
      phonenumber: "",
      newPassword: "",
      avatar: null,
      avatarUrl: "",
      defaultAvatarUrl: "/avatar.png",
      errorMessage: "",
      successMessage: "",
      usernameError: "",
      usernameAvailable: false,
      showAlert: false,
      alertMessage: "",
      pendingPasswordChange: false,
      currentPassword: "",
    };
  },
  methods: {
    // Obsługa przesyłania pliku avatara
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.avatar = file;
        this.avatarUrl = URL.createObjectURL(file);
        console.log("Wybrano plik:", file.name);
      }
    },

    // Sprawdzanie dostępności nazwy użytkownika
    async checkUsernameAvailability() {
      const db = getFirestore();
      if (this.username.trim() === "") {
        this.usernameError = "Nazwa użytkownika nie może być pusta.";
        this.usernameAvailable = false;
        return false;
      }

      try {
        const usernameQuery = query(
          collection(db, "users"),
          where("username", "==", this.username),
        );
        const usernameQuerySnapshot = await getDocs(usernameQuery);

        if (!usernameQuerySnapshot.empty) {
          const foundUserId = usernameQuerySnapshot.docs[0].id;
          const currentUserUid = getAuth().currentUser.uid;

          if (foundUserId !== currentUserUid) {
            this.usernameError = "Nazwa użytkownika jest już zajęta.";
            this.usernameAvailable = false;
            return false;
          }
        }

        console.log("Nazwa użytkownika dostępna:", this.username);
        this.usernameError = "";
        this.usernameAvailable = true;
        return true;
      } catch (error) {
        console.error("Błąd przy sprawdzaniu dostępności nazwy:", error);
        this.usernameError =
          "Błąd podczas sprawdzania dostępności nazwy użytkownika.";
        this.usernameAvailable = false;
        return false;
      }
    },

    // Aktualizacja nazwy użytkownika
    async updateUsername() {
      console.log("🟢 Rozpoczęto zmianę nazwy użytkownika...");

      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();

      if (!user) {
        this.errorMessage =
          "Musisz być zalogowany, aby zmienić nazwę użytkownika.";
        console.error("🔴 Błąd: Brak zalogowanego użytkownika!");
        return;
      }

      if (this.username.trim() === "") {
        this.errorMessage = "Nazwa użytkownika nie może być pusta.";
        console.error("🔴 Błąd: Nazwa użytkownika jest pusta!");
        return;
      }

      console.log("🟢 Sprawdzanie dostępności nazwy:", this.username);
      const usernameAvailable = await this.checkUsernameAvailability();
      if (!usernameAvailable) {
        console.warn("🟡 Nazwa użytkownika jest już zajęta!");
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { username: this.username });

        console.log("✅ Nazwa użytkownika zaktualizowana:", this.username);
        this.successMessage = "Nazwa użytkownika została zmieniona!";
      } catch (error) {
        console.error("❌ Błąd zmiany nazwy użytkownika:", error);
        this.errorMessage =
          "Błąd podczas zmiany nazwy użytkownika: " + error.message;
      }
    },
    // Aktualizacja avatara
    async updateAvatar() {
      console.log("🟢 Rozpoczęto aktualizację avatara...");

      const auth = getAuth();
      const user = auth.currentUser;
      const storage = getStorage();
      const db = getFirestore();

      if (!user) {
        this.errorMessage = "Musisz być zalogowany, aby zmienić avatar.";
        console.error("🔴 Błąd: Brak zalogowanego użytkownika!");
        return;
      }

      if (!this.avatar) {
        this.errorMessage = "Nie wybrano pliku.";
        console.error("🔴 Błąd: Brak wybranego pliku!");
        return;
      }

      try {
        console.log("🟢 Przesyłanie pliku do Firebase Storage...");
        const storageRef = ref(storage, `imgu/${user.uid}.jpg`);
        await uploadBytes(storageRef, this.avatar);

        console.log("🟢 Pobieranie linku do avatara...");
        const avatarUrl = await getDownloadURL(storageRef);

        console.log("🟢 Aktualizacja Firestore...");
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { avatarUrl: avatarUrl });

        console.log("✅ Avatar został zapisany:", avatarUrl);
        this.avatarUrl = avatarUrl;
        this.successMessage = "Avatar zaktualizowany pomyślnie!";
      } catch (error) {
        console.error("❌ Błąd podczas zapisu avatara:", error);
        this.errorMessage = "Błąd podczas zapisu avatara: " + error.message;
      }
    },

    // Usuwanie avatara
    async removeAvatar() {
      console.log("🟢 Rozpoczęto usuwanie avatara...");

      const auth = getAuth();
      const user = auth.currentUser;
      const storage = getStorage();
      const db = getFirestore();

      if (!user) {
        this.errorMessage = "Musisz być zalogowany, aby usunąć avatar.";
        console.error("🔴 Błąd: Brak zalogowanego użytkownika!");
        return;
      }

      try {
        console.log("🟢 Usuwanie pliku z Firebase Storage...");
        const storageRef = ref(storage, `imgu/${user.uid}.jpg`);
        await deleteObject(storageRef);

        console.log("🟢 Resetowanie avatara na domyślny...");
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { avatarUrl: this.defaultAvatarUrl });

        this.avatarUrl = this.defaultAvatarUrl;
        console.log("✅ Avatar został usunięty!");
        this.successMessage = "Avatar usunięty pomyślnie!";
      } catch (error) {
        console.error("❌ Błąd podczas usuwania avatara:", error);
        this.errorMessage = "Błąd podczas usuwania avatara: " + error.message;
      }
    },

    // Zmiana hasła
    requestPasswordChange() {
      if (!this.newPassword || this.newPassword.length < 6) {
        this.errorMessage = "Nowe hasło musi mieć co najmniej 6 znaków.";
        return;
      }

      this.alertMessage = "🔐 Wpisz aktualne hasło:";
      this.showAlert = true;
    },

    async handleAlertClose(password) {
      if (!password) {
        this.errorMessage = "Zmiana hasła anulowana.";
        this.showAlert = false;
        return;
      }

      this.currentPassword = password;
      this.showAlert = false;
      await this.updatePassword();
    },

    async updatePassword() {
      console.log("🟢 Rozpoczęto zmianę hasła...");

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        this.errorMessage = "Musisz być zalogowany, aby zmienić hasło.";
        return;
      }

      try {
        console.log("🔄 Ponowne uwierzytelnianie...");
        const credential = EmailAuthProvider.credential(
          user.email,
          this.currentPassword,
        );
        await reauthenticateWithCredential(user, credential);

        console.log("🟢 Uwierzytelnienie powiodło się. Aktualizacja hasła...");
        await updatePassword(user, this.newPassword);

        console.log("✅ Hasło zostało zmienione!");
        this.successMessage = "Hasło zmienione pomyślnie!";
      } catch (error) {
        if (error.code === "auth/wrong-password") {
          this.errorMessage = "Błędne stare hasło. Spróbuj ponownie.";
        } else if (error.code === "auth/requires-recent-login") {
          this.errorMessage = "Zaloguj się ponownie, aby zmienić hasło.";
        } else {
          this.errorMessage = "Błąd podczas zmiany hasła: " + error.message;
        }
      }
    },

    validatePhoneNumber() {
      if (!this.phonenumber) {
        this.phonenumber = "";
      }
      this.phonenumber = this.phonenumber.replace(/\D/g, "").slice(0, 9);
      console.log("Aktualny numer w inpucie:", this.phonenumber);
    },

    // Aktualizacja numeru telefonu
    async updatePhoneNumber() {
      console.log("🟢 Rozpoczęto zmianę numeru telefonu...");

      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();

      if (!user) {
        this.errorMessage =
          "Musisz być zalogowany, aby zmienić numer telefonu.";
        console.error("🔴 Błąd: Brak zalogowanego użytkownika!");
        return;
      }

      if (this.phonenumber.trim() === "" || this.phonenumber.length !== 9) {
        this.errorMessage = "Numer telefonu musi składać się z 9 cyfr.";
        console.error("🔴 Błąd: Niepoprawny numer telefonu!");
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, { phonenumber: this.phonenumber });

        console.log("✅ Numer telefonu zaktualizowany:", this.phonenumber);
        this.successMessage = "Numer telefonu został zmieniony!";
      } catch (error) {
        console.error("❌ Błąd zmiany numeru telefonu:", error);
        this.errorMessage = "Błąd podczas zmiany numeru: " + error.message;
      }
    },
  },

  async mounted() {
    const auth = getAuth();
    const db = getFirestore();

    if (auth.currentUser) {
      this.email = auth.currentUser.email;
      console.log("Zalogowany użytkownik:", auth.currentUser.uid);

      const userDocRef = doc(db, "users", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.username = userData.username || "";
        this.avatarUrl = userData.avatarUrl || this.defaultAvatarUrl;
        this.phonenumber = userData.phonenumber || "";

        console.log("Dane użytkownika załadowane:", userData);
      }
    }
  },
};
</script>

<style scoped>
.edit-profile-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  font-family: Arial, Helvetica, sans-serif;
}

.profile-card {
  background: rgba(34, 34, 34, 0.95);
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  text-align: center;
  width: 360px;
  color: white;
}

.profile-card:hover {
  box-shadow: 0 0 15px rgba(255, 179, 0, 0.5);
}

.avatar-container {
  margin-bottom: 20px;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 0 12px rgba(255, 179, 0, 0.6);
}

.file-input {
  display: block;
  margin: 10px auto;
  padding-left: 50px;
}

.update-btn {
  padding: 0.8rem;
  background-color: #ffb300;
  color: black;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
}

.update-btn:hover {
  background-color: #ffbb40;
  transform: translateY(-3px);
}

.remove-avatar-btn {
  background-color: #e74c3c;
  color: white;
  font-size: 0.9rem;
  border: none;
  border-radius: 8px;
  padding: 0.8rem;
  cursor: pointer;
}

.remove-avatar-btn:hover {
  background-color: #c0392b;
}

.inputs {
  margin-bottom: 1rem;
  text-align: center;
}

.inputs label {
  font-weight: 500;
  color: #ddd;
  margin-bottom: 0.4rem;
  display: block;
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

/* Usunięcie błędu z autofill */
.inputs input:-webkit-autofill,
.inputs input:-webkit-autofill:hover,
.inputs input:-webkit-autofill:focus,
.inputs input:-webkit-autofill:active {
  background-color: #2b2b2b !important;
  -webkit-box-shadow: 0 0 0px 1000px #2b2b2b inset !important;
  -webkit-text-fill-color: white !important;
}

/* Żółte obramowanie jak w logowaniu */
.inputs input:focus {
  border-color: #ffb300;
}

.small-input {
  width: 70%;
  padding: 0.3rem;
  font-size: 0.85rem;
}

.error {
  color: red;
  font-size: 0.9rem;
}

.success {
  color: green;
  font-size: 0.9rem;
}

label {
  margin-top: 15px;
}

.avatar-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.update-avatar-btn {
  background-color: #ffb300;
  color: black;
  border: none;
  border-radius: 8px;
  padding: 0.8rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.update-avatar-btn:hover {
  background-color: #ffbb40;
}
</style>
