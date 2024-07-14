import express from 'express';
import {createClient} from 'hafas-client';
import {profile as dbProfile} from 'hafas-client/p/db/index.js';


const app = express();
const port = 3000;

const dbHafas = createClient(dbProfile, 'trainboard (request@cuzimmartin.dev)');


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const getClient = (provider) => {
    switch (provider) {
        case 'oebb':
            return oebbHafas;
        case 'sbb':
            return sbbHafas;
        case 'db':
        default:
            return dbHafas;
    }
};

app.get('/locations', async (req, res) => {
    const { query, provider } = req.query;

    if (!query || query.trim() === '') {
        res.status(400).send('Query parameter must be a non-empty string.');
        return;
    }

    try {
        const locations = await dbHafas.locations(query, {
            results: 5,
            stops: true,
            addresses: true,
            poi: true
        });
        res.json(locations);
    } catch (error) {
        console.error('Error fetching data from HAFAS:', error);
        res.status(500).send(error.toString());
    }
});

app.get('/departures', async (req, res) => {
    const { stationID, provider } = req.query;

    if (!stationID || stationID.trim() === '') {
        res.status(400).send('stationID parameter must be a non-empty string.');
        return;
    }

    try {
        const departures = await dbHafas.departures(stationID, {
            duration: 20000,
            results: 400,
            linesOfStops: false,
            remarks: true,
            language: 'de'
        });
        res.json(departures);
    } catch (error) {
        console.error('Error fetching data from HAFAS:', error);
        res.status(500).send(error.toString());
    }
});

app.get('/arrivals', async (req, res) => {
    const { stationID, provider } = req.query;

    if (!stationID || stationID.trim() === '') {
        res.status(400).send('stationID parameter must be a non-empty string.');
        return;
    }

    try {
        const arrivals = await dbHafas.arrivals(stationID, {
            duration: 20000,
            results: 400,
            linesOfStops: false,
            remarks: true,
            language: 'de'
        });
        res.json(arrivals);
    } catch (error) {
        console.error('Error fetching data from HAFAS:', error);
        res.status(500).send(error.toString());
    }
});

app.get('/station', async (req, res) => {
    const { stationID, provider } = req.query;

    if (!stationID || stationID.trim() === '') {
        res.status(400).send('stationID parameter must be a non-empty string.');
        return;
    }

    try {
        const station = await dbHafas.stop(stationID);
        res.json(station);
    } catch (error) {
        console.error('Error fetching station data from HAFAS:', error);
        res.status(500).send(error.toString());
    }
});

app.get('/trip', async (req, res) => {
    const { tripId, provider } = req.query;

    if (!tripId || tripId.trim() === '') {
        res.status(400).send('tripId parameter must be a non-empty string.');
        return;
    }

    try {
        const trip = await dbHafas.trip(tripId, { stopovers: true, remarks: true });
        res.json(trip);
    } catch (error) {
        console.error('Error fetching trip data from HAFAS:', error);
        res.status(500).send(error.toString());
    }
});

app.listen(port, () => {
    console.log(`API server is running at http://localhost:${port}`);
});
