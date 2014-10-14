RTC({
  // use the public google stun servers :)
  ice: [
    { url: 'stun1.l.google.com:19302' },
    { url: 'stun2.l.google.com:19302' },
    { url: 'stun3.l.google.com:19302' },
    { url: 'stun4.l.google.com:19302' }
  ],

  // we want this to work on iOS as well so we will use
  // the rtc-plugin-nicta-ios plugin so we can use the
  // build.rtc.io to create a native iOS app
  plugins: [ RTC.IOS ]
});
