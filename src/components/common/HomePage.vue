<template>
  <body id="HomePage">
    <div class="container">
      <header>
        <div class="header-welcome">
          <h1>Witamy na stronie GetRideHub</h1>
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
                  Jesteśmy platformą, która łączy pasażerów i kierowców.<br />
                  Naszym celem jest ułatwienie podróżowania, <br />
                  oszczędność czasu i promowanie ekologicznych rozwiązań
                  transportowych.
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
        <section id="rides-list" class="ride-list">
          <RideList />
        </section>
      </main>
    </div>
  </body>
</template>

<script>
import { onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import RideList from "@/components/rides/RideList.vue";

export default {
  name: "HomePage",
  components: {
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
section {
  display: flex;
  align-items: flex-start;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 0;
  padding: 0;
  color: #ffffff;
}

header {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: #ffffff;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.7);
}

.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: auto;
  height: auto;
}

.header-welcome {
  margin-top: 60px;
}

.header-welcome h1 {
  font-size: 4em;
  color: white;
  text-shadow: 0px 0px 10px rgba(0, 0, 0, 0.8);
}

.header-welcome p {
  font-size: 2em;
  color: white;
  text-shadow: 0px 0px 8px rgba(0, 0, 0, 0.8);
}

.buttons-header {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 20px;
}

.buttons-header button {
  padding: 20px 30px;
  border: none;
  border-radius: 5px;
  background-color: #ffb300;
  color: black;
  cursor: pointer;
  transition:
    background-color 0.3s,
    box-shadow 0.3s;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
  font-size: 1.1rem;
}

.buttons-header button:hover {
  background-color: #ffbb40;
}

.buttons-header button.active {
  background-color: #de9b00;
  font-weight: bold;
}

.content-section {
  background: rgba(51, 51, 51, 0.9);
  color: #ffffff;
  border-radius: 10px;
  text-align: left;
  padding: 10px;
  font-size: 1.2rem;
  margin-top: 35px;
}

.content-section h2,
p {
  text-align: center;
}

.ride-list {
  display: flex;
  align-items: flex-start;
  gap: 1px;
  margin-left: 300px;
}
</style>
