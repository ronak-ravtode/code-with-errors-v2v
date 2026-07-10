const supabase = require('../utils/supabase');

async function createSession(journeyId, userId, lat, lng) {
  const { data: session, error } = await supabase
    .from('emergency_sessions')
    .insert({
      journey_id: journeyId,
      user_id: userId,
      status: 'ACTIVE',
      last_latitude: lat,
      last_longitude: lng,
      guardian_notified: false,
      location_shared: false,
      audio_started: false,
      timeline_started: false,
      safe_place_found: false
    })
    .select()
    .single();

  if (error) throw error;
  return session;
}

async function updateSessionStatus(sessionId, updates) {
  const { error } = await supabase
    .from('emergency_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) throw error;
}

async function logAction(sessionId, type, title, description) {
  const { error } = await supabase
    .from('emergency_logs')
    .insert({
      session_id: sessionId,
      type,
      title,
      description
    });

  if (error) console.error('Error inserting emergency log:', error);
}

async function getSession(sessionId) {
  const { data, error } = await supabase
    .from('emergency_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error) throw error;
  return data;
}

async function endSession(sessionId) {
  const { error } = await supabase
    .from('emergency_sessions')
    .update({ status: 'CLOSED', ended_at: new Date() })
    .eq('id', sessionId);

  if (error) throw error;
}

async function getHistory(userId) {
  const { data, error } = await supabase
    .from('emergency_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data;
}

module.exports = {
  createSession,
  updateSessionStatus,
  logAction,
  getSession,
  endSession,
  getHistory
};
