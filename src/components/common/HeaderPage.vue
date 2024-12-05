<template>
  <header class="header">
    <div class="header-bar">
      <router-link to="/" class="bar-item bar-title">
        Strona Główna
      </router-link>
    </div>
    <div class="header-end">
      <router-link
        v-if="isLoggedIn && isAdmin"
        to="/admin-dashboard"
        class="bar-item link"
      >
        Panel Administratora
      </router-link>
      <router-link to="/" class="bar-item link">Lista przejazdów</router-link>
      <router-link v-if="isLoggedIn" to="/add-ride" class="bar-item link"
        >Dodaj przejazd</router-link
      >
      <router-link v-if="isLoggedIn" to="/my-reservation" class="bar-item link"
        >Moje rezerwacje</router-link
      >
      <router-link v-if="isLoggedIn" to="/my-rides" class="bar-item link"
        >Moje przejazdy</router-link
      >
      <div
        class="bar-item user-icon"
        @mouseenter="showDropdown"
        @mouseleave="hideDropdown"
      >
        <router-link v-if="!isLoggedIn" to="/login"
          ><a class="login-link">
            <i class="fas fa-user"></i>
          </a>
        </router-link>
        <button v-else class="icon-button">
          <i class="fas fa-user"></i>
          <div class="navbar-dropdown is-right" v-show="isDropdownActive">
            <div class="buttons">
              <router-link
                v-if="isLoggedIn"
                to="/edit-profile"
                class="bar-item"
              >
                Edytuj Profil
              </router-link>
              <a v-if="isLoggedIn" class="bar-item" @click="logout">
                Wyloguj
              </a>
            </div>
          </div>
        </button>
      </div>
    </div>
  </header>
</template>

<script>
import { getAuth, signOut } from "firebase/auth";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getFirestore, doc, getDoc } from "firebase/firestore";

export default {
  name: "HeaderPage",
  setup() {
    const isDropdownActive = ref(false);
    const isLoggedIn = ref(false);
    const isAdmin = ref(false);
    const router = useRouter();

    const showDropdown = () => {
      isDropdownActive.value = true;
    };

    const hideDropdown = () => {
      isDropdownActive.value = false;
    };

    const logout = async () => {
      const auth = getAuth();
      await signOut(auth);
      isLoggedIn.value = false;
      isAdmin.value = false;
      router.push("/");
    };

    onMounted(() => {
      const auth = getAuth();
      const db = getFirestore();
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          isLoggedIn.value = true;
          // Pobieranie roli użytkownika z Firestore
          const docRef = doc(db, "roles", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists() && docSnap.data().role === "admin") {
            isAdmin.value = true;
          } else {
            isAdmin.value = false;
          }
        } else {
          isLoggedIn.value = false;
          isAdmin.value = false;
        }
      });
    });

    return {
      isDropdownActive,
      isLoggedIn,
      isAdmin,
      showDropdown,
      hideDropdown,
      logout,
    };
  },
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: white;
  font-family: Arial, Helvetica, sans-serif;
}

.header-bar {
  display: flex;
  align-items: center;
}

.bar-item {
  margin-right: 1rem;
  color: black;
  text-decoration: none;
}

.bar-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: black;
}

.header-end {
  display: flex;
  align-items: center;
}

.user-icon {
  position: relative;
}

.login-link {
  cursor: pointer;
  color: black;
}

.navbar-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  display: none;
}

.navbar-dropdown.is-right {
  right: 0;
}

.bar-item {
  padding: 0.5rem 1rem;
  white-space: nowrap;
  color: black;
}

.user-icon:hover .navbar-dropdown {
  display: block;
}

.navbar-dropdown .bar-item:hover {
  color: black;
  font-weight: bold;
}

.link {
  margin-right: 1rem;
  color: black;
  font-weight: bold;
}

.buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  text-align: center;
  width: 5%;
  padding: auto;
}

.fas.fa-user {
  font-size: 22px;
}
</style>
