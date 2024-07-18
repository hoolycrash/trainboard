/// Background Image
		
const url = "https://train-img-server.de.cool/dataset.json";

fetch(url)
  .then(response => response.json())
  .then(data => {
    // Assuming the first entry is the first element in the array
    const firstEntry = data[0]; // Access the first element of the array
    if (firstEntry) {
      const imageUrl = firstEntry.filename;
      const focusPoint = firstEntry.focuspoint;

      const bodyElement = document.body;
      bodyElement.style.backgroundImage = `url('https://train-img-server.de.cool/images/${imageUrl}')`;
      bodyElement.style.backgroundPosition = focusPoint;
    } 
	
	const descriptionElement = document.getElementById("description");
      if (descriptionElement) {
        descriptionElement.textContent = firstEntry.description;
      } 

      const copyrightElement = document.getElementById("copyright");
      if (copyrightElement) {
        copyrightElement.textContent = firstEntry.copyright;
      } 
  })
  .catch(error => {
    console.error("Error fetching JSON data:", error);
  });