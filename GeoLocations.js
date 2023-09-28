const x = document.getElementById("Logo1");

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDNnuj-ZDT-RmxNaG-1nmFCHuzmcL9eMK0",
    authDomain: "geolocation-progressbar.firebaseapp.com",
    databaseURL: "https://geolocation-progressbar-default-rtdb.firebaseio.com",
    projectId: "geolocation-progressbar",
    storageBucket: "geolocation-progressbar.appspot.com",
    messagingSenderId: "148383821021",
    appId: "1:148383821021:web:9870902b7a17de1aedff34",
    measurementId: "G-459B7XPYCV"
  };
  

firebase.initializeApp(firebaseConfig);

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition);
  } else { 
    x.innerHTML = "Geolocation is not supported by this browser.";
  }
}

function showPosition(position) {
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

//   x.innerHTML = "Latitude: " + latitude + "<br>Longitude: " + longitude;

  saveLocation(latitude, longitude);
}

function saveLocation(latitude, longitude) {
  const database = firebase.database();
  const locationRef = database.ref('locations');
  locationRef.push().set({
    latitude: latitude,
    longitude: longitude
  }, function(error) {
    if (error) {
      console.log("Error saving location: " + error.message);
    } else {
      console.log("Location saved successfully.");
    }
  });
}