(function() {
  var room = location.hash.slice(1);
  var roomData = document.querySelector('.roomdata');
  var roomInput = roomData && roomData.querySelector('input[type="text"]');
  var conference;

  function connectToRoom() {
    if (roomData) {
      roomData.classList.remove('active');
    }

    conference = RTC({
      // use the rtc.io development and testing switchboard
      signaller: 'https://switchboard.rtc.io',

      // use the public google stun servers :)
      ice: [
        { url: 'stun1.l.google.com:19302' },
        { url: 'stun2.l.google.com:19302' },
        { url: 'stun3.l.google.com:19302' },
        { url: 'stun4.l.google.com:19302' }
      ],

      room: 'helloworld:' + room,

      // we want this to work on iOS as well so we will use
      // the rtc-plugin-nicta-ios plugin so we can use the
      // build.rtc.io to create a native iOS app
      plugins: [ RTC.IOS ]
    });
  }

  function handleKey(evt) {
    if (evt && evt.keyCode === 13) {
      updateRoom();
    }
  }

  function initEvents() {
    if (! roomData) {
      return;
    }

    roomData.querySelector('button').addEventListener('click', updateRoom);
    roomInput.addEventListener('keydown', handleKey);
    roomData.classList.add('ready');
  }

  function promptForRoom() {
    setTimeout(function() {
      roomData.classList.add('active');
    }, 50);
  }

  function updateRoom() {
    room = location.hash = roomInput.value;
    if (room) {
      connectToRoom();
    }
  }

  window.addEventListener('load', initEvents);

  if (! room) {
    return promptForRoom();
  }

  connectToRoom();
})();
