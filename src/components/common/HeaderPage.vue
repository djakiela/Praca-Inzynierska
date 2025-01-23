<template>
  <body>
    <main>
      <section class="logo">
        <img src="/public/logo.png" alt="Logo" />
        <span class="logo-span"><b>GetRidehub</b></span>
      </section>
      <section>
        <router-link to="/" class="bar-item bar-title">
          Strona Główna
        </router-link>
        <router-link to="/?scrollTo=rides-list" class="bar-item bar-title"
          >Lista przejazdów</router-link
        >
      </section>
      <section>
        <router-link
          v-if="isLoggedIn && isAdmin"
          to="/admin-dashboard"
          class="bar-item"
        >
          Panel Administratora
        </router-link>

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
      </section>
    </main>
  </body>
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
body {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: Arial, Helvetica, sans-serif;
}

main {
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 100% box-shadow 0 2px 5px rgba(0, 0, 0, 0.1);
  background-color: #f8f9fa;
}

.logo span {
  font-size: 1.5rem;
  margin-right: 15px;
}

.logo img {
  width: 30px;
  height: 30px;
  margin-left: 15px;
}

.logo {
  align-items: center;
}
</style>
