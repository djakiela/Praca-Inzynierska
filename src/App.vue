<script setup>
import HeaderPage from "./components/common/HeaderPage.vue";
</script>

<template>
  <body>
    <HeaderPage />
    <router-view />
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
</style>
