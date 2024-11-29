<template>
  <div id="HomePage">
    <router-link to="add-ride">Dodaj przejazd</router-link>
    <RideList />
  </div>
</template>

<script>
//import FilterCom from '../main/FilterCom.vue';
//import AlertPage from "@/components/common/AlertPage.vue";
import RideList from "../rides/RideList.vue";

export default {
  name: "HomePage",

  components: {
    //FilterCom
    //AlertPage,
    RideList,
  },
};
</script>

<style scoped></style>
