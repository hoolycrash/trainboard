import express from 'express';
import { createClient } from 'hafas-client';
import { profile as dbProfile } from 'hafas-client/p/db/index.js';

const app = express();
const port = 3000;
const dbHafas = createClient(dbProfile, 'trainboard (request@cuzimmartin.dev)');

// Middleware für CORS
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Middleware für Anfrage-Validierung
const validateQuery = (req, res, next) => {
    const { query } = req.query;
    if (!query || query.trim() === '') {
        return res.status(400).send('Query parameter must be a non-empty string.');
    }
    next();
};

// Middleware für ID-Validierung
const validateID = (id) => {
    return (req, res, next) => {
        if (!req.query[id] || req.query[id].trim() === '') {
            return res.status(400).send(`${id} parameter must be a non-empty string.`);
        }
        next();
    };
};

// Zentrale Fehlerbehandlungsmiddleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
});

app.get('/locations', validateQuery, async (req, res, next) => {
    try {
        const locations = await dbHafas.locations(req.query.query, {
            results: 5,
            stops: true,
            addresses: true,
            poi: true
        });
        res.json(locations);
    } catch (error) {
        next(error);
    }
});

app.get('/departures', validateID('stationID'), async (req, res, next) => {
    try {
        const departures = await dbHafas.departures(req.query.stationID, {
            duration: 20000,
            results: 400,
            linesOfStops: false,
            remarks: true,
            language: 'de'
        });
        res.json(departures);
    } catch (error) {
        next(error);
    }
});

app.get('/arrivals', validateID('stationID'), async (req, res, next) => {
    try {
        const arrivals = await dbHafas.arrivals(req.query.stationID, {
            duration: 20000,
            results: 400,
            linesOfStops: false,
            remarks: true,
            language: 'de'
        });
        res.json(arrivals);
    } catch (error) {
        next(error);
    }
});

app.get('/station', validateID('stationID'), async (req, res, next) => {
    try {
        const station = await dbHafas.stop(req.query.stationID);
        res.json(station);
    } catch (error) {
        next(error);
    }
});

app.get('/trip', validateID('tripId'), async (req, res, next) => {
    try {
        const trip = await dbHafas.trip(req.query.tripId, { stopovers: true, remarks: true });
        res.json(trip);
    } catch (error) {
        next(error);
    }
});

app.listen(port, () => {
    console.log(`API server is running at http://localhost:${port}`);
});
