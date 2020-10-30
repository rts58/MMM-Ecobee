const NodeHelper = require("node_helper");
const path = require("path");
const fs = require("fs");
var Https = require("https");
var Querystring = require("querystring");
const filename = "/tokens.json";
var configFilename = path.resolve(__dirname + filename);

const appKey = "jY03ZxGNFWNpPxQJ03vviHL028l8zGZT";

module.exports = NodeHelper.create({
  start() {
    console.log("##### Starting node helper for: " + this.name);

    console.info("**** Setting the tokens from File!");
    fs.readFile(configFilename, (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return;
        }

        throw err;
      }

      var parsedData = JSON.parse(data);
      this.access_token = parsedData.access_token;
      this.refresh_token = parsedData.refresh_token;
    });
  },

  getRequestOptions(path, method, authenticated) {
    var options = {
      hostname: "api.ecobee.com",
      headers: {
        "Content-Type": "application/json"
      },
      path: path,
      method: method
    };

    if (authenticated) {
      options.headers["authorization"] = `Bearer ${this.access_token}`;
    }

    return options;
  },

  updateSensors() {
    if (this.updatingSensors) {
      console.log("already updating sensors, skipping re-entrancy");
      return;
    }

    if (!this.access_token) {
      console.log("no valid access token - requesting a new pin");
      this.pin();
      return;
    }

    this.updatingSensors = true;

    // todo: poll /thermostatSummary, extract revision, compare before doing a full /thermostat pull.
    // ref: https://www.ecobee.com/home/developer/api/documentation/v1/operations/get-thermostat-summary.shtml

    console.log("Updating sensors with fresh data...");
    var options = this.getRequestOptions("/1/thermostat?" +
      Querystring.stringify({
        json: JSON.stringify({
          selection: {
            selectionType: "registered",
            includeRuntime: "true",
            includeSettings: true,
            selectionMatch: "",
            includeSensors: true
          }
        })
      }), "GET", true);

    var request = Https.request(options, (response) => {
      var data = "";
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          var reply = JSON.parse(data);
          console.info(" . ");
          console.info("Beginning of Update Data:");
          console.info(" . ");
          console.info(reply);
          var status = reply["status"] || { code: 1 };
          var code = status["code"];
          if (code === 0) {
            console.info("Data for updating the sensors acquired and sent back");
            this.sendSocketNotification("UPDATE_MAIN_INFO", reply);
          } else if (code >= 3 && code <= 4) {
            console.debug("received server-side error code. ignoring.");
          } else if (code >= 5 && code <= 13) {
            console.debug("request error. please submit an issue");
          } else if (code === 14) {
            console.info("Refresh");
            this.refresh();
          } else {
            console.info(status["message"] + " Re-requesting authorization!");
            this.access_token = null;
            this.refresh_token = null;
            this.pin();
          }

          this.updatingSensors = false;
        });
    });

    request.on("error", (error) => {
      console.info(error + " Retrying request.");
      setTimeout(() => {
        this.updatingSensors = false;
        this.updateSensors()
      }, 1000);
    });

    request.end();
  },

  refresh() {
    console.info("Refreshing tokens...");
    var options = this.getRequestOptions("/token?" +
      Querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: this.refresh_token,
        client_id: appKey,
        ecobee_type: "jwt"
      }), "POST");

    var request = Https.request(options, (response) => {
      var data = "";
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          var reply = JSON.parse(data);
          console.info(reply);
          switch (reply["error"] || null) {
            case null:
              console.info("#### Tokens");
              this.access_token = reply["access_token"];
              this.refresh_token = reply["refresh_token"];
              this.writeToFile(this.access_token, this.refresh_token);
              this.updateSensors(); //after refreshing it will try to update it again
              break;

            default:
              //Refreshing error, so we need a new PIN authorization
              console.info(reply["error_description"] + " Re-requesting authorization!");
              this.access_token = null;
              this.refresh_token = null;
              //get a new pin!
              this.pin();
              break;
          }
        });
    });

    // console.info("**** API is: " + appKey);
    // console.info("**** Refresh Token is: " + refresh_token);

    request.on("error", (error) => {
      console.error(error + " Re-requesting authorization! - AGAIN !!");
      setTimeout(() => this.pin(), 1000);
    });

    //console.info(request);
    request.end();
  },

  pin() {
    if (this.expiration_time && this.expiration_time > new Date()) {
      console.info("skipping pin request, expiration is pending");
      return;
    }

    console.info("@@@@@@@ Requesting authorization code...");
    var options = this.getRequestOptions("/authorize?" +
      Querystring.stringify({
        response_type: "ecobeePin",
        client_id: appKey,
        scope: "smartRead"
      }), "GET");

    var request = Https.request(options, (response) => {
      var data = "";
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          var reply = JSON.parse(data);
          console.info("this is what I am getting from the PIN REQUEST");
          console.info(reply);
          var pin = reply["ecobeePin"];
          var code = reply["code"];
          var expires_in = reply["expires_in"];
          this.expiration_time = new Date();
          this.expiration_time.setMinutes(this.expiration_time.getMinutes() + expires_in);
          console.info("These are the steps authorize this application to access your Ecobee 3:");
          console.info("  1. Go to https://auth.ecobee.com/u/login");
          console.info("  2. Login to your thermostat console ");
          console.info("  3. Select 'MY APPS' from the menu on the top right.");
          console.info("  4. Click 'Add Application' ");
          console.info(`  5. Enter the following authorization code in the next ${expires_in} minutes:`);
          console.info("   ┌──────┐  ");
          console.info("   │ " + pin + " │  ");
          console.info("   └──────┘  ");
          console.info("  6. Wait a moment.");

          this.authorize(code);
          this.sendSocketNotification("UPDATE_PIN", { pin, expires_in });
        });
    });

    request.on("error", (error) => {
      console.info(error + " Retrying request.");
      // setTimeout(this.pin, 1000);
    });

    request.end();
  },

  authorize(code) {
    //This keeps checking for authorization code
    console.info("Authorizing plugin to access the thermostat...");
    var options = this.getRequestOptions("/token?" +
      Querystring.stringify({
        grant_type: "ecobeePin",
        client_id: appKey,
        code: code,
        ecobee_type: "jwt"
      }), "POST");

    var request = Https.request(options, (response) => {
      var data = "";
      response
        .on("data", (chunk) => {
          data += chunk;
        })
        .on("end", () => {
          var reply = JSON.parse(data);
          console.info(reply);
          switch (reply["error"] || null) {
            case null:
              console.info("Authorization successful :-)");
              this.access_token = reply["access_token"];
              this.refresh_token = reply["refresh_token"];
              console.info("**** ACCESS TOKEN is: " + this.access_token);
              console.info("**** Refresh Token is: " + this.refresh_token);
              this.writeToFile(this.access_token, this.refresh_token);
              this.updateSensors();
              break;

            case "authorization_pending":
              console.info(reply["error_description"] + " Retrying in 30 seconds.");
              setTimeout(() => this.authorize(code), 31 * 1000, code);
              break;

            case "authorization_expired":
              console.info(reply["error_description"]);
              console.info("Expire | 10 minutes.");
              this.pin();
              break;

            default:
              console.info(reply["error_description"]);
              console.info("Wait | 10 seconds");
              setTimeout(() => this.authorize(code), 10 * 1000, code);
              break;
          }
        });
    });

    request.on("error", (error) => {
      console.info(error + " Retrying request.");
      setTimeout(() => this.authorize(code), 1000, code);
    });

    request.end();
  },

  writeToFile(accessToken, refreshToken) {
    // Write the new codes to file
    // var obj = {Tokens: []};
    // obj.Tokens.push({access_token: access_token, refresh_token: refresh_token});
    var obj = { access_token: accessToken, refresh_token: refreshToken };
    var json = JSON.stringify(obj);
    fs.writeFileSync(configFilename, json, "utf8");
  },

  socketNotificationReceived(notification) {
    if (notification === "UPDATE_SENSORS") {
      this.updateSensors();
    }
  }
});
