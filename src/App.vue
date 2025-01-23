<script setup>
import HeaderPage from "./components/common/HeaderPage.vue";
</script>

<template>
  <body>
    <HeaderPage />
    <router-view class="theme" />
  </body>
  <footer>
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
  padding: 10px 0;
}

.theme {
  background-image: url("theme.jpg");
  background-attachment: fixed;
  background-size: cover;
  background-position: center;
}
</style>
