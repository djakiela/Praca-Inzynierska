<template>
  <body>
    <main>
      <section class="logo-section">
        <div clas="logo">
          <img src="/public/logo.png" alt="Logo" />
          <span class="logo"><b>GetRidehub</b></span>
        </div>
        <nav class="nav-links">
          <router-link to="/?scrollTo=HomePage"> Strona Główna </router-link>
          <router-link to="/?scrollTo=rides-list">Lista przejazdów</router-link>
        </nav>
      </section>
      <section class="user-section">
        <router-link
          v-if="isLogged && isAdmin"
          to="/admin-dashboard"
          class="router"
        >
          Panel Administratora
        </router-link>

        <div
          v-if="isLogged"
          @mouseenter="showUserDropdown"
          @mouseleave="hideUserDropdown"
          class="drop"
        >
          <span>Panel Użytkownika</span>
          <div v-show="isUserDropdownActive" class="drop-box">
            <router-link to="/add-ride">Dodaj przejazd</router-link>
            <router-link to="/my-reservation">Moje rezerwacje</router-link>
            <router-link to="/my-rides">Moje przejazdy</router-link>
          </div>
        </div>

        <div
          @mouseenter="showProfileDropdown"
          @mouseleave="hideProfileDropdown"
          class="drop"
        >
          <router-link to="/login"> <i class="fas fa-user"></i></router-link>
          <div
            v-if="isLogged"
            v-show="isProfileDropdownActive"
            class="drop-box fas-box"
          >
            <router-link to="/edit-profile">Edytuj Profil</router-link>
            <a @click="logout">Wyloguj</a>
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
    const isLogged = ref(false);
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
      isLogged.value = false;
      isAdmin.value = false;
      router.push("/login");
    };

    onMounted(() => {
      const auth = getAuth();
      const db = getFirestore();
      auth.onAuthStateChanged(async (user) => {
        if (user) {
          isLogged.value = true;
          const docRef = doc(db, "roles", user.uid);
          const docSnap = await getDoc(docRef);

          isAdmin.value = docSnap.exists() && docSnap.data().role === "admin";
        } else {
          isLogged.value = false;
          isAdmin.value = false;
        }
      });
    });

    return {
      isUserDropdownActive,
      isProfileDropdownActive,
      isLogged,
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
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
}

main {
  position: fixed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  top: 0;
  width: 100%;
  z-index: 100% box-shadow 0 2px 5px rgba(0, 0, 0, 0.1);
  background-color: #f8f9fa;
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  display: inline-block;
  align-items: center;
  margin-right: 18px;
  font-size: 1.5rem;
  font-weight: bold;
  vertical-align: super;
}

.logo img {
  width: 45px;
  height: 45px;
  vertical-align: middle;
}

.logo b {
  margin-left: 4px;
}

.nav-links {
  display: flex;
  gap: 15px;
}

.nav-links a {
  text-decoration: none;
  color: #000;
  font-size: 1.2rem;
}

.user-section {
  display: flex;
  gap: 20px;
  margin-right: 20px;
  vertical-align: middle;
}

.user-section i {
  display: block;
  font-size: 1.5rem;
  color: #000;
  margin-right: 30px;
}

.drop {
  position: relative;
}

.drop-box {
  position: absolute;
  top: 100%;
  right: 0;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.drop-box a {
  text-decoration: none;
  color: #333;
  font-size: 1rem;
}

.router {
  text-decoration: none;
  font-size: 1rem;
  color: #000;
}
</style>
