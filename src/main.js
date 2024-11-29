import { createApp } from "vue";
import App from "./App.vue";
import { app as firebaseApp } from "./firebaseConfig";
import router from "./router";

createApp(App)
  .use(router)

  .mount("#app");

console.log(firebaseApp);
