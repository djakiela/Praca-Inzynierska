<template>
  <div class="alert-overlay" v-if="visible">
    <div class="alert-box">
      <p v-html="message"></p>
      <input
        v-if="showInput"
        type="password"
        v-model="inputValue"
        placeholder="Wpisz aktualne hasło"
      />
      <div class="alert-buttons">
        <button @click="submit" class="ok-btn">OK</button>
        <button @click="close" class="cancel-btn">Anuluj</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    message: { type: String, required: true },
    showInput: { type: Boolean, default: false },
  },
  data() {
    return {
      visible: true,
      inputValue: "",
    };
  },
  methods: {
    submit() {
      if (!this.inputValue) {
        alert("Musisz wpisać hasło!");
        return;
      }
      this.$emit("close", this.inputValue);
      this.visible = false;
    },
    close() {
      this.$emit("close", null);
      this.visible = false;
    },
  },
};
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.alert-box {
  background: #2b2b2b;
  color: white;
  padding: 25px;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 0 15px rgba(255, 179, 0, 0.5);
  width: 350px;
  animation: fadeIn 0.3s ease-in-out;
}

input {
  width: 90%;
  padding: 10px;
  margin: 15px 0;
  background: #2b2b2b !important;
  border: 1px solid #ffb300;
  border-radius: 8px;
  font-size: 1rem;
  color: white !important;
  outline: none;
  text-align: center;
}

/* Fix dla autofill */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  background-color: #2b2b2b !important;
  -webkit-box-shadow: 0 0 0px 1000px #2b2b2b inset !important;
  -webkit-text-fill-color: white !important;
}

.alert-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
}

button {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: bold;
  transition: 0.3s ease;
}

.ok-btn {
  background: #4caf50;
  color: white;
}

.ok-btn:hover {
  background: #3e8e41;
}

.cancel-btn {
  background: #e74c3c;
  color: white;
}

.cancel-btn:hover {
  background: #c0392b;
}

/* Animacja pojawiania */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
