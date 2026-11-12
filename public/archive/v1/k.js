// Initialize Firebase (ADD YOUR OWN DATA)
const firebaseConfig = {
  apiKey: "AIzaSyC_SF82GQR6edfhZsOkbj1EIES0KB-2PmA",
  authDomain: "the-progressbar-form-database.firebaseapp.com",
  databaseURL: "https://the-progressbar-form-database-default-rtdb.firebaseio.com",
  projectId: "the-progressbar-form-database",
  storageBucket: "the-progressbar-form-database.appspot.com",
  messagingSenderId: "702353361774",
  appId: "1:702353361774:web:024dd39e7e0856f87c8f7f",
  measurementId: "G-V4P14FTLY4"
};
// const firebaseConfig = {
//     apiKey: "AIzaSyDIU4otdbs35G88kNpdJKZIttWTNMd-qGs",
//     authDomain: "contactform-f0a28.firebaseapp.com",
//     databaseURL: "https://contactform-f0a28-default-rtdb.firebaseio.com",
//     projectId: "contactform-f0a28",
//     storageBucket: "contactform-f0a28.appspot.com",
//     messagingSenderId: "467495307485",
//     appId: "1:467495307485:web:1042ec4896a426c12b3334",
      
  
//     };
  
  firebase.initializeApp(firebaseConfig);
  
  // Reference messages collection
  var messagesRef = firebase.database().ref('messages');
  
  // Listen for form submit
  document.getElementById('contactForm').addEventListener('submit', submitForm);
  
  // Submit form
  function submitForm(e){
    e.preventDefault();
  
    // Get values
    var email = getInputVal('email');
    var message = getInputVal('message');
  
    // Save message
    saveMessage(email, message);
  
    // Show alert
    document.querySelector('.alert').style.display = 'block';
  
    // Hide alert after 3 seconds
    setTimeout(function(){
    document.querySelector('.alert').style.display = 'none';
    },3000);
  
    // Clear form
    document.getElementById('contactForm').reset();
  }
  
  // Function to get get form values
  function getInputVal(id){
    return document.getElementById(id).value;
  }
  
  // Save message to firebase
  function saveMessage( email, message){
    var newMessageRef = messagesRef.push();
    newMessageRef.set({
      email:email,
      message:message
    });
  }
 

//In the code above, `'visitorCount'` is the name of the key in the database where you want to store the visitor count.
