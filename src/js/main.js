/*
 * ngsi-datamodel2poi-regina
 * https://github.com/gbvsilva/ngsi-datamodel2poi-regina-operator
 *
 * Copyright (c) 2019 REGINA-Lab
 * Licensed under the MIT license.
 */

(function () {

    "use strict";

    var parseInputEndpointData = function parseInputEndpointData(data) {
        if (typeof data === "string") {
            try {
                data = JSON.parse(data);
            } catch (e) {
                throw new MashupPlatform.wiring.EndpointTypeError();
            }
        }

        if (data == null || typeof data !== "object") {
            throw new MashupPlatform.wiring.EndpointTypeError();
        }

        return data;
    };

    var processIncomingData = function processIncomingData(entities) {
        entities = parseInputEndpointData(entities);

        if (!Array.isArray(entities)) {
            entities = [entities];
        }

        var pois = entities.map(processEntity).filter((poi) => {return poi != null;});
        MashupPlatform.wiring.pushEvent("poiOutput", pois);

    };

    var processEntity = function processEntity(entity) {
        var coordinates = null;
        // Check if the entity is supported by this operator and log an error otherwise
        if (builders[entity.type] != undefined) {
            if (entity.location != null && typeof entity.location === "object") {
                // GeoJSON format: longitude, latitude[, elevation]
                // WireCloud: latitude and longitude
                coordinates = {
                    system: "WGS84",
                    lng: parseFloat(entity.location.coordinates[0]),
                    lat: parseFloat(entity.location.coordinates[1])
                };

                return entity2poi(entity, coordinates);
            }
        } else {
            MashupPlatform.operator.log("Entity type is not supported: " + entity.type);
        }
    };

    var entity2poi = function entity2poi(entity, coordinates) {
        return builders[entity.type](entity, coordinates);
    };

    var displayDate = function displayDate(date) {
        var d = date.split("/");

        if (d.length == 1) {
            return moment(d[0], null, MashupPlatform.context.get('language')).format('llll');
        } else if (d.length == 2) {
            return "From " + moment(d[0], null, MashupPlatform.context.get('language')).format('llll') + " to " + moment(d[1], null, MashupPlatform.context.get('language')).format('llll');
        }
    };

    var processAddress = function processAddress(entity) {
        if (entity.address == null || typeof entity.address !== "object") {
            return "";
        }

        var infoWindow = '<p><b><i class="fa fa-fw fa-address-card-o"/> Address: </b><br/>';
        if (entity.address.streetAddress) {
            infoWindow += entity.address.streetAddress + '<br/>';
        }

        var line = [];
        if (entity.address.addressLocality) {
            line.push(entity.address.addressLocality);
        }
        if (entity.address.addressRegion) {
            line.push(entity.address.addressRegion);
        }
        if (entity.address.postalCode) {
            line.push(entity.address.postalCode);
        }

        if (line.length > 0) {
            infoWindow += line.join(', ') + '<br/>';
        }

        if (entity.address.addressCountry) {
            infoWindow += entity.address.addressCountry;
        }
        infoWindow += '</p>';

        return infoWindow;
    };

    var renderSensor = function renderSensor(entity, coordinates) {
        var icon, hash;

        if(entity.id.match(/Regina/g) || entity.id.match(/ESP/g)) {
        	icon = "sensor";
        	hash = "regina:datamodel2poi:sensor";
    	}else {
    		icon = "generic";
    		hash = "generic:datamodel2poi:sensor";
    	}

        var poi = {
            id: entity.id,
            icon: {
                hash: hash,
                anchor: [0.5, 1],
                scale: 1.0,
                src: internalUrl('images/regina/' + icon + '.png')
            },
            tooltip: entity.id,
            data: entity,
            title: entity.id,
            infoWindow: null,
            currentLocation: coordinates,
            location: entity.location
        };

        return poi;
    };

    var internalUrl = function internalUrl(data) {
        var url = document.createElement("a");
        url.setAttribute('href', data);
        return url.href;
    };

    var builders = {
        // Sensors
        "Sensor": renderSensor,
        "SensorESP": renderSensor
    };


    /* TODO
     * this if is required for testing, but we have to search a cleaner way
     */
    if (window.MashupPlatform != null) {
        MashupPlatform.wiring.registerCallback("entityInput", processIncomingData);
    }

    /* MashupPlatform.prefs.registerCallback(function (new_preferences) {

    }.bind(this)); */

    /* test-code */

    /* end-test-code */

})();
