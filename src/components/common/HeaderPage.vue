<template>
  <body>
    <main>
      <section class="logo-section">
        <div class="logo">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="30"
            height="30"
            viewBox="0 0 24 24"
          >
            <path
              d="M7 13.5c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5zm9 1c0-.276-.224-.5-.5-.5h-7c-.276 0-.5.224-.5.5s.224.5.5.5h7c.276 0 .5-.224.5-.5zm4-1c0-.828-.672-1.5-1.5-1.5s-1.5.672-1.5 1.5.672 1.5 1.5 1.5 1.5-.672 1.5-1.5zm-17.298-6.5h-2.202c-.276 0-.5.224-.5.5v.511c0 .793.926.989 1.616.989l1.086-2zm19.318 3.168c-.761-1.413-1.699-3.17-2.684-4.812-.786-1.312-1.37-1.938-2.751-2.187-1.395-.25-2.681-.347-4.585-.347s-3.19.097-4.585.347c-1.381.248-1.965.875-2.751 2.187-.981 1.637-1.913 3.382-2.684 4.812-.687 1.273-.98 2.412-.98 3.806 0 1.318.42 2.415 1 3.817v2.209c0 .552.448 1 1 1h1.5c.552 0 1-.448 1-1v-1h13v1c0 .552.448 1 1 1h1.5c.552 0 1-.448 1-1v-2.209c.58-1.403 1-2.499 1-3.817 0-1.394-.293-2.533-.98-3.806zm-15.641-3.784c.67-1.117.852-1.149 1.39-1.246 1.268-.227 2.455-.316 4.231-.316s2.963.088 4.231.316c.538.097.72.129 1.39 1.246.408.681.81 1.388 1.195 2.081-1.456.22-4.02.535-6.816.535-3.048 0-5.517-.336-6.805-.555.382-.686.779-1.386 1.184-2.061zm11.595 10.616h-11.948c-1.671 0-3.026-1.354-3.026-3.026 0-1.641.506-2.421 1.184-3.678 1.041.205 3.967.704 7.816.704 3.481 0 6.561-.455 7.834-.672.664 1.231 1.166 2.01 1.166 3.646 0 1.672-1.355 3.026-3.026 3.026zm5.526-10c.276 0 .5.224.5.5v.511c0 .793-.926.989-1.616.989l-1.086-2h2.202z"
            />
          </svg>
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
            <router-link to="/add-ride" @click="scrollToTop"
              >Dodaj przejazd</router-link
            >
            <router-link to="/my-reservation" @click="scrollToTop"
              >Moje rezerwacje</router-link
            >
            <router-link to="/my-rides" @click="scrollToTop"
              >Moje przejazdy</router-link
            >
          </div>
        </div>
        <div
          @mouseenter="showProfileDropdown"
          @mouseleave="hideProfileDropdown"
          class="drop"
        >
          <div class="profile-button">
            <i class="fas fa-user"></i>
          </div>
          <div v-show="isProfileDropdownActive" class="drop-box">
            <template v-if="isLogged">
              <router-link to="/edit-profile">Edytuj Profil</router-link>
              <a @click="logout">Wyloguj</a>
            </template>
            <template v-else>
              <router-link to="/login">Logowanie</router-link>
              <router-link to="/register">Rejestracja</router-link>
            </template>
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

  methods: {
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
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
  background: rgba(51, 51, 51, 0.9);
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
  background: rgba(51, 51, 51, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
}

.logo-section {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  margin-right: 7px;
  font-size: 1.5rem;
  font-weight: bold;
  vertical-align: super;
  color: #ffb300;
  text-shadow: 0px 0px 8px rgba(255, 179, 0, 0.8);
}

svg {
  fill: #ffb300;
  filter: drop-shadow(0px 0px 5px rgba(255, 179, 0, 0.8));
}

.nav-links {
  display: flex;
  gap: 15px;
}

.nav-links a {
  text-decoration: none;
  color: white;
  font-size: 1.2rem;
}

.user-section {
  display: flex;
  gap: 20px;
  margin-right: 20px;
  vertical-align: middle;
  color: white;
  align-items: flex-end;
}

.user-section i {
  display: block;
  font-size: 1.5rem;
  color: white;
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
  border-radius: 10px;
  background: rgba(51, 51, 51, 0.9);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.drop-box a {
  text-decoration: none;
  color: white;
  font-size: 1rem;
  padding: 8px 12px;
  transition:
    background-color 0.3s ease,
    box-shadow 0.3s ease;
}

.drop-box a:hover {
  background-color: rgba(255, 179, 0, 0.8);
  color: black;
  border-radius: 5px;
  box-shadow: 0px 0px 10px rgba(255, 179, 0, 0.8);
}

.router {
  text-decoration: none;
  font-size: 1rem;
  color: white;
}
</style>
www.w3.org
