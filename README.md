# MMM-Ecobee

Module for MagicMirror² that supports ecobee thermostats.

## Dependencies

* An installation of [MagicMirror²](https://github.com/MichMich/MagicMirror)

## Installation

1. Clone this repo into `MagicMirror/modules` directory.
1. Configure your `MagicMirror/config/config.js`:

```js
{
  module: 'MMM-Ecobee',
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
5. Enter the code provided.

Codes refresh every ~10mins.
The module will check for the completed authorization every 30sec.

If a code is not used for a long time (Magic Mirror is off, module is turned off, etc.) a new authorization may be required.

## Config Options

| **Option** | **Default** | **Description** |
| --- | --- | --- |
| `updateInterval` | `5 * 60 * 1000` | How often to update the thermostat's data, in milliseconds. Defaults to 5 minutes. This cannot be less than 3 minutes, per ecobee. |
| `showSensors` | `true` | If true, will show thermostat(s) as well as remote sensor(s). If false, will only show thermostat(s). |
| `showHumidity` | `true` | If true, will show current humidity for a thermostat, if available. |
| `showSetTemperature` | `true` | If true, will show the temperature a thermostat is set to cool/heat to. |

## Screenshot

![Screenshot](/sample.png?raw=true)
