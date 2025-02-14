<template>
  <div class="edit-profile-page">
    <div class="profile-card">
      <h1>Edytuj Profil</h1>

      <!-- Sekcja Avatara -->
      <div class="avatar-container">
        <img
          v-if="avatarUrl"
          :src="avatarUrl"
          alt="Avatar"
          class="avatar-circle"
        />
        <input type="file" @change="onFileChange" class="file-input" />
        <button @click="updateAvatar" class="update-btn">Zmień avatar</button>
        <button
          v-if="avatarUrl !== defaultAvatarUrl"
          @click="removeAvatar"
          class="remove-avatar-btn"
        >
          Usuń avatar
        </button>
      </div>

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
        <div v-if="usernameAvailable" class="success">
          Nazwa użytkownika jest dostępna.
        </div>
        <button type="submit" class="update-btn">
          Zmień nazwę użytkownika
        </button>
      </form>

      <!-- Sekcja Hasła -->
      <form @submit.prevent="updatePassword" class="profile-form">
        <div class="inputs">
          <label for="newPassword">Nowe Hasło:</label>
          <input type="password" v-model="newPassword" />
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

export default {
  name: "EditProfilePage",
  data() {
    return {
      email: "",
      username: "",
      newPassword: "",
      avatar: null,
      avatarUrl: "",
      defaultAvatarUrl: "/avatar.png",
      errorMessage: "",
      successMessage: "",
      usernameError: "",
      usernameAvailable: false,
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
    async updatePassword() {
      console.log("🟢 Rozpoczęto zmianę hasła...");

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        this.errorMessage = "Musisz być zalogowany, aby zmienić hasło.";
        console.error("🔴 Błąd: Brak zalogowanego użytkownika!");
        return;
      }

      if (this.newPassword.length < 6) {
        this.errorMessage = "Hasło musi mieć co najmniej 6 znaków.";
        console.error("🔴 Błąd: Hasło jest za krótkie!");
        return;
      }

      try {
        console.log("🟢 Pobieranie ostatniego e-maila użytkownika...");
        const credential = EmailAuthProvider.credential(
          user.email,
          prompt("🔐 Wpisz aktualne hasło:"),
        );

        console.log("🔄 Ponowne uwierzytelnianie...");
        await reauthenticateWithCredential(user, credential);

        console.log("🟢 Uwierzytelnienie powiodło się. Aktualizacja hasła...");
        await updatePassword(user, this.newPassword);

        console.log("✅ Hasło zostało zmienione!");
        this.successMessage = "Hasło zmienione pomyślnie!";
      } catch (error) {
        if (error.code === "auth/wrong-password") {
          console.error("❌ Błąd: Wpisano błędne stare hasło!");
          this.errorMessage = "Błędne stare hasło. Spróbuj ponownie.";
        } else if (error.code === "auth/requires-recent-login") {
          console.error("⚠️ Uwierzytelnienie wymagane! Zaloguj się ponownie.");
          this.errorMessage = "Zaloguj się ponownie, aby zmienić hasło.";
        } else {
          console.error("❌ Inny błąd zmiany hasła:", error);
          this.errorMessage = "Błąd podczas zmiany hasła: " + error.message;
        }
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

        console.log("Dane użytkownika załadowane:", userData);
      }
    }
  },
};
</script>

<style scoped>
.edit-profile-page {
  align-content: center;
  display: center;
  justify-content: center;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  height: 100vh;
}

.profile-card {
  background-color: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 320px;
  margin: 0 auto;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.avatar-container {
  text-align: center;
  margin-bottom: 20px;
}

.avatar-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.file-input {
  display: block;
  margin: 10px auto;
}

.update-btn {
  width: 100%;
  padding: 0.8rem;
  background-color: #189ab4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 1rem;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
}

.update-btn:hover {
  background-color: #00b3b8;
  transform: translateY(-3px);
}

.remove-avatar-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.6rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s ease;
}

.remove-avatar-btn:hover {
  background-color: #c0392b;
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

.error {
  color: red;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.success {
  color: green;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>
