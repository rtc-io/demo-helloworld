# rtc.io "Hello World" demo

This is a demonstration app that provides you a starting point for building your first video conferencing application using [rtc.io](http://rtc.io/). The demo aims to ease you into working with rtc.io through using the prebuilt [`rtc.js`](https://github.com/rtc-io/rtc) bundle.

If you are comfortable using with [browserify](http://browserify.org/) then you should be able to dig and use some of the lower-level packages such as [`rtc-quickconnect`](https://github.com/rtc-io/rtc) and [others](http://rtc.io/modules.html) after playing with this demo.

If you just want to create a Zip file without installing gulp, that's possible, too. Read the below secion on "Creating a zip file without node, npm and gulp".


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

This is a demo that has been constructed from the ground-up to be compatible with a [hosted build service](http://build.rtc.io/) that will produce WebRTC enabled iOS applications in process similar to (and inspired by) [PhoneGap build](http://build.phonegap.com).

Make sure to use your own domain value in the domain attribute of the &lt;bundle> element of the config.xml file as app ID's must be unique with Apple.

To use this application with [build.rtc.io](http://build.rtc.io), prepare a zip file and upload it there.

You can use the `gulp package` command - it will include only those files required to build the application.
You can also use zip directly - use the extended command as below.

[build.rtc.io](http://build.rtc.io) generates an Apple package (.ipa or .app) which is ready to install on an iPhone/iPad or to publish on the Apple App Store.

### Use gulp to prepare archive.zip

To package an archive ready for upload to the service, use the following command:

```
gulp package
```

The archive.zip file will in the demo-helloworld directory ready for upload.

### Creating a zip file without node, npm and gulp

```
git clone https://github.com/rtc-io/demo-helloworld.git
cd demo-helloworld
zip -r archive.zip . -x *.git* -x *.zip -x gulpfile.js -x package.json -x "node_modules/*"
```

The archive.zip file will in the demo-helloworld directory ready for upload.

### Pre-requisites

To complete a build for app package, you just need a structured web applicate with config.xml in the root of the package.

To complete a build for an ipa package, you will need the following:

* Apple id enrolled in iOS Dev.
* Valid distribution provision under the Apple id above.
* A structured web application with config.xml in the root of the package (this is an example of such an app).

### Testing

When you have built it and installed on an iOS device, you can connect with it via http://rtc-io.github.io/demo-helloworld/#yourRoom (make sure to use the same room in the URL fragment that you've chosen in the iOS app).

### Example of config.xml
The `config.xml` is a regular XML-File. It has a strict structure like described here.

```xml
<config>
  <name>HelloWebRTCWorld</name>
  <author email="damon.oehlman@nicta.com.au" href="http://rtc.io">Damon Oehlman</author>
  <content path="/" src="index.html"/>
  <bundle domain="io.rtc.helloworld" version="1.0" />
  <ios>
    <build version="1.2" sdkversion="7.1" config="release"/>
    <icons>
      <icon size="29x29" file="icons/Icon-Small.png" idiom="ipad" />
      <icon size="40x40" file="icons/Icon-Small-40.png" idiom="all" />
      <icon size="58x58" file="icons/Icon-Small@2x.png" idiom="iphone" />
      <icon size="58x58" file="icons/Icon-Small@2x.png" idiom="ipad" />
      <icon size="76x76" file="icons/Icon-76.png" idiom="ipad" />
      <icon size="80x80" file="icons/Icon-Small-40@2x.png" idiom="all" />
      <icon size="120x120" file="icons/Icon-60@2x.png" idiom="iphone" />
      <icon size="152x152" file="icons/Icon-76@2x.png" idiom="ipad" />
    </icons>
  </ios>
</config>
```

#### Name element
The `config.xml` file **must** have a `name`-tag, which gives the ipa package its name.

#### Content tag
The `content`-tag **must** have a `path` attribute that defines the correct directory where the html start page can be found. By default, the application will try to load a index.html file from the `path` directory. You can change the start page's name by setting the `src` attribute.

#### Bundle tag
The `config.xml` file **must** have a 'bundle'-tag which defines the app's reverse-domain identifier in the `domain` attribute and it's version number expressed in major/minor notation.

#### iOS and build tag
The `ios`-tag defines the requirements for an iOS build. The `build`-tag is mandatory and defines the minimum system sdkversion and a config for release/debug build. The `version` attribute defines the build version.

#### Icons structure
The `icons` structure contains a list of icons of different pixel dimensions used for the app on different iOS version. All `icon`-tags **must** have a `size` attribute which adhere to fixed values. If the Web developer uploads an icon mismatching the given size, it could result in iOS ignoring it and replacing it with the white default icon.

The `file` attribute provides the file name for the icon. If the app is only built for one device, it can be a empty string to show it is not supported.

The `idiom` attribute **must** be given for showing which device will use this icon.


## LICENSE

This demo is licensed under the [MIT LICENSE](https://raw.githubusercontent.com/rtc-io/demo-helloworld/gh-pages/LICENSE)
