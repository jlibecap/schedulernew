# Project Setup Instructions

To get this project fully functional, you need to set up Firebase and Google Cloud projects.

## 1. Firebase Setup
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Create a new project.
3. Add a Web App to your project.
4. Copy the `firebaseConfig` object and paste the values into your `.env.local` file.
5. In the Firebase Console, go to **Firestore Database** and create a database in test mode.
6. Go to **Authentication** and enable **Google** sign-in.

## 2. Google Cloud Platform (GCP) Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your Firebase project.
3. Go to **APIs & Services > Library** and enable the **Google Calendar API**.
4. Go to **APIs & Services > Credentials**.
5. Create an **OAuth 2.0 Client ID** (Web application).
6. Add `http://localhost:3000/api/auth/callback/google` to the **Authorized redirect URIs**.
7. Copy the Client ID and Client Secret into your `.env.local` file.

## 3. Running the App
Once you've filled in the `.env.local` file, run:
```bash
npm run dev
```
