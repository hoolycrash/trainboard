// Save Site Type
const siteType = getSiteTypeFromURL();

// Save URL detail
const urlParams = new URLSearchParams(window.location.search);

// EXPERT MODE
// Hide Navbar
var hiddennavbar = urlParams.get('navbar');

if (hiddennavbar === "hide") {
	document.getElementById('navbar').classList.add('hidden');
}

// Hide Clock
var hiddenclock = urlParams.get('clock');

if (hiddenclock === "hide") {
	document.getElementById('clock').classList.add('hidden');
}

// Show Trainnumber
var hiddentrainnumbers = urlParams.get('trainnumbers');
var trainnumberson;

// Prevent Touch
var notouch = urlParams.get('touch');

if (notouch === "no") {
	document.getElementById('notouch').classList.remove('hidden');
}

var showsuburban = urlParams.get('suburban');
// END EXPERTMODE

const stationID = urlParams.get('station');
let hasSuburban;

// Load station Data
fetchStationData(stationID);

// Start Clock
setInterval(updateClock, 1000);
updateClock();

// Start loading data
// reload the function every 5 secs, so displayed data will always been up to date
setInterval(loadData, 5000);
loadData();

// Check site type
function getSiteTypeFromURL() {
	const url = document.location.href;
	if (url.includes("departure.html")) {
		return "D";
	} else if (url.includes("arrival.html")) {
		return "A";
	} else if (url.includes("suburban.html")) {
		return "S";
	} else if (url.includes("local.html")) {
		return "L";
	}
	// Default site type
	return "D";
}

// Fetch API Source to get station details
// (maybe AJAX or Fetch, "async await" is sometimes slow.)
async function fetchStationData(stationID) {
	try {
		const response = await fetch(`https://data.cuzimmartin.dev/station?stationID=${stationID}`, {
			method: "GET",
			mode: "cors"
		});
		const data = await response.json();
		processStationInfo(data, stationID);
	} catch (error) {
		console.error('Fehler beim Abrufen der Daten:', error);
	}
}

// Rendering station details for navbar & header
function processStationInfo(data, station) {
	const navbarDiv = document.getElementById('navbar');
	let navbarContent = '';

	// Local Services
	if (siteType === 'L') {
		navbarContent += `
                <div class="tabs">
                    <a href="#" class="active">&nbsp;Nahverkehr&nbsp;</a>
                </div>`;
	} else

		// Normal station
	if ((data.products.nationalExpress || data.products.national || data.products.regionalExpress || data.products.regional) && data.products.suburban === true) {
		navbarContent += `
                <div class="tabs">
                    <a href="departure.html?station=${station}" class="${siteType === 'D' ? 'active' : ''}">&nbsp;Abfahrt&nbsp;</a>
                    <a href="arrival.html?station=${station}" class="${siteType === 'A' ? 'active' : ''}">&nbsp;Ankunft&nbsp;</a>
                    <a href="suburban.html?station=${station}" class="${siteType === 'S' ? 'active' : ''}">&nbsp;S-Bahn&nbsp;</a>
                </div>`;
		hasSuburban = true;
	} else

		// S-Bahn only station
	if (data.products.suburban === true && data.products.regional === false) {
		if (siteType !== 'S') { document.location = `suburban.html?station=${station}`; }
		navbarDiv.innerHTML += '<a href="#" class="disabled">&nbsp;Abfahrt&nbsp;</a>' +
			'<a href="#" class="disabled">&nbsp;Ankunft&nbsp;</a>' +
			'<a href="suburban.html?station=' + station + '" class="active">&nbsp;S-Bahn&nbsp;</a>';
	} else

		// Station without S-Bahn
	if ((data.products.nationalExpress || data.products.national || data.products.regionalExpress || data.products.regional) && data.products.suburban === false) {
		if (siteType === 'S') { document.location = `departure.html?station=${station}`; }
		navbarContent += `
                <a href="departure.html?station=${station}" class="${siteType === 'D' ? 'active' : ''}">&nbsp;Abfahrt&nbsp;</a>
                <a href="arrival.html?station=${station}" class="${siteType === 'A' ? 'active' : ''}">&nbsp;Ankunft&nbsp;</a>
                <a href="#" class="disabled">&nbsp;S-Bahn&nbsp;</a>`;
	}

	navbarContent += `
            <div class="iconbar"><a class="navsearch" href="${siteType === 'L' ? 'localsearch' : 'index'}.html">${siteType === 'L' ? 'Haltestellen' : 'Stations'}suche</a></div>`;

	navbarDiv.innerHTML = navbarContent;

	// Add station name to div
	document.getElementById('stationname').textContent = data.name;

	document.getElementById('title').textContent = data.name;
}

// Clock
function updateClock() {
	const now = new Date();
	const hours = now.getHours().toString().padStart(2, '0');
	const minutes = now.getMinutes().toString().padStart(2, '0');
	document.getElementById('clock').innerHTML = `${hours}<span class="blink">:</span>${minutes}`;
}

// Fetch departures or arrivals
async function loadData() {
	const apiUrl = `https://data.cuzimmartin.dev/dynamic-${siteType === 'A' ? 'arrivals' : 'departures'}?stationID=${stationID}`;

	try {
		const response = await fetch(apiUrl, {
			method: "GET",
			mode: "cors"
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const jsonData = await response.json();
		const data = siteType === 'A' ? jsonData.arrivals : jsonData.departures;
		updateTable(data);
	} catch (error) {
		console.error('Fehler beim Abrufen der Daten:', error);
	}
}

function updateTable(data) {
	// Handle null response
	if (data == null) {
		console.log(formatTime(new Date()), 'Data Error:', data);
		return;
	}

	// Sort the entries by plannedWhen, ensuring that cancelled trips are also sorted correctly
	data.sort(function(a, b) {
		var timeA = a.plannedWhen !== null ? new Date(a.plannedWhen) : new Date(a.when);
		var timeB = b.plannedWhen !== null ? new Date(b.plannedWhen) : new Date(b.when);
		return timeA - timeB;
	});

	var tableBody = document.getElementById('tableBody');
	tableBody.innerHTML = ''; // Delete everything before rewriting table content

	let findtrain = 0;
	data.forEach(function(entry) {
		// If product is bus, ferry, subway, tram or taxi
		if (siteType !== 'L') {
			if (
				entry.line.product === "bus" ||
				entry.line.product === "ferry" ||
				entry.line.product === "subway" ||
				entry.line.product === "tram" ||
				entry.line.product === "taxi"
			) {
				// Skip this entry (not needed for a TRAIN ONLY board)
				return;
			}
		}

		if (siteType === 'L') {
			if (
				entry.line.product === "national" ||
				entry.line.product === "nationalExpress"
			) {
				// Skip this entry (not needed for a LOCAL SERVICES ONLY board)
				return;
			}
		}

		// If trip is cancelled
		if ((siteType === 'S' && entry.line.product !== "suburban") ||
			((siteType !== 'S' && siteType !== 'L') && entry.line.product === "suburban" && showsuburban !== 'show')) {
			return; // Skip everything except S-Bahn OR skip S-Bahn
		}

		var isCancelled = entry.remarks.some(function(remark) {
			return remark.type === "status" && remark.code === "cancelled";
		});

		// Is trip more than 10 mins ago?
		var plannedDepartureTime = new Date(entry.plannedWhen);
		var now = new Date();
		var diffPlannedMinutes = Math.round((now - plannedDepartureTime) / (1000 * 60));

		// If entry is cancelled and more than 10 mins ago skip (not necessary to skip cancelled trips which should have been departed already. may increase or decrease the time
		if (isCancelled && diffPlannedMinutes > 0) {
			return;
		}

		findtrain++;
		var row = tableBody.insertRow();
		//row.classList.add('boardrow');

		// Set style to line-through if cancelled
		if (isCancelled) {
			row.classList.add('cancelled');
		}

		var abMessage = (isCancelled) ? "" : getAbMessage(entry.when);

		// Extract the line name without the train number
		let lineParts = entry.line.name.split(" ");
		let lineName = lineParts[0] + (lineParts[1] ? " " + lineParts[1] : "");

		if (hiddentrainnumbers === "show") {
			var trainnumber = `<br>(${entry.line.fahrtNr})`;
		} else {
			var trainnumber = ``;
		}

		let linebadge = `<a href="trip.html?tripId=${encodeURIComponent(entry.tripId)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&stationID=${encodeURIComponent(stationID)}"><div class="linebadge ${entry.line.product} ${lineName.replace(/\s/g, '')}${entry.line.operator.id} ${entry.line.operator.id} ${entry.line.productName}">`;
		if (entry.line.operator.id === 'freiberger-eisenbahngesellschaft') {
			linebadge += "FEG</div>";
		} else if (entry.line.productName === "FEX") {
			linebadge += "FEX</div>";
		} else {
			linebadge += `${lineName}</div>`;
		}
		linebadge += `</a>`;



		row.insertCell(0).innerHTML = linebadge;

		// Calculate minutes from time now - departing time (needed for the countdown in sbahn tab)
		var now = new Date();
		var departureTime = new Date(entry.when);
		var timediff = Math.round((departureTime - now) / (1000 * 60));

		var countdownCell = row.insertCell(1);

		// Calculate delay in minutes
		var delayDifference = Math.abs(departureTime - plannedDepartureTime) / (1000 * 60);

		if ((siteType === 'S' || siteType === 'L') && timediff <= 60) {
			if (entry.when !== null) {
				if (timediff <= 0) {
					countdownCell.innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}">jetzt</a>`;

					setInterval(function() {
						timediff = Math.round((departureTime - new Date()) / (1000 * 60));
						if (timediff <= 60) {
							countdownCell.textContent = timediff + ' min.';
						} else {
							countdownCell.textContent = formatTime(entry.when);
						}
					}, 60000);
				} else if (timediff <= 60) {
					// Show countdown instead of departing times when departing time is <= 60 min away from now
					if (delayDifference > 5) {
						// Delay more than 5 minutes -> time in red
						countdownCell.innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}"><span style="color: #ec0016;">` + timediff + `<span class="additional">&nbsp;min.</span></span></a>`;
					} else {
						countdownCell.innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}">` + timediff + '<span class="additional">&nbsp;min.</span></a>';
					}

					// Reload every 60 secs
					setInterval(function() {
						timediff = Math.round((departureTime - new Date()) / (1000 * 60));
						if (timediff <= 60) {
							countdownCell.innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}">${timediff} min.</a>`;
						} else {
							countdownCell.innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}">${formatTime(entry.when)}</a>`;
						}
					}, 60000);
				}
			}
		} else {
			if (entry.when !== null) {
				if (delayDifference > 0) {
					countdownCell.innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}"><nobr class='mobilebreak'><s class='disabled'>${formatTime(entry.plannedWhen)}</s> ${formatTime(entry.when)}</nobr></a>`;
				} else {
					countdownCell.innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}"><span class="timetable">${formatTime(entry.when)}</span></a>`;
				}
			} else {
				countdownCell.innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}"><span class="timetable">${formatTime(entry.plannedWhen)}</span></a>`;
			}
		}

		var wideCell2 = row.insertCell(2);

		// Anpassung hier: Wenn die geplante Plattform null ist und der Zug storniert ist, wird nur die gestrichene Plattform angezeigt
		if (isCancelled) {
			if (entry.plannedPlatform === null) {
				if (entry.platform === null) {
					row.insertCell(3).innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}"></a>`;
				} else {
					row.insertCell(3).innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}"><s>${entry.platform}</s></a>`;
				}
			} else {
				row.insertCell(3).innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}"><nobr class='mobilebreak'><s class='disabled'>${entry.plannedPlatform}</s></nobr></a>`;
			}
		} else {
			if (entry.platform == null) {
				row.insertCell(3).innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}">-</a>`;
			} else if (entry.platform == entry.plannedPlatform) {
				row.insertCell(3).innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}${encodeURIComponent(entry.tripId)}">${entry.plannedPlatform}</a>`;
			} else if (entry.plannedPlatform === null) {
				row.insertCell(3).innerHTML = `<a class="red" href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}">${entry.platform}</a>`;
			} else {
				row.insertCell(3).innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}"><nobr class='mobilebreak'><s class='disabled'>${entry.plannedPlatform}</s><span class="red"> ${entry.platform}</span></nobr></a>`;
			}
		}

		var cell = row.insertCell(4);

		if (entry.remarks.length > 0) {
			var InfoMessage = '';
			for (var i = 0; i < entry.remarks.length; i++) {
				if (i > 0) { InfoMessage += " +++ "; }
				InfoMessage += entry.remarks[i].text;
			}
		}

		cell.innerHTML = abMessage;
		cell.classList.add("zerotable");

		if (siteType !== 'A') {
			wideCell2.innerHTML = `<a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}"><span class="scrolling-wrapper"><span class="scrolling-text station-name"> ${entry.destination.name} </span></span> </a>`;
		} else {
			wideCell2.innerHTML = `<span class="prefix">Von&nbsp;</span><a href="trip.html?stationID=${encodeURIComponent(stationID)}&departureTime=${encodeURIComponent(entry.plannedWhen)}&tripId=${encodeURIComponent(entry.tripId)}"><span class="station-name">${entry.provenance}</span></a>`;
		}

		if (InfoMessage !== undefined) {
			wideCell2.innerHTML += `<div class="remark bigonly">${InfoMessage}</div>`;
		}

		// Show cancelled icon
		if (isCancelled) {
			cell.innerHTML = `<img src="./assets/cancelled.webp" class="mini">`;
		}
	});

	// Switch to S-Bahn or departure if there are no trains in the list
	if (findtrain == 0) {
		if (hasSuburban == true) { document.location = `${siteType === 'S' ? 'departure' : 'suburban'}.html?station=${stationID}`; }
	}


}


// Format time
function formatTime(dateTimeString) {
	var dateTime = new Date(dateTimeString);
	var hours = dateTime.getHours();
	var minutes = dateTime.getMinutes();

	hours = hours < 10 ? '0' + hours : hours;
	minutes = minutes < 10 ? '0' + minutes : minutes;

	return hours + ':' + minutes;
}

// Create closing doors icon when needed
function getAbMessage(dateTimeString) {
	var dateTime = new Date(dateTimeString);
	var now = new Date();

	var timediff = Math.round((dateTime - now) / (1000 * 60));
	if (siteType !== 'A') {
		return timediff <= 0 ? '<img src="./assets/depart.gif" class="mini">' : '';
	} else {
		return timediff <= 0 ? '' : '';
	}
}