<template>
  <body>
    <section>
      <router-link to="/"> Strona Główna </router-link>
    </section>
    <section>
      <router-link to=""> Lista Przejazdów </router-link>
    </section>
    <section>
      <router-link v-if="isLogginIn && isAdmin" to="/admin-dashboard">
        Panel Administratora
      </router-link>
    </section>
    <nav
      v-if="isLoggenIn"
      @mouseenter="showUserDropdown"
      @mouseleave="hideUserDropdown"
    >
      <span>Panel Użytkownika</span>
      <section v-show="isUserDropdownActive">
        <router-link to="/add-ride"> Dodaj przejazd </router-link>
        <router-link to="/my-reservation"> Moje rezerwacje </router-link>
        <router-link to="my-rides"> Moje przejazdy </router-link>
      </section>
    </nav>
    <section
      @mouseenter="showProfileDropdown"
      @mouseleave="hideProfileDropdown"
    >
      <router-link to="/login"> </router-link>
      <div v-if="isLoggedIn" v-show="isProfileDropdownActive">
        <router-link to="/edit-profile">Edytuj Profil</router-link>
        <span @click="logout">Wyloguj</span>
      </div>
    </section>
  </body>
</template>
