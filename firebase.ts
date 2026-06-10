
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import 'firebase/compat/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyACLcK32vH_cOjEat1D36OTjkgM0MMBIuM",
  // NOTE: databaseURL is required for the Realtime Database compat library.
  databaseURL: "https://campus-shuttle-48ed9-default-rtdb.firebaseio.com",
  projectId: "campus-shuttle-48ed9",
  storageBucket: "campus-shuttle-48ed9.appspot.com",
  messagingSenderId: "371652620512",
  appId: "1:371652620512:web:97d074d161b7fbf646e085",
  measurementId: "G-PEB1CGKRQ4"
};

// Initialize Firebase if it hasn't been already
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export the initialized services for use in other parts of the app
const database = firebase.database();
const storage = firebase.storage();

export { database, storage };