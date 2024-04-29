
// Save Site Type
const siteType = getSiteTypeFromURL();

// Save URL detail
const urlParams = new URLSearchParams(window.location.search);

//EXPERT MODE
//Hide Navbar
var hiddennavbar = urlParams.get('navbar');

if (hiddennavbar === "hide") {
	document.getElementById('navbar').classList.add('hidden');
}

//Hide Clock
var hiddenclock = urlParams.get('clock');

if (hiddenclock === "hide") {
	document.getElementById('clock').classList.add('hidden');
}


//Show Trainnumber
var hiddentrainnumbers = urlParams.get('trainnumbers');
var trainnumberson; 

//Prevent Touch
var notouch = urlParams.get('touch');

if (notouch === "no") {
	document.getElementById('notouch').classList.remove('hidden');
}

//END EXPERTMODE


const stationID = urlParams.get('station');
let hasSuburban;
// Load station Data
fetchStationData(stationID);

//Start Clock
setInterval(updateClock, 1000);
updateClock();

//Start loading data
//reload the function every 5 secs, so displayed data will always been up to date
setInterval(loadData, 5000);
loadData();

//---- Functions ----

// Check site type
function getSiteTypeFromURL() {
    const url = document.location.href;
    if (url.includes("departure.html")) {
        return "D";
    } else if (url.includes("arrival.html")) {
        return "A";
    } else if (url.includes("suburban.html")) {
        return "S";
    }
    // Default site type
    return "D";
}

// Fetch API Source to get station details
// (maybe AJAX or Fetch, "async await" is sometimes slow.)
async function fetchStationData(stationID) {
    try {
        const response = await fetch(`https://v6.db.transport.rest/stops/${stationID}?linesOfStops=false&language=de`);
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

	// Normal station 
    if ((data.products.nationalExpress || data.products.national || data.products.regionalExpress || data.products.regional) && data.products.suburban === true) {
        navbarContent += `
            <div class="tabs">
                <a href="departure.html?station=${station}"class="${siteType === 'D' ? 'active' : ''}">&nbsp;Abfahrt&nbsp;</a>
                <a href="arrival.html?station=${station}"class="${siteType === 'A' ? 'active' : ''}">&nbsp;Ankunft&nbsp;</a>
                <a href="suburban.html?station=${station}"class="${siteType === 'S' ? 'active' : ''}">&nbsp;S-Bahn&nbsp;</a>
            </div>`;
			hasSuburban = true;
	}
	
	// S-Bahn only station
	if (data.products.suburban === true && data.products.regional === false) {
		if (siteType !== 'S') {document.location = `suburban.html?station=${station}`;}
		navbarDiv.innerHTML +='<a href="#" class="disabled">&nbsp;Abfahrt&nbsp;</a>' +
		'<a href="#" class="disabled">&nbsp;Ankunft&nbsp;</a>' + 
		'<a href="suburban.html?station=' + station + '" class="active">&nbsp;S-Bahn&nbsp;</a>';
	}

	// Station without S-Bahn
    if ((data.products.nationalExpress || data.products.national || data.products.regionalExpress || data.products.regional) && data.products.suburban === false) {
        if (siteType === 'S') {document.location = `departure.html?station=${station}`;}
		navbarContent += `
            <a href="departure.html?station=${station}"class="${siteType === 'D' ? 'active' : ''}">&nbsp;Abfahrt&nbsp;</a>
            <a href="arrival.html?station=${station}"class="${siteType === 'A' ? 'active' : ''}">&nbsp;Ankunft&nbsp;</a>
            <a href="#" class="disabled">&nbsp;S-Bahn&nbsp;</a>`;
	}
		
    navbarContent += `
        <div class="iconbar bigonly"><a href="index.html">Stationssuche</a></div>
        <div class="iconbar"><a href="index.html"><img src="./assets/icons/search.svg" class="mediumicon"></a></div>`;
                                   
    navbarDiv.innerHTML = navbarContent;


	// Add station name to div
	document.getElementById('stationname').textContent = data.name;
}

// Clock
function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('clock').innerHTML = `${hours}<span class="blink">:</span>${minutes}`;
}

//Fetch departures or arrivals
async function loadData() {
	var apiUrl = `https://v6.db.transport.rest/stops/${stationID}/${siteType === 'A' ? 'arrivals' : 'departures'}?duration=20000&results=500&linesOfStops=false&remarks=true&language=de`;
    try {
        const response = await fetch(apiUrl);
        var jsonData = await response.json();
		if (siteType === 'A') {
			updateTable(jsonData.arrivals)
		} else {
			updateTable(jsonData.departures)
		}
    } catch (error) {
        console.error('Fehler beim Abrufen der Daten:', error);
    }
}
/* // maybe AJAX, "async await" fails sometimes.
// Fetch departures or arrivals
function loadData() {
	var apiUrl = `https://v6.db.transport.rest/stops/${stationID}/${siteType === 'A' ? 'arrivals' : 'departures'}?duration=20000&results=500&linesOfStops=false&remarks=true&language=de`;
	// AJAX-Request
	var xhr = new XMLHttpRequest();
	xhr.open('GET', apiUrl, true);

	// Callback to end request
	xhr.onload = function() {
		if (xhr.status === 200) {
			// JSON Data to table
			var jsonData = JSON.parse(xhr.responseText);
			if (siteType === 'A') {
				updateTable(jsonData.arrivals)
			} else {
				updateTable(jsonData.departures)
			}
		}
	};

	// Send request
	xhr.send();
}
*/


// Rendering departures or arrivals
function updateTable(data) {
	// Handle null response 
	if (data == null) {
		console.log(formatTime(new Date()), 'Data Error:', data);
		return;
	}

	/*
	// Looking for departing products "suburban"
	var hasSuburbanDeparture = data.some(function(entry) {
		return entry.line.product === "suburban";
	});*/

	// sorts the entries by when or plannedwhen
	data.sort(function(a, b) {
        var timeA = a.when !== null ? a.when : a.plannedWhen;
        var timeB = b.when !== null ? b.when : b.plannedWhen;
        return new Date(timeA) - new Date(timeB);
    });

	var tableBody = document.getElementById('tableBody');
	tableBody.innerHTML = ''; // delete everything before  rewrite table content

	let findtrain = 0;
	data.forEach(function(entry) {
		// If product is bus, ferry, subway, tram or taxi
		if (
			entry.line.product === "bus" ||
			entry.line.product === "ferry" ||
			entry.line.product === "subway" ||
			entry.line.product === "tram" ||
			entry.line.product === "taxi"
		) {
			// skip this entry (not needed for a TRAIN ONLY board)
			return;
		}

		// Check is S-Bahn view
		if ((siteType === 'S' && entry.line.product !== "suburban") ||
        (siteType !== 'S' && entry.line.product === "suburban")) {
        	return; // skip everything except S-Bahn OR skip S-Bahn
    	}

		// if trip is cancelled
		var isCancelled = entry.remarks.some(function(remark) {
			return remark.type === "status" && remark.code === "cancelled";
		});

		// Is trip more than 10 mins ago?
		var plannedDepartureTime = new Date(entry.plannedWhen);
		var now = new Date();
		var diffPlannedMinutes = Math.round((now - plannedDepartureTime) / (1000 * 60));

		// If entry is cancelled and more than 10 mins ago skip (not neccesary to skip cancelled trips which should have been departed already. may increase or decrease the time 
		if (isCancelled && diffPlannedMinutes > 0) {
			return;
		}

		findtrain++;
		var row = tableBody.insertRow();
		row.classList.add('boardcell');
		
		// set style to line-trough if cancelled
		if (isCancelled) {
			row.style.textDecoration = "line-through";
		}
		
		// Format time stemps to actual readable format
		//var formattedWhen = formatTime(entry.when);
		//var formattedPlannedWhen = formatTime(entry.plannedWhen);
		
		// add clossing door gif (only when not cancelled)
		var abMessage = (isCancelled) ? "" : getAbMessage(entry.when);
		
		if (hiddentrainnumbers === "show") {
			var trainnnnumber = `<br>(${entry.line.fahrtNr})`;
		} else {
			var trainnnnumber = ``;
		}

		let linebadge = `<div class="linebadge ${entry.line.product} ${entry.line.name.replace(/\s/g, '')}${entry.line.operator.id} ${entry.line.operator.id} ${entry.line.productName}">`;
		if (entry.line.operator.id === 'freiberger-eisenbahngesellschaft') {
			linebadge += "FEG</div>"; //RB 83
		} else if (entry.line.productName === "FEX") {
			linebadge += "FEX</div>"; //Flughafen-Express Berlin
		} else{
			linebadge += `${entry.line.name} ${trainnnnumber}</div>`;
		}
		
		row.insertCell(0).innerHTML = linebadge;
		
		// Calculate minutes from time now - departing time (needed for the countdown in sbahn tab)
		var now = new Date();
		var departureTime = new Date(entry.when);
		var timediff = Math.round((departureTime - now) / (1000 * 60));
			
		var countdownCell = row.insertCell(1);

		// Calculate delay in minutes
		var delayDifference = Math.abs(departureTime - plannedDepartureTime) / (1000 * 60);
		
		if (siteType === 'S' && timediff <= 60) {
			if (entry.when !== null) {
				if (timediff <= 0) {
					countdownCell.textContent = 'jetzt';
			
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
					if (delayDifference > 5) { //delay more then 5 minutes -> time in red
						countdownCell.innerHTML = "<span style='color: #ec0016;'>" + timediff + '<span class="additional">&nbsp;min.</span></span>'; 
					} else {
						countdownCell.innerHTML = timediff + '<span class="additional">&nbsp;min.</span>';
					}
					
					// Reload every 60 secs
					setInterval(function() {
						timediff = Math.round((departureTime - new Date()) / (1000 * 60));
						if (timediff <= 60) {
							countdownCell.textContent = timediff + ' min.';
						} else {
							countdownCell.textContent = formatTime(entry.when);
						}
					}, 60000);
			}	}
		} else {
			if (entry.when !== null) {
				/*if (delayDifference > 5) { //delay more then 5 minutes -> time in red & delay in minutes (planned time in Hovertext)		
					countdownCell.innerHTML = `<nobr class='mobilebreak'><s class='disabled'>${formatTime(entry.plannedWhen)}</s> <span style='color: #ec0016;'>${formatTime(entry.when)} <i class="additional" style='color: #ec0016;'>(+${delayDifference})</i></span></nobr>`;
				} else*/ 		
				if (delayDifference > 0) { //short delay -> time in orange (planned time and delay in minutes in Hovertext)	
					//countdownCell.innerHTML = `<nobr class='mobilebreak'><s class='disabled'>${formatTime(entry.plannedWhen)}</s> <span style='color: #ff6600;'>${formatTime(entry.when)}</span></nobr>`;
					countdownCell.innerHTML = `<nobr class='mobilebreak'><s class='disabled'>${formatTime(entry.plannedWhen)}</s> ${formatTime(entry.when)}</nobr>`;
				} else {
					countdownCell.textContent = formatTime(entry.when);
				}
			} else {
				countdownCell.textContent = formatTime(entry.plannedWhen);
			}
		}

		// Template for tooltip (Hovertext) (maybe showing timediff in Hovertext)
		/*
		countdownCell.innerHTML = "<span class=tooltip style='color: #ec0016;'>" + formatTime(entry.when) + " <i>(+" + timeDifference + ")</i><span class=tooltiptext>" + formatTime(entry.plannedWhen) + "</span></span>";
		*/ 
		
		var wideCell2 = row.insertCell(2);
		
		// Check for Platform changes
		if (entry.platform == entry.plannedPlatform){
			row.insertCell(3).textContent = entry.plannedPlatform;
		} else { 
			if (entry.plannedPlatform === null) { //some Trains have no planned platform
				row.insertCell(3).innerHTML = `<span style='color: #ec0016;'> ${entry.platform}</span>`;
			} else {
				row.insertCell(3).innerHTML = `<nobr class='mobilebreak'><s class='disabled'>${entry.plannedPlatform}</s><span style='color: #ec0016;'> ${entry.platform}</span></nobr>`;
			}
		}

		var cell = row.insertCell(4);

		// Show info-messages (the look on mobile needs to be improved)
		if (entry.remarks.length > 0) {
			var InfoMessage = '';
			for (var i = 0; i < entry.remarks.length; i++) {
				if (i > 0) { InfoMessage += " +++ ";}
				InfoMessage += entry.remarks[i].text;
			}
		}
		
		cell.innerHTML = abMessage;
		cell.classList.add("zerotable");
		
		if (siteType !== 'A') {
			wideCell2.innerHTML = `<a href="trip.html?id=${entry.tripId}&station=${entry.stop.id}" class="black">${entry.direction}</a>`;
		} else {
			wideCell2.innerHTML = `<span class="additional">Von&nbsp;</span><a href="trip.html?id=${entry.tripId}&station=${entry.stop.id}" class="black">${entry.provenance}</a>`;
		}

		if (InfoMessage !== undefined) {
			wideCell2.innerHTML += `<br><span class="remark bigonly">${InfoMessage}</span>`;
		}
		
		// Create link to the trip information tab
		wideCell2.className = 'wide';
		wideCell2.classList.add('boardcell');
	});
	//Switch to S-Bahn or departure if there are no trains in the list 
	if (findtrain == 0) {
		console.log(findtrain);
		if (hasSuburban == true) {document.location = `${siteType === 'S' ? 'departure' : 'suburban'}.html?station=${stationID}`;}
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

// Create cloosing doors icon when needed
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
