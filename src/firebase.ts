import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBdnUZfQgUS9aJ8ilIxXUUeX5y9vISlCeU",
  authDomain: "packlisten-app-41740.firebaseapp.com",
  projectId: "packlisten-app-41740",
  storageBucket: "packlisten-app-41740.firebasestorage.app",
  messagingSenderId: "740923524232",
  appId: "1:740923524232:web:041e6efac24b8dadc5cb3d",
  measurementId: "G-433NXV0259",
  databaseURL: "https://packlisten-app-41740-default-rtdb.europe-west1.firebasedatabase.app"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
export default app
