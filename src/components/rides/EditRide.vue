<template>
  <body class="temp-container">
    <div @submit.prevent="updateRide" class="container">
      <AlertPage2
        v-if="showAlert"
        :message="'Przejazd został pomyślnie zaktualizowany! <br/> 👍'"
        @close="handleAlertClose"
      />
      <form>
        <div class="up-content">
          <button type="submit" class="submit-btn">Zapisz zmiany</button>
          <section>
            <label for="seats">Liczba wolnych miejsc:</label>
            <input
              type="number"
              v-model="seats"
              placeholder="Podaj liczbę wolnych miejsc"
              required
              @input="validateMaxSeats"
            />
          </section>
          <section>
            <label for="dateTime">Data i godzina przejazdu:</label>
            <input type="datetime-local" v-model="dateTime" required />
          </section>
        </div>

        <div class="content db-column">
          <!-- Kolumna dla WYJAZDU -->
          <div class="column">
            <section>
              <label for="departure">Miejsce wyjazdu:</label>
              <input
                class="city"
                type="text"
                v-model="departure"
                placeholder="Podaj miejsce wyjazdu"
              />
            </section>
            <section>
              <label for="exactDepartureAddress">Dokładny adres wyjazdu:</label>
              <input
                class="city"
                type="text"
                id="departureAddressInput"
                v-model="exactDepartureAddress"
                @input="updateMap('departure')"
                placeholder="Wpisz dokładny adres wyjazdu lub zaznacz na mapie"
                required
              />
              <button
                type="button"
                @click="toggleMap('departure')"
                class="map-button"
              >
                Mapa
              </button>
              <div class="map-wrapper">
                <div
                  id="map-departure"
                  class="map-container"
                  :class="{ active: showDepartureMap }"
                >
                  <div class="map"></div>
                </div>
              </div>
            </section>
          </div>

          <!-- Kolumna dla DOCELOWEGO -->
          <div class="column">
            <section>
              <label for="destination">Miejsce docelowe:</label>
              <input
                type="text"
                v-model="destination"
                placeholder="Podaj miejsce docelowe"
              />
            </section>
            <section>
              <label for="exactDestinationAddress"
                >Dokładny adres dojazdu:</label
              >
              <input
                type="text"
                id="destinationAddressInput"
                v-model="exactDestinationAddress"
                @input="updateMap('destination')"
                placeholder="Wpisz dokładny adres dojazdu lub zaznacz na mapie"
                required
              />
              <button
                type="button"
                @click="toggleMap('destination')"
                class="map-button"
              >
                Mapa
              </button>
              <div class="map-wrapper">
                <div
                  id="map-destination"
                  class="map-container"
                  :class="{ active: showDestinationMap }"
                >
                  <div class="map"></div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </form>
    </div>
  </body>
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
    const showDepartureMap = ref(false);
    const showDestinationMap = ref(false);
    let departureMap, destinationMap, departureMarker, destinationMarker;

    const toggleMap = (type) => {
      if (type === "departure") {
        showDepartureMap.value = !showDepartureMap.value;
        if (showDepartureMap.value) {
          updateMap("departure");
        }
      } else {
        showDestinationMap.value = !showDestinationMap.value;
        if (showDestinationMap.value) {
          updateMap("destination");
        }
      }

      const mapElement = document.getElementById(
        type === "departure" ? "map-departure" : "map-destination",
      );
      if (mapElement) {
        mapElement.classList.toggle(
          "show",
          showDepartureMap.value || showDestinationMap.value,
        );
      }
    };

    const validateMaxSeats = () => {
      if (seats.value > 8) seats.value = 8;
      if (seats.value < 1) seats.value = 1;
    };

    const initMap = (type, address) => {
      const mapElementId =
        type === "departure" ? "map-departure" : "map-destination";
      const defaultPosition = { lat: 52.2297, lng: 21.0122 };
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

      // Obsługa przesunięcia markera (drag & drop)
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

      // Obsługa kliknięcia na mapie - użytkownik może wybrać lokalizację klikając
      google.maps.event.addListener(map, "click", (event) => {
        const clickedLocation = event.latLng;
        marker.setPosition(clickedLocation);

        geocoder.geocode({ location: clickedLocation }, (results, status) => {
          if (status === "OK" && results[0]) {
            const addressComponents = results[0].address_components;
            const city = addressComponents.find((component) =>
              component.types.includes("locality"),
            )?.long_name;

            if (type === "departure") {
              exactDepartureAddress.value = results[0].formatted_address;
              exactDeparture.value = {
                lat: clickedLocation.lat(),
                lng: clickedLocation.lng(),
              };
              if (!departure.value) {
                departure.value = city || "";
              }
            } else {
              exactDestinationAddress.value = results[0].formatted_address;
              exactDestination.value = {
                lat: clickedLocation.lat(),
                lng: clickedLocation.lng(),
              };
              if (!destination.value) {
                destination.value = city || "";
              }
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
              component.types.includes("locality"),
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
              component.types.includes("locality"),
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
      initMap("departure");
      initMap("destination");
    });

    return {
      updateRide,
      updateMap,
      handleAlertClose,
      validateMaxSeats,
      toggleMap,
      departure,
      destination,
      exactDepartureAddress,
      exactDestinationAddress,
      seats,
      dateTime,
      showDepartureMap,
      showDestinationMap,
      showAlert,
    };
  },
};
</script>

<style scoped>
body {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  font-family: Arial, Helvetica, sans-serif;
  padding: 0;
  width: 100%;
}

button {
  width: 200px;
  max-width: 400px;
  padding: 12px;
}

input[type="text"],
input[type="number"],
input[type="datetime-local"] {
  max-width: 400px;
  padding: 12px;
  background: #2b2b2b;
  border: 1px solid #444;
  border-radius: 8px;
  font-size: 1rem;
  color: white;
  outline: none;
  transition: border-color 0.2s ease;
}

input:focus {
  border-color: #ffb300;
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  background-color: #2b2b2b !important;
  -webkit-box-shadow: 0 0 0px 1000px #2b2b2b inset !important;
  -webkit-text-fill-color: white !important;
}

input#departureAddressInput,
input#destinationAddressInput {
  width: 120%;
  max-width: 500px;
}

label {
  display: block;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 10px 0px 10px;
  color: white;
}

button {
  background-color: #ffb300;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 1.2rem;
  font-size: 1.2rem;
  width: 100%;
  max-width: 200px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
}

button:hover {
  background-color: #ffbb40;
  transform: translateY(-3px);
}

section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

form {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1100px;
  padding: 2rem;
  border-radius: 10px;
}

.content.db-column {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 40px;
  width: 100%;
}

.up-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 20px;
}

.column {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.temp-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  width: 100%;
  padding-top: 20px;
}

.container {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: visible;
}

.content {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 60px;
  width: 100%;
  position: relative;
}

.map-wrapper {
  position: relative;
  width: 100%;
  max-width: 500px;
  height: 400px;
}

.map-container {
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 500px;
  height: 400px;
  z-index: 10;
  background: white;
  border-radius: 10px;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.2);
  display: none;
}

.map-container.active {
  display: block;
}

.map {
  width: 100%;
  height: 100%;
  border-radius: 10px;
}

.map-button {
  width: 100px;
  margin-top: 10px;
  padding: 15px 15px;
}
</style>
