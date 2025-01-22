<template>
  <header class="header">
    <div class="header-bar">
      <img src="/public/logo.png" alt="Logo" class="logo" />
      <span class="logo-span"><b>GetRidehub</b></span>
      <router-link to="/" class="bar-item bar-title">
        Strona Główna
      </router-link>
      <router-link to="/?scrollTo=rides-list" class="bar-item bar-title"
        >Lista przejazdów</router-link
      >
    </div>
    <div class="header-end">
      <!-- Panel Administratora -->
      <router-link
        v-if="isLoggedIn && isAdmin"
        to="/admin-dashboard"
        class="bar-item"
      >
        Panel Administratora
      </router-link>

      <!-- Panel Użytkownika Dropdown -->
      <div
        v-if="isLoggedIn"
        class="bar-item dropdown"
        @mouseenter="showUserDropdown"
        @mouseleave="hideUserDropdown"
      >
        <span>Panel Użytkownika</span>
        <div class="dropdown-menu" v-show="isUserDropdownActive">
          <router-link to="/add-ride" class="dropdown-item"
            >Dodaj przejazd</router-link
          >
          <router-link to="/my-reservation" class="dropdown-item"
            >Moje rezerwacje</router-link
          >
          <router-link to="/my-rides" class="dropdown-item"
            >Moje przejazdy</router-link
          >
        </div>
      </div>

      <!-- DropDown Icona -->
      <div
        class="bar-item user-icon"
        @mouseenter="showProfileDropdown"
        @mouseleave="hideProfileDropdown"
      >
        <router-link to="/login"> <i class="fas fa-user"></i></router-link>
        <div
          v-if="isLoggedIn"
          class="dropdown-menu"
          v-show="isProfileDropdownActive"
        >
          <router-link to="/edit-profile" class="dropdown-item"
            >Edytuj Profil</router-link
          >
          <a @click="logout" class="dropdown-item">Wyloguj</a>
        </div>
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
    const isUserDropdownActive = ref(false);
    const isProfileDropdownActive = ref(false);
    const isLoggedIn = ref(false);
    const isAdmin = ref(false);
    const router = useRouter();

    const showUserDropdown = () => {
      isUserDropdownActive.value = true;
    };

    const hideUserDropdown = () => {
      isUserDropdownActive.value = false;
    };

    const showProfileDropdown = () => {
      isProfileDropdownActive.value = true;
    };

    const hideProfileDropdown = () => {
      isProfileDropdownActive.value = false;
    };

    const logout = async () => {
      const auth = getAuth();
      await signOut(auth);
      isLoggedIn.value = false;
      isAdmin.value = false;
      router.push("/login");
    };

    onMounted(() => {
      const auth = getAuth();
      const db = getFirestore();
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          isLoggedIn.value = true;
          const docRef = doc(db, "roles", user.uid);
          const docSnap = await getDoc(docRef);

          isAdmin.value = docSnap.exists() && docSnap.data().role === "admin";
        } else {
          isLoggedIn.value = false;
          isAdmin.value = false;
        }
      });
    });

    return {
      isUserDropdownActive,
      isProfileDropdownActive,
      isLoggedIn,
      isAdmin,
      showUserDropdown,
      hideUserDropdown,
      showProfileDropdown,
      hideProfileDropdown,
      logout,
    };
  },
};
</script>

<style scoped>
.logo-span {
  font-size: 1.5rem;
  margin-right: 15px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: white;
  font-family: Arial, Helvetica, sans-serif;
  position: fixed; /* Sticky header */
  top: 0; /* Przyklejony do górnej krawędzi */
  width: 100%; /* Rozciągnięcie na całą szerokość */
  z-index: 1000; /* Zapewnienie widoczności nad innymi elementami */
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); /* Delikatny cień dla efektu */
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

.user-icon,
.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
  width: calc(112%); /* Zwiększono szerokość o 2px */
}

.dropdown-item {
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: black;
  white-space: nowrap;
}

.dropdown-item:hover {
  font-weight: bold;
}

.user-icon {
  position: relative; /* Kontener dla pozycji absolutnej */
}

.user-icon .dropdown-menu {
  position: absolute;
  top: 100%; /* Wyświetlenie menu tuż pod ikoną */
  left: 50%; /* Punkt odniesienia dla środka ikony */
  transform: translateX(-50%); /* Centrowanie menu względem ikony */
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
  width: 150px; /* Ustawienie szerokości menu */
  z-index: 1000; /* Zapewnienie widoczności nad innymi elementami */
}

.fa-user {
  font-size: 1.3rem;
  color: black;
}

.fa-user:hover {
  color: #189ab4;
}

.logo {
  width: 30px;
  height: 30px;
  margin-left: 1rem;
}
</style>
