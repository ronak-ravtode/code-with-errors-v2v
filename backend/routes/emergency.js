const express = require('express');
const { triggerEmergencyCascade } = require('../services/EmergencyOrchestrator');
const EmergencyService = require('../services/EmergencyService');
const ExternalApis = require('../services/ExternalApis');
const EvidenceService = require('../services/EvidenceService');

const router = express.Router();

// POST /api/emergency/start (The Orchestrator)
router.post('/start', async (req, res) => {
  try {
    const { journeyId, userId, latitude, longitude } = req.body;
    
    if (!journeyId || !userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await triggerEmergencyCascade(journeyId, userId, latitude, longitude);
    res.json(result);
  } catch (error) {
    console.error('Error in Emergency Orchestrator:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/emergency/location
router.post('/location', async (req, res) => {
  try {
    const { sessionId, incidentId, latitude, longitude } = req.body;
    if (!sessionId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await EmergencyService.updateSessionStatus(sessionId, { 
      last_latitude: latitude, 
      last_longitude: longitude,
      location_shared: true 
    });
    await EmergencyService.logAction(sessionId, 'LOCATION', 'Location Updated', `Lat: ${latitude}, Lng: ${longitude}`);

    // Pass along to Evidence Vault if incidentId is provided
    if (incidentId) {
      await EvidenceService.saveIncidentLocation(incidentId, latitude, longitude);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating emergency location:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/emergency/safe-place
router.get('/safe-place', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: 'Missing lat or lng' });

    const places = await ExternalApis.getNearbySafePlaces(parseFloat(lat), parseFloat(lng), 2000);
    res.json(places);
  } catch (error) {
    console.error('Error fetching safe places:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/emergency/status/:sessionId (The Checklist API)
router.get('/status/:sessionId', async (req, res) => {
  try {
    const session = await EmergencyService.getSession(req.params.sessionId);
    res.json({
      guardianNotified: session.guardian_notified,
      locationShared: session.location_shared,
      audioStarted: session.audio_started,
      timelineStarted: session.timeline_started,
      safePlaceFound: session.safe_place_found
    });
  } catch (error) {
    console.error('Error fetching emergency status:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/emergency/end
router.post('/end', async (req, res) => {
  try {
    const { sessionId, incidentId, journeyId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'Missing sessionId' });

    // End the session
    await EmergencyService.endSession(sessionId);
    await EmergencyService.logAction(sessionId, 'SYSTEM', 'Emergency Closed', 'User manually ended the emergency.');

    // Cascade to close evidence vault if applicable
    if (incidentId) {
       await EvidenceService.closeIncident(incidentId, journeyId, 'Emergency ended by user.');
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending emergency:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/emergency/history
router.get('/history', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const history = await EmergencyService.getHistory(userId);
    res.json(history);
  } catch (error) {
    console.error('Error fetching emergency history:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
