const supabase = require('../utils/supabase');

/**
 * Handles database operations for journey start, end, and history.
 */

async function startJourney(userId, destinationName, destinationLat, destinationLng, transportMode) {
  // 1. Insert into journeys
  const { data: journey, error: journeyError } = await supabase
    .from('journeys')
    .insert({
      user_id: userId,
      destination_name: destinationName,
      destination_lat: destinationLat,
      destination_lng: destinationLng,
      transport_mode: transportMode || 'walking',
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (journeyError) throw journeyError;

  // 2. Insert first event ("Journey Started") into journey_events
  const { error: eventError } = await supabase
    .from('journey_events')
    .insert({
      journey_id: journey.id,
      event_type: 'STARTED',
      title: 'Journey Started',
      description: `User started journey to ${destinationName} via ${transportMode || 'walking'}.`
    });

  if (eventError) console.error('Error inserting start event:', eventError);

  return { journeyId: journey.id, status: 'ACTIVE' };
}

async function endJourney(journeyId) {
  // Update status to 'COMPLETED'
  const { data: journey, error: journeyError } = await supabase
    .from('journeys')
    .update({ status: 'COMPLETED', ended_at: new Date() })
    .eq('id', journeyId)
    .select()
    .single();

  if (journeyError) throw journeyError;

  // Insert final event
  const { error: eventError } = await supabase
    .from('journey_events')
    .insert({
      journey_id: journeyId,
      event_type: 'COMPLETED',
      title: 'Journey Ended',
      description: 'The journey has been marked as completed.'
    });
    
  if (eventError) console.error('Error inserting end event:', eventError);

  // Calculate summary (duration, average speed, total events)
  const { data: locations } = await supabase
    .from('journey_locations')
    .select('speed')
    .eq('journey_id', journeyId);
    
  const { count: totalEvents } = await supabase
    .from('journey_events')
    .select('*', { count: 'exact', head: true })
    .eq('journey_id', journeyId);

  let averageSpeed = 0;
  if (locations && locations.length > 0) {
    const speeds = locations.map(l => l.speed || 0);
    averageSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  }

  const durationMs = new Date(journey.ended_at) - new Date(journey.started_at);
  const durationMins = Math.round(durationMs / 60000);

  return { 
    journeyId,
    status: 'COMPLETED',
    summary: {
      durationMins,
      averageSpeed,
      totalEvents
    }
  };
}

async function getJourneyHistory(userId) {
  const { data, error } = await supabase
    .from('journeys')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });

  if (error) throw error;
  return data;
}

async function getLiveJourney(journeyId) {
  const { data: journey, error: journeyError } = await supabase
    .from('journeys')
    .select('*')
    .eq('id', journeyId)
    .single();
    
  if (journeyError) throw journeyError;
  
  const { data: latestLocation } = await supabase
    .from('journey_locations')
    .select('*')
    .eq('journey_id', journeyId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .single();
    
  return {
    journey,
    latestLocation
  };
}

async function updateBattery(journeyId, level, charging) {
  // For battery, we check if it's critically low and emit an event.
  if (level < 20 && !charging) {
    // Check if we already fired a battery low event recently to avoid spam
    const { data: recentEvents } = await supabase
      .from('journey_events')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('event_type', 'BATTERY_LOW')
      .order('created_at', { ascending: false })
      .limit(1);

    const shouldFire = !recentEvents || recentEvents.length === 0 || 
                      (new Date() - new Date(recentEvents[0].created_at) > 30 * 60 * 1000); // 30 min cooldown

    if (shouldFire) {
      await supabase.from('journey_events').insert({
        journey_id: journeyId,
        event_type: 'BATTERY_LOW',
        title: 'Battery Low Warning',
        description: `User's device battery is critically low (${Math.round(level)}%).`
      });
    }
  }
  return { success: true };
}

async function triggerDeviation(journeyId) {
  // Fire a deviation event
  const { error } = await supabase.from('journey_events').insert({
    journey_id: journeyId,
    event_type: 'ROUTE_DEVIATION',
    title: 'Route Deviation Detected',
    description: 'The user has deviated significantly from the planned route.'
  });

  if (error) console.error('Error triggering deviation event:', error);
  return { success: !error };
}

async function triggerEmergency(journeyId) {
  // Lock journey status to EMERGENCY
  const { error: updateError } = await supabase
    .from('journeys')
    .update({ status: 'EMERGENCY' })
    .eq('id', journeyId);

  if (updateError) throw updateError;

  // Insert SOS event
  const { error: eventError } = await supabase
    .from('journey_events')
    .insert({
      journey_id: journeyId,
      event_type: 'SOS_TRIGGERED',
      title: 'EMERGENCY: SOS TRIGGERED',
      description: 'The user has triggered an SOS alert!'
    });

  if (eventError) console.error('Error triggering SOS event:', eventError);
  return { success: true, status: 'EMERGENCY' };
}

module.exports = { 
  startJourney, 
  endJourney, 
  getJourneyHistory, 
  getLiveJourney,
  updateBattery,
  triggerDeviation,
  triggerEmergency
};
