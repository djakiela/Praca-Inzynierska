<template>
  <body class="terms-page">
    <div class="terms-content">
      <h1>Regulamin</h1>
      <h4>1. Postanowienia ogólne</h4>
      <p>
        1.1. Niniejszy regulamin określa zasady korzystania ze strony
        internetowej GetRideHub.
      </p>
      <p>
        1.2. Korzystając ze strony internetowej, użytkownik akceptuje
        postanowienia niniejszego regulaminu.
      </p>

      <h4>2. Definicje</h4>
      <p>
        2.1. Strona – serwis internetowy dostępny pod adresem
        https://getridehub.com.
      </p>
      <p>
        2.2. Użytkownik – każda osoba fizyczna lub prawna korzystająca ze
        Strony.
      </p>
      <p>
        2.3. Administrator – właściciel Strony, odpowiedzialny za jej
        zarządzanie i funkcjonowanie.
      </p>

      <h4>3. Warunki korzystania</h4>
      <p>
        3.1. Użytkownik zobowiązuje się do korzystania ze Strony zgodnie z
        prawem oraz postanowieniami niniejszego regulaminu.
      </p>
      <p>
        3.2. Zabrania się wykorzystywania Strony w sposób naruszający prawa osób
        trzecich lub dobre obyczaje.
      </p>

      <h4>4. Rejestracja</h4>
      <p>4.1. Rejestracja na Stronie jest dobrowolna i bezpłatna.</p>
      <p>
        4.2. Użytkownik zobowiązany jest do podania prawdziwych i aktualnych
        danych podczas rejestracji.
      </p>
      <p>
        4.3. Administrator zastrzega sobie prawo do usunięcia konta Użytkownika
        w przypadku naruszenia postanowień niniejszego regulaminu.
      </p>

      <h4>5. Ochrona danych osobowych</h4>
      <p>
        5.1. Administratorem danych osobowych Użytkowników jest [Nazwa
        Firmy/Administratora].
      </p>
      <p>
        5.2. Dane osobowe przetwarzane są w celu świadczenia usług dostępnych na
        Stronie oraz w celach marketingowych.
      </p>
      <p>
        5.3. Użytkownik ma prawo do wglądu w swoje dane osobowe oraz do ich
        poprawiania lub usunięcia.
      </p>

      <h4>6. Prawa autorskie</h4>
      <p>
        6.1. Wszystkie materiały dostępne na Stronie są chronione prawem
        autorskim.
      </p>
      <p>
        6.2. Kopiowanie, rozpowszechnianie lub wykorzystywanie materiałów bez
        zgody Administratora jest zabronione.
      </p>

      <h4>7. Odpowiedzialność</h4>
      <p>
        7.1. Administrator nie ponosi odpowiedzialności za treści zamieszczane
        przez Użytkowników.
      </p>
      <p>
        7.2. Administrator nie ponosi odpowiedzialności za przerwy w
        funkcjonowaniu Strony spowodowane siłą wyższą, awariami technicznymi lub
        działaniami osób trzecich.
      </p>

      <h4>8. Postanowienia końcowe</h4>
      <p>
        8.1. Administrator zastrzega sobie prawo do wprowadzania zmian w
        regulaminie.
      </p>
      <p>
        8.2. Zmiany w regulaminie wchodzą w życie z dniem ich opublikowania na
        Stronie.
      </p>
      <p>
        8.3. W sprawach nieuregulowanych niniejszym regulaminem zastosowanie
        mają przepisy prawa polskiego.
      </p>
      <section class="buttons">
        <router-link to="/?scrollTo=HomePage" class="btn-link"
          ><button class="btn-back">
            Powrót do strony głównej
          </button></router-link
        >
        <router-link to="/register" class="btn-link"
          ><button class="btn-back">Powrót do rejestracji</button></router-link
        >
      </section>
    </div>
  </body>
</template>

<script>
export default {
  name: "TermsPage",
};
</script>

<style scoped>
.terms-page {
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Arial, Helvetica, sans-serif;
  padding: 20px;
  margin-top: 50px;
}

.terms-content {
  background-color: white;
  padding: 2rem;
  border-radius: 15px;
  background: rgba(51, 51, 51, 0.9);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  text-align: left;
  width: 80%;
  max-width: 800px;
}

.terms-page h1 {
  text-align: center;
  color: white;
}

.terms-page h4 {
  color: white;
}

.terms-page p {
  margin-bottom: 10px;
  color: white;
}

.btn-back {
  display: block;
  width: 20%;
  padding: 12px;
  background-color: #ffb300;
  color: black;
  border: none;
  border-radius: 8px;
  font-size: 1.4rem;
  font-weight: bold;
  margin: 1rem auto 0 auto;
  text-align: center;
  cursor: pointer;
  transition:
    background-color 0.3s,
    transform 0.2s,
    box-shadow 0.3s;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
}

.btn-back:hover {
  background-color: #ffbb40;
  transform: translateY(-3px);
}

.btn-link {
  color: white;
  text-decoration: none;
}

.buttons {
  text-align: right;
  justify-content: space-between;
  display: flex;
}

.buttons button {
  display: inline-block;
  margin: 10px;
  width: 150px;
  height: 50px;
  font-size: 16px;
  text-align: center;
  border: none;
  border-radius: 5px;
  font-size: 11px;
}
</style>
