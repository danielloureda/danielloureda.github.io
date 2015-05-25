/*
 * Constructor for WeatherData class. This class holds all the weather info of a day.
 */
function WeatherData(date, img, degrees, description, maxDegrees, minDegrees,
		humidity, wind, windDegrees, sunset, sunrise, main) {
	var today = new Date(date * 1000);

	var days = new Array("SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT");
	this.day = days[today.getDay()];

	var dd = today.getDate();
	var mm = today.getMonth() + 1;

	var yyyy = today.getFullYear();
	if (dd < 10) {
		dd = '0' + dd;
	}
	if (mm < 10) {
		mm = '0' + mm;
	}
	this.date = dd + '/' + mm + '/' + yyyy;

	this.img = "assets/" + img + ".png";
	this.imgXL = "assets/" + img + ".png";
	this.degrees = Math.round(degrees)
			+ (_thisWea.units === "metric" ? "ºC" : "ºF");
	this.description = description;
	this.main = main;
	this.maxDegrees = Math.round(maxDegrees)
			+ (_thisWea.units === "metric" ? "ºC" : "ºF");
	this.minDegrees = Math.round(minDegrees)
			+ (_thisWea.units === "metric" ? "ºC" : "ºF");
	this.humidity = humidity + "%";
	this.wind = wind + " km/h";
	this.windDegrees = windDegrees;
	var dateSunset = new Date(sunset * 1000);
	this.sunset = dateSunset.getHours()
			+ ":"
			+ (dateSunset.getMinutes() < 10 ? '0' + dateSunset.getMinutes()
					: dateSunset.getMinutes());
	var dateSunrise = new Date(sunrise * 1000);
	this.sunrise = dateSunrise.getHours()
			+ ":"
			+ (dateSunrise.getMinutes() < 10 ? '0' + dateSunrise.getMinutes()
					: dateSunrise.getMinutes());
}