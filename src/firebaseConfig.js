import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDcYd61VIFSqSiSFdUloXsO1R4CumhwB80",
  authDomain: "przejazdy-fd250.firebaseapp.com",
  projectId: "przejazdy-fd250",
  storageBucket: "przejazdy-fd250.appspot.com",
  messagingSenderId: "953080619253",
  appId: "1:953080619253:web:9cafd23ef273d87f0aa5bc",
  measurementId: "G-C74RZZT4DR",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
