import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';
import 'firebase/storage';

const config = {
  apiKey: 'AIzaSyAwiye3YJmjYAGuXoMSOPzEW4zWneXjFoM',
  authDomain: 'chat-web-arzky.firebaseapp.com',
  projectId: 'chat-web-arzky',
  storageBucket: 'chat-web-arzky.appspot.com',
  messagingSenderId: '881501680669',
  appId: '1:881501680669:web:912e5b06724391a19bc2f4',
  databaseURL:
    'https://chat-web-arzky-default-rtdb.asia-southeast1.firebasedatabase.app/',
};

const app = firebase.initializeApp(config);
export const auth = app.auth();
export const database = app.database();
export const storage = app.storage();
