const supabase = require('../utils/supabase');
const WeatherAlertService = require('./WeatherAlertService');
const CommunityAlertService = require('./CommunityAlertService');
const GeminiSummaryService = require('./GeminiSummaryService');

async function evaluateRoute(journeyId, userId, lat, lng) {
  try {
    // 1. Fetch active alerts from services
    const weatherAlert = await WeatherAlertService.checkWeather(lat, lng);
    const communityAlerts = await CommunityAlertService.checkCommunityReports(lat, lng);

    let newAlerts = [...communityAlerts];
    if (weatherAlert) newAlerts.push(weatherAlert);

    // 2. Insert new alerts into DB for Realtime sync
    if (newAlerts.length > 0) {
      const recordsToInsert = newAlerts.map(alert => ({
        journey_id: journeyId,
        user_id: userId,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        recommendation: alert.recommendation
      }));

      const { error } = await supabase.from('alerts').insert(recordsToInsert);
      if (error) console.error('Failed to insert alerts into DB:', error);
    }

    // 3. Generate AI Summary using ALL unread alerts for this journey
    // Fetch all active unread alerts from the DB so Gemini has full context
    const { data: activeDbAlerts } = await supabase
      .from('alerts')
      .select('title, message, severity, type')
      .eq('journey_id', journeyId)
      .eq('is_read', false);

    const aiSummary = await GeminiSummaryService.generateRouteSummary(activeDbAlerts || []);

    return {
      newAlerts,
      aiSummary
    };
  } catch (error) {
    console.error('AlertEngine Error:', error);
    throw error;
  }
}

module.exports = { evaluateRoute };
