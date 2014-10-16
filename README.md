# rtc.io "Hello World" demo

This is a demonstration app that provides you a starting point for building your first video conferencing application using [rtc.io](http://rtc.io/). The demo aims to ease you into working with rtc.io through using the prebuilt [`rtc.js`](https://github.com/rtc-io/rtc) bundle.  If you are comfortable using with [browserify](http://browserify.org/) then you should be able to dig and use some of the lower-level packages such as [`rtc-quickconnect`](https://github.com/rtc-io/rtc) and [others](http://rtc.io/modules.html) after playing with this demo.

## Getting Started

To have a play with this demo application, simply do the following:

### Prerequisites

- git, node and npm
- gulp: `npm install -g gulp`

### Clone and Go

```
git clone https://github.com/rtc-io/demo-helloworld.git
cd demo-helloworld
npm install
gulp
```

This will provide you information on the various build options available to you that have been provided in the [`gulpfile`](gulpfile.js).  This should be something similar to what is displayed below:

```
Usage
  gulp [task]

Available tasks
  help            Display this help text.
  package         Package for upload to build.rtc.io
  serve           Serve the local files using a development server
  vendor          Rebuild vendor scripts from node package dependencies
  vendor-rtc
  vendor-rtc-ios
```

## build.rtc.io ready

This is a demo that has been constructed from the ground-up to be compatible with a [soon to be released hosted build service](http://build.rtc.io/) that will produce WebRTC enabled iOS applications in process similar to (and inspired by) [PhoneGap build](http://build.phonegap.com). To package an archive ready for upload to the service, using the following command:

```
gulp package
```

## LICENSE

This demo is licensed under the [MIT LICENSE](https://raw.githubusercontent.com/rtc-io/demo-helloworld/gh-pages/LICENSE)
