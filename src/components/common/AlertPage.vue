<template>
  <body v-if="visible" class="alert">
    <section class="alert-box">
      <p>{{ message }}</p>
      <button @click="closeAlert">OK</button>
    </section>
  </body>
</template>

<script>
export default {
  props: {
    message: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      visible: true,
    };
  },
  methods: {
    closeAlert() {
      this.visible = false;
      this.$emit("close");
    },
  },
};
</script>

<style scoped>
.alert {
  position: fixed;
  font-family: Arial, Helvetica, sans-serif;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7); /* Ciemne przyciemnienie tła */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.alert-box {
  background: rgba(51, 51, 51, 0.95); /* Ciemne tło dla spójności */
  color: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  text-align: center;
  width: 350px;
}

.alert-box:hover {
  transform: translateY(-5px);
}

.alert-box p {
  margin-bottom: 20px;
  font-size: 1.1rem;
  font-weight: bold;
}

.alert-box button {
  background-color: #ffb300; /* Żółty akcent */
  color: black;
  font-weight: bold;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.2);
}

.alert-box button:hover {
  background-color: #ffbb40;
  transform: translateY(-3px);
}

.alert-box button:active {
  background-color: #de9b00;
  transform: scale(0.95);
}
</style>
