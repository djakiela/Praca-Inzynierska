<template>
  <body class="page">
    <main class="ride-list">
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
        class="ride-item"
      >
        <h2>Przejazd: {{ ride.departure }} → {{ ride.destination }}</h2>

        <section class="user-info">
          <img
            :src="userAvatars[ride.userId] || defaultAvatar"
            alt="Avatar"
            class="avatar"
          />
          <p>
            <strong>Dodano przez:</strong>
            {{ userNames[ride.userId] || "Nieznany użytkownik" }}
          </p>
        </section>

        <p><strong>Data:</strong> {{ formatDate(ride.dateTime) }}</p>
        <p><strong>Miejsca:</strong> {{ ride.seats }}</p>

        <section>
          <template v-if="ride.userId === currentUser?.uid">
            <p class="info-message">
              Ten przejazd należy do Ciebie. Możesz go sprawdzić w sekcji
              <strong>Moje przejazdy</strong>.
            </p>
            <button @click="goToMyRides" class="my-rides-btn">
              Przejdź do moich przejazdów
            </button>
          </template>

          <template v-else>
            <div v-if="!reservationStatus[index]" class="reservation-box">
              <label>Liczba miejsc do rezerwacji:</label>
              <input
                class="seats-input"
                type="number"
                v-model.number="reservationSeats[ride.id]"
                :max="ride.seats"
                :min="1"
                @input="validateSeats(ride.id, ride.seats)"
              />
              <p v-if="validationErrors[index]" class="error">
                {{ validationErrors[index] }}
              </p>
            </div>

            <button
              @click="
                reservationStatus[ride.id]
                  ? cancelReservation(ride.id)
                  : makeReservation(ride.id)
              "
            >
              {{
                reservationStatus[ride.id] ? "Odwołaj rezerwację" : "Zarezerwuj"
              }}
            </button>
          </template>
        </section>

        <section class="details" v-if="reservationStatus[ride.id]">
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
          <button @click="toggleMap(ride.id)">
            {{ mapVisibility[ride.id] ? "Ukryj mapę" : "Wizualizacja trasy" }}
          </button>
        </section>
        <div
          v-if="mapVisibility[ride.id]"
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
    </main>
  </body>
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

    const toggleMap = (rideId) => {
      mapVisibility.value[rideId] = !mapVisibility.value[rideId];

      if (mapVisibility.value[rideId]) {
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
        loading.value = true;
        const q = query(collection(db, "rides"), orderBy("dateTime", "asc"));
        const querySnapshot = await getDocs(q);

        rides.value = querySnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((ride) => ride.seats > 0);

        // Inicjalizacja stanu dla rezerwacji
        for (const ride of rides.value) {
          if (!(ride.id in reservationSeats.value)) {
            reservationSeats.value[ride.id] = 1;
          }
          reservationStatus.value[ride.id] = false;
          mapVisibility.value[ride.id] = false;
        }

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
            userPhones.value[id] =
              userData.phonenumber || "Brak numeru telefonu";

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
            userPhones.value[id] = "Brak numeru telefonu";
          }
        } catch {
          userNames.value[id] = "Nieznany użytkownik";
          userAvatars.value[id] = defaultAvatar;
          userPhones.value[id] = "Brak numeru telefonu";
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
        reservationStatus.value[reservation.rideId] = true;
        reservationSeats.value[reservation.rideId] = reservation.seats;
      });
    };

    const makeReservation = async (rideId) => {
      try {
        const reservedSeats = reservationSeats.value[rideId];

        if (!reservedSeats || reservedSeats <= 0) {
          console.error("Niepoprawna liczba miejsc do rezerwacji.");
          return;
        }

        const rideRef = doc(db, "rides", rideId);
        const rideDoc = await getDoc(rideRef);

        if (!rideDoc.exists()) {
          console.error("Przejazd nie istnieje.");
          return;
        }

        const currentSeats = rideDoc.data().seats;

        if (currentSeats < reservedSeats) {
          console.error("Nie ma wystarczającej liczby miejsc.");
          return;
        }

        await updateDoc(rideRef, { seats: currentSeats - reservedSeats });

        await setDoc(doc(db, "reservations", `${currentUser.uid}_${rideId}`), {
          rideId,
          userId: currentUser.uid,
          seats: reservedSeats,
        });

        const rideIndex = rides.value.findIndex((r) => r.id === rideId);
        if (rideIndex !== -1) {
          rides.value[rideIndex].seats -= reservedSeats;
        }

        reservationStatus.value[rideId] = true;

        if (rides.value[rideIndex].seats === 0) {
          rides.value = rides.value.filter((r) => r.id !== rideId);
          delete reservationStatus.value[rideId];
        }
      } catch (err) {
        console.error("Błąd podczas rezerwacji:", err);
      }
    };

    const cancelReservation = async (rideId) => {
      try {
        const reservationRef = doc(
          db,
          "reservations",
          `${currentUser.uid}_${rideId}`,
        );
        const reservationDoc = await getDoc(reservationRef);

        if (reservationDoc.exists()) {
          const reservedSeats = reservationDoc.data().seats;
          const rideRef = doc(db, "rides", rideId);
          const rideDoc = await getDoc(rideRef);

          if (rideDoc.exists()) {
            const currentSeats = rideDoc.data().seats;
            await updateDoc(rideRef, { seats: currentSeats + reservedSeats });

            await deleteDoc(reservationRef);

            if (rides.value.find((r) => r.id === rideId)) {
              rides.value.find((r) => r.id === rideId).seats += reservedSeats;
            }

            reservationStatus.value[rideId] = false;

            mapVisibility.value[rideId] = false;
            const mapElement = document.getElementById(
              `map-container-${rideId}`,
            );
            if (mapElement) mapElement.innerHTML = "";
          }
        }
      } catch (err) {
        console.error("Błąd podczas anulowania rezerwacji:", err);
      }
    };

    const validateSeats = (rideId, availableSeats) => {
      if (reservationSeats.value[rideId] > availableSeats) {
        validationErrors.value[rideId] =
          `Nie można zarezerwować więcej niż ${availableSeats} miejsc.`;
        reservationSeats.value[rideId] = availableSeats;
      } else if (reservationSeats.value[rideId] < 1) {
        validationErrors.value[rideId] =
          "Musisz zarezerwować przynajmniej 1 miejsce.";
        reservationSeats.value[rideId] = 1;
      } else {
        validationErrors.value[rideId] = "";
      }
    };

    const setPage = (page) => {
      currentPage.value = page;
    };

    const goToMyRides = () => {
      router.push("/my-rides");
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
  align-items: center;
  color: white;
  display: flex;
  justify-content: center;
}

.ride-list {
  font-family: Arial, Helvetica, sans-serif;
  max-width: 1000px;
  width: 100%;
  background: rgba(51, 51, 51, 0.95);
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  padding: 20px;
  padding-right: 45px;
  margin-bottom: 25px;
}

.seats-input {
  width: 30px;
  margin-left: 10px;
  background: #2b2b2b !important;
  color: white !important;
  outline: none;
  transition: border-color 0.2s ease;
  border-radius: 8px;
}

.seats-input:focus {
  border-color: #ffb300;
}

h1 {
  text-align: center;
  color: white;
  text-shadow: 0px 0px 10px rgba(0, 0, 0, 0.8);
}

.ride-item {
  background: rgba(34, 34, 34, 0.9);
  padding: 25px;
  margin-bottom: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  min-height: 350px;
  min-width: 500px;
  width: 95%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.ride-item h2 {
  margin: 0 0 10px;
  color: #ffb300;
  text-shadow: 0px 0px 8px rgba(255, 179, 0, 0.8);
}

.ride-item p {
  margin: 5px 0;
  color: #ddd;
}

.ride-item strong {
  color: #ffbb40;
}

.details {
  background: rgba(40, 40, 40, 0.9);
  padding: 10px;
  border-radius: 8px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.pagination button {
  background-color: #ffb300;
  border: none;
  padding: 10px 15px;
  margin: 5px;
  cursor: pointer;
  font-weight: bold;
}

.pagination button:hover {
  background-color: #ffbb40;
}

.pagination button.active {
  background-color: #de9b00;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid #ffb300;
}

button {
  padding: 12px 18px;
  margin: 12px 0px 15px;
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

.map-container {
  height: 300px;
  margin-top: 10px;
  border: 1px solid #333;
  border-radius: 5px;
}
</style>
