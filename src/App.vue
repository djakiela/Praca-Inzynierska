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
      <router-link to="/terms" class="link">Regulamin</router-link>
    </span>
    <div class="logo">
      <img src="/public/logo.png" alt="Logo" class="logo-img" />
      <span class="logo-text"><b>GetRidehub</b></span>
    </div>
    <p>&copy; 2025 GetRidehub. Wszystkie prawa zastrzeżone.</p>
  </footer>
</template>

<style>
body {
  margin: 0;
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
  text-decoration: none;
}

.logo {
  display: flex;
  align-items: center;
  gap: 3px;
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
