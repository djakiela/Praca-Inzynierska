<template>
  <div class="filter-container">
    <h2>Filtruj</h2>

    <div class="filter-group">
      <label for="departure">Miejsce wyjazdu:</label>
      <input
        id="departure"
        type="text"
        v-model="filters.departure"
        placeholder="Wpisz miejsce wyjazdu"
      />
    </div>

    <div class="filter-group">
      <label for="destination">Miejsce docelowe:</label>
      <input
        id="destination"
        type="text"
        v-model="filters.destination"
        placeholder="Wpisz miejsce docelowe"
      />
    </div>

    <div class="filter-group">
      <label for="departureDate">Data wyjazdu:</label>
      <input id="departureDate" type="date" v-model="filters.departureDate" />
    </div>

    <button @click="applyFilters" class="filter-btn">Filtruj</button>
    <button @click="resetFilters" class="filter-btn">Resetuj</button>
  </div>
</template>

<script>
export default {
  name: "FilerCom",
  data() {
    return {
      filters: {
        departure: "",
        destination: "",
        departureDate: "",
      },
    };
  },
  methods: {
    applyFilters() {
      this.$emit("filter-changed", { ...this.filters });
    },
    resetFilters() {
      // Resetowanie filtrów
      this.filters = {
        departure: "",
        destination: "",
        departureDate: "",
      };

      // Emit zdarzeń pustych
      this.$emit("filter-changed", { ...this.filters });
    },
  },
};
</script>

<style scoped>
.filter-container {
  background: rgba(51, 51, 51, 0.95);
  padding: 20px;
  padding-right: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-right: 1px;
  font-family: Arial, Helvetica, sans-serif;
  color: white;
  width: 280px;
  height: 450px;
}

h2 {
  text-align: center;
  color: white;
  text-shadow: 0px 0px 10px rgba(0, 0, 0, 0.8);
}

.filter-group {
  margin-bottom: 15px;
}

.filter-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #ffb300;
}

.filter-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #666;
  background-color: #333;
  color: white;
  border-radius: 8px;
  font-size: 1rem;
}

.filter-group input:focus {
  border-color: #ffb300;
  outline: none;
  box-shadow: 0 0 5px rgba(255, 179, 0, 0.7);
}

.filter-btn {
  width: 100%;
  padding: 12px;
  background-color: #ffb300;
  color: black;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin-top: 0.5rem;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
}

.filter-btn:hover {
  background-color: #ffbb40;
  transform: translateY(-3px);
}

.filter-btn:active {
  background-color: #de9b00;
  transform: scale(0.95);
}
</style>
