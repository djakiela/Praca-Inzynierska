<template>
  <div class="page">
    <div class="my-reservations">
      <h1>Twoje rezerwacje</h1>
      <div v-if="loading" class="loading">Ładowanie...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="rides.length === 0 && !loading" class="no-rides">
        Brak aktywnych rezerwacji.
      </div>

      <ul v-if="rides.length > 0">
        <li v-for="(ride, index) in rides" :key="ride.id" class="ride-item">
          <h2>Przejazd: {{ ride.departure }} → {{ ride.destination }}</h2>
          <p><strong>Data:</strong> {{ formatDate(ride.dateTime) }}</p>
          <p>
            <strong>Zarezerwowane miejsca:</strong>
            {{ reservations[index]?.seats || "Brak danych" }}
          </p>
          <button @click="cancelReservation(index, ride.id)">
            Odwołaj rezerwację
          </button>

          <!-- Szczegóły -->
          <div class="details">
            <p>
              <strong>Numer telefonu:</strong>
              {{ userPhones[ride.userId] || "Brak numeru telefonu" }}
            </p>
            <p>
              <strong>Dokładny adres wyjazdu:</strong>
              {{ ride.exactDepartureAddress }}
            </p>
            <p>
              <strong>Dokładny adres dojazdu:</strong>
              {{ ride.exactDestinationAddress }}
            </p>
            <button @click="toggleMap(index, ride.id)">
              {{ mapVisibility[index] ? "Ukryj mapę" : "Wizualizacja trasy" }}
            </button>
          </div>
          <!-- Box z mapą -->
          <div
            v-if="mapVisibility[index]"
            :id="'map-container-' + ride.id"
            class="map-container"
          ></div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
/* global google */
import { ref, onMounted } from "vue";
import { db } from "@/firebaseConfig";
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";


export default {
  name: "MyReservation",
  setup() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const rides = ref([]);
    const reservations = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const userPhones = ref({});
    const mapVisibility = ref([]);

    // Pobierz rezerwacje użytkownika
    const fetchUserReservations = async () => {
      try {
        if (!currentUser) {
          error.value = "Musisz być zalogowany, aby zobaczyć swoje rezerwacje.";
          return;
        }

        // Pobierz rezerwacje użytkownika
        const reservationQuery = query(
          collection(db, "reservations"),
          where("userId", "==", currentUser.uid)
        );
        const reservationDocs = await getDocs(reservationQuery);

        const reservationData = [];
        const ridePromises = [];
        const userIds = new Set();

        reservationDocs.forEach((reservationDoc) => {
          const data = reservationDoc.data();
          reservationData.push({ ...data, id: reservationDoc.id });
          const rideRef = doc(db, "rides", data.rideId);
          ridePromises.push(getDoc(rideRef));
          if (data.userId) userIds.add(data.userId);
        });

        reservations.value = reservationData;

        // Pobierz dane przejazdów
        const rideDocs = await Promise.all(ridePromises);
        rides.value = rideDocs
          .filter((ride) => ride.exists())
          .map((ride) => ({ id: ride.id, ...ride.data() }));

        // Inicjalizacja widoczności map dla każdego przejazdu
        mapVisibility.value = new Array(rides.value.length).fill(false);

        // Pobierz dane użytkowników, w tym numery telefonów
        const userPromises = Array.from(userIds).map((userId) =>
          getDoc(doc(db, "users", userId))
        );
        const userDocs = await Promise.all(userPromises);

        userDocs.forEach((userDoc) => {
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userPhones.value[userDoc.id] =
              userData.phonenumber || "Brak numeru telefonu";
          }
        });
      } catch (err) {
        error.value = "Nie udało się pobrać rezerwacji: " + err.message;
      } finally {
        loading.value = false;
      }
    };

    // Odwołaj rezerwację
    const cancelReservation = async (index, rideId) => {
      try {
        const reservedSeats = reservations.value[index]?.seats || 0;
        const rideRef = doc(db, "rides", rideId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
          const currentSeats = rideDoc.data().seats || 0;
          await updateDoc(rideRef, { seats: currentSeats + reservedSeats });

          await deleteDoc(
            doc(db, "reservations", reservations.value[index].id)
          );

          rides.value.splice(index, 1);
          reservations.value.splice(index, 1);
        }
      } catch (err) {
        console.error("Błąd podczas odwoływania rezerwacji:", err);
      }
    };

    const formatDate = (date) =>
      new Date(date).toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

    const visualizeRoute = async (rideId) => {
      try {
        const rideRef = doc(db, "rides", rideId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
          const rideData = rideDoc.data();

          const origin = rideData.exactDepartureAddress;
          const destination = rideData.exactDestinationAddress;

          if (!origin || !destination) {
            console.error("Adresy początkowy lub końcowy są nieprawidłowe.");
            return;
          }

          const mapElement = document.getElementById(`map-container-${rideId}`);
          if (!mapElement) {
            console.error("Kontener mapy nie został znaleziony.");
            return;
          }

          mapElement.innerHTML = "";

          const map = new google.maps.Map(mapElement, {
            zoom: 7,
            center: { lat: 52.2297, lng: 21.0122 },
          });

          const directionsService = new google.maps.DirectionsService();
          const directionsRenderer = new google.maps.DirectionsRenderer();
          directionsRenderer.setMap(map);

          directionsService.route(
            {
              origin,
              destination,
              travelMode: google.maps.TravelMode.DRIVING,
            },
            (response, status) => {
              if (status === "OK") {
                directionsRenderer.setDirections(response);
                console.log(
                  `Trasa dla przejazdu ${rideId} została pomyślnie wyznaczona.`
                );
              } else {
                console.error(
                  `Błąd podczas wyznaczania trasy dla przejazdu ${rideId}:`,
                  status
                );
              }
            }
          );
        } else {
          console.error("Przejazd o podanym ID nie został znaleziony.");
        }
      } catch (err) {
        console.error("Błąd podczas wizualizacji trasy:", err);
      }
    };

    const toggleMap = (index, rideId) => {
      mapVisibility.value[index] = !mapVisibility.value[index];
      if (mapVisibility.value[index]) {
        visualizeRoute(rideId); // Wyświetl mapę
      } else {
        const mapElement = document.getElementById(`map-container-${rideId}`);
        if (mapElement) mapElement.innerHTML = ""; // Ukryj mapę
      }
    };

    onMounted(fetchUserReservations);

    return {
      rides,
      reservations,
      userPhones,
      loading,
      error,
      mapVisibility,
      toggleMap,
      visualizeRoute,
      cancelReservation,
      formatDate,
    };
  },
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-top: 60px;
  align-items: center;
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
}

.my-reservations {
  font-family: Arial, Helvetica, sans-serif;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
}

.loading {
  text-align: center;
  color: #007bff;
}

.error {
  text-align: center;
  color: red;
}

.no-rides {
  text-align: center;
  color: #555;
}

ul {
  list-style-type: none;
  padding: 0;
}

.ride-item {
  background-color: white;
  border: 1px solid #ddd;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.ride-item h2 {
  margin: 0 0 10px;
  color: #007bff;
}

.ride-item p {
  margin: 5px 0;
  color: #555;
}

.ride-item strong {
  color: #333;
}

button {
  margin-top: 10px;
  padding: 10px;
  border: none;
  background-color: #189ab4;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #007bff;
}

.details {
  margin-top: 10px;
  padding: 10px;
  border-top: 1px solid #ddd;
  color: #444;
}

.map-container {
  width: 100%;
  height: 400px;
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>