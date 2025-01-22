<script setup>
import HeaderPage from '@/components/common/HeaderPage.vue';
import RideList from './components/rides/RideList.vue';
</script>

<template>
  <body id="HomePage" >
    <nav>
    <HeaderPage />
    </nav>
  <main>
    <RideList />
  </main>
    </body>
</template>

<style>
body {
  margin: 0;
}
</style>
