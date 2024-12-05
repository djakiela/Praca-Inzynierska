<template>
  <div id="HomePage" class="page">
    <div class="pageg">
      <div class="container">
        <!-- Filtr -->
        <FilterCom @filter-changed="updateFilters" />

        <!-- Lista przejazdów -->
        <div class="list">
          <RideList :filters="filters" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FilterCom from "@/components/rides/FilterCom.vue";
import RideList from "@/components/rides/RideList.vue";

export default {
  name: "HomePage",
  components: {
    FilterCom,
    RideList,
  },
  data() {
    return {
      filters: {
        search: "",
        date: "",
        seats: "",
      },
    };
  },
  methods: {
    updateFilters(newFilters) {
      this.filters = newFilters;
    },
  },
};
</script>

<style scoped>
.pageg {
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
}
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.container {
  display: flex;
  align-items: flex-start;
}
</style>
