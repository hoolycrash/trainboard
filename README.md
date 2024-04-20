
# Trainboard

Trainboard is a departure/arrival board for trains that uses real-time data from Deutsche Bahn. It is supposed to stand out by a clear user interface that is strongly inspired by its Danish competitor "Mit Tog".

Check it out: [https://trainboard.de.cool/](https://trainboard.de.cool/)

## Run this code
You can run this application locally by simply downloading the newest version from [Release Tab](https://github.com/hoolycrash/trainboard/releases) and opening it in a web browser of your choice.
It's just JS :)

Please note: You need a internet connection to fetch data.
## Contribution
If you wish to contribute to this project, please feel free to do so. However, it's important to keep in mind that the primary goal of this project is to faithfully replicate the "Mit-Tog" WebApplication offered by BaneDanmark. ([Reference](https://www.mit-tog.dk/en))

Therefore, if you intend to make functional or visual changes that deviate from the original purpose, consider creating your own project using the code provided here.

Additionally, please be aware that one of the significant advantages of this application is its ability to run locally in a web browser without requiring a complicated setup. Preserving this functionality would be highly appreciated :)

To ensure that your code will be accepted, it is recommended to start by contributing to planned features listed below: 

- Optimise Coach Position Indicator (`db-wagenreihung.html`)
- Complete S-Bahn Signet styles in `/assets/css/line-colors.css`
- Train Remarks
- Optimise javascript and outsource it to single files to reduce clutter and storage space
- Add Train Number (Zugnummer) to the trip informations tab (`trip.html`)
- Improving accessibility
- Better Optimisation for different screen sizes

:information_source: TIP: To play a little around with the `db-rest API` there are great sandboxes here: [db-rest | Swagger UI](https://petstore.swagger.io/?url=https%3A%2F%2Fv6.db.transport.rest%2F.well-known%2Fservice-desc%0A#/default/get_stops__id_)


## Follow me:
[![linkedin](https://img.shields.io/badge/twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/SBahnFahrer)

[☕ Buy me a coffe](https://www.buymeacoffee.com/felixnietzold)
