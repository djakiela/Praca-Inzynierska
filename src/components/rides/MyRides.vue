<template>
  <body class="page">
    <div v-if="editingRideId">
      <EditRide :rideId="editingRideId" @close="closeEditor" />
    </div>
    <main v-else class="rides">
      <h1>Twoje dodane przejazdy</h1>
      <div v-if="loading" class="loading">Ładowanie...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="rides.length === 0 && !loading" class="no-rides">
        Brak aktywnych przejazdów.
      </div>

      <ul v-if="rides.length > 0">
        <li v-for="ride in rides" :key="ride.id" class="conent">
          <h2>Przejazd: {{ ride.departure }} → {{ ride.destination }}</h2>
          <p><strong>Data:</strong> {{ formatDate(ride.dateTime) }}</p>
          <p><strong>Wolne miejsca:</strong> {{ ride.seats }}</p>

          <div class="details">
            <p>
              <strong>Dokładny adres wyjazdu:</strong>
              {{ ride.exactDepartureAddress }}
            </p>
            <p>
              <strong>Dokładny adres dojazdu:</strong>
              {{ ride.exactDestinationAddress }}
            </p>
            <div v-if="ride.reservations && ride.reservations.length > 0">
              <h4>Użytkownicy, którzy zarezerwowali miejsca:</h4>
              <ul>
                <li v-for="user in ride.reservations" :key="user.userId">
                  <strong>{{ user.username }}</strong>
                  <ul>
                    <li>
                      • Numer telefonu:
                      {{ user.phone || "Brak numeru telefonu" }}
                    </li>
                    <li>• Zarezerwowane miejsca: {{ user.seats }}</li>
                  </ul>
                </li>
              </ul>
            </div>
          </div>

          <!-- Przyciski akcji -->
          <div class="actions">
            <button @click="editRide(ride.id)">Edytuj</button>
            <button @click="deleteRide(ride.id)">Odwołaj przejazd</button>
          </div>
        </li>
      </ul>
    </main>
  </body>
</template>

<script>
import { ref, onMounted } from "vue";
import { db } from "@/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import EditRide from "@/components/rides/EditRide.vue";

export default {
  name: "MyRides",
  components: { EditRide },
  setup() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const rides = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const editingRideId = ref(null);

    const fetchUserRides = async () => {
      try {
        if (!currentUser) {
          error.value = "Musisz być zalogowany, aby zobaczyć swoje przejazdy.";
          return;
        }

        const q = query(
          collection(db, "rides"),
          where("userId", "==", currentUser.uid),
        );
        const querySnapshot = await getDocs(q);

        const ridePromises = querySnapshot.docs.map(async (doc) => {
          const rideData = { id: doc.id, ...doc.data() };

          const reservationsQuery = query(
            collection(db, "reservations"),
            where("rideId", "==", rideData.id),
          );
          const reservationsSnapshot = await getDocs(reservationsQuery);

          const userIds = reservationsSnapshot.docs.map(
            (doc) => doc.data().userId,
          );

          let userMap = {};
          if (userIds.length > 0) {
            const userQuery = query(
              collection(db, "users"),
              where("__name__", "in", userIds),
            );
            const userSnapshot = await getDocs(userQuery);

            userSnapshot.forEach((doc) => {
              const userData = doc.data();
              userMap[doc.id] = {
                username: userData.username || "Nieznany użytkownik",
                phone: userData.phonenumber || "Brak numeru telefonu",
              };
            });
          }

          const reservations = reservationsSnapshot.docs.map(
            (reservationDoc) => {
              const reservationData = reservationDoc.data();
              return {
                ...reservationData,
                username:
                  userMap[reservationData.userId]?.username ||
                  "Nieznany użytkownik",
                phone:
                  userMap[reservationData.userId]?.phone ||
                  "Brak numeru telefonu",
              };
            },
          );

          rideData.reservations = reservations;
          return rideData;
        });

        rides.value = await Promise.all(ridePromises);
      } catch (err) {
        console.error(err);
        error.value = "Nie udało się pobrać przejazdów.";
      } finally {
        loading.value = false;
      }
    };

    const deleteRide = async (rideId) => {
      try {
        await deleteDoc(doc(db, "rides", rideId));
        rides.value = rides.value.filter((ride) => ride.id !== rideId);
      } catch (err) {
        console.error("Nie udało się usunąć przejazdu:", err);
      }
    };

    const editRide = (rideId) => {
      editingRideId.value = rideId;
    };

    const closeEditor = () => {
      editingRideId.value = null;
    };

    const formatDate = (dateString) => {
      const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return new Date(dateString).toLocaleDateString("pl-PL", options);
    };

    onMounted(fetchUserRides);

    return {
      rides,
      loading,
      error,
      editingRideId,
      formatDate,
      deleteRide,
      editRide,
      closeEditor,
    };
  },
};
</script>

<style scoped>
/* Ogólny styl strony */
.page {
  min-height: 100vh;
  padding-top: 60px;
  padding-bottom: 30px;
  align-items: center;
  background-color: #222; /* Ciemne tło */
  color: white;
}

.rides {
  font-family: Arial, Helvetica, sans-serif;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  background: rgba(51, 51, 51, 0.9); /* Przejrzyste, eleganckie tło */
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

/* Styl listy */
ul {
  list-style-type: none;
  padding: 0;
}

/* Karta przejazdu */
.conent {
  background: rgba(34, 34, 34, 0.9); /* Spójny z całą stroną */
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
  padding: 15px 25px;
  border: none;
  border-radius: 5px;
  background-color: #ffb300; /* Kolor jak w headerze */
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

/* Przyciski w sekcji akcji */
.actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* Alternatywny styl dla ważniejszych przycisków */
button.primary {
  background-color: #ff9f00;
}

button.primary:hover {
  background-color: #ffae40;
}

button.primary:active {
  background-color: #d98b00;
}

/* Przyciski drugorzędne */
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

/* Sekcja działań */
.actions {
  margin-top: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
}

/* Ulepszone wyrównanie i przestrzeń */
section {
  display: flex;
  align-items: flex-start;
}

.ride-list {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-left: 50px;
}
</style>
