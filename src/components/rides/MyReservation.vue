<template>
  <body class="page">
    <section class="reservation">
      <div v-if="loading" class="loading">Ładowanie...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="rides.length === 0 && !loading" class="no-rides">
        Brak aktywnych rezerwacji.
      </div>

      <ul v-if="rides.length > 0">
        <h1>Twoje rezerwacje</h1>
        <li v-for="(ride, index) in rides" :key="ride.id" class="conent">
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
          <div
            v-if="mapVisibility[index]"
            :id="'map-container-' + ride.id"
            class="map-container"
          ></div>
        </li>
      </ul>
    </section>
  </body>
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
import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
} from "firebase/storage";

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
    const userAvatars = ref({});
    const userNames = ref({});
    const defaultAvatar = "/avatar.png";
    const storage = getStorage();

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
          where("userId", "==", currentUser.uid),
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

        // Zbierz wszystkie ID użytkowników z przejazdów
        rides.value.forEach((ride) => {
          if (ride.userId) userIds.add(ride.userId);
        });

        // Pobierz dane użytkowników, w tym avatary i nazwy
        await fetchUserDetailsAndAvatars(Array.from(userIds));
      } catch (err) {
        error.value = "Nie udało się pobrać rezerwacji: " + err.message;
      } finally {
        loading.value = false;
      }
    };

    // Nowa funkcja do pobierania szczegółów użytkowników i avatarów
    const fetchUserDetailsAndAvatars = async (userIds) => {
      const userPromises = userIds.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userNames.value[userId] =
              userData.username || "Nieznany użytkownik";
            userPhones.value[userId] =
              userData.phonenumber || "Brak numeru telefonu";

            // Pobieramy avatar użytkownika z Firebase Storage
            const avatarPath = `imgu/${userId}.jpg`; // Avatar w katalogu `imgu/`
            const avatarRef = storageRef(storage, avatarPath);

            try {
              const avatarUrl = await getDownloadURL(avatarRef);
              userAvatars.value[userId] = avatarUrl;
            } catch {
              userAvatars.value[userId] = defaultAvatar; // Jeśli avatar nie istnieje, używamy domyślnego
            }
          } else {
            userNames.value[userId] = "Nieznany użytkownik";
            userAvatars.value[userId] = defaultAvatar;
            userPhones.value[userId] = "Brak numeru telefonu";
          }
        } catch (err) {
          console.error("Błąd podczas pobierania danych użytkownika:", err);
          userNames.value[userId] = "Nieznany użytkownik";
          userAvatars.value[userId] = defaultAvatar;
          userPhones.value[userId] = "Brak numeru telefonu";
        }
      });

      await Promise.all(userPromises);
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
            doc(db, "reservations", reservations.value[index].id),
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
      userNames,
      userAvatars,
      defaultAvatar,
      currentUser,
    };
  },
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-top: 60px;
  padding-bottom: 30px;
  align-items: center;
  background-color: #222;
  color: white;
}

.reservation {
  font-family: Arial, Helvetica, sans-serif;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: rgba(51, 51, 51, 0.9);
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  margin-top: 30px;
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
ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.conent {
  background: rgba(34, 34, 34, 0.9);
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.conent h2 {
  margin: 0 0 10px;
  color: #ffb300;
  text-shadow: 0px 0px 8px rgba(255, 179, 0, 0.8);
}

.conent p {
  margin: 5px 0;
  color: #ddd;
}

.conent strong {
  color: #ffbb40;
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

.actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

section {
  align-items: flex-start;
}

.ride-list {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-left: 50px;
}

.map-container {
  height: 300px;
  margin-top: 10px;
  border: 1px solid #333;
  border-radius: 5px;
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
</style>
