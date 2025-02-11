<script setup>
import HeaderPage from "./components/common/HeaderPage.vue";
</script>

<template>
  <body>
    <HeaderPage />
    <router-view class="theme" />
  </body>
  <footer>
    <span class="text"
      >Zapoznaj się z naszym
      <router-link to="/terms" class="link">Regulaminem</router-link>
    </span>
    <div class="logo">
      <img src="/public/logo.svg" alt="Logo" class="logo-img" />
      <p>&copy; 2025 GetRidehub. Wszystkie prawa zastrzeżone.</p>
    </div>
  </footer>
</template>

<style>
body {
  font-family: Arial, Helvetica, sans-serif;
  margin: 0;
  padding: 0;
}
footer {
  background-color: #333;
  color: white;
  text-align: center;
  align-items: center !important;
  padding: 10px 0;
  display: flex;
  justify-content: space-between;
}

.theme {
  background-image: url("theme.jpg");
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
}

.link {
  color: white;
  text-decoration: underline;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  margin-right: 10px;
}

.logo-img {
  filter: invert(1);
  width: 30px;
  height: 30px;
}

.logo-text {
  font-size: 1.2rem;
  color: white;
}

.text {
  align-items: center;
  margin-left: 10px;
}
</style>
