
// //Getting Geolocation 
function getLocation(){ 
    try{ 
      navigator.geolocation.getCurrentPosition(showPosition); 
  
    }catch{ 
      x.innerHTML= err; 
    }
  }
  function showPosition(position){ 
    x.innerHTML= "Latitude:"  + position.coords.latitude+ "<br> Longitude" + position.coords.longitude; 
   var latitude= position.
  }

// Initialize Firebase
// const firebaseConfig = {
//     apiKey: "AIzaSyDNnuj-ZDT-RmxNaG-1nmFCHuzmcL9eMK0",
//     authDomain: "geolocation-progressbar.firebaseapp.com",
//     projectId: "geolocation-progressbar",
//     storageBucket: "geolocation-progressbar.appspot.com",
//     messagingSenderId: "148383821021",
//     appId: "1:148383821021:web:9870902b7a17de1aedff34",
//     measurementId: "G-459B7XPYCV"
//   };
//   // Initialize Firebase
//   firebase.initializeApp(firebaseConfig);
  
//   function getLocation() {
//     var locationOutput = document.getElementById("location");
  
//     try {
//       navigator.geolocation.getCurrentPosition(function(position) {
//         showPosition(position);
//         storeInFirebase(position);
//       });
//     } catch (error) {
//       locationOutput.innerHTML = error;
//     }
//   }
  
//   function showPosition(position) {
//     var latitude = position.coords.latitude;
//     var longitude = position.coords.longitude;
  
//     var locationOutput = document.getElementById("location");
//     locationOutput.innerHTML = "Latitude: " + latitude + "<br>Longitude: " + longitude;
//   }
  
//   function storeInFirebase(position) {
//     var latitude = position.coords.latitude;
//     var longitude = position.coords.longitude;
  
//     var database = firebase.database();
//     var locationsRef = database.ref("locations");
//     var newLocationRef = locationsRef.push();
  
//     newLocationRef.set({
//       latitude: latitude,
//       longitude: longitude
//     })
//     .then(function() {
//       console.log("Geolocation data successfully stored in Firebase.");
//     })
//     .catch(function(error) {
//       console.error("Error storing geolocation data: ", error);
//     });
//   }



















  // Initialize Firebase
//   firebase.initializeApp(firebaseConfig);
  
//   function getLocation() {
//     var locationOutput = document.getElementById("location");
  
//     if (navigator.permissions) {
//       navigator.permissions.query({ name: 'geolocation' }).then(function(permissionStatus) {
//         if (permissionStatus.state === 'granted') {
//           navigator.geolocation.getCurrentPosition(function(position) {
//             showPosition(position);
//             storeInFirebase(position);
//           }, showError);
//         } else if (permissionStatus.state === 'prompt') {
//           permissionStatus.onchange = function() {
//             if (permissionStatus.state === 'granted') {
//               navigator.geolocation.getCurrentPosition(function(position) {
//                 showPosition(position);
//                 storeInFirebase(position);
//               }, showError);
//             }
//           };
//         }
//       });
//     } else {
//       locationOutput.innerHTML = "Geolocation is not supported by this browser.";
//     }
//   }
  
//   function showPosition(position) {
//     var latitude = position.coords.latitude;
//     var longitude = position.coords.longitude;
  
//     var locationOutput = document.getElementById("location");
//     locationOutput.innerHTML = "Latitude: " + latitude + "<br>Longitude: " + longitude;
//   }
  
//   function showError(error) {
//     var locationOutput = document.getElementById("location");
  
//     switch (error.code) {
//       case error.PERMISSION_DENIED:
//         locationOutput.innerHTML = "User denied the request for Geolocation.";
//         break;
//       case error.POSITION_UNAVAILABLE:
//         locationOutput.innerHTML = "Location information is unavailable.";
//         break;
//       case error.TIMEOUT:
//         locationOutput.innerHTML = "The request to get user location timed out.";
//         break;
//       case error.UNKNOWN_ERROR:
//         locationOutput.innerHTML = "An unknown error occurred.";
//         break;
//     }
//   }
  
//   function storeInFirebase(position) {
//     var latitude = position.coords.latitude;
//     var longitude = position.coords.longitude;
  
//     var database = firebase.database();
//     var locationsRef = database.ref("locations");
//     var newLocationRef = locationsRef.push();
  
//     newLocationRef.set({
//       latitude: latitude,
//       longitude: longitude
//     })
//     .then(function() {
//       console.log("Geolocation data successfully stored in Firebase.");
//     })
//     .catch(function(error) {
//       console.error("Error storing geolocation data: ", error);
//     });
//   }
//   firebase.initializeApp(firebaseConfig);
  
//   // Get geolocation data and store it in Firebase
//   if (navigator.geolocation) {
//     navigator.geolocation.getCurrentPosition(function(position) {
//       var latitude = position.coords.latitude;
//       var longitude = position.coords.longitude;
  
//       // Store the geolocation data in Firebase
//       var database = firebase.database();
//       var locationsRef = database.ref("locations");
//       var newLocationRef = locationsRef.push();
      
//       newLocationRef.set({
//         latitude: latitude,
//         longitude: longitude
//       })
//       .then(function() {
//         console.log("Geolocation data successfully stored in Firebase.");
//       })
//       .catch(function(error) {
//         console.error("Error storing geolocation data: ", error);
//       });
//     }, function(error) {
//       console.error("Error retrieving geolocation: ", error);
//     });
//   } else {
//     console.log("Geolocation is not supported by this browser.");
//   }
// Function to get geolocation and store it in Firebase
// function getGeolocationAndStore() {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(function(position) {
//         var latitude = position.coords.latitude;
//         var longitude = position.coords.longitude;
  
//         // Store the geolocation data in Firebase
//         var database = firebase.database();
//         var locationsRef = database.ref("locations");
//         var newLocationRef = locationsRef.push();
        
//         newLocationRef.set({
//           latitude: latitude,
//           longitude: longitude
//         })
//         .then(function() {
//           console.log("Geolocation data successfully stored in Firebase.");
//         })
//         .catch(function(error) {
//           console.error("Error storing geolocation data: ", error);
//         });
//       }, function(error) {
//         console.error("Error retrieving geolocation: ", error);
//       });
//     } else {
//       console.log("Geolocation is not supported by this browser.");
//     }
//   }
  
  // Execute getGeolocationAndStore when the page finishes loading
//   window.onload = getGeolocationAndStore;