<script setup>
import HeaderPage from "./components/common/HeaderPage.vue";
</script>

<template>
  <div>
    <HeaderPage />
    <router-view />
  </div>
</template>

<style>
body {
  margin: 0;
}
</style>
