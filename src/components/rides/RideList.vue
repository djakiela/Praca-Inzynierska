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

      <div
        v-for="(ride, index) in paginatedRides"
        :key="ride.id"
        class="content"
      >
        <h2>Przejazd: {{ ride.departure }} → {{ ride.destination }}</h2>

        <!-- Sekcja użytkownika z avatarem -->
        <div class="user-info">
          <p>
            <strong>Dodano przez:</strong>
            {{ userNames[ride.userId] || "Nieznany użytkownik" }}
          </p>
          <img
            :src="userAvatars[ride.userId] || defaultAvatar"
            alt="Avatar"
            class="avatar"
          />
        </div>

        <p><strong>Data:</strong> {{ formatDate(ride.dateTime) }}</p>
        <p><strong>Miejsca:</strong> {{ ride.seats }}</p>

        <div class="actions">
          <template v-if="ride.userId === currentUser?.uid">
            <p class="info-message">
              Ten przejazd należy do Ciebie. Możesz go sprawdzić w sekcji
              <strong>Moje przejazdy</strong>.
            </p>
            <button @click="goToMyRides" class="primary">
              Przejdź do moich przejazdów
            </button>
          </template>

          <template v-else>
            <div v-if="!reservationStatus[index]" class="reservation-section">
              <label>Liczba miejsc do rezerwacji:</label>
              <input
                class="seats-input"
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

            <button
              class="primary"
              @click="
                reservationStatus[index]
                  ? cancelReservation(index, ride.id)
                  : makeReservation(index, ride.id)
              "
            >
              {{
                reservationStatus[index] ? "Odwołaj rezerwację" : "Zarezerwuj"
              }}
            </button>
          </template>
        </div>

        <div class="details" v-if="reservationStatus[index]">
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
          <button @click="toggleMap(index, ride.id)" class="secondary">
            {{ mapVisibility[index] ? "Ukryj mapę" : "Wizualizacja trasy" }}
          </button>
        </div>

        <div
          v-if="mapVisibility[index]"
          :id="'map-container-' + ride.id"
          class="map-container"
        ></div>
      </div>

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
/* global google */
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
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
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";

export default {
  name: "RideList",

  setup() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const rides = ref([]);
    const userNames = ref({});
    const userAvatars = ref({});
    const reservationSeats = ref([]);
    const validationErrors = ref([]);
    const reservationStatus = ref([]);
    const mapVisibility = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = 6;
    const userPhones = ref({});
    const router = useRouter();
    const defaultAvatar = "/avatar.png";
    const storage = getStorage();

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
                  `Trasa dla przejazdu ${rideId} została pomyślnie wyznaczona.`,
                );
              } else {
                console.error(
                  `Błąd podczas wyznaczania trasy dla przejazdu ${rideId}:`,
                  status,
                );
              }
            },
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
      Math.ceil(rides.value.length / itemsPerPage),
    );

    const paginatedRides = computed(() => {
      const filteredRides = rides.value.filter((ride) => ride.seats > 0);
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredRides.slice(start, end);
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
        mapVisibility.value = new Array(rides.value.length).fill(false);

        const userIds = [...new Set(rides.value.map((ride) => ride.userId))];
        await fetchUserNamesAndAvatars(userIds);
        if (currentUser) await fetchUserReservations();
      } catch (err) {
        error.value = "Nie udało się pobrać przejazdów: " + err.message;
      } finally {
        loading.value = false;
      }
    };

    const fetchUserNamesAndAvatars = async (userIds) => {
      const userFetchPromises = userIds.map(async (id) => {
        try {
          const userDoc = await getDoc(doc(db, "users", id));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userNames.value[id] = userData.username || "Nieznany użytkownik";

            // Pobieramy avatar użytkownika z Firebase Storage
            const avatarPath = `imgu/${id}.jpg`; // Avatar w katalogu `imgu/`
            const avatarRef = storageRef(storage, avatarPath);

            try {
              const avatarUrl = await getDownloadURL(avatarRef);
              userAvatars.value[id] = avatarUrl;
            } catch {
              userAvatars.value[id] = defaultAvatar; // Jeśli avatar nie istnieje, używamy domyślnego
            }
          } else {
            userNames.value[id] = "Nieznany użytkownik";
            userAvatars.value[id] = defaultAvatar;
          }
        } catch {
          userNames.value[id] = "Nieznany użytkownik";
          userAvatars.value[id] = defaultAvatar;
        }
      });

      await Promise.all(userFetchPromises);
    };

    const fetchUserReservations = async () => {
      const q = query(
        collection(db, "reservations"),
        where("userId", "==", currentUser.uid),
      );
      const querySnapshot = await getDocs(q);

      querySnapshot.forEach((doc) => {
        const reservation = doc.data();
        const rideIndex = rides.value.findIndex(
          (ride) => ride.id === reservation.rideId,
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
              },
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
            doc(db, "reservations", `${currentUser.uid}_${rideId}`),
          );

          rides.value[index].seats += reservedSeats;
          reservationStatus.value[index] = false;

          mapVisibility.value[index] = false;

          const mapElement = document.getElementById(`map-container-${rideId}`);
          if (mapElement) mapElement.innerHTML = "";
        }
      } catch (err) {
        console.error("Błąd podczas odwoływania rezerwacji:", err);
      }
    };

    const validateSeats = (index, availableSeats) => {
      if (reservationSeats.value[index] > availableSeats) {
        validationErrors.value[index] =
          `Nie można zarezerwować więcej niż ${availableSeats} miejsc.`;
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

    const goToMyRides = () => {
      router.push("/my-rides"); // Zakładając, że ścieżka to '/my-rides'
    };

    onMounted(fetchRides);

    return {
      rides,
      paginatedRides,
      userNames,
      reservationSeats,
      validationErrors,
      reservationStatus,
      mapVisibility,
      userPhones,
      loading,
      error,
      currentPage,
      totalPages,
      defaultAvatar,
      userAvatars,
      goToMyRides,
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
.page {
  min-height: 100vh;
  padding-bottom: 30px;
  align-items: center;
  background-color: #222;
  color: white;
}

.ride-list {
  font-family: Arial, Helvetica, sans-serif;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: rgba(51, 51, 51, 0.9);
  border-radius: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

h1 {
  text-align: center;
  color: white;
  text-shadow: 0px 0px 10px rgba(0, 0, 0, 0.8);
}

.loading {
  text-align: center;
  color: #ffb300;
}

.error {
  text-align: center;
  color: red;
}

.no-rides {
  text-align: center;
  color: #ccc;
}

.content {
  background: rgba(34, 34, 34, 0.9);
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.content h2 {
  margin: 0 0 10px;
  color: #ffb300;
  text-shadow: 0px 0px 8px rgba(255, 179, 0, 0.8);
}

.content p {
  margin: 5px 0;
  color: #ddd;
}

.content strong {
  color: #ffbb40;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ffb300;
}

button {
  padding: 10px 15px;
  margin: 10px 0px 15px;
  border: none;
  border-radius: 5px;
  background-color: #ffb300;
  color: black;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition:
    background-color 0.3s,
    transform 0.2s,
    box-shadow 0.3s;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
}

button:hover {
  background-color: #ffbb40;
}

button:active {
  background-color: #de9b00;
  transform: scale(0.95);
}

.actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

button.primary {
  background-color: #ff9f00;
}

button.primary:hover {
  background-color: #ffae40;
}

button.primary:active {
  background-color: #d98b00;
}

button.secondary {
  background-color: #ffcc66;
  color: black;
}

button.secondary:hover {
  background-color: #ffdb8a;
}

button.secondary:active {
  background-color: #e6b354;
}

.map-container {
  height: 300px;
  margin-top: 10px;
  border: 1px solid #333;
  border-radius: 5px;
}
</style>
