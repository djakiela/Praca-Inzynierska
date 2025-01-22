<template>
  <body id="HomePage">
    <div class="container">
      <header>
        <div class="header-welcome">
          <h1>Witamy na naszej stronie!</h1>
          <p>Znajdź przejazd, dodaj swoją trasę i podróżuj wygodnie.</p>
        </div>
        <div class="activeSection">
          <div class="buttons-header">
            <button
              @click="activeSection = 'about'"
              :class="{ active: activeSection === 'about' }"
            >
              O nas
            </button>
            <button
              @click="activeSection = 'howItWorks'"
              :class="{ active: activeSection === 'howItWorks' }"
            >
              Jak to działa?
            </button>
            <button
              @click="activeSection = 'benefits'"
              :class="{ active: activeSection === 'benefits' }"
            >
              Zalety platformy
            </button>
          </div>
          <div class="content-section">
            <section v-if="activeSection === 'about'">
              <article>
                <h2>O nas</h2>
                <p>
                  Jesteśmy platformą, która łączy pasażerów i kierowców. Naszym
                  celem jest ułatwienie podróżowania, oszczędność czasu i
                  promowanie ekologicznych rozwiązań transportowych.
                </p>
              </article>
            </section>

            <section v-if="activeSection === 'howItWorks'">
              <article>
                <h2>Jak to działa?</h2>
                <p>To proste:</p>
                <ol>
                  <li>
                    Dodaj swoją trasę jako kierowca lub znajdź przejazd jako
                    pasażer.
                  </li>
                  <li>
                    Skontaktuj się z drugą stroną i ustal szczegóły podróży.
                  </li>
                  <li>Podróżuj wygodnie i tanio!</li>
                </ol>
              </article>
            </section>

            <section v-if="activeSection === 'benefits'">
              <article>
                <h2>Zalety naszej platformy</h2>
                <ul>
                  <li>Łatwość obsługi i szybkie wyszukiwanie przejazdów.</li>
                  <li>Przyjazny interfejs i intuicyjna obsługa.</li>
                  <li>Promowanie ekologicznego podróżowania.</li>
                </ul>
              </article>
            </section>
          </div>
        </div>
      </header>
      <main>
        <section id="rides-list">
          <FilterCom />
          <RideList />
        </section>
      </main>
      <footer>
        <p>&copy; 2025 GetRidehub. Wszystkie prawa zastrzeżone.</p>
      </footer>
    </div>
  </body>
</template>

<script>
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import FilterCom from "@/components/rides/FilterCom.vue";
import RideList from "@/components/rides/RideList.vue";

export default {
  name: "HomePage",
  components: {
    FilterCom,
    RideList,
  },
  data() {
    return {
      activeSection: "about",
    };
  },

  setup() {
    const route = useRoute();

    const scrollToSection = (sectionId) => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    };

    onMounted(() => {
      // Przewiń do sekcji, jeśli `scrollTo` jest obecne w zapytaniu
      if (route.query.scrollTo) {
        scrollToSection(route.query.scrollTo);
      }
    });

    watch(route, (newRoute) => {
      if (newRoute.query.scrollTo) {
        scrollToSection(newRoute.query.scrollTo);
      }
    });

    return {};
  },
};
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: auto;
  height: auto;
}

.header-welcome {
  margin-top: 150px;
}

section {
  display: flex;
  align-items: flex-start;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  background-image: url("theme.jpg");
  background-attachment: fixed; /* Efekt przesuwania */
  background-size: cover;
  background-position: center;
  color: #333;
}
header {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: white;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.7);
}

.activeSection {
  position: absolute;
  top: 40%;
  width: 100%;
}

.buttons-header {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.buttons-header button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.buttons-header button:hover {
  background-color: #0056b3;
}

.buttons-header button.active {
  background-color: #0056b3;
  font-weight: bold;
}

.content-section {
  margin-top: 10px;
  padding: 20px;
  background: rgba(
    255,
    255,
    255,
    0.9
  ); /* Tło białe z lekko przezroczystym efektem */
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  text-align: left;
  width: 20%;
  margin: 0 auto; /* Wyśrodkowanie sekcji */
}

.content-section article {
  margin: 0;
}

.content-section h2 {
  margin-top: 0;
  color: #007bff;
}

main {
  padding: 20px;
}

article {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
article h2 {
  margin-top: 0;
  color: #007bff;
}
footer {
  background-color: #333;
  color: white;
  text-align: center;
  padding: 10px 0;
  margin-top: 20px;
}
</style>
