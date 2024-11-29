<template>
  <div class="page">
    <div class="ride-list">
      <h1>Lista przejazdów</h1>

      <!-- Paginacja na górze -->
      <nav v-if="totalPages > 1" class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">&lt;</button>
        <button
          v-for="page in totalPages"
          :key="page"
          :class="{ active: page === currentPage }"
          @click="setPage(page)"
        >
          {{ page }}
        </button>
        <button @click="nextPage" :disabled="currentPage === totalPages">
          &gt;
        </button>
      </nav>

      <div v-if="loading" class="loading">Ładowanie...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="paginatedRides.length === 0 && !loading" class="no-rides">
        Brak przejazdów do wyświetlenia.
      </div>

      <div v-for="(ride, index) in paginatedRides" :key="ride.id" class="ride-item">
  <h2>Przejazd: {{ ride.departure }} → {{ ride.destination }}</h2>
  <p>
    <strong>Dodano przez:</strong>
    {{ userNames[ride.userId] || "Nieznany użytkownik" }}
  </p>
  <p><strong>Data:</strong> {{ formatDate(ride.dateTime) }}</p>
  <p><strong>Miejsca:</strong> {{ ride.seats }}</p>
  
  <!-- Formularz wyboru liczby miejsc -->
  <div v-if="!reservationStatus[index]">
    <label>Liczba miejsc do rezerwacji:</label>
    <input
      type="number"
      v-model.number="reservationSeats[index]"
      :max="ride.seats"
      :min="1"
      @input="validateSeats(index, ride.seats)"
    />
    <p v-if="validationErrors[index]" class="error">
      {{ validationErrors[index] }}
    </p>
  </div>

  <!-- Przyciski rezerwacji -->
  <div>
    <button
      @click="
        reservationStatus[index]
          ? cancelReservation(index, ride.id)
          : makeReservation(index, ride.id)
      "
    >
      {{ reservationStatus[index] ? "Odwołaj rezerwację" : "Zarezerwuj" }}
    </button>
  </div>

  <!-- Szczegóły przejazdu -->
  <div class="details" v-if="reservationStatus[index]">
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

      </div>

      <!-- Paginacja na dole -->
      <nav v-if="totalPages > 1" class="pagination">
        <button @click="prevPage" :disabled="currentPage === 1">&lt;</button>
        <button
          v-for="page in totalPages"
          :key="page"
          :class="{ active: page === currentPage }"
          @click="setPage(page)"
        >
          {{ page }}
        </button>
        <button @click="nextPage" :disabled="currentPage === totalPages">
          &gt;
        </button>
      </nav>
    </div>
  </div>
</template>


<script>
import { ref, computed, onMounted } from "vue";
import { db } from "@/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  updateDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default {
  name: "RideList",
  setup() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const rides = ref([]);
    const userNames = ref({});
    const reservationSeats = ref([]);
    const validationErrors = ref([]);
    const reservationStatus = ref([]);
    const mapVisibility = ref([]); // Zmienna do kontrolowania widoczności mapy
    const loading = ref(true);
    const error = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = 6;

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
                console.log(`Trasa dla przejazdu ${rideId} została pomyślnie wyznaczona.`);
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


    const totalPages = computed(() =>
      Math.ceil(rides.value.length / itemsPerPage)
    );

    const paginatedRides = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return rides.value.slice(start, end);
    });

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const fetchRides = async () => {
  try {
    const q = query(collection(db, "rides"), orderBy("dateTime", "asc"));
    const querySnapshot = await getDocs(q);

    rides.value = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    reservationSeats.value = new Array(rides.value.length).fill(1);
    validationErrors.value = new Array(rides.value.length).fill("");
    reservationStatus.value = new Array(rides.value.length).fill(false);
    mapVisibility.value = new Array(rides.value.length).fill(false); // Dodano inicjalizację mapVisibility

    const userIds = [...new Set(rides.value.map((ride) => ride.userId))];
    await fetchUserNames(userIds);

    if (currentUser) await fetchUserReservations();
  } catch (err) {
    error.value = "Nie udało się pobrać przejazdów: " + err.message;
  } finally {
    loading.value = false;
  }
};

    const fetchUserNames = async (userIds) => {
      const userFetchPromises = userIds.map(async (id) => {
        try {
          const userDoc = await getDoc(doc(db, "users", id));
          if (userDoc.exists()) {
            userNames.value[id] = userDoc.data().username;
          } else {
            userNames.value[id] = "Nieznany użytkownik";
          }
        } catch {
          userNames.value[id] = "Nieznany użytkownik";
        }
      });
      await Promise.all(userFetchPromises);
    };

    const fetchUserReservations = async () => {
      const q = query(
        collection(db, "reservations"),
        where("userId", "==", currentUser.uid)
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const reservation = doc.data();
        const rideIndex = rides.value.findIndex(
          (ride) => ride.id === reservation.rideId
        );
        if (rideIndex !== -1) {
          reservationStatus.value[rideIndex] = true;
          reservationSeats.value[rideIndex] = reservation.seats;
        }
      });
    };

    const makeReservation = async (index, rideId) => {
      const reservedSeats = reservationSeats.value[index];
      try {
        const rideRef = doc(db, "rides", rideId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
          const currentSeats = rideDoc.data().seats;
          if (currentSeats >= reservedSeats) {
            await updateDoc(rideRef, { seats: currentSeats - reservedSeats });

            await setDoc(
              doc(db, "reservations", `${currentUser.uid}_${rideId}`),
              {
                rideId,
                userId: currentUser.uid,
                seats: reservedSeats,
              }
            );

            rides.value[index].seats -= reservedSeats;
            reservationStatus.value[index] = true;
          }
        }
      } catch (err) {
        console.error("Błąd podczas rezerwacji:", err);
      }
    };

    const cancelReservation = async (index, rideId) => {
      const reservedSeats = reservationSeats.value[index];
      try {
        const rideRef = doc(db, "rides", rideId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
          const currentSeats = rideDoc.data().seats;

          await updateDoc(rideRef, { seats: currentSeats + reservedSeats });

          await deleteDoc(
            doc(db, "reservations", `${currentUser.uid}_${rideId}`)
          );

          rides.value[index].seats += reservedSeats;
          reservationStatus.value[index] = false;

          const mapElement = document.getElementById(`map-container-${rideId}`);
          if (mapElement) mapElement.innerHTML = "";
        }
      } catch (err) {
        console.error("Błąd podczas odwoływania rezerwacji:", err);
      }
    };

    const validateSeats = (index, availableSeats) => {
      if (reservationSeats.value[index] > availableSeats) {
        validationErrors.value[
          index
        ] = `Nie można zarezerwować więcej niż ${availableSeats} miejsc.`;
        reservationSeats.value[index] = availableSeats;
      } else if (reservationSeats.value[index] < 1) {
        validationErrors.value[index] =
          "Musisz zarezerwować przynajmniej 1 miejsce.";
        reservationSeats.value[index] = 1;
      } else {
        validationErrors.value[index] = "";
      }
    };

    const setPage = (page) => {
      currentPage.value = page;
    };

    onMounted(fetchRides);

    return {
  rides,
  paginatedRides,
  userNames,
  reservationSeats,
  validationErrors,
  reservationStatus,
  mapVisibility, // Dodano zmienną mapVisibility
  loading,
  error,
  currentPage,
  totalPages,
  nextPage,
  prevPage,
  setPage,
  formatDate: (date) => new Date(date).toLocaleString("pl-PL"),
  makeReservation,
  cancelReservation,
  validateSeats,
  visualizeRoute,
  toggleMap,
};

  },
};
</script>


<style scoped>
.map-container {
  width: 100%;
  height: 400px;
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: block; /* Domyślnie ukryj kontener */
}



.page {
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  padding-top: 30px;
  padding-bottom: 30px;
}

.ride-list {
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

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

.pagination button {
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin: 0 5px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
  transition: background-color 0.3s, transform 0.2s;
}

.pagination button:hover {
  background-color: #007bff;
  color: white;
  transform: translateY(-2px);
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.pagination button.active {
  background-color: #007bff;
  color: white;
  font-weight: bold;
  cursor: default;
}
</style>
