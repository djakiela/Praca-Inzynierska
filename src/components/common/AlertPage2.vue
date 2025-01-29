<template>
  <body v-if="visible" class="alert">
    <section class="alert-box">
      <p v-html="message"></p>
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
  mounted() {
    setTimeout(() => {
      this.visible = false;
      this.$emit("close");
    }, 2500);
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.alert-box {
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  text-align: center;
}

.alert-box:hover {
  transform: translateY(-5px);
}

.alert-box p {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}
</style>
