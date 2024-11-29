<template>
  <div class="add-ride-page">
    <form @submit.prevent="addRide">
      <AlertPage
        v-if="showAlert"
        :message="alertMessage"
        @close="handleAlertClose"
      />
      <div class="card">
        <!-- Sekcja Liczba wolnych miejsc oraz Data -->
        <div class="short-center">
          <div class="form-group short">
            <!-- Przycisk dodania przejazdu -->
            <button type="submit" class="submit-btn">Dodaj Przejazd</button>
            <div class="form-group">
              <label for="seats">Liczba wolnych miejsc:</label>
              <input
                type="number"
                v-model="seats"
                placeholder="Podaj liczbę wolnych miejsc"
                min="1"
                max="10"
                required
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
          <!-- Miejscowość wyjazdu -->
          <div class="form-group">
            <label for="departure">Miejscowość wyjazdu:</label>
            <input
              type="text"
              v-model="departure"
              placeholder="Wpisz miejscowość wyjazdu"
              required
            />
          </div>

          <!-- Miejscowość dojazdu -->
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
              placeholder="Wpisz dokładny adres wyjazdu lub zaznacz na mapie"
              required
            />
            <button type="button" @click="toggleMap('departure')">
              Pokaż mapę
            </button>
            <div v-show="showDepartureMap" id="map-departure" class="map"></div>
          </div>

          <div class="form-group">
            <label for="exactDestinationAddress">Dokładny adres dojazdu:</label>
            <input
              type="text"
              id="destinationAddressInput"
              v-model="exactDestinationAddress"
              @input="updateMap('destination')"
              placeholder="Wpisz dokładny adres dojazdu lub zaznacz na mapie"
            />
            <button type="button" @click="toggleMap('destination')">
              Pokaż mapę
            </button>
            <div
              v-show="showDestinationMap"
              id="map-destination"
              class="map"
            ></div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { db } from "@/firebaseConfig";
import { getAuth } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import AlertPage from "@/components/common/AlertPage.vue";

/* global google */

export default {
  name: "AddRide",
  components: { AlertPage },
  setup() {
    const rideId = ref(""); // Unikalne ID przejazdu
    const userId = ref(""); // Identyfikator użytkownika
    const departure = ref(""); // Miejscowość wyjazdu
    const destination = ref(""); // Miejscowość dojazdu
    const exactDepartureAddress = ref(""); // Dokładny adres wyjazdu
    const exactDestinationAddress = ref(""); // Dokładny adres dojazdu
    const exactDeparture = ref({ lat: null, lng: null });
    const exactDestination = ref({ lat: null, lng: null });
    const seats = ref(1); // Liczba wolnych miejsc
    const dateTime = ref(""); // Data i godzina przejazdu
    const showDepartureMap = ref(false); // Widoczność mapy wyjazdu
    const showDestinationMap = ref(false); // Widoczność mapy dojazdu
    let departureMap, destinationMap, departureMarker, destinationMarker;
    let departureAutocomplete, destinationAutocomplete;
    const alertMessage = ref("");
    const showAlert = ref(false);

    // Funkcja do inicjalizacji mapy
    const initMap = (type) => {
      const mapElementId =
        type === "departure" ? "map-departure" : "map-destination";
      const mapOptions = {
        center: { lat: 52.2297, lng: 21.0122 }, // Warszawa
        zoom: 13,
      };
      const map = new google.maps.Map(
        document.getElementById(mapElementId),
        mapOptions
      );
      const marker = new google.maps.Marker({
        position: mapOptions.center,
        map: map,
        draggable: true,
      });

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
          exactDeparture.value = { lat: position.lat(), lng: position.lng() };
        } else {
          exactDestination.value = { lat: position.lat(), lng: position.lng() };
        }
      });

      // Dodajemy możliwość kliknięcia na mapie i pobrania adresu
      google.maps.event.addListener(map, "click", (event) => {
        const clickedLocation = event.latLng;
        marker.setPosition(clickedLocation); // Ustawiamy marker na klikniętej lokalizacji
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ location: clickedLocation }, (results, status) => {
          if (status === "OK" && results[0]) {
            // Wypełniamy odpowiednie pole adresem
            if (type === "departure") {
              exactDepartureAddress.value = results[0].formatted_address;
              exactDeparture.value = {
                lat: clickedLocation.lat(),
                lng: clickedLocation.lng(),
              };
            } else {
              exactDestinationAddress.value = results[0].formatted_address;
              exactDestination.value = {
                lat: clickedLocation.lat(),
                lng: clickedLocation.lng(),
              };
            }
          } else {
            console.warn("Nie udało się znaleźć adresu dla tej lokalizacji");
          }
        });
      });
    };

    // Funkcja do inicjalizacji autocomplete dla adresów
    const initAutocomplete = () => {
      const options = {
        componentRestrictions: { country: "PL" }, // Ograniczenie do Polski
      };

      // Inicjalizacja Autocomplete dla wyjazdu
      departureAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById("departureAddressInput"),
        options
      );

      // Inicjalizacja Autocomplete dla dojazdu
      destinationAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById("destinationAddressInput"),
        options
      );

      // Wysłanie adresu do odpowiedniego pola po wybraniu sugestii
      departureAutocomplete.addListener("place_changed", () => {
        const place = departureAutocomplete.getPlace();
        if (place.geometry) {
          exactDepartureAddress.value = place.formatted_address;
          updateMap("departure");
        }
      });

      destinationAutocomplete.addListener("place_changed", () => {
        const place = destinationAutocomplete.getPlace();
        if (place.geometry) {
          exactDestinationAddress.value = place.formatted_address;
          updateMap("destination");
        }
      });
    };

    // Funkcja do geokodowania adresu
    const geocodeAddress = (type) => {
      const address =
        type === "departure"
          ? exactDepartureAddress.value
          : exactDestinationAddress.value;
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode(
        {
          address: address,
          componentRestrictions: { country: "PL" },
        },
        (results, status) => {
          if (status === "OK") {
            const location = results[0].geometry.location;
            if (type === "departure") {
              departureMap.setCenter(location);
              departureMarker.setPosition(location);
              exactDeparture.value = {
                lat: location.lat(),
                lng: location.lng(),
              };
            } else {
              destinationMap.setCenter(location);
              destinationMarker.setPosition(location);
              exactDestination.value = {
                lat: location.lat(),
                lng: location.lng(),
              };
            }
          } else {
            console.warn("Nie udało się znaleźć lokalizacji: " + status);
          }
        }
      );
    };

    const addRide = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          console.error("Użytkownik musi być zalogowany, aby dodać przejazd.");
          return;
        }
        const rideData = {
          rideId: `${user.uid}_${Date.now()}`,
          userId: user.uid,
          departure: departure.value,
          destination: destination.value,
          exactDepartureAddress: exactDepartureAddress.value,
          exactDestinationAddress: exactDestinationAddress.value,
          dateTime: dateTime.value,
          seats: seats.value,
          exactDeparture: exactDeparture.value,
          exactDestination: exactDestination.value,
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, "rides"), rideData);
        alertMessage.value = "Dodano przejazd pomyślnie!";
        showAlert.value = true;
        console.log("Dodano przejazd z ID:", docRef.id);
      } catch (e) {
        console.error("Błąd podczas dodawania przejazdu:", e);
      }
    };

    // Funkcja do wyświetlania mapy po kliknięciu
    const toggleMap = (type) => {
      if (type === "departure") {
        showDepartureMap.value = !showDepartureMap.value;
        if (showDepartureMap.value) {
          // Zaktualizowanie mapy po jej wyświetleniu
          updateMap("departure");
        }
      } else {
        showDestinationMap.value = !showDestinationMap.value;
        if (showDestinationMap.value) {
          // Zaktualizowanie mapy po jej wyświetleniu
          updateMap("destination");
        }
      }

      // Dodajemy klasę do elementu mapy, aby wywołać animację
      const mapElement = document.getElementById(
        type === "departure" ? "map-departure" : "map-destination"
      );
      if (mapElement) {
        mapElement.classList.toggle(
          "show",
          showDepartureMap.value || showDestinationMap.value
        );
      }
    };

    // Funkcja do aktualizowania mapy
    const updateMap = (type) => {
      const address =
        type === "departure"
          ? exactDepartureAddress.value
          : exactDestinationAddress.value;
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode(
        {
          address: address,
          componentRestrictions: { country: "PL" },
        },
        (results, status) => {
          if (status === "OK") {
            const location = results[0].geometry.location;
            const map = type === "departure" ? departureMap : destinationMap;
            const marker =
              type === "departure" ? departureMarker : destinationMarker;

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
          } else {
            console.warn("Nie udało się znaleźć lokalizacji: " + status);
          }
        }
      );
    };

    onMounted(() => {
      initMap("departure");
      initMap("destination");
      initAutocomplete();
    });

    return {
      departure,
      destination,
      exactDepartureAddress,
      exactDestinationAddress,
      exactDeparture,
      exactDestination,
      dateTime,
      seats,
      updateMap,
      geocodeAddress,
      addRide,
      toggleMap,
      showDepartureMap,
      showDestinationMap,
      rideId,
      userId,
      alertMessage,
      showAlert,
    };
  },

  methods: {
    handleAlertClose() {
      this.showAlert = false;
      this.$router.push("/");
    },
  },
};
</script>

<style scoped>
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
  margin-bottom: 20px;
  width: 100%;
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

.map {
  height: 400px;
  width: 100%;
  margin-top: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
}

.map.show {
  transform: translateY(0);
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

button[type="button"] {
  background-color: #05445e;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

button[type="button"]:hover {
  background-color: #006b7f;
  transform: translateY(-3px);
}

input[type="datetime-local"] {
  padding: 10px;
  margin-top: 5px;
  border-radius: 5px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}

.submit-btn:disabled {
  background-color: #7d9c9b;
  cursor: not-allowed;
}

.short-center {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}
</style>
