<template>
  <body class="temp-container">
    <div @submit.prevent="addRide" class="container">
      <AlertPage
        v-if="showAlert"
        :message="alertMessage"
        @close="handleAlertClose"
        class="alert-container"
      />
      <form>
        <div class="up-content">
          <button @click="handleAddRide">Dodaj przejazd</button>
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
import { db } from "@/firebaseConfig";
import { getAuth } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import AlertPage from "@/components/common/AlertPage.vue";

/* global google */

export default {
  name: "AddRide",
  components: { AlertPage },
  setup() {
    /**
     * * Unikalne ID przejazdu
     * * Identyfikator użytkownika
     * * Miejscowość wyjazdu
     * * Miejscowość dojazdu
     * * Dokładny adres wyjazdu
     * * Dokładny adres dojazdu
     * * Współrzędne geograficzne wyjazdu
     * * Współrzędne geograficzne dojazdu
     * * Liczba wolnych miejsc
     * * Data i godzina przejazdu
     * * Widoczność mapy wyjazdu
     * * Widoczność mapy dojazdu
     * **/
    const rideId = ref("");
    const userId = ref("");
    const departure = ref("");
    const destination = ref("");
    const exactDepartureAddress = ref("");
    const exactDestinationAddress = ref("");
    const exactDeparture = ref({ lat: null, lng: null });
    const exactDestination = ref({ lat: null, lng: null });
    const seats = ref(1);
    const dateTime = ref("");
    const showDepartureMap = ref(false);
    const showDestinationMap = ref(false);
    let departureMap, destinationMap, departureMarker, destinationMarker;
    let departureAutocomplete, destinationAutocomplete;
    const alertMessage = ref("");
    const showAlert = ref(false);

    watch(
      [exactDepartureAddress, exactDestinationAddress],
      ([newDepAddress, newDestAddress]) => {
        const geocoder = new google.maps.Geocoder();

        if (newDepAddress) {
          geocoder.geocode({ address: newDepAddress }, (results, status) => {
            if (status === "OK" && results[0]) {
              const city = results[0].address_components.find((component) =>
                component.types.includes("locality"),
              )?.long_name;

              if (city) {
                departure.value = city;
                console.log("Miejscowość wyjazdu:", city);
              }
            }
          });
        }

        if (newDestAddress) {
          geocoder.geocode({ address: newDestAddress }, (results, status) => {
            if (status === "OK" && results[0]) {
              const city = results[0].address_components.find((component) =>
                component.types.includes("locality"),
              )?.long_name;

              if (city) {
                destination.value = city;
                console.log("Miejscowość docelowa:", city);
              }
            }
          });
        }
      },
    );

    /**
     * * Funkcja do walidacji maksymalnej liczby miejsc
     */

    const validateMaxSeats = () => {
      if (seats.value > 8) {
        seats.value = 8;
      } else if (seats.value < 1) {
        seats.value = 1;
      }
    };

    /**
     * * Funkcja do inicjalizacji mapy
     */
    const initMap = (type) => {
      const mapElementId =
        type === "departure" ? "map-departure" : "map-destination";
      const mapOptions = {
        center: { lat: 52.2297, lng: 21.0122 },
        zoom: 13,
      };
      const map = new google.maps.Map(
        document.getElementById(mapElementId),
        mapOptions,
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

      /**
       * * Funkcja do dodawania możliwości kliknięcia na mapie i pobrania adresu
       */
      google.maps.event.addListener(map, "click", (event) => {
        const clickedLocation = event.latLng;
        marker.setPosition(clickedLocation);
        const geocoder = new google.maps.Geocoder();

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
          } else {
            console.warn("Nie udało się znaleźć adresu dla tej lokalizacji");
          }
        });
      });
    };

    /**
     * * Funkcja do inicjalizacji autocomplete dla adresów
     * * Ogranieczenie dla Polski
     */
    const initAutocomplete = () => {
      const options = {
        componentRestrictions: { country: "PL" },
      };

      /**
       * * Inicjalizacja Autocomplete dla wyjazdu
       */
      departureAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById("departureAddressInput"),
        options,
      );

      /**
       * * Inicjalizacja Autocomplete dla dojazdu
       */
      destinationAutocomplete = new google.maps.places.Autocomplete(
        document.getElementById("destinationAddressInput"),
        options,
      );

      /**
       * * Wysłanie adresu do odpowiedniego pola po wybraniu sugestii
       */
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

    /**
     * * Funkcja do geokodowania adresu
     */
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
            const addressComponents = results[0].address_components;
            const city = addressComponents.find((component) =>
              component.types.includes("locality"),
            )?.long_name;

            if (type === "departure") {
              if (!departure.value) {
                /**
                 * * Jeśli pole miejscowości jest puste, przypisze nazwę miasta
                 */
                departure.value = city || "";
              }
              exactDeparture.value = {
                lat: location.lat(),
                lng: location.lng(),
              };
            } else {
              if (!destination.value) {
                destination.value = city || "";
              }
              exactDestination.value = {
                lat: location.lat(),
                lng: location.lng(),
              };
            }
          } else {
            console.warn("Nie udało się znaleźć lokalizacji: " + status);
          }
        },
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
        console.log("Tworzenie nowego przejazdu...");
        console.log("Miejscowość wyjazdu:", departure.value);
        console.log("Miejscowość docelowa:", destination.value);
        console.log("Dokładny adres wyjazdu:", exactDepartureAddress.value);
        console.log("Dokładny adres docelowy:", exactDestinationAddress.value);
        console.log("Data i godzina przejazdu:", dateTime.value);
        console.log("Liczba miejsc:", seats.value);

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
          createdAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "rides"), rideData);
        alertMessage.value = "Dodano przejazd pomyślnie!";
        showAlert.value = true;
        console.log("Dodano przejazd z ID:", docRef.id);
      } catch (e) {
        console.error("Błąd podczas dodawania przejazdu:", e);
      }
    };

    /**
     * * Funkcja do wyświetlania mapy po kliknięciu
     */
    const toggleMap = (type) => {
      if (type === "departure") {
        showDepartureMap.value = !showDepartureMap.value;
        if (showDepartureMap.value) {
          /**
           * * Zaktualizowanie mapy po jej wyświetleniu
           */
          updateMap("departure");
        }
      } else {
        showDestinationMap.value = !showDestinationMap.value;
        if (showDestinationMap.value) {
          /**
           * * Zaktualizowanie mapy po jej wyświetleniu
           */
          updateMap("destination");
        }
      }

      /**
       * * Dodanie klasy do elementu mapy, aby wywołać animację
       */
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

    /**
     * * Funkcja do aktualizowania mapy
     */
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
        },
      );
    };

    onMounted(() => {
      initMap("departure");
      initMap("destination");
      initAutocomplete();
    });

    return {
      validateMaxSeats,
      updateMap,
      geocodeAddress,
      addRide,
      toggleMap,
      departure,
      destination,
      exactDepartureAddress,
      exactDestinationAddress,
      exactDeparture,
      exactDestination,
      dateTime,
      seats,
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
  margin-bottom: 20px;
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
.alert-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(51, 51, 51, 0.9);
  color: white;
  padding: 20px;
  border-radius: 10px;
  z-index: 9999;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 300px;
}

.alert-container button {
  margin-top: 10px;
  background-color: #ffb300;
  color: black;
  border: none;
  padding: 10px 15px;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
}

.alert-container button:hover {
  background-color: #ffbb40;
  transform: translateY(-2px);
}
</style>
