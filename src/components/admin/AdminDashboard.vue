<template>
    <div class="admin-dashboard">
      <h1>Panel Administratora</h1>
      <p>Witaj w panelu administratora.</p>
      <!-- Dodaj tutaj inne funkcje dla administratora -->
    </div>
  </template>
  
  <script>
  export default {
    name: 'AdminDashboard',
  };
  </script>
  
  <style scoped>
  .admin-dashboard {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background-color: #f9f9f9;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .admin-dashboard h1 {
    text-align: center;
    color: #333;
  }
  </style>