const express = require('express');
const supabase = require('../utils/supabase');
const AlertEngine = require('../services/AlertEngine');

const router = express.Router();

// POST /api/alerts/evaluate
router.post('/evaluate', async (req, res) => {
  try {
    const { journeyId, userId, latitude, longitude } = req.body;
    if (!journeyId || !userId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await AlertEngine.evaluateRoute(journeyId, userId, latitude, longitude);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alerts/active/:journeyId
router.get('/active/:journeyId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('journey_id', req.params.journeyId)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/alerts/history/:userId
router.get('/history/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/alerts/read/:id
router.patch('/read/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
