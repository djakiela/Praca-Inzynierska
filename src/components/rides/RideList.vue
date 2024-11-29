<template>
  <div class="ride-list">
    <h1>Lista przejazdów</h1>
    <div v-if="loading" class="loading">Ładowanie...</div>
    <div v-if="error" class="error">{{ error }}</div>
    <div v-if="rides.length === 0 && !loading" class="no-rides">
      Brak przejazdów do wyświetlenia.
    </div>

    <ul v-if="rides.length > 0">
      <li v-for="(ride, index) in rides" :key="ride.id" class="ride-item">
        <h2>Przejazd: {{ ride.departure }} → {{ ride.destination }}</h2>
        <p>
          <strong>Dodano przez:</strong>
          {{ userNames[ride.userId] || "Nieznany użytkownik" }}
        </p>
        <p><strong>Data:</strong> {{ formatDate(ride.dateTime) }}</p>
        <p><strong>Miejsca:</strong> {{ ride.seats }}</p>

        <!-- Formularz rezerwacji -->
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

        <!-- Przyciski -->
        <button
          @click="
            reservationStatus[index]
              ? cancelReservation(index, ride.id)
              : makeReservation(index, ride.id)
          "
        >
          {{ reservationStatus[index] ? "Odwołaj rezerwację" : "Zarezerwuj" }}
        </button>

        <!-- Szczegóły przejazdu -->
        <div v-if="reservationStatus[index]" class="details">
          <p>
            <strong>Dokładny adres wyjazdu:</strong>
            {{ ride.exactDepartureAddress }}
          </p>
          <p>
            <strong>Dokładny adres dojazdu:</strong>
            {{ ride.exactDestinationAddress }}
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
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
    const loading = ref(true);
    const error = ref(null);

    // Pobierz przejazdy
    const fetchRides = async () => {
      try {
        const q = query(collection(db, "rides"), orderBy("dateTime", "asc"));
        const querySnapshot = await getDocs(q);

        rides.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Inicjalizuj stany
        reservationSeats.value = new Array(rides.value.length).fill(1);
        validationErrors.value = new Array(rides.value.length).fill("");
        reservationStatus.value = new Array(rides.value.length).fill(false);

        // Pobierz nazwy użytkowników
        const userIds = [...new Set(rides.value.map((ride) => ride.userId))];
        await fetchUserNames(userIds);

        // Sprawdź rezerwacje użytkownika
        if (currentUser) await fetchUserReservations();
      } catch (err) {
        error.value = "Nie udało się pobrać przejazdów: " + err.message;
      } finally {
        loading.value = false;
      }
    };

    // Pobierz nazwy użytkowników
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

    // Sprawdź rezerwacje użytkownika
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

    // Rezerwacja
    const makeReservation = async (index, rideId) => {
      const reservedSeats = reservationSeats.value[index];
      try {
        const rideRef = doc(db, "rides", rideId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
          const currentSeats = rideDoc.data().seats;
          if (currentSeats >= reservedSeats) {
            await updateDoc(rideRef, { seats: currentSeats - reservedSeats });

            // Dodaj rezerwację
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

    // Odwołaj rezerwację
    const cancelReservation = async (index, rideId) => {
      const reservedSeats = reservationSeats.value[index];
      try {
        const rideRef = doc(db, "rides", rideId);
        const rideDoc = await getDoc(rideRef);

        if (rideDoc.exists()) {
          const currentSeats = rideDoc.data().seats;

          await updateDoc(rideRef, { seats: currentSeats + reservedSeats });

          // Usuń rezerwację
          await deleteDoc(
            doc(db, "reservations", `${currentUser.uid}_${rideId}`)
          );

          rides.value[index].seats += reservedSeats;
          reservationStatus.value[index] = false;
        }
      } catch (err) {
        console.error("Błąd podczas odwoływania rezerwacji:", err);
      }
    };

    // Walidacja liczby miejsc
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

    onMounted(fetchRides);

    return {
      rides,
      userNames,
      reservationSeats,
      validationErrors,
      reservationStatus,
      loading,
      error,
      formatDate: (date) => new Date(date).toLocaleString("pl-PL"),
      makeReservation,
      cancelReservation,
      validateSeats,
    };
  },
};
</script>

<style scoped>
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
</style>
