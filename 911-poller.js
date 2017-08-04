exports.myHandler = function (event, context) {
    var RTM = require("satori-rtm-sdk");
    var request = require("request");
    var endpoint = "";
    var appKey = "";
    var role = "";
    var roleSecret = "";

    var channelName = "seattle-911-incident-response";

    // Check if the role is set to authenticate or not
    var shouldAuthenticate = false;
    var authProvider;

    if (shouldAuthenticate) {
        authProvider = RTM.roleSecretAuthProvider(role, roleSecret);
    }

    var rtm = new RTM(endpoint, appKey, { authProvider: authProvider });

    rtm.on("enter-connected", function () {
        console.log("Connected");
        var data = request("https://data.seattle.gov/resource/pu5n-trf4.json", function (error, response, body) {
            var parsedResponse = JSON.parse(body);
            for (var i = 0; i < parsedResponse.length; i++) {
                publishToSatoriChannel(parsedResponse[i]);
            }

        });
    });
    console.log("Starting RTM");
    rtm.on("error", function (error) {
        console.writeln("Error connecting to RTM: " + error.message);
        rtm.stop();
    });
    rtm.start();

    var publishToSatoriChannel = function (objectToPush) {
        rtm.publish(channelName, objectToPush, function (pdu) {
            if (pdu.action.endsWith("/ok")) {
                // Publish is confirmed by Satori RTM.
                console.log("Published data: " + JSON.stringify(objectToPush));
            } else {
                console.log("Publish request failed: " + pdu.body.error + " - " + pdu.body.reason);
            }
        });
    }
}