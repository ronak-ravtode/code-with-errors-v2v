const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase'); // Your Supabase client

// POST /api/guardian/generate-invite
router.post('/generate-invite', async (req, res) => {
  console.log('========================================');
  console.log(' NEW INVITE REQUEST');
  console.log('========================================');
  console.log('Request body:', req.body);
  
  try {
    const { userId, relationship, guardianEmail } = req.body;

    // VALIDATION
    if (!userId) {
      console.error('❌ Missing userId');
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!relationship) {
      console.error('❌ Missing relationship');
      return res.status(400).json({ error: 'Relationship is required' });
    }

    console.log('✅ Validation passed');
    console.log('  - userId:', userId);
    console.log('  - relationship:', relationship);
    console.log('  - guardianEmail:', guardianEmail || 'Not provided');

    // Generate unique token
    const inviteToken = require('crypto').randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    console.log('📝 Creating invite record...');
    console.log('  - Token:', inviteToken);
    console.log('  - Expires:', expiresAt);

    // Insert or update guardian link
    const { data, error } = await supabase
      .from('guardian_links')
      .insert({
        user_id: userId,
        guardian_email: guardianEmail || null,
        relationship: relationship,
        status: 'PENDING',
        invite_token: inviteToken,
        invite_expires_at: expiresAt.toISOString(),
        is_accepted: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      throw error;
    }

    console.log('✅ Invite created successfully:', data);

    // Generate invite link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteLink = `${frontendUrl}/invite?token=${inviteToken}`;

    console.log('🔗 Invite link:', inviteLink);

    res.json({
      success: true,
      inviteLink: inviteLink,
      token: inviteToken,
      expiresAt: expiresAt,
      relationship: relationship
    });

  } catch (error) {
    console.error('========================================');
    console.error('💥 ERROR in /api/guardian/generate-invite');
    console.error('========================================');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    res.status(500).json({
      error: 'Failed to generate invite',
      message: error.message,
      details: error.details || null
    });
  }
});

// POST /api/guardian/accept-invite
router.post('/accept-invite', async (req, res) => {
  console.log('📥 Accept invite request:', req.body);
  
  try {
    const { token, guardianUserId } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find the invite
    const { data: invite, error: fetchError } = await supabase
      .from('guardian_links')
      .select('*')
      .eq('invite_token', token)
      .single();

    if (fetchError || !invite) {
      console.error(' Invite not found:', fetchError);
      return res.status(404).json({ error: 'Invite not found or invalid' });
    }

    // Check if expired
    if (new Date(invite.invite_expires_at) < new Date()) {
      console.error('❌ Invite expired');
      return res.status(400).json({ error: 'Invite has expired' });
    }

    // Check if already accepted
    if (invite.is_accepted) {
      console.error('❌ Invite already accepted');
      return res.status(400).json({ error: 'Invite already accepted' });
    }

    // Accept the invite
    const { data, error } = await supabase
      .from('guardian_links')
      .update({
        guardian_user_id: guardianUserId,
        status: 'ACCEPTED',
        is_accepted: true,
        updated_at: new Date().toISOString()
      })
      .eq('invite_token', token)
      .select()
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      throw error;
    }

    console.log('✅ Invite accepted successfully');

    res.json({
      success: true,
      message: 'Guardian link established',
      data: data
    });

  } catch (error) {
    console.error('💥 Error accepting invite:', error);
    res.status(500).json({
      error: 'Failed to accept invite',
      message: error.message
    });
  }
});

// GET /api/guardian/list
router.get('/list', async (req, res) => {
  try {
    const { userId } = req.query;

    const { data, error } = await supabase
      .from('guardian_links')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'ACCEPTED')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, guardians: data || [] });

  } catch (error) {
    console.error('Error fetching guardians:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/guardian/safe-places
router.get('/safe-places', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng are required' });
    }

    const { getNearbySafePlaces } = require('../services/SafePlacesService');
    const safePlaces = await getNearbySafePlaces(parseFloat(lat), parseFloat(lng), parseInt(radius) || 5000);
    
    res.json(safePlaces);
  } catch (error) {
    console.error('Error fetching safe places endpoint:', error);
    res.status(500).json({ error: 'Failed to fetch safe places' });
  }
});

module.exports = router;
