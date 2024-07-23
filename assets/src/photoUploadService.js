document.getElementById('type').addEventListener('change', function () {
    const evaNumberField = document.getElementById('stationField');
    if (this.value === 'station') {
        evaNumberField.style.display = 'block';
    } else {
        evaNumberField.style.display = 'none';
    }
});

document.getElementById('uploadForm').addEventListener('submit', async function (event) {
    event.preventDefault();

    const form = document.getElementById('uploadForm');
    const formData = new FormData(form);

    // Überprüfe und setze die evaNumber nur einmalig und als String
    const type = document.getElementById('type').value;
    if (type === 'station') {
        const stationId = document.getElementById('stationId').value;
        if (stationId) {
            formData.set('evaNumber', stationId);
        }
    }

    // Zeige den Lade-Spinner und verstecke den Button-Text
    const submitButton = document.getElementById('submitButton');
    const spinner = document.getElementById('spinner');
    const buttonText = document.querySelector('.button-text');
    const successMessage = document.getElementById('successMessage');
    spinner.style.display = 'block';
    buttonText.classList.add('hidden');

    try {
        const response = await fetch('https://data.cuzimmartin.dev/upload-image', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Erfolg:', result);

        // Verstecke den Lade-Spinner und zeige den Button-Text
        spinner.style.display = 'none';
        buttonText.classList.remove('hidden');

        // Setze das Formular zurück
        form.reset();

        // Zeige die Erfolgsmeldung
        successMessage.textContent = 'Bild erfolgreich hochgeladen!';
        setTimeout(() => {
            successMessage.textContent = '';
        }, 5000);
    } catch (error) {
        console.error('Fehler:', error);

        // Verstecke den Lade-Spinner und zeige den Button-Text
        spinner.style.display = 'none';
        buttonText.classList.remove('hidden');

        // Zeige eine Fehlermeldung
        successMessage.textContent = `Fehler beim Hochladen des Bildes: ${error.message}`;
        setTimeout(() => {
            successMessage.textContent = '';
        }, 5000);
    }
});
