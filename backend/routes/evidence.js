const express = require('express');
const multer = require('multer');
const { uploadEvidence } = require('../services/StorageService');
const {
  startIncident,
  saveEvidenceFile,
  saveIncidentLocation,
  addIncidentNote,
  closeIncident,
  getIncidentData,
  generateReportSummary
} = require('../services/EvidenceService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/evidence/start
router.post('/start', async (req, res) => {
  try {
    const { journeyId, userId, type } = req.body;
    if (!userId || !type) return res.status(400).json({ error: 'Missing required fields' });

    const result = await startIncident(journeyId, userId, type);
    res.json(result);
  } catch (error) {
    console.error('Error starting incident:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/evidence/upload
// Note: 'file' is the name of the form-data field
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { incidentId, journeyId, type } = req.body;
    const file = req.file;

    if (!incidentId || !file || !type) {
      return res.status(400).json({ error: 'Missing incidentId, file, or type (AUDIO/IMAGE)' });
    }

    // 1. Upload to storage via Multer buffer
    const fileUrl = await uploadEvidence(incidentId, file);

    // 2. Save record to evidence_files
    await saveEvidenceFile(incidentId, journeyId, type, fileUrl);

    res.json({ success: true, fileUrl });
  } catch (error) {
    console.error('Error uploading evidence:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/evidence/location
router.post('/location', async (req, res) => {
  try {
    const { incidentId, latitude, longitude } = req.body;
    if (!incidentId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await saveIncidentLocation(incidentId, latitude, longitude);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving incident location:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/evidence/note
router.post('/note', async (req, res) => {
  try {
    const { incidentId, note, createdBy } = req.body;
    if (!incidentId || !note) return res.status(400).json({ error: 'Missing required fields' });

    await addIncidentNote(incidentId, note, createdBy);
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding incident note:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/evidence/close
router.post('/close', async (req, res) => {
  try {
    const { incidentId, journeyId, summary } = req.body;
    if (!incidentId) return res.status(400).json({ error: 'Missing incidentId' });

    await closeIncident(incidentId, journeyId, summary);
    res.json({ success: true });
  } catch (error) {
    console.error('Error closing incident:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evidence/report/:incidentId
// IMPORTANT: Must be defined before the /:incidentId route so 'report' isn't treated as an ID
router.get('/report/:incidentId', async (req, res) => {
  try {
    const { incidentId } = req.params;
    const summary = await generateReportSummary(incidentId);
    res.json(summary);
  } catch (error) {
    console.error('Error generating report summary:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/evidence/:incidentId (The Master Aggregator)
router.get('/:incidentId', async (req, res) => {
  try {
    const { incidentId } = req.params;
    const data = await getIncidentData(incidentId);
    res.json(data);
  } catch (error) {
    console.error('Error fetching incident data:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
