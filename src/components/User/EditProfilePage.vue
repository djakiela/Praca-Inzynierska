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
        <img
          v-else
          src="/avatar.png"
          alt="Default Avatar"
          class="avatar-circle"
        />
        <input type="file" @change="onFileChange" class="file-input" />
        <button @click="updateAvatar" class="update-btn">Zmień avatar</button>
        <button
          v-if="avatarUrl !== '/avatar.png'"
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
import { getAuth, updatePassword } from "firebase/auth";
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
          where("username", "==", this.username)
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

        // Logowanie zalogowanego użytkownika
        const auth = getAuth();
        console.log(
          "Zalogowany użytkownik:",
          auth.currentUser?.uid || "Brak zalogowanego użytkownika"
        );

        this.usernameError = "";
        this.usernameAvailable = true;
        return true;
      } catch (error) {
        console.error(
          "Błąd podczas sprawdzania dostępności nazwy użytkownika:",
          error.message
        );
        this.usernameError =
          "Błąd podczas sprawdzania dostępności nazwy użytkownika.";
        this.usernameAvailable = false;
        return false;
      }
    },

    // Aktualizacja profilu użytkownika
    async updateProfile() {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();
      const storage = getStorage();

      const isUsernameAvailable = await this.checkUsernameAvailability();
      if (!isUsernameAvailable) {
        this.errorMessage =
          "Proszę rozwiązać wszystkie błędy przed aktualizacją profilu.";
        return;
      }

      try {
        // Aktualizacja hasła (jeśli wprowadzono nowe)
        if (this.newPassword) {
          await updatePassword(user, this.newPassword);
        }

        // Aktualizacja avatara (jeśli przesłano nowy plik)
        if (this.avatar) {
          const storageRef = ref(storage, `avatars/${user.uid}`);
          await uploadBytes(storageRef, this.avatar);
          const avatarUrl = await getDownloadURL(storageRef);
          this.avatarUrl = avatarUrl;
        }

        // Aktualizacja danych użytkownika w Firestore
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          username: this.username,
          ...(this.avatarUrl && { avatarUrl: this.avatarUrl }),
        });

        this.successMessage = "Profil zaktualizowany pomyślnie!";
        setTimeout(() => {
          this.successMessage = "";
        }, 5000); // Komunikat znika po 5 sekundach
      } catch (error) {
        console.error("Błąd podczas aktualizacji profilu:", error.message);
        this.errorMessage =
          "Błąd podczas aktualizacji profilu: " + error.message;
      }
    },

    // Usuwanie avatara
    async removeAvatar() {
      const auth = getAuth();
      const user = auth.currentUser;
      const db = getFirestore();
      const storage = getStorage();

      try {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await deleteObject(storageRef);

        this.avatarUrl = "/avatar.png";
        const userDocRef = doc(db, "users", user.uid);
        await updateDoc(userDocRef, {
          avatarUrl: this.avatarUrl,
        });

        this.successMessage = "Avatar usunięty pomyślnie!";
        setTimeout(() => {
          this.successMessage = "";
        }, 5000);
      } catch (error) {
        console.error("Błąd podczas usuwania avatara:", error.message);
        this.errorMessage = "Błąd podczas usuwania avatara: " + error.message;
      }
    },
  },

  // Pobieranie danych użytkownika podczas ładowania komponentu
  async mounted() {
    const auth = getAuth();
    const user = auth.currentUser;
    const db = getFirestore();

    if (user) {
      this.email = user.email;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.username = userData.username || "";
        this.avatarUrl = userData.avatarUrl || "/avatar.png";
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
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
  transition: background-color 0.3s ease, transform 0.2s ease;
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
