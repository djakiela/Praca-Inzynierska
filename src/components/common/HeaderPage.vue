<template>
  <header class="header">
    <div class="header-bar">
      <router-link to="/" class="bar-item bar-title">
        Strona Główna
      </router-link>
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

      <router-link to="/" class="bar-item link">Lista przejazdów</router-link>

      <!-- DropDown Icona -->
      <div
        class="bar-item user-icon"
        @mouseenter="showProfileDropdown"
        @mouseleave="hideProfileDropdown"
      >
        <i class="fas fa-user"></i>
        <div class="dropdown-menu" v-show="isProfileDropdownActive">
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
      router.push("/");
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

.dropdown {
  position: relative;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  left: auto;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
  width: calc(110% + 1px);
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

.fas.fa-user {
  font-size: 22px;
}
</style>
