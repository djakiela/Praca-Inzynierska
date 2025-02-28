<template>
  <body class="page">
    <div class="container">
      <div class="admin-sidebar">
        <h2>Panel administratora</h2>
        <div class="admin-menu">
          <button
            @click="activeTab = 'rides'"
            :class="{ active: activeTab === 'rides' }"
            class="admin-menu-btn"
          >
            Przejazdy
          </button>
          <button
            @click="activeTab = 'users'"
            :class="{ active: activeTab === 'users' }"
            class="admin-menu-btn"
          >
            Użytkownicy
          </button>
        </div>
      </div>

      <main class="admin-content">
        <!-- Zarządzanie przejazdami -->
        <div v-if="activeTab === 'rides'">
          <div class="admin-header">
            <h1>Zarządzanie przejazdami</h1>
            <div class="admin-filters">
              <!-- Filtrowanie przejazdów -->
              <div class="filter-group">
                <input
                  v-model="rideFilters.search"
                  type="text"
                  placeholder="Szukaj (miejsce wyjazdu, docelowe lub ID)"
                  class="admin-filter-input"
                />
                <label class="checkbox-label filter-option">
                  <input type="checkbox" v-model="rideFilters.searchById" />
                  Wyszukaj po ID
                </label>
                <select
                  v-model="rideFilters.sortBy"
                  class="admin-filter-select"
                >
                  <option value="dateTimeAsc">Data: rosnąco</option>
                  <option value="dateTimeDesc">Data: malejąco</option>
                  <option value="seatsAsc">Dostępne miejsca: rosnąco</option>
                  <option value="seatsDesc">Dostępne miejsca: malejąco</option>
                </select>
                <button @click="applyRideFilters" class="admin-btn primary">
                  Filtruj
                </button>
                <button @click="resetRideFilters" class="admin-btn secondary">
                  Resetuj
                </button>
              </div>
            </div>
          </div>

          <div v-if="loading" class="loading">Ładowanie danych...</div>
          <div v-else-if="filteredRides.length === 0" class="no-data">
            Brak przejazdów spełniających kryteria.
          </div>

          <div v-else class="rides-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Wyjazd</th>
                  <th>Cel</th>
                  <th>Miejsca</th>
                  <th>Dodano przez</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="ride in filteredRides" :key="ride.id">
                  <td class="id-cell">
                    <span>{{ shortId(ride.id) }}</span>
                    <button
                      @click="copyToClipboard(ride.id)"
                      class="copy-btn"
                      title="Kopiuj ID"
                    >
                      <span class="icon">📋</span>
                    </button>
                  </td>
                  <td>{{ formatDate(ride.dateTime) }}</td>
                  <td>{{ ride.departure }}</td>
                  <td>{{ ride.destination }}</td>
                  <td>{{ ride.seats }}</td>
                  <td class="user-cell">
                    <div class="user-info-cell">
                      <img
                        :src="userAvatars[ride.userId] || defaultAvatar"
                        alt="Avatar"
                        class="avatar-small"
                      />
                      <span>{{ userNames[ride.userId] || "Nieznany" }}</span>
                    </div>
                  </td>
                  <td class="actions">
                    <button @click="editRide(ride)" class="admin-btn small">
                      Edytuj
                    </button>
                    <button
                      @click="deleteRide(ride.id)"
                      class="admin-btn small danger"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Modal do edycji przejazdu -->
          <div v-if="showRideModal" class="modal">
            <div class="modal-content">
              <span class="close" @click="closeRideModal">&times;</span>
              <h2>
                {{ editedRide.id ? "Edytuj przejazd" : "Dodaj przejazd" }}
              </h2>

              <div class="form-group">
                <label>ID przejazdu:</label>
                <div class="copy-field">
                  <input
                    type="text"
                    :value="editedRide.id"
                    disabled
                    class="form-input"
                  />
                  <button
                    @click="copyToClipboard(editedRide.id)"
                    class="copy-btn-inline"
                    title="Kopiuj ID"
                  >
                    <span class="icon">📋</span>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Miejsce wyjazdu:</label>
                <input
                  v-model="editedRide.departure"
                  type="text"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Miejsce docelowe:</label>
                <input
                  v-model="editedRide.destination"
                  type="text"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Data i czas:</label>
                <input
                  v-model="editedRide.dateTime"
                  type="datetime-local"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Liczba miejsc:</label>
                <input
                  v-model.number="editedRide.seats"
                  type="number"
                  min="1"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Dokładny adres wyjazdu:</label>
                <input
                  v-model="editedRide.exactDepartureAddress"
                  type="text"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Dokładny adres docelowy:</label>
                <input
                  v-model="editedRide.exactDestinationAddress"
                  type="text"
                  class="form-input"
                />
              </div>

              <!-- Rezerwacje -->
              <div class="form-group reservation-section" v-if="editedRide.id">
                <label>Rezerwacje:</label>
                <div
                  v-if="rideReservations.length === 0"
                  class="no-reservations"
                >
                  Brak rezerwacji dla tego przejazdu.
                </div>
                <div v-else class="reservations-list">
                  <div
                    v-for="(reservation, index) in rideReservations"
                    :key="index"
                    class="reservation-item"
                  >
                    <div class="reservation-details">
                      <div class="reservation-id">
                        <span
                          >ID Użytkownika:
                          {{
                            shortId(
                              extractUserIdFromReservation(reservation.id),
                            )
                          }}</span
                        >
                        <button
                          @click="copyUserIdFromReservation(reservation.id)"
                          class="copy-btn"
                          title="Kopiuj ID użytkownika"
                        >
                          <span class="icon">📋</span>
                        </button>
                      </div>
                      <div class="user-info-cell">
                        <img
                          :src="
                            userAvatars[reservation.userId] || defaultAvatar
                          "
                          alt="Avatar"
                          class="avatar-small"
                        />
                        <span>{{
                          userNames[reservation.userId] || "Nieznany"
                        }}</span>
                      </div>
                      <span>Miejsca: {{ reservation.seats }}</span>
                    </div>
                    <button
                      @click="deleteReservation(reservation.id)"
                      class="admin-btn small danger"
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              </div>

              <div class="form-actions">
                <button @click="saveRide" class="admin-btn primary">
                  Zapisz
                </button>
                <button @click="closeRideModal" class="admin-btn secondary">
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Zarządzanie użytkownikami -->
        <div v-if="activeTab === 'users'">
          <div class="admin-header">
            <h1>Zarządzanie użytkownikami</h1>
            <div class="admin-filters">
              <div class="filter-group">
                <input
                  v-model="userFilters.search"
                  type="text"
                  placeholder="Szukaj (nazwa użytkownika, email lub ID)"
                  class="admin-filter-input"
                />
                <label class="checkbox-label filter-option">
                  <input type="checkbox" v-model="userFilters.searchById" />
                  Wyszukaj po ID
                </label>
                <button @click="applyUserFilters" class="admin-btn primary">
                  Filtruj
                </button>
                <button @click="resetUserFilters" class="admin-btn secondary">
                  Resetuj
                </button>
              </div>
            </div>
          </div>

          <div v-if="loadingUsers" class="loading">
            Ładowanie użytkowników...
          </div>
          <div v-else-if="filteredUsers.length === 0" class="no-data">
            Brak użytkowników spełniających kryteria.
          </div>

          <div v-else class="users-table-container">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nazwa użytkownika</th>
                  <th>Email</th>
                  <th>Telefon</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.id">
                  <td class="id-cell">
                    <span>{{ shortId(user.id) }}</span>
                    <button
                      @click="copyToClipboard(user.id)"
                      class="copy-btn"
                      title="Kopiuj ID"
                    >
                      <span class="icon">📋</span>
                    </button>
                  </td>
                  <td class="user-cell">
                    <div class="user-info-cell">
                      <img
                        :src="userAvatars[user.id] || defaultAvatar"
                        alt="Avatar"
                        class="avatar-small"
                      />
                      <span>{{ user.username || "Brak nazwy" }}</span>
                    </div>
                  </td>
                  <td>{{ user.email }}</td>
                  <td>{{ user.phonenumber || "Brak numeru" }}</td>
                  <td>
                    <span
                      :class="['status-badge', user.isAdmin ? 'admin' : 'user']"
                    >
                      {{ user.isAdmin ? "Administrator" : "Użytkownik" }}
                    </span>
                  </td>
                  <td class="actions">
                    <button @click="editUser(user)" class="admin-btn small">
                      Edytuj
                    </button>
                    <button
                      @click="toggleAdminStatus(user)"
                      class="admin-btn small"
                      :class="user.isAdmin ? 'warning' : 'success'"
                    >
                      {{ user.isAdmin ? "Usuń admina" : "Nadaj admina" }}
                    </button>
                    <button
                      @click="deleteUser(user.id)"
                      class="admin-btn small danger"
                    >
                      Usuń konto
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Modal do edycji użytkownika -->
          <div v-if="showUserModal" class="modal">
            <div class="modal-content">
              <span class="close" @click="closeUserModal">&times;</span>
              <h2>Edytuj użytkownika</h2>

              <div class="form-group">
                <label>ID użytkownika:</label>
                <div class="copy-field">
                  <input
                    type="text"
                    :value="editedUser.id"
                    disabled
                    class="form-input"
                  />
                  <button
                    @click="copyToClipboard(editedUser.id)"
                    class="copy-btn-inline"
                    title="Kopiuj ID"
                  >
                    <span class="icon">📋</span>
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>Avatar:</label>
                <div class="avatar-edit">
                  <img
                    :src="editedUserAvatar || defaultAvatar"
                    alt="Avatar"
                    class="avatar-preview"
                  />
                  <div class="avatar-actions">
                    <label for="avatar-upload" class="upload-btn">
                      Zmień avatar
                      <input
                        id="avatar-upload"
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        @change="handleAvatarUpload"
                        style="display: none"
                      />
                    </label>
                    <button
                      @click="removeAvatar"
                      class="admin-btn small danger"
                    >
                      Usuń avatar
                    </button>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Nazwa użytkownika:</label>
                <input
                  v-model="editedUser.username"
                  type="text"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Email:</label>
                <input
                  v-model="editedUser.email"
                  type="email"
                  class="form-input"
                  disabled
                />
              </div>

              <div class="form-group">
                <label>Numer telefonu:</label>
                <input
                  v-model="editedUser.phonenumber"
                  type="text"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input v-model="editedUser.isAdmin" type="checkbox" />
                  Administrator
                </label>
              </div>

              <div class="form-actions">
                <button @click="saveUser" class="admin-btn primary">
                  Zapisz
                </button>
                <button @click="closeUserModal" class="admin-btn secondary">
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Powiadomienie o skopiowaniu -->
    <div v-if="showCopyNotification" class="copy-notification">
      Skopiowano do schowka!
    </div>
  </body>
</template>

<script>
import { ref, reactive, computed, onMounted } from "vue";
import { db, storage } from "@/firebaseConfig";
import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  where,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export default {
  name: "AdminPanel",
  setup() {
    const activeTab = ref("rides");
    const loading = ref(true);
    const loadingUsers = ref(true);
    const rides = ref([]);
    const users = ref([]);
    const userNames = ref({});
    const userAvatars = ref({});
    const defaultAvatar = "/avatar.png";
    const showCopyNotification = ref(false);

    // Filtry dla przejazdów
    const rideFilters = reactive({
      search: "",
      sortBy: "dateTimeAsc",
      searchById: false,
    });

    // Filtry dla użytkowników
    const userFilters = reactive({
      search: "",
      searchById: false,
    });

    // Stan modala dla przejazdów
    const showRideModal = ref(false);
    const editedRide = reactive({
      id: "",
      departure: "",
      destination: "",
      dateTime: "",
      seats: 1,
      exactDepartureAddress: "",
      exactDestinationAddress: "",
      userId: "",
    });

    // Rezerwacje dla wybranego przejazdu
    const rideReservations = ref([]);

    // Stan modala dla użytkowników
    const showUserModal = ref(false);
    const editedUser = reactive({
      id: "",
      username: "",
      email: "",
      phonenumber: "",
      isAdmin: false,
    });

    // Tymczasowy avatar dla edytowanego użytkownika
    const editedUserAvatar = ref(null);
    const newAvatarFile = ref(null);

    // Przefiltrowane przejazdy
    const filteredRides = computed(() => {
      let result = [...rides.value];

      // Filtrowanie wg tekstu lub ID
      if (rideFilters.search) {
        if (rideFilters.searchById) {
          // Filtrowanie po ID przejazdu
          result = result.filter((ride) =>
            ride.id.includes(rideFilters.search),
          );
        } else {
          // Standardowe filtrowanie po miejscach
          const searchLower = rideFilters.search.toLowerCase();
          result = result.filter(
            (ride) =>
              ride.departure.toLowerCase().includes(searchLower) ||
              ride.destination.toLowerCase().includes(searchLower),
          );
        }
      }

      // Sortowanie
      switch (rideFilters.sortBy) {
        case "dateTimeAsc":
          result.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
          break;
        case "dateTimeDesc":
          result.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
          break;
        case "seatsAsc":
          result.sort((a, b) => a.seats - b.seats);
          break;
        case "seatsDesc":
          result.sort((a, b) => b.seats - a.seats);
          break;
      }

      return result;
    });

    // Przefiltrowane użytkownicy
    const filteredUsers = computed(() => {
      let result = [...users.value];

      if (userFilters.search) {
        const searchLower = userFilters.search.toLowerCase();
        result = result.filter((user) => {
          // Filtrowanie po ID jeśli zaznaczono opcję
          if (userFilters.searchById) {
            return user.id.includes(userFilters.search);
          }

          // Standardowe filtrowanie po nazwie lub emailu
          return (
            (user.username &&
              user.username.toLowerCase().includes(searchLower)) ||
            (user.email && user.email.toLowerCase().includes(searchLower))
          );
        });
      }

      return result;
    });

    // Pobieranie przejazdów
    const fetchRides = async () => {
      try {
        loading.value = true;
        const q = query(collection(db, "rides"), orderBy("dateTime", "asc"));
        const querySnapshot = await getDocs(q);

        rides.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Pobierz nazwy użytkowników
        const userIds = [...new Set(rides.value.map((ride) => ride.userId))];
        await fetchUserDetails(userIds);
      } catch (error) {
        console.error("Błąd podczas pobierania przejazdów:", error);
      } finally {
        loading.value = false;
      }
    };

    // Pobieranie użytkowników
    const fetchUsers = async () => {
      try {
        loadingUsers.value = true;
        const q = query(collection(db, "users"));
        const querySnapshot = await getDocs(q);

        users.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Pobierz avatary dla wszystkich użytkowników
        const userIds = users.value.map((user) => user.id);
        await fetchUserAvatars(userIds);
      } catch (error) {
        console.error("Błąd podczas pobierania użytkowników:", error);
      } finally {
        loadingUsers.value = false;
      }
    };

    // Pobierz szczegóły użytkowników (nazwy i avatary)
    const fetchUserDetails = async (userIds) => {
      const promises = userIds.map(async (userId) => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            userNames.value[userId] =
              userDoc.data().username || "Nieznany użytkownik";
          } else {
            userNames.value[userId] = "Nieznany użytkownik";
          }
        } catch (error) {
          console.error(
            `Błąd podczas pobierania użytkownika ${userId}:`,
            error,
          );
          userNames.value[userId] = "Nieznany użytkownik";
        }
      });

      await Promise.all(promises);

      // Pobierz avatary dla tych użytkowników
      await fetchUserAvatars(userIds);
    };

    // 1. Dodaj tę funkcję w komponencie AdminPanel
    const extractUserIdFromReservation = (reservationId) => {
      // Sprawdź, czy ID rezerwacji zawiera podkreślnik (format: userId_rideId)
      if (reservationId && reservationId.includes("_")) {
        return reservationId.split("_")[0]; // Zwróć tylko userId
      }
      return reservationId; // Jeśli nie ma podkreślnika, zwróć całość
    };

    // 2. Zaktualizuj funkcję kopiującą dla rezerwacji
    const copyUserIdFromReservation = (reservationId) => {
      const userId = extractUserIdFromReservation(reservationId);
      navigator.clipboard
        .writeText(userId)
        .then(() => {
          // Pokaż powiadomienie
          showCopyNotification.value = true;

          // Ukryj powiadomienie po 2 sekundach
          setTimeout(() => {
            showCopyNotification.value = false;
          }, 2000);
        })
        .catch((err) => {
          console.error("Nie udało się skopiować ID: ", err);
        });
    };

    // Pobierz avatary użytkowników
    const fetchUserAvatars = async (userIds) => {
      const promises = userIds.map(async (userId) => {
        try {
          // Używamy dokładnie takiego samego podejścia jak w Twoim działającym kodzie
          const avatarPath = `imgu/${userId}.jpg`;
          const avatarRef = storageRef(storage, avatarPath);

          try {
            const avatarUrl = await getDownloadURL(avatarRef);
            userAvatars.value[userId] = avatarUrl;
          } catch {
            userAvatars.value[userId] = defaultAvatar;
          }
        } catch (error) {
          console.error(
            `Błąd podczas pobierania avatara dla ${userId}:`,
            error,
          );
          userAvatars.value[userId] = defaultAvatar;
        }
      });

      await Promise.all(promises);
    };

    // Pobieranie rezerwacji dla przejazdu
    const fetchReservationsForRide = async (rideId) => {
      try {
        const q = query(
          collection(db, "reservations"),
          where("rideId", "==", rideId),
        );

        const querySnapshot = await getDocs(q);

        rideReservations.value = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Pobierz szczegóły użytkowników, którzy dokonali rezerwacji
        const userIds = [
          ...new Set(rideReservations.value.map((res) => res.userId)),
        ];
        await fetchUserDetails(userIds);
      } catch (error) {
        console.error("Błąd podczas pobierania rezerwacji:", error);
        rideReservations.value = [];
      }
    };

    // Funkcje dla filtrowania przejazdów
    const applyRideFilters = () => {
      // Filtry są już aplikowane przez computed property
    };

    const resetRideFilters = () => {
      rideFilters.search = "";
      rideFilters.sortBy = "dateTimeAsc";
      rideFilters.searchById = false;
    };

    // Funkcje dla filtrowania użytkowników
    const applyUserFilters = () => {
      // Filtry są już aplikowane przez computed property
    };

    const resetUserFilters = () => {
      userFilters.search = "";
      userFilters.searchById = false;
    };

    // Funkcje dla zarządzania przejazdami
    const editRide = async (ride) => {
      // Konwertuj timestamp na format datetime-local
      const date = new Date(ride.dateTime);
      const formattedDate = date.toISOString().slice(0, 16); // Format YYYY-MM-DDTHH:MM

      Object.assign(editedRide, {
        ...ride,
        dateTime: formattedDate,
      });

      // Pobierz rezerwacje dla tego przejazdu
      await fetchReservationsForRide(ride.id);

      showRideModal.value = true;
    };

    const closeRideModal = () => {
      showRideModal.value = false;
      // Reset edytowanego przejazdu
      Object.assign(editedRide, {
        id: "",
        departure: "",
        destination: "",
        dateTime: "",
        seats: 1,
        exactDepartureAddress: "",
        exactDestinationAddress: "",
        userId: "",
      });
      // Wyczyść listę rezerwacji
      rideReservations.value = [];
    };

    const saveRide = async () => {
      try {
        const rideData = {
          departure: editedRide.departure,
          destination: editedRide.destination,
          dateTime: new Date(editedRide.dateTime).toISOString(),
          seats: editedRide.seats,
          exactDepartureAddress: editedRide.exactDepartureAddress,
          exactDestinationAddress: editedRide.exactDestinationAddress,
          userId: editedRide.userId,
        };

        await updateDoc(doc(db, "rides", editedRide.id), rideData);

        // Odśwież listę przejazdów
        await fetchRides();
        closeRideModal();
      } catch (error) {
        console.error("Błąd podczas zapisywania przejazdu:", error);
      }
    };

    const deleteRide = async (rideId) => {
      if (
        confirm(
          "Czy na pewno chcesz usunąć ten przejazd? Ta operacja jest nieodwracalna.",
        )
      ) {
        try {
          await deleteDoc(doc(db, "rides", rideId));

          // Usuń również wszystkie rezerwacje związane z tym przejazdem
          const reservationsQuery = query(
            collection(db, "reservations"),
            where("rideId", "==", rideId),
          );

          const reservationsSnapshot = await getDocs(reservationsQuery);
          const deletePromises = reservationsSnapshot.docs.map((doc) =>
            deleteDoc(doc.ref),
          );

          await Promise.all(deletePromises);

          // Odśwież listę przejazdów
          await fetchRides();
        } catch (error) {
          console.error("Błąd podczas usuwania przejazdu:", error);
        }
      }
    };

    // Usuwanie rezerwacji
    const deleteReservation = async (reservationId) => {
      if (confirm("Czy na pewno chcesz usunąć tę rezerwację?")) {
        try {
          // Znajdź rezerwację w tablicy
          const reservation = rideReservations.value.find(
            (r) => r.id === reservationId,
          );
          if (!reservation) return;

          // Aktualizuj dostępne miejsca w przejeździe
          const rideRef = doc(db, "rides", editedRide.id);
          const rideDoc = await getDoc(rideRef);

          if (rideDoc.exists()) {
            const currentSeats = rideDoc.data().seats;
            await updateDoc(rideRef, {
              seats: currentSeats + reservation.seats,
            });

            // Zaktualizuj liczbę miejsc w edytowanym przejeździe
            editedRide.seats += reservation.seats;
          }

          // Usuń rezerwację
          await deleteDoc(doc(db, "reservations", reservationId));

          // Odśwież listę rezerwacji
          await fetchReservationsForRide(editedRide.id);
        } catch (error) {
          console.error("Błąd podczas usuwania rezerwacji:", error);
        }
      }
    };

    // Funkcje dla zarządzania użytkownikami
    const editUser = (user) => {
      Object.assign(editedUser, { ...user });
      editedUserAvatar.value = userAvatars.value[user.id] || defaultAvatar;
      showUserModal.value = true;
    };

    const closeUserModal = () => {
      showUserModal.value = false;
      // Reset edytowanego użytkownika
      Object.assign(editedUser, {
        id: "",
        username: "",
        email: "",
        phonenumber: "",
        isAdmin: false,
      });
      editedUserAvatar.value = null;
      newAvatarFile.value = null;
    };

    const saveUser = async () => {
      try {
        const userData = {
          username: editedUser.username,
          phonenumber: editedUser.phonenumber,
          isAdmin: editedUser.isAdmin,
        };

        await updateDoc(doc(db, "users", editedUser.id), userData);

        // Obsługa uploadu avatara jeśli został zmieniony
        if (newAvatarFile.value) {
          const avatarRef = storageRef(storage, `imgu/${editedUser.id}.jpg`);
          await uploadBytes(avatarRef, newAvatarFile.value);

          // Pobierz i zaktualizuj URL avatara
          const avatarUrl = await getDownloadURL(avatarRef);
          userAvatars.value[editedUser.id] = avatarUrl;
        }

        // Odśwież listę użytkowników
        await fetchUsers();
        closeUserModal();
      } catch (error) {
        console.error("Błąd podczas zapisywania użytkownika:", error);
      }
    };

    const toggleAdminStatus = async (user) => {
      try {
        await updateDoc(doc(db, "users", user.id), {
          isAdmin: !user.isAdmin,
        });

        // Odśwież listę użytkowników
        await fetchUsers();
      } catch (error) {
        console.error("Błąd podczas zmiany statusu administratora:", error);
      }
    };

    // Obsługa avatara
    const handleAvatarUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Sprawdź typ pliku
      if (!file.type.includes("image/")) {
        alert("Proszę wybrać plik obrazu (JPG, PNG)");
        return;
      }

      // Zapisz plik do późniejszego uploadu
      newAvatarFile.value = file;

      // Podgląd obrazu
      const reader = new FileReader();
      reader.onload = (e) => {
        editedUserAvatar.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    const removeAvatar = async () => {
      try {
        const avatarRef = storageRef(storage, `imgu/${editedUser.id}.jpg`);

        // Usuń plik z Firebase Storage
        try {
          await deleteObject(avatarRef);
        } catch (error) {
          // Ignoruj błąd jeśli plik nie istnieje
          console.log(
            "Avatar nie istniał lub wystąpił błąd podczas usuwania:",
            error,
          );
        }

        // Zresetuj avatar w UI
        editedUserAvatar.value = defaultAvatar;
        userAvatars.value[editedUser.id] = defaultAvatar;
        newAvatarFile.value = null;
      } catch (error) {
        console.error("Błąd podczas usuwania avatara:", error);
      }
    };

    // Funkcja do usuwania konta użytkownika
    const deleteUser = async (userId) => {
      if (
        confirm(
          "Czy na pewno chcesz usunąć to konto użytkownika? Ta operacja jest nieodwracalna i spowoduje usunięcie wszystkich przejazdów i rezerwacji użytkownika.",
        )
      ) {
        try {
          // 1. Pobierz wszystkie przejazdy użytkownika
          const ridesQuery = query(
            collection(db, "rides"),
            where("userId", "==", userId),
          );
          const ridesSnapshot = await getDocs(ridesQuery);

          // Tablica ID wszystkich przejazdów użytkownika
          const userRideIds = ridesSnapshot.docs.map((doc) => doc.id);

          // 2. Usuń wszystkie rezerwacje dla przejazdów użytkownika
          for (const rideId of userRideIds) {
            const reservationsQuery = query(
              collection(db, "reservations"),
              where("rideId", "==", rideId),
            );
            const reservationsSnapshot = await getDocs(reservationsQuery);

            const deleteReservationPromises = reservationsSnapshot.docs.map(
              (doc) => deleteDoc(doc.ref),
            );
            await Promise.all(deleteReservationPromises);
          }

          // 3. Usuń wszystkie przejazdy użytkownika
          const deleteRidesPromises = ridesSnapshot.docs.map((doc) =>
            deleteDoc(doc.ref),
          );
          await Promise.all(deleteRidesPromises);

          // 4. Usuń wszystkie rezerwacje dokonane przez użytkownika
          const userReservationsQuery = query(
            collection(db, "reservations"),
            where("userId", "==", userId),
          );
          const userReservationsSnapshot = await getDocs(userReservationsQuery);

          const deleteUserReservationsPromises =
            userReservationsSnapshot.docs.map((doc) => deleteDoc(doc.ref));
          await Promise.all(deleteUserReservationsPromises);

          // 5. Usuń avatar użytkownika
          try {
            const avatarRef = storageRef(storage, `imgu/${userId}.jpg`);
            await deleteObject(avatarRef);
          } catch (error) {
            // Ignoruj błąd jeśli avatar nie istnieje
            console.log("Błąd podczas usuwania avatara:", error);
          }

          // 6. Usuń użytkownika
          await deleteDoc(doc(db, "users", userId));

          // 7. Odśwież listy
          await fetchRides();
          await fetchUsers();

          alert(
            "Konto użytkownika zostało usunięte wraz ze wszystkimi przejazdami i rezerwacjami.",
          );
        } catch (error) {
          console.error("Błąd podczas usuwania konta użytkownika:", error);
          alert("Wystąpił błąd podczas usuwania konta użytkownika.");
        }
      }
    };

    // Funkcja do kopiowania do schowka
    const copyToClipboard = (text) => {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          // Pokaż powiadomienie
          showCopyNotification.value = true;

          // Ukryj powiadomienie po 2 sekundach
          setTimeout(() => {
            showCopyNotification.value = false;
          }, 2000);
        })
        .catch((err) => {
          console.error("Nie udało się skopiować tekstu: ", err);
        });
    };

    // Helper function for formatting dates
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Helper function to shorten IDs for display
    const shortId = (id) => {
      return id ? id.substring(0, 6) + "..." : "";
    };

    onMounted(() => {
      fetchRides();
      fetchUsers();
    });

    return {
      activeTab,
      loading,
      loadingUsers,
      rides,
      users,
      userNames,
      userAvatars,
      rideFilters,
      userFilters,
      filteredRides,
      filteredUsers,
      showRideModal,
      editedRide,
      rideReservations,
      showUserModal,
      editedUser,
      editedUserAvatar,
      defaultAvatar,
      showCopyNotification,
      extractUserIdFromReservation,
      copyUserIdFromReservation,
      applyRideFilters,
      resetRideFilters,
      applyUserFilters,
      resetUserFilters,
      editRide,
      closeRideModal,
      saveRide,
      deleteRide,
      deleteReservation,
      editUser,
      closeUserModal,
      saveUser,
      toggleAdminStatus,
      handleAvatarUpload,
      removeAvatar,
      deleteUser,
      copyToClipboard,
      formatDate,
      shortId,
    };
  },
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  color: white;
  background-color: #222;
  display: flex;
  justify-content: center;
  padding: 20px;
}

.container {
  display: flex;
  width: 100%;
  max-width: 1600px;
  gap: 20px;
}

.admin-sidebar {
  width: 250px;
  background-color: rgba(34, 34, 34, 0.9);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.admin-sidebar h2 {
  color: #ffb300;
  text-align: center;
  margin-bottom: 25px;
  text-shadow: 0px 0px 8px rgba(255, 179, 0, 0.8);
}

.admin-menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.admin-menu-btn {
  padding: 12px;
  background-color: #333;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.admin-menu-btn:hover {
  background-color: #444;
}

.admin-menu-btn.active {
  background-color: #ffb300;
  color: black;
  font-weight: bold;
}

.admin-content {
  flex: 1;
  background-color: rgba(51, 51, 51, 0.95);
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.admin-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.admin-header h1 {
  color: #ffb300;
  margin-bottom: 20px;
  text-shadow: 0px 0px 8px rgba(255, 179, 0, 0.8);
}

.admin-filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.admin-filter-input,
.admin-filter-select {
  padding: 10px;
  background-color: #2b2b2b;
  color: white;
  border: 1px solid #444;
  border-radius: 5px;
  font-size: 1rem;
}

.admin-filter-input {
  width: 300px;
}

.admin-filter-select {
  width: 200px;
}

.admin-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.admin-btn.small {
  padding: 5px 10px;
  font-size: 0.85rem;
}

.admin-btn.primary {
  background-color: #ffb300;
  color: black;
}

.admin-btn.primary:hover {
  background-color: #ffbb40;
}

.admin-btn.secondary {
  background-color: #444;
  color: white;
}

.admin-btn.secondary:hover {
  background-color: #555;
}

.admin-btn.danger {
  background-color: #d32f2f;
  color: white;
}

.admin-btn.danger:hover {
  background-color: #e33e3e;
}

.admin-btn.success {
  background-color: #388e3c;
  color: white;
}

.admin-btn.success:hover {
  background-color: #46a34b;
}

.admin-btn.warning {
  background-color: #f57c00;
  color: white;
}

.admin-btn.warning:hover {
  background-color: #ff8f1f;
}

.loading,
.no-data {
  text-align: center;
  margin: 40px 0;
  color: #ccc;
  font-size: 1.2rem;
}

.rides-table-container,
.users-table-container {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.admin-table th,
.admin-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #444;
}

.admin-table th {
  background-color: #222;
  color: #ffb300;
  font-weight: bold;
}

.admin-table tr:hover {
  background-color: rgba(255, 179, 0, 0.1);
}

.actions {
  display: flex;
  gap: 5px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
}

.status-badge.admin {
  background-color: #ffb300;
  color: black;
}

.status-badge.user {
  background-color: #555;
  color: white;
}

/* Modal styles */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: #333;
  padding: 25px;
  border-radius: 10px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 28px;
  cursor: pointer;
  color: #ccc;
}

.close:hover {
  color: #ffb300;
}

.modal-content h2 {
  margin-bottom: 20px;
  color: #ffb300;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.form-input {
  width: 100%;
  padding: 10px;
  background-color: #2b2b2b;
  color: white;
  border: 1px solid #444;
  border-radius: 5px;
  font-size: 1rem;
}

.form-input:focus {
  border-color: #ffb300;
  outline: none;
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.copy-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 9999;
  transition: opacity 0.3s ease;
}

.id-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-btn {
  background: none;
  border: none;
  color: #ffb300;
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.copy-btn:hover {
  opacity: 1;
}

.copy-btn-inline {
  background: none;
  border: none;
  color: #ffb300;
  cursor: pointer;
  font-size: 16px;
  padding: 2px 5px;
}

.copy-field {
  display: flex;
  align-items: center;
}

.copy-field input {
  flex: 1;
}

.avatar-small {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #ffb300;
}

.user-info-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #ffb300;
}

.avatar-edit {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-btn {
  display: inline-block;
  padding: 8px 12px;
  background-color: #ffb300;
  color: black;
  font-weight: bold;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
  transition: background-color 0.3s ease;
}

.upload-btn:hover {
  background-color: #ffbb40;
}

.reservation-section {
  margin-top: 20px;
  border-top: 1px solid #444;
  padding-top: 15px;
}

.reservations-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reservation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #2a2a2a;
  padding: 10px;
  border-radius: 5px;
}

.no-reservations {
  color: #888;
  padding: 10px;
  font-style: italic;
}

.reservation-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.reservation-id {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: #aaa;
}
</style>
