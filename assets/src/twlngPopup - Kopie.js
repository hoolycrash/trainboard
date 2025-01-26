fetch("https://traewelling.de/api/v1/user/FelixTaube/statuses")
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(json => {
        if (json.data && Array.isArray(json.data)) {
            const item = json.data[0]; // Erstes Element auswählen

            function extractTime(dateString) {
                const date = new Date(dateString);
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${hours}:${minutes}`;
            }
            
            var client;
            
            if (item.client === null) {
                client = 'Träwelling';
            } else {
                client = `${item.client.name}`
            }

            console.log(item.train.linename);
            document.getElementById('checkinicon').innerHTML = `<img src="./assets/icons/${client}.png" class="widgeticon">`;
            document.getElementById('checkin').textContent = client;
            document.getElementById('twlnglinebadge').textContent = item.train.lineName;
            document.getElementById('twlngoriginStationPopup').textContent = item.train.origin.name;
            document.getElementById('twlngdestinationStationPopup').textContent = item.train.destination.name;
            document.getElementById('twlngoriginTime').textContent = extractTime(item.train.origin.departure);
            document.getElementById('twlngdestinationTime').textContent = extractTime(item.train.destination.arrival);
            document.getElementById("twlngpopuplink").href = `trip.html?tripId=${encodeURIComponent(item.train.hafasId)}&?stationID=${item.train.origin.evaIdentifier}`;


        } else {
            console.error("Unexpected data format:", json);
        }
    })
    .catch(error => {
        console.error("Error fetching data:", error);
    });
