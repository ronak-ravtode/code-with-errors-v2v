const EmergencyService = require('./EmergencyService');
const EvidenceService = require('./EvidenceService');
const GuardianService = require('./GuardianService');
const ExternalApis = require('./ExternalApis');

/**
 * The Orchestrator Pattern: Triggers all emergency sub-systems in parallel/cascade.
 */
async function triggerEmergencyCascade(journeyId, userId, lat, lng) {
  let sessionId = null;
  let safePlaces = [];

  try {
    // 1. Create DB Session
    const session = await EmergencyService.createSession(journeyId, userId, lat, lng);
    sessionId = session.id;
    await EmergencyService.logAction(sessionId, 'SYSTEM', 'Session Created', 'Emergency session initialized.');

    // 2. Start Evidence Vault (Timeline started, Audio started)
    try {
      await EvidenceService.startIncident(journeyId, userId, 'SOS');
      await EmergencyService.updateSessionStatus(sessionId, { audio_started: true, timeline_started: true });
      await EmergencyService.logAction(sessionId, 'EVIDENCE', 'Evidence Vault Active', 'Tamper-proof vault started.');
    } catch (e) {
      console.error('Evidence Cascade Failed:', e);
      await EmergencyService.logAction(sessionId, 'SYSTEM', 'Evidence Failed', e.message);
    }

    // 3. Notify Guardians
    try {
      await GuardianService.notifyGuardians(userId, journeyId, 'EMERGENCY');
      await EmergencyService.updateSessionStatus(sessionId, { guardian_notified: true });
      await EmergencyService.logAction(sessionId, 'GUARDIAN', 'Guardians Notified', 'Alerts sent to all accepted guardians.');
    } catch (e) {
      console.error('Guardian Cascade Failed:', e);
      await EmergencyService.logAction(sessionId, 'SYSTEM', 'Guardian Notification Failed', e.message);
    }

    // 4. Find Safe Places
    try {
      safePlaces = await ExternalApis.getNearbySafePlaces(lat, lng, 2000);
      if (safePlaces.length > 0) {
        await EmergencyService.updateSessionStatus(sessionId, { safe_place_found: true });
        await EmergencyService.logAction(sessionId, 'LOCATION', 'Safe Places Found', `Found ${safePlaces.length} nearby safe locations.`);
      }
    } catch (e) {
      console.error('Safe Place Cascade Failed:', e);
      await EmergencyService.logAction(sessionId, 'SYSTEM', 'Safe Place Search Failed', e.message);
    }

    return { sessionId, safePlaces, success: true };
  } catch (error) {
    console.error('CRITICAL ORCHESTRATOR FAILURE:', error);
    throw error;
  }
}

module.exports = { triggerEmergencyCascade };
