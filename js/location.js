var _thisLoc;

/*
 * Constructor for Location class. This class handles everything concerning to
 * the location of the user and the locations added by the user.
 */
function Location() {
	this.lat;
	this.long;
	this.city;
	this.country;
	this.gps;

	this.apiGeocoding = "http://maps.googleapis.com/maps/api/geocode/json";

	this.callback = arguments[0];
	_thisLoc = this;
	if (arguments.length === 1) {
		var options = {
			enableHighAccuracy : true,
			timeout : 5000,
			maximumAge : 0
		};
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(this.savePosition,
					this.showError, options);
			this.gps = true;
		} else {
			alert("Your navigator does not support location!");
		}
	} else {
		this.lat = arguments[0];
		this.long = arguments[1];
		this.gps = false;
		this.callback = arguments[2];
		this.storeLocation();
	}

}

/*
 * It saves the latitude and longitude of the user position.
 */
Location.prototype.savePosition = function(position) {
	if (position) {
		_thisLoc.lat = position.coords.latitude;
		_thisLoc.long = position.coords.longitude;
		_thisLoc.storeLocation();
	}

};

/*
 * It sends the request to google api in order to get the name of the city and
 * the country by its coordinates.
 */
Location.prototype.storeLocation = function() {
	$.get(_thisLoc.apiGeocoding, {
		latlng : _thisLoc.lat + "," + _thisLoc.long
	}, function(result) {
		_thisLoc.parseResult(result);
	});
};

/*
 * It is called when the response of google api is received. It parses the JSON
 * received and saves the name of the city and the country.
 */
Location.prototype.parseResult = function(result) {
	$.each(result.results, function(i, address) {
		if (address.types[0] === "postal_code"
			&& _thisLoc.city === undefined)
			_thisLoc.city = address.address_components[0].long_name;
		if (address.types[0] === "locality")
			_thisLoc.city = address.address_components[0].long_name;
		if (address.types[0] === "administrative_area_level_2"
			&& _thisLoc.country === undefined)
			_thisLoc.country = address.address_components[address.address_components.length - 1].long_name;
		if (address.types[0] === "country")
			_thisLoc.country = address.address_components[0].long_name;
	});
	_thisLoc.callback(_thisLoc);
};

/*
 * It shows an error if the navigator is not able to get the location
 */
Location.prototype.showError = function(error) {
	var errorTypes = {
		0 : "Unknown",
		1 : "Permission denied by the user",
		2 : "Position not allowed",
		3 : "Time-out overflow"
	};
	var errorMessage = errorTypes[error.code];
	if (error.code === 0 || error.code === 2) {
		errorMessage = errorMessage + " " + error.message;
	}
	_thisWea.showAlert("<strong>Error</strong> Your browser cannot get your geolocation. "+errorMessage+".",
			"alert-danger");
};