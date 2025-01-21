<template>
  <form @submit.prevent="addRide">
    <body>
      <AlertPage
        v-if="showAlert"
        :message="alertMessage"
        @close="handleAlertClose"
      />
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
      <section>
        <label for="departure">Miejsce wyjazdu:</label>
        <input
          type="text"
          v-model="departure"
          placeholder="Podaj miejsce wyjazdu"
        />
      </section>
      <section>
        <label for="destination">Miejsce docelowe:</label>
        <input
          type="text"
          v-model="destination"
          placeholder="Podaj miejsce docelowe"
        />
      </section>
      <section>
        <label for="exactDepartureAddress">Dokładny adres wyjazdu:</label>
        <input
          type="text"
          id="departureAddressInput"
          v-model="exactDepartureAddress"
          @input="updateMap('departure')"
          placeholder="Wpisz dokładny adres wyjazdu lub zaznacz na mapie"
          required
        />
        <button type="button" @click="toggleMap('departure')">Mapa</button>
        <div v-show="showDepartureMap" id="map-departure" class="map"></div>
      </section>
      <section>
        <label for="exactDestinationAddress">Dokładny adres dojazdu:</label>
        <input
          type="text"
          id="destinationAddressInput"
          v-model="exactDestinationAddress"
          @input="updateMap('destination')"
          placeholder="Wpisz dokładny adres dojazdu lub zaznacz na mapie"
          required
        />
        <button type="button" @click="toggleMap('destination')">Mapa</button>
        <div v-show="showDestinationMap" id="map-destination" class="map"></div>
      </section>
    </body>
    <footer></footer>
  </form>
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

    watch(exactDepartureAddress, (newAddress) => {
      if (newAddress) {
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ address: newAddress }, (results, status) => {
          if (status === "OK" && results[0]) {
            const addressComponents = results[0].address_components;
            const city = addressComponents.find((component) =>
              component.types.includes("locality")
            )?.long_name;

            if (city) {
              departure.value = city; // Aktualizacja miejscowości wyjazdu
            }
          } else {
            console.warn("Nie udało się znaleźć miasta dla adresu: " + status);
          }
        });
      }
    });

    // Funkcja do walidacji maksymalnej liczby miejsc
    const validateMaxSeats = () => {
      if (seats.value > 8) {
        seats.value = 8;
      } else if (seats.value < 1) {
        seats.value = 1;
      }
    };

    // Funkcja do inicjalizacji mapy
    const initMap = (type) => {
      const mapElementId =
        type === "departure" ? "map-departure" : "map-destination";
      const mapOptions = {
        center: { lat: 52.2297, lng: 21.0122 },
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
        marker.setPosition(clickedLocation);
        const geocoder = new google.maps.Geocoder();

        geocoder.geocode({ location: clickedLocation }, (results, status) => {
          if (status === "OK" && results[0]) {
            const addressComponents = results[0].address_components;
            const city = addressComponents.find((component) =>
              component.types.includes("locality")
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
            const addressComponents = results[0].address_components;
            const city = addressComponents.find((component) =>
              component.types.includes("locality")
            )?.long_name;

            if (type === "departure") {
              if (!departure.value) {
                // Jeśli pole miejscowości jest puste, przypisze nazwę miasta
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
      validateMaxSeats,
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
