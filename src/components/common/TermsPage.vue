<template>
  <div class="terms-page">
    <div class="terms-card">
      <h1>Regulamin</h1>
      <p>1. Postanowienia ogólne</p>
      <p>
        1.1. Niniejszy regulamin określa zasady korzystania ze strony
        internetowej GetRideHub.
      </p>
      <p>
        1.2. Korzystając ze strony internetowej, użytkownik akceptuje
        postanowienia niniejszego regulaminu.
      </p>

      <p>2. Definicje</p>
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

      <p>3. Warunki korzystania</p>
      <p>
        3.1. Użytkownik zobowiązuje się do korzystania ze Strony zgodnie z
        prawem oraz postanowieniami niniejszego regulaminu.
      </p>
      <p>
        3.2. Zabrania się wykorzystywania Strony w sposób naruszający prawa osób
        trzecich lub dobre obyczaje.
      </p>

      <p>4. Rejestracja</p>
      <p>4.1. Rejestracja na Stronie jest dobrowolna i bezpłatna.</p>
      <p>
        4.2. Użytkownik zobowiązany jest do podania prawdziwych i aktualnych
        danych podczas rejestracji.
      </p>
      <p>
        4.3. Administrator zastrzega sobie prawo do usunięcia konta Użytkownika
        w przypadku naruszenia postanowień niniejszego regulaminu.
      </p>

      <p>5. Ochrona danych osobowych</p>
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

      <p>6. Prawa autorskie</p>
      <p>
        6.1. Wszystkie materiały dostępne na Stronie są chronione prawem
        autorskim.
      </p>
      <p>
        6.2. Kopiowanie, rozpowszechnianie lub wykorzystywanie materiałów bez
        zgody Administratora jest zabronione.
      </p>

      <p>7. Odpowiedzialność</p>
      <p>
        7.1. Administrator nie ponosi odpowiedzialności za treści zamieszczane
        przez Użytkowników.
      </p>
      <p>
        7.2. Administrator nie ponosi odpowiedzialności za przerwy w
        funkcjonowaniu Strony spowodowane siłą wyższą, awariami technicznymi lub
        działaniami osób trzecich.
      </p>

      <p>8. Postanowienia końcowe</p>
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
      <div class="buttons">
        <router-link to="/" class="btn-link"
          ><button class="btn-back">
            Powrót do strony głównej
          </button></router-link
        >
        <router-link to="/register" class="btn-link"
          ><button class="btn-back">Powrót do rejestracji</button></router-link
        >
      </div>
    </div>
  </div>
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
  background: linear-gradient(150deg, #05445e, #189ab4, #d4f1f4);
  font-family: Arial, Helvetica, sans-serif;
  padding: 20px;
}

.terms-card {
  background-color: white;
  padding: 2rem;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  text-align: left;
  width: 80%;
  max-width: 800px;
}

.terms-page h1 {
  text-align: center;
  color: #333;
}

.terms-page p {
  margin-bottom: 10px;
  color: #333;
}

.btn-back {
  display: block;
  width: 20%;
  padding: 12px;
  background-color: #189ab4;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  margin: 1rem auto 0 auto;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-back:hover {
  background-color: #00b3b8;
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
