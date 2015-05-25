var _thisWea;

/*
 * Constructor for WeatherManager class. This class handles the user interface
 * and all the operations concerning to getting data from openweathermap.org. It
 * receives the names of the divs in order to change their content.
 */
function WeatherManager(cities, forecastContainer, inputCity, addCity, form,
		appTitle, today, forecast, collapseButton, todayWeather, city,
		progressBar, alert) {
	this.elements = {};
	this.elements[cities] = $("#" + cities);
	this.elements[forecastContainer] = $("#" + forecastContainer);
	this.elements[form] = $("#" + form);
	this.inputCity = document.getElementById(inputCity);
	this.elements[addCity] = $("#" + addCity);
	this.elements[inputCity] = $("#" + inputCity);
	this.elements[appTitle] = $("#" + appTitle);
	this.elements[today] = $("#" + today);
	this.elements[forecast] = $("#" + forecast);
	this.elements[collapseButton] = $("#" + collapseButton);
	this.elements[todayWeather] = $("#" + todayWeather);
	this.elements[city] = $("#" + city);
	this.elements[progressBar] = $("#" + progressBar);
	this.progressBarWidth = 0;
	this.elements[alert] = $("#" + alert);

	this.weatherInfo = this.getWeatherInfo();

	var options = {
		types : [ '(cities)' ]
	};

	this.online = false;
	this.autocomplete;
	this.weatherURL = "http://api.openweathermap.org/data/2.5/weather";
	this.forecastURL = "http://api.openweathermap.org/data/2.5/forecast/daily";
	this.appid = "b06ecca0bfb143f6b0cdd4cf689b4e4e";
	this.lang = "en";
	this.units = "metric";
	this.numberOfDays = 6;
	this.mode = "json";

	this.cityLat = 0;
	this.cityLong = 0;

	this.locations = new Array();

	this.lastUpdate = "";

	this.todayWeather = "";
	this.forecast = new Array();

	_thisWea = this;

	this.addListeners();
	this.addTooltips();

	this.addAutocomplete();
	if (this.online) {
		this.currentLocation = new Location(this.getCurrentWeather);
		this.locations.push(this.currentLocation);
	}

	this.loadWeatherInfo();

	if (!this.online)
		_thisWea.getCurrentWeather();

	this.checkBrowser();

	return this;
}

/*
 * Adds tooltips to the images
 */
WeatherManager.prototype.addTooltips = function() {
	_thisWea.elements["today"].find("#sunrise>img").attr("title",
	"Sunrise");
	_thisWea.elements["today"].find("#sunset>img").attr("title",
	"Sunset");
	_thisWea.elements["today"].find("#maxTemperature>img").attr("title",
	"Maximum temperature");
	_thisWea.elements["today"].find("#minTemperature>img").attr("title",
	"Minimum temperature");
	_thisWea.elements["today"].find("#wind>img").attr("title",
	"Wind");
	_thisWea.elements["today"].find("#humidity>img").attr("title",
	"Moisture");
	_thisWea.elements["todayWeather"].find("#todayImg").attr("title",
			"Current weather");
}

/*
 * Check if whether the browser is ready for some js features
 */
WeatherManager.prototype.checkBrowser = function() {
	if (!Modernizr.geolocation) {
		_thisWea.showAlert("<strong>Error</strong> Your browser does not have "
				+ "enabled geolocation. The application may run unexpectedly.",
				"alert-danger");
	} else if (!Modernizr.localstorage) {
		_thisWea.showAlert("<strong>Error</strong> Your browser does not have" +
				" enabled local storage. The application may run unexpectedly.",
				"alert-danger");
	} else if (!Modernizr.csstransitions) {
		_thisWea.showAlert("<strong>Warning</strong> Your browser does not have" +
				" enabled CSS transitions. The application may run unexpectedly.",
				"alert-warning");
	} else if (!Modernizr.cssanimations) {
		_thisWea.showAlert("<strong>Warning</strong> Your browser does not have" +
				" enabled CSS animations. The application may run unexpectedly.",
				"alert-warning");
	}
}

WeatherManager.prototype.showAlert = function(text, alertClass) {
	_thisWea.elements["alert"].html(text);
	_thisWea.elements["alert"].addClass(alertClass);
	_thisWea.elements["alert"].removeClass("hidden");
}
/*
 * Returns the array containing the weather info stored in Local Storage in JSON
 * format.
 */
WeatherManager.prototype.getWeatherInfo = function() {
	var weatherInfo = localStorage.getItem("weatherInfo");
	if (weatherInfo)
		weatherInfo = JSON.parse(weatherInfo);
	else
		weatherInfo = [];

	return weatherInfo;
}

/*
 * Load in memory the JSON object containing the weather info.
 */
WeatherManager.prototype.loadWeatherInfo = function() {
	var weatherInfo = _thisWea.getWeatherInfo();
	$.each(weatherInfo, function(i, day) {
		if (!day.location.gps)
			_thisWea.addLocation(day.location);
		if (!_thisWea.online && day.location.gps) {
			_thisWea.locations.push(day.location);
			_thisWea.currentLocation = day.location;
		}
	});
}

/*
 * Changes the weather info which is displayed in screen among the all weather
 * info of the forecast. It is fired when the user clicks one of the days in the
 * forecast list.
 */
WeatherManager.prototype.setTodayWeather = function(index) {
	_thisWea.todayWeather = _thisWea.forecast[index];
	_thisWea.onCurrentWeatherReady(true);
}

/*
 * Necessary code to use the google autocomplete library.
 */
WeatherManager.prototype.addAutocomplete = function() {
	if (_thisWea.online) {
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.src = 'http://maps.googleapis.com/maps/api/js?libraries=places&sensor=true'
				+ '&callback=_thisWea.initialize';
		document.body.appendChild(script);
	}
}

/*
 * Necessary code to initialize google autocomplete library if offline
 */
WeatherManager.prototype.initialize = function() {
	var options = {
		types : [ '(cities)' ]
	};
	_thisWea.autocomplete = new google.maps.places.Autocomplete(
			_thisWea.inputCity, options);
	google.maps.event.addListener(_thisWea.autocomplete, 'place_changed',
			function() {
				var place = _thisWea.autocomplete.getPlace();
				if (place.name !== "") {
					_thisWea.cityLat = place.geometry.location.A;
					_thisWea.cityLong = place.geometry.location.F;
				} else
					_thisWea.animate(_thisWea.elements["input"], "shake");
			});
}

/*
 * Adds every required listener in order to run the application.
 */
WeatherManager.prototype.addListeners = function(location) {
	if ("onLine" in navigator) {
		window.addEventListener("online", function online() {
			_thisWea.elements["appTitle"].css("color", "#acacac");
			_thisWea.animate(_thisWea.elements["appTitle"], "rubberBand");
			_thisWea.elements["input"].attr("disabled", false);
			_thisWea.elements["addCity"].attr("disabled", false);
			_thisWea.online = true;
		});

		window.addEventListener("offline", function offline(e) {
			_thisWea.elements["appTitle"].css("color", "red");
			_thisWea.animate(_thisWea.elements["appTitle"], "rubberBand");
			_thisWea.elements["input"].attr("disabled", true);
			_thisWea.elements["addCity"].attr("disabled", true);
			_thisWea.online = false;
		});

		if (navigator.onLine) {
			_thisWea.elements["appTitle"].css("color", "#acacac");
			_thisWea.animate(_thisWea.elements["appTitle"], "rubberBand");
			_thisWea.elements["input"].attr("disabled", false);
			_thisWea.elements["addCity"].attr("disabled", false);
			_thisWea.online = true;
		} else {
			_thisWea.elements["appTitle"].css("color", "red");
			_thisWea.animate(_thisWea.elements["appTitle"], "rubberBand");
			_thisWea.elements["input"].attr("disabled", true);
			_thisWea.elements["addCity"].attr("disabled", true);
			_thisWea.online = false;
		}
	} else {
		console.log("not supported");
	}
	$(window).resize(function(e) {
		var height = _thisWea.elements["today"].css("height");
		_thisWea.elements["forecast"].css("max-height", height);
	});
	$(document)
			.ready(
					function() {
						$(window)
								.keydown(
										function(event) {
											if ((event.keyCode == 13)
													&& (_thisWea.cityLat === 0 && _thisWea.cityLong === 0)) {
												event.preventDefault();
												return false;
											}
										});
					});

	_thisWea.elements["form"].submit(function(event) {
		event.preventDefault();
	});

	_thisWea.elements["cities"].on("click", "li", function() {
		if (!$(this).hasClass("active")) {
			_thisWea.elements["cities"].find("li").removeClass("active");
			$(this).addClass("active");
			var index = _thisWea.elements["cities"].find("li").index($(this));
			if (index > 1)
				index--;
			_thisWea.changeLocation(index);
		}
		_thisWea.elements["collapseButton"].click();
	});

	_thisWea.elements["cities"].on("click", "span", function(event) {
		if ($(this).hasClass("pull-right")) {
			// remove html
			var li = $(this).parent().parent();
			var index = _thisWea.elements["cities"].find("li").index(li);
			index--;
			// remove localstorage
			var weatherInfo = _thisWea.getWeatherInfo();
			var indexStorage = _thisWea.indexOfLocation(weatherInfo,
					_thisWea.locations[index]);
			if (indexStorage !== -1)
				weatherInfo.splice(indexStorage, 1);
			localStorage.setItem("weatherInfo", JSON.stringify(weatherInfo));
			event.stopPropagation();
			if (_thisWea.locations[index] === _thisWea.currentLocation) {
				_thisWea.elements["cities"].find("li").removeClass("active");
				_thisWea.elements["cities"].find("li").first().addClass(
						"active");
				_thisWea.changeLocation(0);
			}
			// removeHtml
			li.remove();
			// remove object
			_thisWea.locations.splice(index, 1);
		}
	});

	_thisWea.elements["forecastContainer"].on("click", "a", function() {
		var index = _thisWea.elements["forecastContainer"].find("a").index(
				$(this));
		_thisWea.setTodayWeather(index);
	});

	_thisWea.elements["addCity"].on("click", function() {
		if (_thisWea.cityLat === 0 && _thisWea.cityLong === 0) {
			_thisWea.animate(_thisWea.elements["input"], "shake");
		} else
			new Location(_thisWea.cityLat, _thisWea.cityLong,
					_thisWea.addLocation);
	});

};

/*
 * Adds a new location to the locations list and to the user interface. It is
 * fired when the user push tha Add button.
 */
WeatherManager.prototype.addLocation = function(location) {
	var val = _thisWea.elements["input"].val();
	var result = val.split(",");
	if (location.city === undefined) {
		location.city = result[0];
	}
	if (location.country === undefined) {
		location.country = result[result.length - 1];
	}
	$(_thisWea.elements["cities"])
			.append(
					"<li><a class='pointer'>"
							+ location.city
							+ "<span class='glyphicon glyphicon-remove pull-right'></span></a></li>");
	_thisWea.elements["input"].val("");
	_thisWea.cityLat = 0;
	_thisWea.cityLong = 0;
	_thisWea.locations.push(location);
};

/*
 * It changes the current location and refresh the weather info. It is fired
 * when the user clicks in a location of the locations list.
 */
WeatherManager.prototype.changeLocation = function(index) {
	_thisWea.currentLocation = _thisWea.locations[index];
	_thisWea.getCurrentWeather();
};

/*
 * Necessary code to dates treatment.
 */
Number.prototype.padLeft = function(base, chr) {
	var len = (String(base || 10).length - String(this).length) + 1;
	return len > 0 ? new Array(len).join(chr || '0') + this : this;
};

/*
 * Increases the progress bar by 100/6%
 */
WeatherManager.prototype.increaseProgressBar = function() {
	_thisWea.progressBarWidth += 20;
	_thisWea.elements["progressBar"].find(".progress-bar").css("width",
			(_thisWea.progressBarWidth) + "%");
}

/*
 * Clears the progress bar
 */
WeatherManager.prototype.clearProgressBar = function() {
	_thisWea.progressBarWidth = 0;
	_thisWea.elements["progressBar"].find(".progress-bar").css("width",
			(_thisWea.progressBarWidth) + "%");
	_thisWea.elements["progressBar"].removeClass("progress");
	_thisWea.elements["progressBar"].find(".progress-bar").remove();
}

/*
 * It animates the progress bar. This cannot be animated with animate() method
 * because it needs not to be displayed always.
 */
WeatherManager.prototype.animateProgressBar = function() {
	_thisWea.elements["progressBar"].removeClass("animated zoomIn");
	_thisWea.elements["progressBar"].addClass("animated zoomOut");
	_thisWea.timeoutID = window.setTimeout(_thisWea.clearProgressBar, 500);
}

/*
 * It does the request to the API for both the current weather and the forecast.
 */
WeatherManager.prototype.getCurrentWeather = function() {
	_thisWea.elements["progressBar"].addClass("progress");
	_thisWea.elements["progressBar"]
			.append("<div class='progress-bar progress-bar-success progress-bar-striped' role='progressbar' aria-valuenow='40' aria-valuemin='0' aria-valuemax='100' style='width: 0%'>	<span class='sr-only'>0% Complete (success)</span></div>");
	_thisWea.elements["progressBar"].removeClass("animated zoomOut");
	_thisWea.elements["progressBar"].addClass("animated zoomIn");
	_thisWea.increaseProgressBar();
	if (!_thisWea.online) {
		var weatherInfo = _thisWea.getWeatherInfo();
		var index;
		index = _thisWea.indexOfLocation(weatherInfo, _thisWea.currentLocation);
		_thisWea.lastUpdate = weatherInfo[index].updateTime;
		_thisWea.saveWeather(weatherInfo[index], false);
		_thisWea.saveForecast(weatherInfo[index], false);
	} else {
		_thisWea.forecast = [];
		$.get(_thisWea.weatherURL, {
			lat : _thisWea.currentLocation.lat,
			lon : _thisWea.currentLocation.long,
			lang : _thisWea.lang,
			APPID : _thisWea.appid,
			units : _thisWea.units
		}, function(result) {
			_thisWea.saveWeather(result);
		});
		var d = new Date();
		var dFormat = [ d.getDate().padLeft(), (d.getMonth() + 1).padLeft(),
				d.getFullYear() ].join('/')
				+ ' '
				+ [ d.getHours().padLeft(), d.getMinutes().padLeft(),
						d.getSeconds().padLeft() ].join(':');
		_thisWea.lastUpdate = dFormat;

		$.get(_thisWea.forecastURL, {
			lat : _thisWea.currentLocation.lat,
			lon : _thisWea.currentLocation.long,
			cnt : _thisWea.numberOfDays,
			APPID : _thisWea.appid,
			units : _thisWea.units,
			mode : _thisWea.mode,
			lang : _thisWea.lang
		}, function(result) {
			_thisWea.saveForecast(result);
		});
	}
	return _thisWea;
};

/*
 * It saves the current weather into memory.
 */
WeatherManager.prototype.saveWeather = function(result) {
	_thisWea.increaseProgressBar();
	if (arguments[1] === false) {
		_thisWea.todayWeather = result.today;
	} else {
		_thisWea.todayWeather = new WeatherData(result.dt,
				result.weather[0].icon, result.main.temp,
				result.weather[0].description, result.main.temp_max,
				result.main.temp_min, result.main.humidity, result.wind.speed,
				result.wind.degrees, result.sys.sunset, result.sys.sunrise,
				result.weather[0].main);
		_thisWea.forecast.splice(0, 0, _thisWea.todayWeather);
	}
	_thisWea.elements["forecastContainer"].find("#todayForecast>img").attr(
			"src", _thisWea.todayWeather.img);
	_thisWea.elements["forecastContainer"].find("#todayForecast>h5").html(
			_thisWea.todayWeather.main);
	_thisWea.elements["forecastContainer"].find("#todayForecast>h4").html(
			_thisWea.todayWeather.day);
	_thisWea.onCurrentWeatherReady(false);

	if (_thisWea.online)
		_thisWea.saveJsonWeather();
	_thisWea.increaseProgressBar();
};

/*
 * It saves the current weather into Local Storage in JSON format.
 */
WeatherManager.prototype.saveJsonWeather = function() {
	var weatherInfo = _thisWea.getWeatherInfo();

	var jsonInfo = {
		'location' : _thisWea.currentLocation,
		'today' : _thisWea.todayWeather,
		'forecast' : "",
		'updateTime' : _thisWea.lastUpdate
	}
	var index = _thisWea.indexOfLocation(weatherInfo, _thisWea.currentLocation);
	if (index !== -1) {
		weatherInfo[index].today = jsonInfo.today;
		weatherInfo[index].updateTime = jsonInfo.updateTime;
	} else {
		weatherInfo.push(jsonInfo);
	}
	localStorage.setItem("weatherInfo", JSON.stringify(weatherInfo));
};

/*
 * It returns the index of a location given in an array of weather info.
 */
WeatherManager.prototype.indexOfLocation = function(weatherInfo, location) {
	var ret = -1;
	$.each(weatherInfo, function(i, weather) {
		if ((weather.location.city === location.city)
				&& (weather.location.country === location.country))
			ret = i;
	});
	return ret;
}

/*
 * It saves the forecast into memory.
 */
WeatherManager.prototype.saveForecast = function(result) {
	_thisWea.increaseProgressBar();
	if (arguments[1] === false) {
		_thisWea.forecast = result.forecast;
	} else {
		$.each(result.list, function(i, day) {
			if (i !== 0) {
				_thisWea.forecast.push(new WeatherData(day.dt,
						day.weather[0].icon, day.temp.day,
						day.weather[0].description, day.temp.max, day.temp.min,
						day.humidity, day.speed, day.deg, 0, 0,
						day.weather[0].main));
			}
		});
	}
	_thisWea.onForecastReady();

	if (_thisWea.online)
		_thisWea.saveJsonForecast();
	_thisWea.increaseProgressBar();
};

/*
 * It saves the forecast into Local Storage in JSON format.
 */
WeatherManager.prototype.saveJsonForecast = function(result) {
	var weatherInfo = _thisWea.getWeatherInfo();

	var jsonInfo = {
		'location' : _thisWea.currentLocation,
		'today' : "",
		'forecast' : _thisWea.forecast,
		'updateTime' : _thisWea.lastUpdate
	}
	var index = _thisWea.indexOfLocation(weatherInfo, _thisWea.currentLocation);
	if (index !== -1) {
		weatherInfo[index].forecast = jsonInfo.forecast;
		weatherInfo[index].updateTime = jsonInfo.updateTime;
	} else {
		weatherInfo.push(jsonInfo);
	}
	localStorage.setItem("weatherInfo", JSON.stringify(weatherInfo));
};

/*
 * It prints into the screen the current weather info.
 */
WeatherManager.prototype.onCurrentWeatherReady = function(refresh) {
	_thisWea.timeoutID = window.setTimeout(_thisWea.animateProgressBar, 2000);
	if (_thisWea.todayWeather.sunrise === "1:00") {
		_thisWea.elements["today"].find("#sunrise").removeClass(
				"animated bounceIn");
		_thisWea.elements["today"].find("#sunset").removeClass(
				"animated bounceIn");
		_thisWea.elements["today"].find("#sunrise").addClass(
				"animated bounceOut");
		_thisWea.elements["today"].find("#sunset").addClass(
				"animated bounceOut");
	} else {
		_thisWea.elements["today"].find("#sunrise>h4").html(
				_thisWea.todayWeather.sunrise);
		_thisWea.elements["today"].find("#sunrise>img").attr("src",
				"./assets/sunrise.png");
		_thisWea.elements["today"].find("#sunset>h4").html(
				_thisWea.todayWeather.sunset);
		_thisWea.elements["today"].find("#sunset>img").attr("src",
				"./assets/sunset.png");
		_thisWea.elements["today"].find("#sunrise").removeClass(
				"animated bounceOut");
		_thisWea.elements["today"].find("#sunset").removeClass(
				"animated bounceOut");
		_thisWea.elements["today"].find("#sunrise").addClass(
				"animated bounceIn");
		_thisWea.elements["today"].find("#sunset")
				.addClass("animated bounceIn");
	}
	_thisWea.elements["todayWeather"].find("#todayImg").attr("src",
			_thisWea.todayWeather.imgXL);
	_thisWea.animate(_thisWea.elements["todayWeather"].find("#todayImg"),
			"bounceInUp");
	if (!refresh) {
		$("#lastUpdate").html("Last update: " + _thisWea.lastUpdate);
		_thisWea.animate($("#lastUpdate"), "fadeInDown");
	}
	$("#date").html(_thisWea.todayWeather.date);
	_thisWea.animate($("#date"), "fadeInRightBig");
	_thisWea.elements["todayWeather"].find("span").html(
			_thisWea.todayWeather.degrees);
	_thisWea.animate(_thisWea.elements["todayWeather"].find("span"),
			"bounceInRight");
	_thisWea.elements["todayWeather"].find("h2").html(
			_thisWea.todayWeather.description);
	_thisWea.animate(_thisWea.elements["todayWeather"].find("h2"),
			"bounceInLeft");
	_thisWea.elements["today"].find("#maxTemperature>img").attr("src",
			"./assets/maxDegrees.png");
	_thisWea.elements["today"].find("#maxTemperature>h4").html(
			_thisWea.todayWeather.maxDegrees);
	_thisWea.elements["today"].find("#minTemperature>img").attr("src",
			"./assets/minDegrees.png");
	_thisWea.elements["today"].find("#minTemperature>h4").html(
			_thisWea.todayWeather.minDegrees);
	_thisWea.elements["today"].find("#humidity>img").attr("src",
			"./assets/humidity.png");
	_thisWea.elements["today"].find("#humidity>h4").html(
			_thisWea.todayWeather.humidity);
	_thisWea.elements["today"].find("#wind>img").attr("src",
			"./assets/wind.png");
	_thisWea.elements["today"].find("#wind>h4")
			.html(_thisWea.todayWeather.wind);
	_thisWea.animate(_thisWea.elements["today"].find("#otherTodayWeather"),
			"fadeIn");
	if (!refresh) {
		_thisWea.elements["city"].html(_thisWea.currentLocation.city + ", "
				+ _thisWea.currentLocation.country);
		_thisWea.animate(_thisWea.elements["city"], "fadeInLeftBig");
	}
};

/*
 * It animates the given element with the given animation.
 */
WeatherManager.prototype.animate = function(element, animation) {
	element
			.addClass(animation + " animated")
			.one(
					"webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationEnd animationEnd",
					function() {
						if ($(this).attr("id") === "otherTodayWeather") {
							var height = _thisWea.elements["today"]
									.css("height");
							_thisWea.elements["forecast"].css("max-height",
									height);
						}
						$(this).removeClass(animation + " animated");
					});
}

/*
 * It prints into the screen the forecast info.
 */
WeatherManager.prototype.onForecastReady = function() {
	if (_thisWea.forecast.length === 5) {
		$.each(_thisWea.forecast, function(i, day) {
			_thisWea.elements["forecastContainer"].find("#day" + i + ">img")
					.attr("src", day.img);
			_thisWea.elements["forecastContainer"].find("#day" + i + ">h5")
					.html(day.main);
			_thisWea.elements["forecastContainer"].find("#day" + i + ">h4")
					.html(day.day);
		});
	} else {
		$.each(_thisWea.forecast, function(i, day) {
			if (i != 0) {
				_thisWea.elements["forecastContainer"].find(
						"#day" + (i - 1) + ">img").attr("src", day.img);
				_thisWea.elements["forecastContainer"].find(
						"#day" + (i - 1) + ">h5").html(day.main);
				_thisWea.elements["forecastContainer"].find(
						"#day" + (i - 1) + ">h4").html(day.day);
			}
		});
	}
	var height = _thisWea.elements["today"].css("height");
	_thisWea.elements["forecast"].css("max-height", height);
	_thisWea.animate(_thisWea.elements["forecastContainer"], "fadeIn");
	_thisWea.elements["forecastContainer"].css("visibility", "visible");
};
