<template>
  <div class="page">
    <div class="my-rides">
      <h1>Twoje dodane przejazdy</h1>
      <div v-if="loading" class="loading">Ładowanie...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-if="rides.length === 0 && !loading" class="no-rides">
        Brak aktywnych przejazdów.
      </div>

      <ul v-if="rides.length > 0">
        <!-- eslint-disable-next-line vue/no-unused-vars -->
        <li v-for="(ride, index) in rides" :key="ride.id" class="ride-item">
          <h2>Przejazd: {{ ride.departure }} → {{ ride.destination }}</h2>
          <p><strong>Data:</strong> {{ formatDate(ride.dateTime) }}</p>
          <p><strong>Miejsca:</strong> {{ ride.seats }}</p>

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
    </div>
  </div>
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

export default {
  name: "MyRides",
  setup() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const rides = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchUserRides = async () => {
      try {
        if (!currentUser) {
          error.value = "Musisz być zalogowany, aby zobaczyć swoje przejazdy.";
          return;
        }

        // Pobierz przejazdy użytkownika
        const q = query(
          collection(db, "rides"),
          where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        const ridePromises = querySnapshot.docs.map(async (doc) => {
          const rideData = { id: doc.id, ...doc.data() };

          // Pobierz rezerwacje dla każdego przejazdu
          const reservationsQuery = query(
            collection(db, "reservations"),
            where("rideId", "==", rideData.id)
          );
          const reservationsSnapshot = await getDocs(reservationsQuery);

          // Pobierz wszystkich użytkowników
          const userIds = reservationsSnapshot.docs.map(
            (doc) => doc.data().userId
          );

          // Sprawdzamy, czy `userIds` jest puste
          let userMap = {};
          if (userIds.length > 0) {
            const userQuery = query(
              collection(db, "users"),
              where("__name__", "in", userIds)
            );
            const userSnapshot = await getDocs(userQuery);

            // Mapujemy użytkowników na podstawie ich `userId`
            userSnapshot.forEach((doc) => {
              const userData = doc.data();
              userMap[doc.id] = {
                username: userData.username || "Nieznany użytkownik",
                phone: userData.phonenumber || "Brak numeru telefonu",
              };
            });
          }

          // Połącz rezerwacje z nazwami użytkowników i numerami telefonów
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
            }
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
      console.log(`Edytowanie przejazdu o ID: ${rideId}`);
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
      formatDate,
      deleteRide,
      editRide,
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

.my-rides {
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
  margin: 5px;
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

.actions {
  margin-top: 10px;
}
</style>
