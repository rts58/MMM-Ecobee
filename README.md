# MMM-Ecobee

Module for Magic Mirror that supports ecobee thermostats.

## Installation

1. Navigate into your MagicMirror `modules` folder and execute

`git clone https://github.com/parnic/MMM-Ecobee`

## Configuration on config.js

```javascript
{
  module: 'MMM-Ecobee',
  header: 'ecobee Thermostat',
  position: "top_left",
  config: {
  }
}
```

## Authorizing the module on your ecobee account

To authorize this application to access your Ecobee:

1. Go to <https://auth.ecobee.com/u/login>
2. Log in to your thermostat console
3. Select `My Apps` from the menu on the top right.
4. Click `Add Application`
5. Enter the code provided!

Code refresh every 5min.
Module check for the authorization every 30sec.

If a code is not used for a long time (Magic Mirror is off, module is turned off, etc.) a new authorization will be required.
