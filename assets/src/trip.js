// Profilzustände über Seitenaktualisierungen hinweg speichern
let profileFailureCache = JSON.parse(localStorage.getItem('profileFailureCache')) || {};

// Funktion zur Bestimmung der Profile basierend auf Zugtyp und Betreiber
function determineProfiles(train) {
    const operatorId = train.line.operator && train.line.operator.id ? train.line.operator.id.toLowerCase() : '';
    const productName = train.line.productName ? train.line.productName.toLowerCase() : '';

    let mainProfile = 'oebb';
    let fallbackProfile = 'db';

    // Prüfen, ob der Zug eine S-Bahn oder ein Regionalzug der DB ist
    const isRegionalDBTrain = (
        (productName.includes('s') || productName.includes('re') || productName.includes('fex') || productName.includes('rb') || productName.includes('bus')) &&
        operatorId.includes('db')
    );

    if (isRegionalDBTrain) {
        mainProfile = 'db';
        fallbackProfile = 'oebb';
    }

    return { mainProfile, fallbackProfile };
}

document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById("mapModal");
    const btn = document.getElementById("openMapBtn");
    const closeBtn = document.getElementsByClassName("close")[0];
    let map;
    let marker;
    let intervalId;

    // Funktion, um Parameter aus der URL zu extrahieren
    function getParameterByName(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
        const results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    // Event-Handler für das Öffnen und Schließen des Modals
    btn.onclick = function() {
        modal.style.display = "block";
        setTimeout(() => {
            if (!map) {
                initMap();
            } else {
                map.resize(); // Wichtig, damit die Karte die richtige Größe annimmt
            }
        }, 300);
    }

    closeBtn.onclick = function() {
        modal.style.display = "none";
        clearInterval(intervalId); // Stoppe die regelmäßige Positionsabfrage, wenn das Modal geschlossen wird
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            clearInterval(intervalId); // Stoppe die regelmäßige Positionsabfrage, wenn das Modal geschlossen wird
        }
    }

    // Funktion zur Aktualisierung der aktuellen Position auf der Karte
    async function updateCurrentPosition(tripId, profile) {
        let tripApiUrl = `https://data.cuzimmartin.dev/${profile === 'oebb' ? 'oebb-trip' : 'trip'}?tripId=${encodeURIComponent(tripId)}`;
        let tripResponse;

        try {
            tripResponse = await fetch(tripApiUrl);
            if (!tripResponse.ok) {
                throw new Error('Request failed');
            }
        } catch (error) {
            // Falls die Anfrage fehlschlägt, auf die alternative API umstellen
            const fallbackProfile = profile === 'oebb' ? 'db' : 'oebb';
            tripApiUrl = `https://data.cuzimmartin.dev/${fallbackProfile === 'oebb' ? 'oebb-trip' : 'trip'}?tripId=${encodeURIComponent(tripId)}`;
            tripResponse = await fetch(tripApiUrl);
            profile = fallbackProfile; // Aktualisiere das Profil
        }

        const tripData = await tripResponse.json();

        if (tripData.trip.currentLocation && marker) {
            const newPosition = [tripData.trip.currentLocation.longitude, tripData.trip.currentLocation.latitude];
            marker.setLngLat(newPosition);
        }
    }

    async function initMap() {
        const tripId = getParameterByName('tripId');
        const stationId = getParameterByName('stationID');

        const tripIdKey = tripId;

        let profileUsed = 'oebb'; // Standardprofil

        if (profileFailureCache[tripIdKey]) {
            if (profileFailureCache[tripIdKey]['db'] === false) {
                profileUsed = 'db';
            } else if (profileFailureCache[tripIdKey]['oebb'] === false) {
                profileUsed = 'oebb';
            }
        }

        let profile = profileUsed;

        if (!tripId) {
            alert("Keine tripId in der URL gefunden.");
            return;
        }

        let polylineApiUrl = `https://data.cuzimmartin.dev/trip/${encodeURIComponent(tripId)}/polyline?profile=${profile}`;
        let polylineResponse;

        try {
            polylineResponse = await fetch(polylineApiUrl);
            if (!polylineResponse.ok) {
                throw new Error('Polyline request failed');
            }
        } catch (error) {
            // Falls die Anfrage fehlschlägt, auf das alternative Profil umstellen
            const fallbackProfile = profile === 'oebb' ? 'db' : 'oebb';
            profile = fallbackProfile;
            polylineApiUrl = `https://data.cuzimmartin.dev/trip/${encodeURIComponent(tripId)}/polyline?profile=${profile}`;
            polylineResponse = await fetch(polylineApiUrl);
        }

        const polylineData = await polylineResponse.json();

        let tripApiUrl = `https://data.cuzimmartin.dev/${profile === 'oebb' ? 'oebb-trip' : 'trip'}?tripId=${encodeURIComponent(tripId)}`;
        let tripResponse;

        try {
            tripResponse = await fetch(tripApiUrl);
            if (!tripResponse.ok) {
                throw new Error('Trip request failed');
            }
        } catch (error) {
            // Falls die Anfrage fehlschlägt, auf das alternative Profil umstellen
            const fallbackProfile = profile === 'oebb' ? 'db' : 'oebb';
            profile = fallbackProfile;
            tripApiUrl = `https://data.cuzimmartin.dev/${profile === 'oebb' ? 'oebb-trip' : 'trip'}?tripId=${encodeURIComponent(tripId)}`;
            tripResponse = await fetch(tripApiUrl);
        }

        const tripData = await tripResponse.json();

        // Bestimmen der Startposition aus den Polyline-Daten
        let startPosition = [16.3738, 48.2082]; // Standardposition
        if (polylineData.polyline && polylineData.polyline.features && polylineData.polyline.features.length > 0) {
            const firstFeature = polylineData.polyline.features[0];
            if (firstFeature.geometry.type === "Point") {
                startPosition = [firstFeature.geometry.coordinates[0], firstFeature.geometry.coordinates[1]];
            }
        }

        mapboxgl.accessToken = 'pk.eyJ1IjoibWFydGlpbmhpZXIiLCJhIjoiY2x6b284ZGxtMHRlbzJpcjd5em80MDIxcSJ9.BMb9-B_QvsdFy6arQxennw';
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/dark-v10',
            center: startPosition,
            zoom: 10
        });

        if (polylineData.polyline && polylineData.polyline.features) {
            const coordinates = polylineData.polyline.features.map(feature => {
                if (feature.geometry.type === "Point") {
                    return [feature.geometry.coordinates[0], feature.geometry.coordinates[1]];
                }
            }).filter(coord => coord);

            const fullRoute = {
                'type': 'Feature',
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                }
            };

            map.on('load', () => {
                map.addSource('fullRoute', {
                    'type': 'geojson',
                    'data': fullRoute
                });

                map.addLayer({
                    'id': 'fullRoute',
                    'type': 'line',
                    'source': 'fullRoute',
                    'layout': {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    'paint': {
                        'line-color': '#1db7dd',
                        'line-width': 4
                    }
                });

                if (tripData.trip.currentLocation) {
                    const currentLocation = [tripData.trip.currentLocation.longitude, tripData.trip.currentLocation.latitude];
                    marker = new mapboxgl.Marker({ color: "red" })
                        .setLngLat(currentLocation)
                        .addTo(map);
                } else {
                    console.warn("Aktuelle Position nicht verfügbar, Marker wird nicht gesetzt.");
                }

                const bounds = coordinates.reduce(function(bounds, coord) {
                    return bounds.extend(coord);
                }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

                map.fitBounds(bounds, {
                    padding: { top: 50, bottom: 50, left: 50, right: 50 }
                });

                if (tripData.trip.currentLocation) {
                    intervalId = setInterval(() => updateCurrentPosition(tripId, profile), 10000);
                }
            });
        } else {
            console.error("Keine gültigen Polyline-Daten gefunden");
        }
    }
});

async function fetchAndDisplayData() {
    const currentUrl = window.location.href;

    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
        const results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    const tripId = getParameterByName('tripId', currentUrl);
    const stationId = getParameterByName('stationID', currentUrl);

    const tripIdKey = tripId; // Verwende tripId als Schlüssel im profileFailureCache

    if (!profileFailureCache[tripIdKey]) {
        profileFailureCache[tripIdKey] = {
            'db': false,
            'oebb': false
        };
    }

    // Abrufen der Abfahrtsdaten, um die Operator-Informationen zu erhalten
    let departuresData;
    let trainData;
    try {
        const departuresApiUrl = `https://data.cuzimmartin.dev/departures?stationID=${encodeURIComponent(stationId)}`;
        const departuresResponse = await fetch(departuresApiUrl);
        departuresData = await departuresResponse.json();

        console.log('Departures Data:', departuresData); // Ausgabe zur Überprüfung

        // Überprüfe, ob departuresData ein Array ist oder ein Objekt mit einem departures-Array
        let departuresArray;
        if (Array.isArray(departuresData)) {
            departuresArray = departuresData;
        } else if (departuresData && Array.isArray(departuresData.departures)) {
            departuresArray = departuresData.departures;
        } else {
            throw new Error('Ungültige Struktur der Abfahrtsdaten');
        }

        // Suche nach dem Zug mit der entsprechenden tripId
        trainData = departuresArray.find(departure => departure.tripId === tripId);

        if (!trainData) {
            console.error('Zug mit der gegebenen tripId nicht gefunden.');
            const statusElement = document.getElementById('tripStatus');
            statusElement.textContent = `Zug mit der gegebenen tripId nicht gefunden.`;
            return;
        }

    } catch (error) {
        console.error('Fehler beim Abrufen der Abfahrtsdaten:', error);
        const statusElement = document.getElementById('tripStatus');
        statusElement.textContent = `Fehler beim Abrufen der Abfahrtsdaten.`;
        return;
    }

    // Profile bestimmen
    const { mainProfile, fallbackProfile } = determineProfiles(trainData);

    // Prüfen, ob Profile zuvor fehlgeschlagen sind
    const mainProfileFailedPreviously = profileFailureCache[tripIdKey][mainProfile] === true;
    const fallbackProfileFailedPreviously = profileFailureCache[tripIdKey][fallbackProfile] === true;

    let data;
    let profileUsed;

    // Hauptprofil abfragen, wenn es nicht zuvor fehlgeschlagen ist
    if (!mainProfileFailedPreviously) {
        try {
            const primaryEndpoint = mainProfile === 'oebb' ? 'oebb-trip' : 'trip';
            const apiUrl = `https://data.cuzimmartin.dev/${primaryEndpoint}?tripId=${encodeURIComponent(tripId)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Fehler beim Abrufen der Daten von ${primaryEndpoint}: ${response.statusText}`);
            }
            data = await response.json();

            if (!data.trip) {
                throw new Error('Keine Daten für diese Reise gefunden.');
            }

            profileUsed = mainProfile;
        } catch (error) {
            console.warn(`Problem mit der ${mainProfile} API:`, error);
            // Hauptprofil als fehlgeschlagen markieren
            profileFailureCache[tripIdKey][mainProfile] = true;
            localStorage.setItem('profileFailureCache', JSON.stringify(profileFailureCache));
        }
    }

    // Fallback-Profil abfragen, wenn keine Daten vorliegen und es nicht zuvor fehlgeschlagen ist
    if (!data && !fallbackProfileFailedPreviously) {
        try {
            const fallbackEndpoint = fallbackProfile === 'oebb' ? 'oebb-trip' : 'trip';
            const apiUrl = `https://data.cuzimmartin.dev/${fallbackEndpoint}?tripId=${encodeURIComponent(tripId)}`;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`Fehler beim Abrufen der Daten von ${fallbackEndpoint}: ${response.statusText}`);
            }
            data = await response.json();

            if (!data.trip) {
                throw new Error('Keine Daten für diese Reise gefunden.');
            }

            profileUsed = fallbackProfile;
        } catch (error) {
            console.warn(`Problem mit der ${fallbackProfile} API:`, error);
            // Fallback-Profil als fehlgeschlagen markieren
            profileFailureCache[tripIdKey][fallbackProfile] = true;
            localStorage.setItem('profileFailureCache', JSON.stringify(profileFailureCache));
        }
    }

    if (!data) {
        // Beide Profile haben keine Daten geliefert
        const statusElement = document.getElementById('tripStatus');
        statusElement.textContent = `Keine Daten für diese Reise verfügbar.`;
        return;
    }

    // Erfolgreiches Profil zurücksetzen
    profileFailureCache[tripIdKey][profileUsed] = false;
    localStorage.setItem('profileFailureCache', JSON.stringify(profileFailureCache));

    // Funktion zur Aktualisierung des Zugstatus
    function updateTrainStatus(trip) {
        let currentTime = new Date();
        let departureTime = new Date(trip.departure);
        let arrivalTime = new Date(trip.arrival);

        const statusElement = document.getElementById('tripStatus');

        // Wenn der Zug noch nicht abgefahren ist
        if (currentTime < departureTime) {
            const timeUntilDeparture = departureTime - currentTime;
            const minutesUntilDeparture = Math.round(timeUntilDeparture / 60000);
            const hours = Math.floor(minutesUntilDeparture / 60);
            const minutes = minutesUntilDeparture % 60;

            let timeString;
            if (hours > 0) {
                timeString = `${hours} Stunde${hours > 1 ? 'n' : ''} und ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
            } else {
                timeString = `${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
            }

            const platformInfo = trip.origin.departurePlatform ? `auf Gleis ${trip.origin.departurePlatform}` : '';
            statusElement.textContent = `Fährt in ${timeString} von 🔻 ${trip.origin.name} ${platformInfo} ab.`;

            return;
        }

        // Wenn der Zug bereits abgefahren ist, finde den nächsten Halt
        let nextStop = null;
        for (let i = 0; i < trip.stopovers.length; i++) {
            const stop = trip.stopovers[i];
            if (new Date(stop.plannedDeparture) > currentTime) {
                nextStop = stop;
                break;
            }
        }

        if (nextStop) {
            const timeUntilNextStop = new Date(nextStop.plannedArrival) - currentTime;
            const minutesUntilNextStop = Math.round(timeUntilNextStop / 60000);

            if (minutesUntilNextStop >= 0) {
                const hours = Math.floor(minutesUntilNextStop / 60);
                const minutes = minutesUntilNextStop % 60;

                let timeString;
                if (hours > 0) {
                    timeString = `${hours} Stunde${hours > 1 ? 'n' : ''} und ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
                } else {
                    timeString = `${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
                }

                const platformInfo = nextStop.arrivalPlatform || nextStop.departurePlatform ?
                    `auf Gleis ${nextStop.arrivalPlatform || nextStop.departurePlatform}` : '';

                statusElement.textContent = `Erreicht in ${timeString} die Station 🔻 ${nextStop.stop.name} ${platformInfo}.`;
            } else {
                statusElement.textContent = `Zug hat die Station 🔻 ${nextStop.stop.name} erreicht.`;
            }
        } else {
            // Wenn kein nächster Halt mehr bevorsteht oder kein Remark vorhanden ist
            if (currentTime > arrivalTime) {
                statusElement.textContent = `Zug hat sein Ziel 🔻 ${trip.destination.name} erreicht.`;
            } else {
                statusElement.textContent = `Zug ist auf dem Weg zu 🔻 ${trip.destination.name}.`;
            }
        }
    }


    if ((data.trip.line.productName === 'ICE') || (data.trip.line.productName === 'IC')) {
        console.log('Its Fernzug!')
        document.getElementById('comfortbutton').classList.remove('hidden');
    }

    // Titel und Details setzen
    document.getElementById('trainTitle').innerHTML = `${data.trip.line.fahrtNr}`;

    var lineName = data.trip.line.name.split('(')[0];
    document.getElementById('linebadge').textContent = `${lineName}`;
    document.getElementById('title').textContent = `${data.trip.line.productName} ${data.trip.line.fahrtNr} 🡺 ${data.trip.direction}`;

    // Dauer berechnen
    const departureTime = new Date(data.trip.plannedDeparture);
    const arrivalTime = new Date(data.trip.plannedArrival);
    const duration = (arrivalTime - departureTime) / (1000 * 60 * 60); // Stunden
    const minutes = Math.floor((duration % 1) * 60);
    document.getElementById('tripDurationTime').textContent = `${Math.floor(duration)}:${minutes.toString().padStart(2, '0')} Std`;

    // Datum setzen
    const tripDate = departureTime.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('trip-date').innerHTML = tripDate;

    // Ursprungsstation und Zielstation setzen
    document.getElementById('originStation').textContent = data.trip.origin.name;
    document.getElementById('originTime').textContent = departureTime.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });
    document.getElementById('destinationStation').textContent = data.trip.destination.name;
    document.getElementById('destinationTime').textContent = arrivalTime.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });

    // Haltestellen dynamisch hinzufügen
    console.log(stationId)
    const stopoversContainer = document.querySelector('.trip-stopovers');
    stopoversContainer.innerHTML = '';
    data.trip.stopovers.forEach(stop => {
        const stopElement = document.createElement('div');
        if (stop.cancelled) {
            stopElement.classList.add('trip-stopover');
            stopElement.innerHTML = `
            <div class="trip-stop-time">
                <div class="trip-delay" style="font-size: 16px">Entfällt</div>
            </div>
            <div class="trip-stop-info">
                <span class="trip-stop-name">${stop.stop.name}</span>
            </div>
        `;
        } else {

            const plannedArrivalTime = stop.plannedArrival ? new Date(stop.plannedArrival).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
            const actualArrivalTime = stop.arrival ? new Date(stop.arrival).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
            const plannedDepartureTime = stop.plannedDeparture ? new Date(stop.plannedDeparture).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';
            const actualDepartureTime = stop.departure ? new Date(stop.departure).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '';

            const arrivalTimeDisplay = plannedArrivalTime === actualArrivalTime ? plannedArrivalTime : `<s class=\"disabled\">${plannedArrivalTime}</s> <span>${actualArrivalTime}</span>`;
            const departureTimeDisplay = plannedDepartureTime === actualDepartureTime ? plannedDepartureTime : `<s class=\"disabled\">${plannedDepartureTime}</s> <span>${actualDepartureTime}</span>`;

            let stopname;
            if (stationId === stop.stop.id) {
                stopname = stop.stop.name + ` huhu`;
                stopElement.classList.add('marked-stopover');
            } else {
                stopname = stop.stop.name;
            }

            console.log(stopname);
            stopElement.classList.add('trip-stopover');
            stopElement.innerHTML = `
            <div class="trip-stop-time">
                <div>${arrivalTimeDisplay}</div>
                <div>${departureTimeDisplay}</div>
            </div>
            <div class="trip-stop-info">
                <span class="trip-stop-name">${stop.stop.name}</span>
                <span class="trip-platform">${(stop.arrivalPlatform || stop.departurePlatform) ? `Gl<span class=\"bigonly\">eis</span> ${stop.arrivalPlatform || stop.departurePlatform}` : '-'}</span>
            </div>
        `;
        }
        stopoversContainer.appendChild(stopElement);
    });


    // Warnungen dynamisch hinzufügen
    const warningsList = document.getElementById('warningsList');
    warningsList.innerHTML = '';
    if (data.trip.remarks && data.trip.remarks.length > 0) {
        const WarningHeaderItem = document.createElement('div');
        WarningHeaderItem.classList.add('trip-warning-header');
        WarningHeaderItem.innerHTML = `<span class=\"pill\">&nbsp;&nbsp;${data.trip.remarks.length}&nbsp;&nbsp;</span> aktuelle Informationen:`;
        warningsList.appendChild(WarningHeaderItem);
        const warnings = data.trip.remarks.map(remark => remark.text);
        warnings.forEach(warning => {
            const warningItem = document.createElement('div');
            warningItem.classList.add('trip-warning-item');
            warningItem.textContent = warning;
            warningsList.appendChild(warningItem);
        });
    } else {
        const WarningHeaderItem = document.createElement('div');
        WarningHeaderItem.classList.add('trip-warning-item');
        WarningHeaderItem.textContent = 'Keine Warnungen vorhanden.';
        warningsList.appendChild(WarningHeaderItem);
    }

    // Dynamischen Status des Zuges setzen
    updateTrainStatus(data.trip);

    // Header Farbe
    const badgeClassProductName = encodeURIComponent(data.trip.line.productName);
    const badgeClassProduct = encodeURIComponent(data.trip.line.product);
    const badgeClassLineOperator = encodeURIComponent(lineName.replace(/\s+/g, '')) + encodeURIComponent(data.trip.line.operator.id);
    const badgeClassOperator = encodeURIComponent(data.trip.line.operator.id);
    const tripID = encodeURIComponent(data.trip.id);

    document.getElementById('bigheaderbox').classList.add(badgeClassProductName);
    document.getElementById('bigheaderbox').classList.add(badgeClassProduct);
    document.getElementById('bigheaderbox').classList.add(badgeClassLineOperator);
    document.getElementById('bigheaderbox').classList.add(badgeClassOperator);

    document.getElementById('linebadge').classList.add(badgeClassProductName);
    document.getElementById('linebadge').classList.add(badgeClassProduct);
    document.getElementById('linebadge').classList.add(badgeClassLineOperator);
    document.getElementById('linebadge').classList.add(badgeClassOperator);

    let $number = encodeURIComponent(data.trip.id);

    // Funktion, um ein Cookie zu setzen
    function setCookie(name, value, days) {
        let expires = "";
        if (days) {
            const date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    }

    // Funktion, um ein Cookie abzurufen
    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Funktion beim Klick auf das Div
    document.getElementById('myDiv').addEventListener('click', function() {
        // Setze das Cookie
        setCookie('pinnedjourney', $number, 7); // Cookie für 7 Tage speichern
        document.getElementById("pinIt").textContent = "Angeheftet";
        document.getElementById("addtrainIcon").src = "./assets/icons/addedtrain.svg";

        // Logge den Cookie-Wert zur Konsole
        console.log('Cookie-Wert:', cookieValue);
    });

    // Rufe das Cookie ab
    const cookieValue = getCookie('pinnedjourney');
    console.log('Cooooookie Value:', cookieValue);

    const activeValue = `${encodeURIComponent(tripId)}`;

    console.log('Active Value', activeValue);

    if (cookieValue === activeValue) {
        console.log('It is pinned Journey');
        document.getElementById("pinIt").textContent = "Angeheftet";
        document.getElementById("addtrainIcon").src = "./assets/icons/addedtrain.svg";

    } else {
        console.log('It is not pinned Journey');
    }

    // Datenanbieter-Logo aktualisieren
    const dataProviderLogo = document.querySelector('.trip-logo');
    if (profileUsed === 'oebb') {
        dataProviderLogo.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Logo_%C3%96BB.svg/2560px-Logo_%C3%96BB.svg.png";
        dataProviderLogo.alt = "ÖBB Logo";
    } else if (profileUsed === 'db') {
        dataProviderLogo.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Deutsche_Bahn_AG-Logo.svg/512px-Deutsche_Bahn_AG-Logo.svg.png";
        dataProviderLogo.alt = "DB Logo";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayData();

    // Alle 30 Sekunden die Daten aktualisieren
    setInterval(fetchAndDisplayData, 30000); // 30 Sekunden in Millisekunden
});





function fetchtraincomposition(zugnummer, datetime, stationId) {


    fetch(`https://ist-wr.noncd.db.de/wagenreihung/1.0/${zugnummer}/${datetime}`)
        .then(response => response.json())
        .then(data => {


            // Check for valid JSON
            if (data.error) {
                document.getElementById('notice').innerHTML = '<br><br>Wagenreihung für diesen Zug nicht verfügbar.<br><br>';
                document.getElementById('coacheswrapper').classList.add('hidden');
                return;
            }
            if (data.data.istformation.halt.evanummer !== stationId) { //Check if Wagenreihung is for the right station
                console.log("StationID does not match:", stationId, data.data.istformation);
                document.getElementById('notice').innerHTML = '<br><br>Wagenreihung für diesen Zug nicht verfügbar.<br><br>';
                document.getElementById('coacheswrapper').classList.add('hidden');
                document.getElementById('git-info').className = '';
                //Create direct link for Issue report on GitHub
                document.getElementById('git-error').innerHTML = `<a href="https://github.com/hoolycrash/trainboard/issues/new?title=Bug%20Wagenreihung:&body=Train:${zugnummer}%20Datetime:${datetime}%20Station:${stationId}" target="_blank" class="black">Open new Issue with Train data on Github</a>`;
                return;
            }
            document.getElementById('git-info').className = '';
            document.getElementById('git-error').innerHTML = `<a href="https://github.com/hoolycrash/trainboard/issues/new?title=Bug%20Wagenreihung:&body=Train:${zugnummer}%20Datetime:${datetime}%20Station:${stationId}" target="_blank" class="black">Open new Issue with Train data on Github</a>`;
            rendertraincomposition(data.data.istformation);
        });
}

function rendertraincomposition(data) {

    /* //Did not work with more then one train set
    const allFahrzeuggruppe = data.allFahrzeuggruppe;
    const firstElementsMap = new Map();
    for (let i = 0; i < allFahrzeuggruppe.length; i++) {
        let fahrzeuggruppe = allFahrzeuggruppe[i];
        for ( let j = 0; j < fahrzeuggruppe.allFahrzeug.length; j++) {
            const fahrzeug = fahrzeuggruppe.allFahrzeug[j];
            const positioningruppe = fahrzeug.positioningruppe;
            if (!firstElementsMap.has(positioningruppe)) {
                firstElementsMap.set(positioningruppe, fahrzeug);
            } else {
                console.log("Already set", positioningruppe, fahrzeug);
                //const existingFahrzeuge = firstElementsMap.get(positioningruppe);
                //existingFahrzeuge.push(fahrzeug);
                //firstElementsMap.set(positioningruppe, existingFahrzeuge);
    }	}	}

    // Sort elements
    const sortedFahrzeuge = Array.from(firstElementsMap.values()).sort((a, b) => {
        return parseInt(a.positioningruppe) - parseInt(b.positioningruppe);
    });
    console.log(firstElementsMap);
    */

    const blocksContainer = document.getElementById('blocksContainer');
    let vehiclename = "";
    const imgpath = 'assets/icons/carriage';
    const allFahrzeuggruppe = data.allFahrzeuggruppe;
    console.log("Wagenreihung:", data);

    // several trains -> every train
    for (let i = 0; i < allFahrzeuggruppe.length; i++) {
        let fahrzeuggruppe = allFahrzeuggruppe[i];
        let setLOK = false; //Boolean TrainSet has LOK

        //
        let vehicletype;
        let getvehicleType = getVehicleType(fahrzeuggruppe.fahrzeuggruppebezeichnung);
        if (getvehicleType[2] !== "") {
            vehicletype = getvehicleType[1] + " (BR" + getvehicleType[2] + ")";
        } else {
            vehicletype = getvehicleType[1];
        }
        if (vehicletype !== "") {
            console.log(vehicletype);
        }
        vehiclename = +vehicletype;

        //one train set -> every coach ("Wagon")
        for (let j = 0; j < fahrzeuggruppe.allFahrzeug.length; j++) {
            let fahrzeug = fahrzeuggruppe.allFahrzeug[j];

            const wagenordnungsnummer = fahrzeug.wagenordnungsnummer;
            const fahrzeugnummer = 'fzg' + fahrzeug.fahrzeugnummer;
            const kategorie = fahrzeug.kategorie;
            const ausstattungsDiv = document.createElement('div');
            ausstattungsDiv.classList.add('coach');
            //Boolean for Show IMG
            let showIMG = true;

            //check TrainSET has LOK -> Add Head on Coach

            ausstattungsDiv.classList.add(fahrzeugnummer);

            if (setLOK === true) {
                ausstattungsDiv.classList.add('head');
                setLOK = false;
            }

            if (kategorie === "LOK") {
                ausstattungsDiv.classList.add('lok');
                ausstattungsDiv.innerHTML = `LOK`;
                setLOK = true;
                showIMG = false;
            }

            if (j === 0 && kategorie !== "LOK") {
                if (kategorie === "TRIEBKOPF" || kategorie.includes("STEUERWAGEN")) {
                    ausstattungsDiv.classList.add('steuerHead');
                    if (kategorie === "TRIEBKOPF") {
                        showIMG = false
                    }
                } else {
                    ausstattungsDiv.classList.add('head');
                }
            }

            if (j === (fahrzeuggruppe.allFahrzeug.length - 1) && kategorie !== "LOK" && !(i === 0 && j === 0)) {
                if (kategorie === "TRIEBKOPF" || kategorie.includes("STEUERWAGEN")) {
                    ausstattungsDiv.classList.add('steuerBack');
                    if (kategorie === "TRIEBKOPF") {
                        showIMG = false
                    }
                } else {
                    ausstattungsDiv.classList.add('back');
                }
            }

            //if next coach == LOK -> Back
            if (j === (fahrzeuggruppe.allFahrzeug.length - 2)
                && fahrzeuggruppe.allFahrzeug[j + 1].kategorie === "LOK") {
                ausstattungsDiv.classList.add('back');
            }

            //single Coach in Train
            if (j === 0 && (fahrzeuggruppe.allFahrzeug.length - 1) === 0) {
                //Train-Set has only one Coach or is BR650 (RS1)
                if (i === 0 && (allFahrzeuggruppe.length - 1) === 0 || getvehicleType[2] === "650") {
                    ausstattungsDiv.className = 'coach';
                    ausstattungsDiv.classList.add('single');
                } else {
                    if (i > 0 && kategorie !== "LOK") {
                        ausstattungsDiv.className = 'coach';
                        //if 2th vehicle after LOK
                        if (i === 1 && allFahrzeuggruppe[0].allFahrzeug[0].kategorie === "LOK") {
                            ausstattungsDiv.classList.add('head');
                        }
                        //if last Coach befor LOK
                        if (i === (allFahrzeuggruppe.length - 2) && allFahrzeuggruppe[i + 1].allFahrzeug[0].kategorie === "LOK") {
                            ausstattungsDiv.classList.add('back');
                        }
                        // if Last Coach
                        if (i === (allFahrzeuggruppe.length - 1) && kategorie !== "LOK") {
                            if (kategorie.includes("STEUERWAGEN")) {
                                ausstattungsDiv.classList.add('steuerBack');
                            } else {
                                ausstattungsDiv.classList.add('back');
                            }
                        }
                    }
                }
            }

            if (fahrzeug.status === "GESCHLOSSEN") {
                ausstattungsDiv.innerHTML = `x`;
                showIMG = false;
                //ausstattungsDiv.innerHTML += `<br><br>${fahrzeug.fahrzeugsektor}`;
            }

            if (showIMG) {

                ausstattungsDiv.innerHTML = `<div class='sector'>${fahrzeug.fahrzeugsektor}`;

                if (kategorie !== "STEUERWAGENZWEITEKLASSE" && kategorie !== "REISEZUGWAGENZWEITEKLASSE" && kategorie !== "DOPPELSTOCKSTEUERWAGENZWEITEKLASSE" && kategorie !== "DOPPELSTOCKWAGENZWEITEKLASSE") {
                    ausstattungsDiv.innerHTML += `${wagenordnungsnummer}<br><img src="${imgpath}/${kategorie}.svg">`;
                } else {
                    ausstattungsDiv.innerHTML += `${wagenordnungsnummer}<br>`;
                }
                ;

                //let countausstatt = 0;
                fahrzeug.allFahrzeugausstattung.forEach(ausstattung => {
                    if (
                        //countausstatt < 2 &&
                        !["KLIMA"].includes(ausstattung.ausstattungsart)) {
                        //countausstatt++;
                        ausstattungsDiv.innerHTML += `<img src="${imgpath}/${ausstattung.ausstattungsart}.svg">`;
                    }
                    //TODO: Optimize which AUSSTATTUNG are shown
                });

            }
            blocksContainer.appendChild(ausstattungsDiv);
            //Next Coach
        }
        //Next Train
    }

    
}


   


function getVehicleType(fahrzeugbezeichnung) {
    let type = "";
    let series = "";
    let name = "";
    if (fahrzeugbezeichnung.startsWith("ICE")) {
        let name = fahrzeugbezeichnung.substring(0, 3);
        let number = fahrzeugbezeichnung.substring(3);
        let firstnum = number.substring(0, 2);
        let lastnum = number.substring(2);
        switch (firstnum) {
            case "01":
                type = "ICE 1";
                series = "401";
                break;
            case "02":
                type = "ICE 2";
                series = "402";
                break;
            case "03":
                type = "ICE 3";
                series = "403";
                break;
            case "46":
                type = "ICE 3";
                series = "406";
                break;
            case "47":
                type = "ICE 3";
                series = "407";
                break;
            case "80":
                type = "ICE 3";
                series = "408";
                break;
            case "90":
                type = "ICE 4";
                series = "412.0";
                break;
            case "92":
                type = "ICE 4";
                series = "412.2";
                break;
            case "94":
                type = "ICE 4";
                series = "412.4";
                break;
            case "11":
                type = "ICE T";
                series = "411";
                break;
            case "15":
                type = "ICE T";
                series = "415";
                break;
            default:
        }
    }
    if (fahrzeugbezeichnung.startsWith("ICK")) {
        type = "IC2 KISS";
    }
    if (fahrzeugbezeichnung.startsWith("ICD")) {
        type = "IC2";
    }
    if (fahrzeugbezeichnung.startsWith("T0442")) {
        type = "Talent 2";
        series = "442";
    }
    if (fahrzeugbezeichnung.startsWith("T1442")) {
        type = "Talent 2";
        series = "1442";
    }
    if (fahrzeugbezeichnung.startsWith("D0650")) {
        type = "RS1";
        series = "650";
    }

    return [fahrzeugbezeichnung, type, series, name];
    

   
}


fetchAndDisplayData();

