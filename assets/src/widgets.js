function createWidgetBar() {
    const widgetBar = document.createElement("div");
    widgetBar.className = "widgetbar";

    // Pinned Popup
    const pinnedPopup = document.createElement("div");
    pinnedPopup.className = "pinnedPopup hidden";
    pinnedPopup.id = "pinnedPopup";

    const pinnedTable = document.createElement("table");
    pinnedTable.className = "pureTable";
    const pinnedRow = document.createElement("tr");

    const pinnedTdIcon = document.createElement("td");
    pinnedTdIcon.className = "tdPure";
    const pinnedImg = document.createElement("img");
    pinnedImg.src = "./assets/icons/pinned.svg";
    pinnedImg.className = "widgeticon";
    pinnedTdIcon.appendChild(pinnedImg);

    const pinnedTdText = document.createElement("td");
    pinnedTdText.className = "tdPure";
    const pinnedText = document.createElement("span");
    pinnedText.className = "widgetname";
    pinnedText.textContent = "Angeheftet";
    pinnedTdText.appendChild(pinnedText);

    pinnedRow.appendChild(pinnedTdIcon);
    pinnedRow.appendChild(pinnedTdText);
    pinnedTable.appendChild(pinnedRow);
    pinnedPopup.appendChild(pinnedTable);

    const darkerWidget = document.createElement("div");
    darkerWidget.className = "darkerwidget";

    const popupText = document.createElement("div");
    popupText.className = "popuptext";

    const tripHeader = document.createElement("div");
    tripHeader.className = "trip-header";
    const tripTitle = document.createElement("div");
    tripTitle.className = "trip-title";

    const lineBadge = document.createElement("div");
    lineBadge.className =
        "linebadge badgeClassProductName IC national IC2174nahreisezug nahreisezug";
    lineBadge.id = "Pinnedlinebadge";
    lineBadge.textContent = "XX";

    tripTitle.appendChild(lineBadge);
    tripHeader.appendChild(tripTitle);
    popupText.appendChild(tripHeader);

    const tripProgressBar = document.createElement("div");
    tripProgressBar.className = "trip-progress-bar";

    const tripStationInfo = document.createElement("div");
    tripStationInfo.className = "trip-station-info";

    const tripOriginInfo = document.createElement("div");
    tripOriginInfo.className = "trip-origin-info";
    const originStation = document.createElement("span");
    originStation.id = "originStationPopup";
    originStation.textContent = "Origin";
    tripOriginInfo.appendChild(originStation);

    const tripDestinationInfo = document.createElement("div");
    tripDestinationInfo.className = "trip-destination-info";
    const destinationStation = document.createElement("span");
    destinationStation.id = "destinationStationPopup";
    destinationStation.textContent = "Destination";
    tripDestinationInfo.appendChild(destinationStation);

    tripStationInfo.appendChild(tripOriginInfo);
    tripStationInfo.appendChild(tripDestinationInfo);
    tripProgressBar.appendChild(tripStationInfo);

    const tripTimeInfo = document.createElement("div");
    tripTimeInfo.className = "trip-time-info";

    const tripOriginTime = document.createElement("div");
    tripOriginTime.className = "trip-origin-time";
    const originTime = document.createElement("span");
    originTime.id = "originTime";
    originTime.textContent = "xx:xx";
    tripOriginTime.appendChild(originTime);

    const tripDurationDiv = document.createElement("div");
    tripDurationDiv.className = "trip-duration-div";
    const tripDuration = document.createElement("span");
    tripDuration.className = "trip-duration";
    tripDuration.id = "tripDurationTime";
    tripDuration.textContent = "xx min.";
    tripDurationDiv.appendChild(tripDuration);

    const tripDestinationTime = document.createElement("div");
    tripDestinationTime.className = "trip-destination-time";
    const destinationTime = document.createElement("span");
    destinationTime.id = "destinationTime";
    destinationTime.textContent = "xx:xx";
    tripDestinationTime.appendChild(destinationTime);


    tripTimeInfo.appendChild(tripOriginTime);
    tripTimeInfo.appendChild(tripDurationDiv);
    tripTimeInfo.appendChild(tripDestinationTime);

    tripProgressBar.appendChild(tripTimeInfo);
    popupText.appendChild(tripProgressBar);
    darkerWidget.appendChild(popupText);
    pinnedPopup.appendChild(darkerWidget);

    widgetBar.appendChild(pinnedPopup);

    // Trawelling Popup
    const twlngPopup = document.createElement("div");
    twlngPopup.className = "pinnedPopup hidden";
    twlngPopup.id = "twlngPopup";

    const twlngTable = document.createElement("table");
    twlngTable.className = "pureTable";
    const twlngRow = document.createElement("tr");

    const twlngTdIcon = document.createElement("td");
    twlngTdIcon.className = "tdPure";
    const twlngImg = document.createElement("img");
    twlngImg.src = "./assets/icons/Träwelling.png";
    twlngImg.className = "widgeticon";
    twlngTdIcon.appendChild(twlngImg);

    const twlngTdText = document.createElement("td");
    twlngTdText.className = "tdPure";
    const twlngText = document.createElement("span");
    twlngText.className = "widgetname";
    twlngText.textContent = "Von Träwelling";
    twlngTdText.appendChild(twlngText);

    twlngRow.appendChild(twlngTdIcon);
    twlngRow.appendChild(twlngTdText);
    twlngTable.appendChild(twlngRow);
    twlngPopup.appendChild(twlngTable);

    const twlngLink = document.createElement("a");
    twlngLink.id = "twlngpopuplink";

    const twlngDarkerWidget = darkerWidget.cloneNode(true);
    twlngDarkerWidget.querySelector("#Pinnedlinebadge").id = "twlnglinebadge";
    twlngDarkerWidget.querySelector("#originStationPopup").id =
        "twlngoriginStationPopup";
    twlngDarkerWidget.querySelector("#destinationStationPopup").id =
        "twlngdestinationStationPopup";
    twlngDarkerWidget.querySelector("#originTime").id = "twlngoriginTime";
    twlngDarkerWidget.querySelector("#tripDurationTime").id =
        "twlngtripDurationTime";
    twlngDarkerWidget.querySelector("#destinationTime").id =
        "twlngdestinationTime";

    twlngLink.appendChild(twlngDarkerWidget);
    twlngPopup.appendChild(twlngLink);

    widgetBar.appendChild(twlngPopup);

    // Add to DOM
    document.body.appendChild(widgetBar);
}

// Call the function to add the widget bar to the DOM
createWidgetBar();
