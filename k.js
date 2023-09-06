     //Google Analytics
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());

     gtag('config', 'G-HGQ08F2P9V');
                         
 
     // Import the functions you need from the SDKs you need
     import { initializeApp } from "firebase/app";
     import { getAnalytics } from "firebase/analytics";
     // TODO: Add SDKs for Firebase products that you want to use
     // https://firebase.google.com/docs/web/setup#available-libraries

     // Your web app's Firebase configuration
     // For Firebase JS SDK v7.20.0 and later, measurementId is optional
     const firebaseConfig = {
     apiKey: "AIzaSyC4Liqqt6fX38Z51LGW4TEhgQerWkHbkvY",
     authDomain: "the-progressbar-np.firebaseapp.com",
     projectId: "the-progressbar-np",
     storageBucket: "the-progressbar-np.appspot.com",
     messagingSenderId: "795499051919",
     appId: "1:795499051919:web:4d8f64bce8ad1a16b7e9fa",
     measurementId: "G-Q28PP5HJNX"
     };

     // Initialize Firebase
     const app = initializeApp(firebaseConfig);
     const analytics = getAnalytics(app);