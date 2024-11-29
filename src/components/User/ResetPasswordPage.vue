
<template>
  <div class="reset-password-page">
    <h1>Zmiana Hasła</h1>
    <form @submit.prevent="resetPassword">
      <div>
        <label for="newPassword">Nowe Hasło:</label>
        <input 
          :type="showNewPassword ? 'text' : 'password'" 
          v-model="newPassword" 
          required 
        />
        <button type="button" class="toggle-visibility" @click="toggleNewPasswordVisibility">
          {{ showNewPassword ? 'Ukryj' : 'Pokaż' }}
        </button>
      </div>
      <div>
        <label for="confirmPassword">Powtórz Hasło:</label>
        <input 
          :type="showConfirmPassword ? 'text' : 'password'" 
          v-model="confirmPassword" 
          required 
        />
        <button type="button" class="toggle-visibility" @click="toggleConfirmPasswordVisibility">
          {{ showConfirmPassword ? 'Ukryj' : 'Pokaż' }}
        </button>
      </div>
      <button type="submit" class="button">Zmień Hasło</button>
    </form>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success">{{ successMessage }}</p>
  </div>
</template>

<script>
import { getAuth, confirmPasswordReset } from "firebase/auth";

export default {
  name: 'ResetPasswordPage',
  data() {
    return {
      newPassword: '',
      confirmPassword: '',
      showNewPassword: false,
      showConfirmPassword: false,
      errorMessage: '',
      successMessage: '',
    };
  },
  methods: {
    toggleNewPasswordVisibility() {
      this.showNewPassword = !this.showNewPassword;
    },
    toggleConfirmPasswordVisibility() {
      this.showConfirmPassword = !this.showConfirmPassword;
    },
    async resetPassword() {
      if (this.newPassword !== this.confirmPassword) {
        this.errorMessage = 'Hasła nie są zgodne.';
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const oobCode = urlParams.get('oobCode');

      if (!oobCode) {
        this.errorMessage = 'Nieprawidłowy link do resetowania hasła.';
        return;
      }

      try {
        const auth = getAuth();
        await confirmPasswordReset(auth, oobCode, this.newPassword);
        this.successMessage = 'Hasło zostało zmienione pomyślnie!';
        this.errorMessage = '';
      } catch (error) {
        this.errorMessage = 'Błąd podczas zmiany hasła: ' + error.message;
      }
    }
  }
};
</script>

<style scoped>
.reset-password-page {
  max-width: 400px;
  margin: 0 auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.reset-password-page h1 {
  text-align: center;
  color: #333;
}
.reset-password-page form div {
  margin-bottom: 15px;
  position: relative;
}
.reset-password-page form label {
  display: block;
  margin-bottom: 5px;
}
.reset-password-page form input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 5px;
}
.button {
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  background-color: #333;
  color: #fff;
  border: none;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  text-decoration: none;
  display: block;
  font-size: 16px;
}
.button:hover {
  background-color: #555;
}
.toggle-visibility {
  position: absolute;
  right: 10px;
  top: 28px;
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 12px;
}
.toggle-visibility:hover {
  color: #0056b3;
}
.error {
  color: red;
  text-align: center;
}
.success {
  color: green;
  text-align: center;
}
</style>

