<template>
  <div id="HomePage" class="page">
    <div class="list"><RideList /></div>
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
<style scoped>
.text1 {
  color: white;
}

.page {
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  align-items: center;
  justify-content: center;
}

.list {
  padding-top: 30px;
  padding-bottom: 30px;
}
</style>
