# MMM-Ecobee    BETA v0.1

Module for Magic Mirror that supports ecobee Thermostat

## Installation

1. Navigate into your MagicMirror `modules` folder and execute

`git clone https://github.com/fabbr/MMM-Ecobee`

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

```text
These are the steps authorize this application to access your Ecobee 3:
  1. Go to https://www.ecobee.com/home/ecobeeLogin.jsp
  2. Login to your thermostat console
  3. Select 'MY APPS' from the menu on the top right.
  4. Click 'Add Application'
  5. Enter the code provided!
  
  Code refresh every 5min.
  Module check for the authorization every 30sec.
  
  If a code is not used for a long time (Magic Mirror is off, module is turned off, etc) a new authorization will be required.
```
