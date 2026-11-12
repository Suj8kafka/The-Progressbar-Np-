(function () {
    'use strict';
    // Public web configuration identifies projects. Database Rules control access.
    // Never put service-account credentials here.
    const configurations = {
        contact: {
            apiKey: 'AIzaSyC_SF82GQR6edfhZsOkbj1EIES0KB-2PmA',
            authDomain: 'the-progressbar-form-database.firebaseapp.com',
            databaseURL: 'https://the-progressbar-form-database-default-rtdb.firebaseio.com',
            projectId: 'the-progressbar-form-database',
            appId: '1:702353361774:web:024dd39e7e0856f87c8f7f'
        },
        publicMessages: {
            apiKey: 'AIzaSyAfXF8OEfXpSjLY6YvqU22y2X0rTW2I7zY',
            authDomain: 'form-firebase-realtimedata.firebaseapp.com',
            databaseURL: 'https://form-firebase-realtimedata-default-rtdb.firebaseio.com',
            projectId: 'form-firebase-realtimedata',
            appId: '1:636354839867:web:ba4838a7f986688184231e'
        }
    };
    function getDatabase(name) {
        if (!window.firebase || typeof window.firebase.database !== 'function') {
            throw new Error('Firebase could not be loaded.');
        }
        if (!Object.prototype.hasOwnProperty.call(configurations, name)) {
            throw new Error('Unknown Firebase application.');
        }
        const app = window.firebase.apps.find((candidate) => candidate.name === name)
            || window.firebase.initializeApp(configurations[name], name);
        return app.database();
    }
    function showStatus(element, message, state) {
        element.hidden = !message;
        element.textContent = message;
        element.dataset.state = state;
    }
    window.ProgressFirebase = Object.freeze({ getDatabase, showStatus });
}());
