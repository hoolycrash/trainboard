// Erstelle die äußere div mit der Klasse "pinnedPopup" und ID "pinnedPopup"
const pinnedPopup = document.createElement('div');
pinnedPopup.classList.add('pinnedPopup');
pinnedPopup.id = 'pinnedPopup';

// Erstelle die div mit der Klasse "darker"
const darker = document.createElement('div');
darker.classList.add('darker');

// Erstelle die innere Struktur des "darker"-Containers
const popuptext = document.createElement('div');
popuptext.classList.add('popuptext');

// Erstelle die trip-header
const tripHeader = document.createElement('div');
tripHeader.classList.add('trip-header');

// Erstelle die trip-title
const tripTitle = document.createElement('div');
tripTitle.classList.add('trip-title');

// Erstelle das table-Element für die trip-title
const table = document.createElement('table');
const tr = document.createElement('tr');
const td1 = document.createElement('td');
const linebadge = document.createElement('div');
linebadge.classList.add('linebadge');
linebadge.id = 'linebadge'; // ID für linebadge
td1.appendChild(linebadge);
tr.appendChild(td1);

const td2 = document.createElement('td');
const small = document.createElement('small');
small.classList.add('disabled');
small.innerHTML = '&nbsp;&nbsp;Angeheftete Fahrt';
td2.appendChild(small);
tr.appendChild(td2);

table.appendChild(tr);
tripTitle.appendChild(table);
tripHeader.appendChild(tripTitle);

// Füge trip-header zum popuptext hinzu
popuptext.appendChild(tripHeader);

// Erstelle die trip-progress-bar Struktur
const tripProgressBar = document.createElement('div');
tripProgressBar.classList.add('trip-progress-bar');

// Erstelle die trip-station-info
const tripStationInfo = document.createElement('div');
tripStationInfo.classList.add('trip-station-info');

// Erstelle die trip-origin-info und fülle sie mit einem span
const tripOriginInfo = document.createElement('div');
tripOriginInfo.classList.add('trip-origin-info');
const originStationPopup = document.createElement('span');
originStationPopup.id = 'originStationPopup'; // ID für originStationPopup
tripOriginInfo.appendChild(originStationPopup);
tripStationInfo.appendChild(tripOriginInfo);

// Erstelle die trip-destination-info
const tripDestinationInfo = document.createElement('div');
tripDestinationInfo.classList.add('trip-destination-info');
const destinationStationPopup = document.createElement('span');
destinationStationPopup.id = 'destinationStationPopup'; // ID für destinationStationPopup
tripDestinationInfo.appendChild(destinationStationPopup);
tripStationInfo.appendChild(tripDestinationInfo);

// Füge station-info zur progress-bar hinzu
tripProgressBar.appendChild(tripStationInfo);

// Erstelle die trip-time-info Struktur
const tripTimeInfo = document.createElement('div');
tripTimeInfo.classList.add('trip-time-info');

// Erstelle die trip-origin-time
const tripOriginTime = document.createElement('div');
tripOriginTime.classList.add('trip-origin-time');
const originTime = document.createElement('span');
originTime.id = 'originTime'; // ID für originTime
tripOriginTime.appendChild(originTime);

// Erstelle die trip-duration-div
const tripDurationDiv = document.createElement('div');
tripDurationDiv.classList.add('trip-duration-div');
const tripDurationTime = document.createElement('span');
tripDurationTime.classList.add('trip-duration');
tripDurationTime.id = 'tripDurationTime'; // ID für tripDurationTime
const spinnerImg = document.createElement('img');
spinnerImg.src = './assets/whiteSpinner.svg';
spinnerImg.classList.add('loadingspinner');
tripDurationTime.appendChild(spinnerImg);
tripDurationDiv.appendChild(tripDurationTime);

// Erstelle die trip-destination-time
const tripDestinationTime = document.createElement('div');
tripDestinationTime.classList.add('trip-destination-time');
const destinationTime = document.createElement('span');
destinationTime.id = 'destinationTime'; // ID für destinationTime
tripDestinationTime.appendChild(destinationTime);

// Füge time-info zur progress-bar hinzu
tripTimeInfo.appendChild(tripOriginTime);
tripTimeInfo.appendChild(tripDurationDiv);
tripTimeInfo.appendChild(tripDestinationTime);
tripProgressBar.appendChild(tripTimeInfo);

// Füge die trip-progress-bar zum popuptext hinzu
popuptext.appendChild(tripProgressBar);
darker.appendChild(popuptext);

// Füge die darker div zum pinnedPopup hinzu
pinnedPopup.appendChild(darker);

// Erstelle und füge die trip-progress-bar-container hinzu
const progressBarContainer = document.createElement('div');
progressBarContainer.classList.add('trip-progress-bar-container');
const progress = document.createElement('div');
progress.classList.add('trip-progress');
progressBarContainer.appendChild(progress);
pinnedPopup.appendChild(progressBarContainer);

// Füge das komplette pinnedPopup in das DOM hinzu
document.body.appendChild(pinnedPopup);




async function fetchAndDisplayData() {

    // Funktion zum Abrufen des Cookies
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

    // Den Wert des Cookies 'pinnedjourney' abrufen und in einer Variablen speichern
    const pinnedJourney = getCookie('pinnedjourney');
    const pinnedJourneyStation = getCookie('pinnedjourneyStation');

    console.log(pinnedJourneyStation);
    console.log(pinnedJourney);

    // Wenn der Cookie existiert, gib den Wert aus
    if (pinnedJourney) {
        const tripId = pinnedJourney;
        console.log(tripId);  // Wenn du den Wert von `pinnedJourney` überprüfen möchtest, wird jetzt `tripId` angezeigt
        document.getElementById('linebadge').classList.add('badgeClassProductName');

        document.getElementById('informationisle').classList.add('bigonly');
        document.getElementById('descriptionbox').classList.add('bigonly');

    } else {
        console.log('Cookie "pinnedJourney" wurde nicht gefunden.');
        document.getElementById('pinnedPopup').classList.add('hidden');
        return;  // Beende die Funktion, um keine API-Anfrage zu stellen
    }

    const currentUrl = window.location.href;

    // Funktion, um URL-Parameter zu extrahieren
    function getParameterByName(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
        const results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    // Event Listener für Klick auf das Popup, um auf die Trip-Seite zu leiten
    document.getElementById('pinnedPopup').addEventListener('click', function () {
        // Seite mit der Trip-ID weiterleiten
        window.location.href = `trip.html?tripId=${pinnedJourney}&?stationID=${pinnedJourneyStation}`;
    });

    const tripID = pinnedJourney;

    

    console.log(pinnedJourney);

    

    try {
        const apiUrl = `https://data.cuzimmartin.dev/dynamic-trip?tripId=${(pinnedJourney)}&stationID=${(pinnedJourneyStation)}`;
        const response = await fetch(apiUrl);
        
        data = await response.json();

        
    } catch (error) {
        console.warn(`Problem mit der  API.`, error);
       
    }

    // Titel und Details setzen
    var lineName = data.trip.line.name.split('(')[0];
    document.getElementById('linebadge').textContent = `${lineName}`;

    // Dauer berechnen
    const departureTime = new Date(data.trip.plannedDeparture);
    const arrivalTime = new Date(data.trip.plannedArrival);
    const duration = (arrivalTime - departureTime) / (1000 * 60 * 60);  // Stunden
    const minutes = Math.floor((duration % 1) * 60);
    document.getElementById('tripDurationTime').textContent = `${Math.floor(duration)}:${minutes.toString().padStart(2, '0')} Std`;

    // Ursprungsstation und Zielstation setzen
    document.getElementById('originStationPopup').textContent = data.trip.origin.name;
    document.getElementById('originTime').textContent = departureTime.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
    });

    console.log(departureTime);  // Prüfe, ob departureTime ein gültiges Datum ist

    document.getElementById('destinationStationPopup').textContent = data.trip.destination.name;
    document.getElementById('destinationTime').textContent = arrivalTime.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit',
    });

    // Header Farbe
    const badgeClassProductName = encodeURIComponent(data.trip.line.productName);
    const badgeClassProduct = encodeURIComponent(data.trip.line.product);
    const badgeClassLineOperator = encodeURIComponent(lineName.replace(/\s+/g, '')) + encodeURIComponent(data.trip.line.operator.id);
    const badgeClassOperator = encodeURIComponent(data.trip.line.operator.id);

    document.getElementById('linebadge').classList.add(badgeClassProductName);
    document.getElementById('linebadge').classList.add(badgeClassProduct);
    document.getElementById('linebadge').classList.add(badgeClassLineOperator);
    document.getElementById('linebadge').classList.add(badgeClassOperator);

   

    // Dynamische Fortschrittsleiste aktualisieren
    setProgressBar(departureTime, new Date(), arrivalTime);

    function setProgressBar(departureTime, currentTime, arrivalTime) {
        const startTime = new Date(departureTime);
        const endTime = new Date(arrivalTime);

        // Gesamtzeitspanne zwischen Abfahrt und Ankunft
        const totalTime = endTime - startTime;
        // Verstrichene Zeit seit der Abfahrt
        const elapsedTime = currentTime - startTime;

        // Berechnen des Fortschritts als Prozentsatz
        let progressPercentage = (elapsedTime / totalTime) * 100;

        // Fortschritt auf 0% und 100% beschränken
        progressPercentage = Math.max(0, Math.min(progressPercentage, 100));

        // Fortschrittsleiste aktualisieren
        const progressBar = document.querySelector('.trip-progress');
        progressBar.style.width = progressPercentage + '%';
    }
}