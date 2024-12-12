<template>
  <div class="page">
    <div class="edit-ride">
      <h1>Edytuj przejazd</h1>
      <div v-if="loading" class="loading">Ładowanie...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <form v-if="ride" @submit.prevent="updateRide">
        <label for="departure">Miejsce wyjazdu:</label>
        <input type="text" id="departure" v-model="ride.departure" required />
        <label for="destination">Miejsce docelowe:</label>
        <input
          type="text"
          id="destination"
          v-model="ride.destination"
          required
        />
        <label for="dateTime">Data i godzina:</label>
        <input
          type="datetime-local"
          id="dateTime"
          v-model="ride.dateTime"
          required
        />
        <label for="seats">Liczba miejsc:</label>
        <input type="number" id="seats" v-model="ride.seats" required />
        <label for="exactDepartureAddress">Dokładny adres wyjazdu:</label>
        <input
          type="text"
          id="exactDepartureAddress"
          v-model="ride.exactDepartureAddress"
          required
        />
        <label for="exactDestinationAddress">Dokładny adres dojazdu:</label>
        <input
          type="text"
          id="exactDestinationAddress"
          v-model="ride.exactDestinationAddress"
          required
        />
        <button type="submit">Zapisz zmiany</button>
      </form>
    </div>
  </div>
</template>

<script></script>
