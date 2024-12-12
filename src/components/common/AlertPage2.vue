<template>
    <div v-if="visible" class="alert-overlay">
      <div class="alert-box">
        <p>{{ message }}</p>
      </div>
    </div>
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
  .alert-overlay {
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
  }
  .alert-box {
    background: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s ease, transform 0.2s ease;
    text-align: center;
  }
  
  .alert-box:hover {
    transform: translateY(-5px);
  }
  
  .alert-box p {
    margin-bottom: 20px;
  }
  .alert-box button {
    background-color: #189ab4;
    color: #fff;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
  }
  .alert-box button:hover {
    background-color: #00b3b8;
  }
  </style>
  