<template>
    <div class="page">
      <div class="my-rides">
        <h1>Moje Przejazdy</h1>
        <div v-if="loading" class="loading">Ładowanie...</div>
        <div v-if="error" class="error">{{ error }}</div>
        <div v-if="rides.length === 0 && !loading" class="no-rides">
          Nie masz żadnych przejazdów.
        </div>
  
        <ul v-if="rides.length > 0">
          <li v-for="(ride, index) in rides" :key="ride.id" class="ride-item">
            <h2>Przejazd: {{ ride.departure }} → {{ ride.destination }}</h2>
            <p><strong>Data:</strong> {{ formatDate(ride.dateTime) }}</p>
            <p><strong>Pozostałe miejsca:</strong> {{ ride.seats }}</p>
  
            <!-- Lista rezerwacji -->
            <div class="reservations">
              <p><strong>Użytkownicy, którzy dokonali rezerwacji:</strong></p>
              <ul>
                <li v-for="(reservation, rIndex) in ride.reservations" :key="rIndex">
                  {{ userNames[reservation.userId] || "Nieznany użytkownik" }} - {{ reservation.seats }} miejsc
                </li>
              </ul>
            </div>
  
            <!-- Przycisk edycji -->
            <button @click="editRide(ride.id)">Edytuj przejazd</button>
  
            <!-- Szczegóły i wizualizacja mapy -->
            <div class="details">
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
  
            <!-- Kontener mapy -->
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
  import { ref, onMounted, nextTick } from "vue";
  import { db } from "@/firebaseConfig";
  import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
  import { getAuth } from "firebase/auth";
  
  export default {
    name: "MyRides",
    setup() {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      const rides = ref([]);
      const userNames = ref({}); // Mapa userId -> nazwa użytkownika
      const mapVisibility = ref([]);
      const loading = ref(true);
      const error = ref(null);
  
      const fetchUserRides = async () => {
        try {
          if (!currentUser) {
            error.value = "Musisz być zalogowany, aby zobaczyć swoje przejazdy.";
            return;
          }
  
          // Pobieranie przejazdów dodanych przez użytkownika
          const q = query(
            collection(db, "rides"),
            where("userId", "==", currentUser.uid)
          );
          const rideDocs = await getDocs(q);
  
          const ridesData = [];
          const reservationPromises = [];
  
          rideDocs.forEach((rideDoc) => {
            const ride = { ...rideDoc.data(), id: rideDoc.id };
            ridesData.push(ride);
  
            // Pobieranie rezerwacji dla każdego przejazdu
            const reservationsQuery = query(
              collection(db, "reservations"),
              where("rideId", "==", rideDoc.id)
            );
            reservationPromises.push(getDocs(reservationsQuery));
          });
  
          // Przetwarzanie danych rezerwacji
          const reservationResults = await Promise.all(reservationPromises);
          const userIds = new Set();
  
          reservationResults.forEach((resDoc, index) => {
            const reservations = [];
            resDoc.forEach((doc) => {
              const resData = doc.data();
              reservations.push({
                userId: resData.userId,
                seats: resData.seats,
              });
              userIds.add(resData.userId);
            });
            ridesData[index].reservations = reservations;
          });
  
          // Pobieranie nazw użytkowników
          await fetchUserNames([...userIds]);
  
          rides.value = ridesData;
          mapVisibility.value = new Array(rides.value.length).fill(false);
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
  
      const toggleMap = async (index, rideId) => {
        mapVisibility.value[index] = !mapVisibility.value[index];
        if (mapVisibility.value[index]) {
          await nextTick();
          visualizeRoute(rideId);
        } else {
          const mapElement = document.getElementById(`map-container-${rideId}`);
          if (mapElement) mapElement.innerHTML = "";
        }
      };
  
      const visualizeRoute = async (rideId) => {
        try {
          const ride = rides.value.find((r) => r.id === rideId);
          if (!ride) return;
  
          const origin = ride.exactDepartureAddress;
          const destination = ride.exactDestinationAddress;
  
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
              } else {
                console.error(`Błąd podczas wyznaczania trasy: ${status}`);
              }
            }
          );
        } catch (err) {
          console.error("Błąd podczas wizualizacji trasy:", err);
        }
      };
  
      const editRide = (rideId) => {
        console.log(`Edytuj przejazd o ID: ${rideId}`);
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
        userNames,
        mapVisibility,
        loading,
        error,
        formatDate,
        toggleMap,
        editRide,
      };
    },
  };
  </script>
  
  <style scoped>
  .page {
    padding: 30px 0;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: Arial, Helvetica, sans-serif;
    background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  }
  
  .my-rides {
    background-color: white;
    border-radius: 15px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    padding: 20px;
    width: 700px;
    max-width: 1000px;
    margin: 0 auto;
  }
  
  h1 {
    text-align: center;
    color: #333;
    font-size: 2rem;
    margin-bottom: 20px;
  }
  
  .my-rides ul {
    list-style: none; 
    margin: 0;
    padding: 0;
  }
  
  .ride-item {
    background-color: white;
    border: 1px solid #ddd;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  
  .ride-item h2 {
    font-size: 1.5rem;
    color: #05445e;
    margin-bottom: 10px;
  }
  
  .ride-item p {
    font-size: 1rem;
    color: #54626f;
    margin: 5px 0;
  }
  
  .ride-item strong {
    color: #333;
  }
  
  .reservations {
    margin-top: 15px;
  }
  
  .reservations p {
    font-size: 1rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 10px;
  }
  
  .reservations ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .reservations ul li {
    font-size: 1rem;
    color: #54626f;
    margin-left: 15px;
  }
  
  button {
    padding: 0.8rem 1.5rem;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
  }
  
  button:hover {
    transform: translateY(-3px);
  }
  
  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  button:nth-of-type(1) {
    background-color: #189ab4;
    color: white;
  }
  
  button:nth-of-type(1):hover {
    background-color: #00b3b8;
  }
  
  button:nth-of-type(2) {
    background-color: #05445e;
    color: white;
  }
  
  button:nth-of-type(2):hover {
    background-color: #006b7f;
  }
  
  .details {
    margin-top: 15px;
    padding: 15px;
    border-top: 3px solid #c9c9c9;
    background-color: white;
    border-radius: 8px;
    padding-left: 0;
  }
  
  .details p {
    font-size: 0.95rem;
    color: #3b444b;
  }
  
  .map-container {
    width: 100%;
    height: 400px;
    margin-top: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
    border-radius: 8px;
    margin: 0 5px;
    padding: 5px 10px;
    font-size: 1rem;
    color: #54626f;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
  }
  
  .pagination button:hover {
    background-color: #189ab4;
    color: white;
    transform: translateY(-2px);
  }
  
  .pagination button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  .pagination button.active {
    background-color: #05445e;
    color: white;
    font-weight: bold;
  }
  </style>
  