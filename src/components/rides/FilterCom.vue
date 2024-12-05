<template>
  <div class="filter-container">
    <h2>Filtry</h2>
    <!-- Pole wyszukiwania -->
    <div class="filter-group">
      <label for="search">Wyszukaj:</label>
      <input
        id="search"
        type="text"
        v-model="filters.search"
        placeholder="Wpisz frazę"
      />
    </div>

    <!-- Filtr daty -->
    <div class="filter-group">
      <label for="date">Data:</label>
      <input id="date" type="date" v-model="filters.date" />
    </div>

    <!-- Filtr miejsc -->
    <div class="filter-group">
      <label for="seats">Liczba miejsc:</label>
      <input
        id="seats"
        type="number"
        v-model="filters.seats"
        min="0"
        placeholder="Wybierz ilość miejsc"
      />
    </div>
    <button @click="applyFilters" class="filter-btn">Filtruj</button>
  </div>
</template>

<script>
export default {
  name: "FilterCom",
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
    applyFilters() {
      this.$emit("filter-changed", { ...this.filters });
    },
  },
};
</script>

<style scoped>
.filter-container {
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-left: 300px;
  margin-top: 30px;
  margin-right: 1px;
  font-family: Arial, Helvetica, sans-serif;
}

.filter-group {
  margin-bottom: 15px;
}

.filter-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #05445e;
}

.filter-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.filter-btn {
  width: 100%;
  padding: 0.8rem;
  background-color: #05445e;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.filter-btn:hover {
  background-color: #006b7f;
  transform: translateY(-3px);
}
</style>
