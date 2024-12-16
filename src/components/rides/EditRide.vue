<template>
  <div class="add-ride-page">
    <form @submit.prevent="updateRide">
      <AlertPage2
        v-if="showAlert"
        :message="'Przejazd został pomyślnie zaktualizowany! <br/> 👍'"
        @close="handleAlertClose"
      />
      <div class="card">
        <!-- Sekcja Liczba wolnych miejsc oraz Data -->
        <div class="short-center">
          <div class="form-group short">
            <button type="submit" class="submit-btn">Zapisz zmiany</button>
            <div class="form-group">
              <label for="seats">Liczba wolnych miejsc:</label>
              <input
                type="number"
                v-model="seats"
                placeholder="Podaj liczbę wolnych miejsc"
                required
                @input="validateMaxSeats"
              />
            </div>
            <div class="form-group">
              <label for="dateTime">Data i godzina przejazdu:</label>
              <input type="datetime-local" v-model="dateTime" required />
            </div>
          </div>
        </div>

        <!-- Sekcja miejscowości wyjazdu i dojazdu oraz mapy -->
        <div class="form-group double-column">
          <div class="form-group">
            <label for="departure">Miejscowość wyjazdu:</label>
            <input
              type="text"
              v-model="departure"
              placeholder="Wpisz miejscowość wyjazdu"
              required
            />
          </div>
          <div class="form-group">
            <label for="destination">Miejscowość dojazdu:</label>
            <input
              type="text"
              v-model="destination"
              placeholder="Wpisz miejscowość dojazdu"
              required
            />
          </div>
        </div>

        <!-- Dokładny adres wyjazdu i dojazdu oraz mapy -->
        <div class="form-group double-column">
          <div class="form-group">
            <label for="exactDepartureAddress">Dokładny adres wyjazdu:</label>
            <input
              type="text"
              id="departureAddressInput"
              v-model="exactDepartureAddress"
              @input="updateMap('departure')"
              placeholder="Wpisz dokładny adres wyjazdu"
              required
            />
            <div id="map-departure" class="map"></div>
          </div>
          <div class="form-group">
            <label for="exactDestinationAddress">Dokładny adres dojazdu:</label>
            <input
              type="text"
              id="destinationAddressInput"
              v-model="exactDestinationAddress"
              @input="updateMap('destination')"
              placeholder="Wpisz dokładny adres dojazdu"
              required
            />
            <div id="map-destination" class="map"></div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, onMounted, watch } from "vue";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebaseConfig";
import AlertPage2 from "@/components/common/AlertPage2.vue";

/* global google */

export default {
  name: "EditRide",
  components: { AlertPage2 },
  props: {
    rideId: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const departure = ref("");
    const destination = ref("");
    const exactDepartureAddress = ref("");
    const exactDestinationAddress = ref("");
    const exactDeparture = ref({ lat: null, lng: null });
    const exactDestination = ref({ lat: null, lng: null });
    const seats = ref(1);
    const dateTime = ref("");
    const showAlert = ref(false);
    let departureMap, destinationMap, departureMarker, destinationMarker;

    const validateMaxSeats = () => {
      if (seats.value > 8) seats.value = 8;
      if (seats.value < 1) seats.value = 1;
    };

    const initMap = (type, address) => {
      const mapElementId =
        type === "departure" ? "map-departure" : "map-destination";
      const defaultPosition = { lat: 52.2297, lng: 21.0122 }; // Warszawa jako fallback
      const geocoder = new google.maps.Geocoder();

      // Tworzenie mapy
      const map = new google.maps.Map(document.getElementById(mapElementId), {
        center: defaultPosition,
        zoom: 13,
      });

      const marker = new google.maps.Marker({
        map: map,
        draggable: true,
      });

      // Ustaw marker na podany adres
      if (address) {
        geocoder.geocode({ address: address }, (results, status) => {
          if (status === "OK" && results[0]) {
            const location = results[0].geometry.location;
            map.setCenter(location);
            marker.setPosition(location);
            if (type === "departure") {
              exactDeparture.value = {
                lat: location.lat(),
                lng: location.lng(),
              };
            } else {
              exactDestination.value = {
                lat: location.lat(),
                lng: location.lng(),
              };
            }
          }
        });
      } else {
        // Ustaw domyślne położenie
        map.setCenter(defaultPosition);
        marker.setPosition(defaultPosition);
      }

      // Przechwytywanie zdarzenia `dragend`
      google.maps.event.addListener(marker, "dragend", () => {
        const position = marker.getPosition();
        geocoder.geocode({ location: position }, (results, status) => {
          if (status === "OK" && results[0]) {
            if (type === "departure") {
              exactDepartureAddress.value = results[0].formatted_address;
              exactDeparture.value = {
                lat: position.lat(),
                lng: position.lng(),
              };
            } else {
              exactDestinationAddress.value = results[0].formatted_address;
              exactDestination.value = {
                lat: position.lat(),
                lng: position.lng(),
              };
            }
          }
        });
      });

      if (type === "departure") {
        departureMap = map;
        departureMarker = marker;
      } else {
        destinationMap = map;
        destinationMarker = marker;
      }
    };

    const updateMap = (type) => {
      const address =
        type === "departure"
          ? exactDepartureAddress.value
          : exactDestinationAddress.value;
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          const location = results[0].geometry.location;
          const map = type === "departure" ? departureMap : destinationMap;
          const marker =
            type === "departure" ? departureMarker : destinationMarker;

          map.setCenter(location);
          marker.setPosition(location);
        }
      });
    };

    watch(exactDepartureAddress, (newAddress) => {
      if (newAddress) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: newAddress }, (results, status) => {
          if (status === "OK" && results[0]) {
            const city = results[0].address_components.find((component) =>
              component.types.includes("locality")
            )?.long_name;
            if (city) departure.value = city;
          }
        });
      }
    });

    watch(exactDestinationAddress, (newAddress) => {
      if (newAddress) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: newAddress }, (results, status) => {
          if (status === "OK" && results[0]) {
            const city = results[0].address_components.find((component) =>
              component.types.includes("locality")
            )?.long_name;
            if (city) destination.value = city;
          }
        });
      }
    });

    const fetchRideData = async () => {
      try {
        const rideDoc = await getDoc(doc(db, "rides", props.rideId));
        if (rideDoc.exists()) {
          const data = rideDoc.data();
          seats.value = data.seats;
          dateTime.value = data.dateTime;
          departure.value = data.departure;
          destination.value = data.destination;
          exactDepartureAddress.value = data.exactDepartureAddress;
          exactDestinationAddress.value = data.exactDestinationAddress;
          initMap("departure", data.exactDepartureAddress);
          initMap("destination", data.exactDestinationAddress);
        }
      } catch (err) {
        console.error("Nie udało się pobrać danych przejazdu:", err);
      }
    };

    const updateRide = async () => {
      try {
        await updateDoc(doc(db, "rides", props.rideId), {
          seats: seats.value,
          dateTime: dateTime.value,
          departure: departure.value,
          destination: destination.value,
          exactDepartureAddress: exactDepartureAddress.value,
          exactDestinationAddress: exactDestinationAddress.value,
        });
        showAlert.value = true;
        setTimeout(() => {
          showAlert.value = false;
          emit("close");
        }, 2500);
      } catch (err) {
        console.error("Błąd podczas aktualizacji przejazdu:", err);
      }
    };

    const handleAlertClose = () => {
      showAlert.value = false;
      emit("close");
    };

    onMounted(() => {
      fetchRideData();
    });

    return {
      departure,
      destination,
      exactDepartureAddress,
      exactDestinationAddress,
      seats,
      dateTime,
      updateRide,
      updateMap,
      handleAlertClose,
      validateMaxSeats,
      showAlert,
    };
  },
};
</script>

<style scoped>
.short-center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.add-ride-page {
  display: center;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  min-height: 53.3em;
  padding: 2rem;
}

h1 {
  text-align: center;
  color: white;
  font-size: 2.5rem;
  margin-bottom: 2rem;
}

.form-group {
  margin-bottom: 0px;
  width: 100%;
  padding: 0;
}

label {
  display: block;
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: white;
}

.form-group.short {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  margin-bottom: 30px;
  width: 16%;
}

input[type="text"],
input[type="number"],
input[type="datetime-local"] {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
  box-sizing: border-box;
  margin-top: 5px;
}

.map {
  height: 400px; /* Ustaw wysokość mapy */
  width: 100%; /* Mapa powinna zajmować pełną szerokość kontenera */

  border: 1px solid #ccc;
  border-radius: 5px;
  min-height: 400px; /* Minimalna wysokość mapy */
}

button {
  background-color: #189ab4;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  width: 100%;
  margin-top: 10px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

button:hover {
  background-color: #00b3b8;
  transform: translateY(-3px);
}

.form-group.double-column {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 250px;
  width: 100%;
}

.map-container {
  display: flex;
  flex-wrap: wrap; /* Obsługuje zmniejszenie rozmiaru węższych ekranów */
  justify-content: space-between; /* Rozdziela mapy i pola */
  gap: 20px; /* Mały odstęp między sekcjami */
  width: 100%;
}

.map-section {
  flex: 1; /* Mapy zajmują równą przestrzeń */
  min-width: 400px; /* Zapobiega zbyt małemu wyświetlaniu map */
  max-width: 48%; /* Zapewnia elastyczność */
}

.map-section label {
  font-size: 1rem;
  font-weight: bold;
  color: white;
  margin-bottom: 5px;
  display: block;
}

.map-section input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.map {
  height: 400px;
  width: 100%;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.submit-btn {
  background-color: #189ab4;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 1rem;
  font-size: 1.1rem;
  width: 110%;
  cursor: pointer;
  display: flex;
  margin-bottom: 20px;
  justify-content: center;
  align-items: center;

  transition: background-color 0.3s ease, transform 0.2s ease;
}

.submit-btn:hover {
  background-color: #00b3b8;
  transform: translateY(-3px);
}

form {
  margin: 0;
  padding: 0;
}

.section {
  margin: 0;
  padding: 0;
}
</style>
