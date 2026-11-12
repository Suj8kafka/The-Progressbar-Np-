// Get the button element and message box element
var showMessageBoxBtn = document.getElementById('show-message-box-btn');
var messageBox = document.getElementById('message-box');
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('message-input');
var messageList = document.getElementById('message-list');

// Listen for the button click event
showMessageBoxBtn.addEventListener('click', function () {
  // Toggle the visibility of the message box
  if (messageBox.classList.contains('hidden')) {
    messageBox.classList.remove('hidden');
  } else {
    messageBox.classList.add('hidden');
  }
});

// Initialize Firebase
var config = {
  // Replace with your Firebase configuration
  apiKey: "AIzaSyAfXF8OEfXpSjLY6YvqU22y2X0rTW2I7zY",
      authDomain: "form-firebase-realtimedata.firebaseapp.com",
      databaseURL: "https://form-firebase-realtimedata-default-rtdb.firebaseio.com",
      projectId: "form-firebase-realtimedata",
      storageBucket: "form-firebase-realtimedata.appspot.com",
      messagingSenderId: "636354839867",
      appId: "1:636354839867:web:ba4838a7f986688184231e",
      measurementId: "G-27XNZ7BBS4"
};

firebase.initializeApp(config);

// Get a reference to the Firebase database
var database = firebase.database();

// Listen for the form submit event
messageForm.addEventListener('submit', function (e) {
  e.preventDefault();

  // Get the message text
  var messageText = messageInput.value.trim();

  // Only proceed if the message is not empty
  if (messageText !== '') {
    // Create a new message object with the message text and current timestamp
    var message = {
      text: messageText,
      timestamp: new Date().toString()
    };

    // Push the message object to the Firebase database
    database.ref('messages').push(message);

    // Clear the input field
    messageInput.value = '';
  }
});

// Listen for new messages added to the database
database.ref('messages').on('child_added', function (snapshot) {
  // Get the message object
  var message = snapshot.val();

  // Create a new list item for the message
  var listItem = document.createElement('div');
  listItem.classList.add('message-list-item');
  listItem.innerHTML = '<p>' + message.text + '</p><p class="timestamp">' + message.timestamp + '</p>';

  // Append the list item to the message list
  messageList.appendChild(listItem);
});