/* Magic Mirror
 * Module: MMM-Ecobee
 *
 * By Fábio Alves
 * MIT Licensed.
 */
Module.register("MMM-Ecobee", {
  // Default module config.
  defaults: {
    units: config.units,
    updateInterval: 5 * 60 * 1000, // updates every minute
    animationSpeed: 2 * 1000,
    authorization_token: "nada",
    access_token: "acesso default",
    refresh_token: "autualizao default"
  },

  getStyles() {
    return ["MMM-Ecobee.css"];
  },

  getDom() {
    var wrapper = document.createElement("table");
    wrapper.className = "small dimmed";

    if (this.tempData.length === 0) {
      //No data was received and PIN is not working
      wrapper.innerHTML =
        "These are the steps authorize this application to access your Ecobee 3:<br>" +
        "  1. Go to https://www.ecobee.com/home/ecobeeLogin.jsp<br>" +
        "  2. Login to your thermostat console <br>" +
        "  3. Select 'MY APPS' from the menu on the top right.<br>" +
        "  4. Click 'Add Application' <br>" +
        "  5. Enter the following authorization code: " +
        "<b>" +
        this.pin +
        "</b>";
    } else {
      //iterate tru the reply list for all thermostats
      for (var e in this.tempData.thermostatList) {
        var thermo = this.tempData.thermostatList[e];

        //getting Settings from the Main Thermostat
        var hvacMode = thermo.settings.hvacMode;
        var desiredHeat = Math.round(thermo.runtime.desiredHeat / 10);
        var desiredCool = Math.round(thermo.runtime.desiredCool / 10);

        for (var x in thermo.remoteSensors) {
          var device = thermo.remoteSensors[x];
          var eventWrapper = document.createElement("tr");
          eventWrapper.className = "normal";

          //Add LOGO
          var symbolWrapper = document.createElement("td");
          symbolWrapper.className = "icon";
          var deviceType = document.createElement("img");
          if (device.type === "thermostat") {
            switch (hvacMode) {
              case "off":
                deviceType.src = this.file("images/g_thermo_off.png");
                break;
              default:
                deviceType.src = this.file("images/g_thermo_on.png");
                break;
            }
          } else {
            if (device.capability[1].value === "true") {
              //There is motion
              deviceType.src = this.file("images/sensor_motion.png");
            } else {
              deviceType.src = this.file("images/sensor_no_motion.png");
            }
          }
          symbolWrapper.appendChild(deviceType);
          eventWrapper.appendChild(symbolWrapper);

          var titleWrapper = document.createElement("td");
          titleWrapper.innerHTML = device.name;
          titleWrapper.className = "title";
          eventWrapper.appendChild(titleWrapper);

          /// INFORMATION TABLE
          var currentLogo = document.createElement("td");
          currentLogo.className = "heat logo align-left";
          var currentLogoIcon = document.createElement("i");
          currentLogoIcon.classList = ["fas fa-thermometer-half"];
          currentLogo.appendChild(currentLogoIcon);
          eventWrapper.appendChild(currentLogo);

          var currentTemp = document.createElement("td");
          currentTemp.className = "current_temp";
          currentTemp.innerHTML = Math.round(device.capability[0].value / 10);
          eventWrapper.appendChild(currentTemp);

          // IF DEVICE is Thermostat and NOT SENSOR
          if (device.type === "thermostat") {
            var programLogo = document.createElement("td");
            programLogo.className = "program logo align-center";
            var programLogoIcon = document.createElement("img");

            //Different Temperature/LOGO to display depending on the program

            var temperatureToDisplay;
            var iconToDisplay;

            switch (hvacMode) {
              case "cool":
                temperatureToDisplay = desiredCool;
                iconToDisplay = "images/g_cool.png";
                break;
              case "heat":
                temperatureToDisplay = desiredHeat;
                iconToDisplay = "images/g_heat.png";
                break;
              case "auto":
                temperatureToDisplay = desiredCool + " - " + desiredHeat;
                iconToDisplay = "images/g_auto.png";
                break;
              default:
                //off
                temperatureToDisplay = "";
                iconToDisplay = "images/g_off.png";
                break;
            }
            programLogoIcon.src = this.file(iconToDisplay);
            programLogo.appendChild(programLogoIcon);
            eventWrapper.appendChild(programLogo);

            var currentProgram = document.createElement("td");
            currentProgram.className = "current_program";
            currentProgram.innerHTML = temperatureToDisplay;
            eventWrapper.appendChild(currentProgram);

            var humLogo = document.createElement("td");
            humLogo.className = "program logo align-right";
            var humLogoIcon = document.createElement("img");
            humLogoIcon.src = this.file("images/hum.png");
            humLogo.appendChild(humLogoIcon);
            eventWrapper.appendChild(humLogo);

            currentTemp = document.createElement("td");
            currentTemp.className = "current Humidity align-left";
            currentTemp.innerHTML = device.capability[1].value + "%";
            eventWrapper.appendChild(currentTemp);
          }

          //secondTable.appendChild(informationTR);
          //eventWrapper.appendChild(midTable);

          //Add information
          wrapper.appendChild(eventWrapper);
        }
      }
    }

    return wrapper;
  }, //END OF getDom

  // Define start sequence.
  start() {
    Log.info("Starting module: " + this.name);

    this.tempData = new Array();
    this.sendSocketNotification("UPDATE_SENSORS");
    this.scheduleUpdate();
  }, ///End of START

  updateSensors() {
    console.log("**** Updating Sensors Notification");
    this.sendSocketNotification("UPDATE_SENSORS");
  },

  socketNotificationReceived(notification, payload) {
    Log.info("**** Ready to receive");
    if (notification === "UPDATE_MAIN_INFO") {
      Log.info("received the payload with the information to update!");
      this.tempData = payload;
      Log.info("1 - XXXXXXXXXX" + this.tempData.thermostatList[0].name);
      this.updateDom();
    } else if (notification === "UPDATE_PIN") {
      // No working pin was received
      this.tempData = [];
      this.pin = payload;
      Log.info("@@@@@@  Updating DOM and PIn with this pin: " + this.pin);
      this.updateDom();
    }
  },

  scheduleUpdate() {
    setInterval(() => {
      this.updateSensors();
      console.log("ˆˆˆˆ TIME OUT ");
    }, this.config.updateInterval);
  }
});
