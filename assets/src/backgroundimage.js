/// Background Image
		
const url = "https://data.cuzimmartin.dev/mainpage-images/latest";

fetch(url)
  .then(response => response.json())
  .then(data => {
    // Assuming the first entry is the first element in the array
    const firstEntry = data[0]; // Access the first element of the array
    if (firstEntry) {
      const imageUrl = firstEntry.url;
      //const focusPoint = firstEntry.focuspoint;

      const bodyElement = document.body;
      bodyElement.style.backgroundImage = `url('${imageUrl}')`;
      //bodyElement.style.backgroundPosition = focusPoint;
    } 
	
	const descriptionElement = document.getElementById("description");
      if (descriptionElement) {
        descriptionElement.textContent = firstEntry.infoText;
      } 

      const copyrightElement = document.getElementById("copyright");
      if (copyrightElement) {
        copyrightElement.textContent = firstEntry.copyright;
      } 
  })
  .catch(error => {
    console.error("Error fetching JSON data:", error);
  });