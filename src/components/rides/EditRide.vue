<template>
  <div class="edit-ride-page">
    <form @submit.prevent="updateRide">
      <AlertPage
        v-if="showAlert"
        :message="'Przejazd został pomyślnie zaktualizowany!'"
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
                v-model="ride.seats"
                placeholder="Podaj liczbę wolnych miejsc"
                required
                @input="validateMaxSeats"
              />
            </div>
            <div class="form-group">
              <label for="dateTime">Data i godzina przejazdu:</label>
              <input type="datetime-local" v-model="ride.dateTime" required />
            </div>
          </div>
        </div>

        <!-- Sekcja miejscowości wyjazdu i dojazdu oraz mapy -->
        <div class="form-group double-column">
          <div class="form-group">
            <label for="departure">Miejscowość wyjazdu:</label>
            <input
              type="text"
              v-model="ride.departure"
              placeholder="Wpisz miejscowość wyjazdu"
              required
            />
          </div>
          <div class="form-group">
            <label for="destination">Miejscowość dojazdu:</label>
            <input
              type="text"
              v-model="ride.destination"
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
              v-model="ride.exactDepartureAddress"
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
              v-model="ride.exactDestinationAddress"
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
import { ref, onMounted } from "vue";
import { db } from "@/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import AlertPage from "@/components/common/AlertPage.vue";

/* global google */

export default {
  name: "EditRide",
  components: { AlertPage },
  props: {
    rideId: {
      type: String,
      required: true,
    },
  },
  setup(props, { emit }) {
    const ride = ref({
      seats: 1,
      dateTime: "",
      departure: "",
      destination: "",
      exactDepartureAddress: "",
      exactDestinationAddress: "",
    });
    const showAlert = ref(false);
    let departureMap, destinationMap, departureMarker, destinationMarker;

    const validateMaxSeats = () => {
      if (ride.value.seats > 8) ride.value.seats = 8;
      if (ride.value.seats < 1) ride.value.seats = 1;
    };

    const initMap = (type) => {
      const mapElementId = type === "departure" ? "map-departure" : "map-destination";
      const mapOptions = { center: { lat: 52.2297, lng: 21.0122 }, zoom: 13 };
      const map = new google.maps.Map(document.getElementById(mapElementId), mapOptions);
      const marker = new google.maps.Marker({ position: mapOptions.center, map, draggable: true });

      if (type === "departure") {
        departureMap = map;
        departureMarker = marker;
      } else {
        destinationMap = map;
        destinationMarker = marker;
      }

      google.maps.event.addListener(marker, "dragend", () => {
        const position = marker.getPosition();
        if (type === "departure") {
          ride.value.exactDepartureAddress = `${position.lat()}, ${position.lng()}`;
        } else {
          ride.value.exactDestinationAddress = `${position.lat()}, ${position.lng()}`;
        }
      });
    };

    const updateMap = (type) => {
      const address =
        type === "departure" ? ride.value.exactDepartureAddress : ride.value.exactDestinationAddress;
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK") {
          const location = results[0].geometry.location;
          const map = type === "departure" ? departureMap : destinationMap;
          const marker = type === "departure" ? departureMarker : destinationMarker;

          map.setCenter(location);
          marker.setPosition(location);
        }
      });
    };

    const fetchRideData = async () => {
      try {
        const rideDoc = await getDoc(doc(db, "rides", props.rideId));
        if (rideDoc.exists()) {
          ride.value = rideDoc.data();
        }
      } catch (err) {
        console.error("Nie udało się pobrać danych przejazdu:", err);
      }
    };

    const updateRide = async () => {
      try {
        await updateDoc(doc(db, "rides", props.rideId), ride.value);
        showAlert.value = true;
        setTimeout(() => {
          showAlert.value = false;
          emit("close");
        }, 3000);
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
      ride,
      showAlert,
      validateMaxSeats,
      updateMap,
      updateRide,
      handleAlertClose,
    };
  },
};
</script>

<style scoped>
.edit-ride-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: Arial, Helvetica, sans-serif;
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  min-height: 100vh;
  padding: 2rem;
}
.card {
  width: 100%;
  max-width: 800px;
  background-color: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
}
h1 {
  text-align: center;
  color: #333;
}
.form-group {
  margin-bottom: 20px;
}
label {
  display: block;
  margin-bottom: 5px;
  color: #333;
}
input {
  width: 100%;
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}
button {
  background-color: #189ab4;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
button:hover {
  background-color: #00b3b8;
}
.map {
  height: 400px;
  width: 100%;
  margin-top: 10px;
  border-radius: 5px;
  border: 1px solid #ccc;
}
</style>
