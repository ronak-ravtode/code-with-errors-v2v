const express = require('express');
const { startJourney, endJourney, getJourneyHistory, getLiveJourney } = require('../services/JourneyService');
const { processNewLocation } = require('../services/LocationService');

const router = express.Router();

// POST /api/journey/start
// Body: { userId, destinationName, destinationLat, destinationLng, transportMode }
router.post('/start', async (req, res) => {
  try {
    const { userId, destinationName, destinationLat, destinationLng, transportMode } = req.body;
    
    if (!userId || !destinationName || !destinationLat || !destinationLng) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await startJourney(userId, destinationName, destinationLat, destinationLng, transportMode);
    res.json(result);
  } catch (error) {
    console.error('Error starting journey:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/journey/location
// Body: { journeyId, latitude, longitude, speed }
router.post('/location', async (req, res) => {
  try {
    const { journeyId, latitude, longitude, speed } = req.body;
    
    if (!journeyId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await processNewLocation(journeyId, latitude, longitude, speed || 0);
    res.json(result);
  } catch (error) {
    console.error('Error processing location:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/journey/end
// Body: { journeyId }
router.post('/end', async (req, res) => {
  try {
    const { journeyId } = req.body;
    if (!journeyId) return res.status(400).json({ error: 'Missing journeyId' });

    const summary = await endJourney(journeyId);
    res.json(summary);
  } catch (error) {
    console.error('Error ending journey:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/journey/history
// Query: ?userId=...
router.get('/history', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const history = await getJourneyHistory(userId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/journey/live/:id
router.get('/live/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const liveData = await getLiveJourney(id);
    res.json(liveData);
  } catch (error) {
    console.error('Error fetching live journey:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/journey/battery
router.post('/battery', async (req, res) => {
  try {
    const { journeyId, level, charging } = req.body;
    if (!journeyId || level === undefined) return res.status(400).json({ error: 'Missing required fields' });
    
    const { updateBattery } = require('../services/JourneyService');
    const result = await updateBattery(journeyId, level, charging);
    res.json(result);
  } catch (error) {
    console.error('Error updating battery:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/journey/deviation
router.post('/deviation', async (req, res) => {
  try {
    const { journeyId } = req.body;
    if (!journeyId) return res.status(400).json({ error: 'Missing journeyId' });
    
    const { triggerDeviation } = require('../services/JourneyService');
    const result = await triggerDeviation(journeyId);
    res.json(result);
  } catch (error) {
    console.error('Error triggering deviation:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/journey/emergency
router.post('/emergency', async (req, res) => {
  try {
    const { journeyId } = req.body;
    if (!journeyId) return res.status(400).json({ error: 'Missing journeyId' });
    
    const { triggerEmergency } = require('../services/JourneyService');
    const result = await triggerEmergency(journeyId);
    res.json(result);
  } catch (error) {
    console.error('Error triggering emergency:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
