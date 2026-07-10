const supabase = require('../utils/supabase');

async function startIncident(journeyId, userId, type) {
  // 1. Update journeys to 'EMERGENCY'
  if (journeyId) {
    await supabase
      .from('journeys')
      .update({ status: 'EMERGENCY' })
      .eq('id', journeyId);
  }

  // 2. Insert into incidents
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .insert({
      journey_id: journeyId,
      user_id: userId,
      type,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (incidentError) throw incidentError;

  // 3. Insert journey_events (reusing the timeline from Feature 2)
  if (journeyId) {
    await supabase
      .from('journey_events')
      .insert({
        journey_id: journeyId,
        event_type: 'INCIDENT_STARTED',
        title: 'Emergency SOS Activated',
        description: `User activated an emergency incident of type: ${type}.`
      });
  }

  return { incidentId: incident.id, status: 'ACTIVE' };
}

async function saveEvidenceFile(incidentId, journeyId, fileType, fileUrl) {
  const { data, error } = await supabase
    .from('evidence_files')
    .insert({
      incident_id: incidentId,
      file_type: fileType,
      file_url: fileUrl
    })
    .select()
    .single();

  if (error) throw error;

  // Log to timeline
  if (journeyId) {
    await supabase
      .from('journey_events')
      .insert({
        journey_id: journeyId,
        event_type: 'EVIDENCE_UPLOADED',
        title: 'Evidence Uploaded',
        description: `A new ${fileType} was uploaded to the evidence vault.`
      });
  }

  return data;
}

async function saveIncidentLocation(incidentId, lat, lng) {
  const { data, error } = await supabase
    .from('incident_locations')
    .insert({
      incident_id: incidentId,
      latitude: lat,
      longitude: lng
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function addIncidentNote(incidentId, note, createdBy) {
  const { data, error } = await supabase
    .from('incident_notes')
    .insert({
      incident_id: incidentId,
      note,
      created_by: createdBy
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function closeIncident(incidentId, journeyId, summary) {
  const { error } = await supabase
    .from('incidents')
    .update({ status: 'CLOSED', summary, ended_at: new Date() })
    .eq('id', incidentId);

  if (error) throw error;

  if (journeyId) {
    await supabase
      .from('journey_events')
      .insert({
        journey_id: journeyId,
        event_type: 'INCIDENT_CLOSED',
        title: 'Incident Closed',
        description: summary || 'The incident was marked as closed.'
      });
  }

  return { success: true };
}

async function getIncidentData(incidentId) {
  // Master Aggregator
  const { data: incident, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('id', incidentId)
    .single();

  if (error || !incident) throw new Error('Incident not found');

  const { data: files } = await supabase.from('evidence_files').select('*').eq('incident_id', incidentId);
  const { data: locations } = await supabase.from('incident_locations').select('*').eq('incident_id', incidentId).order('captured_at', { ascending: true });
  const { data: notes } = await supabase.from('incident_notes').select('*').eq('incident_id', incidentId).order('created_at', { ascending: false });
  const { data: guardianActions } = await supabase.from('guardian_actions').select('*').eq('incident_id', incidentId).order('created_at', { ascending: false });
  
  let timeline = [];
  if (incident.journey_id) {
    const { data: events } = await supabase
      .from('journey_events')
      .select('*')
      .eq('journey_id', incident.journey_id)
      .order('created_at', { ascending: false });
    timeline = events || [];
  }

  return {
    incident,
    files: files || [],
    locations: locations || [],
    notes: notes || [],
    guardianActions: guardianActions || [],
    timeline
  };
}

async function generateReportSummary(incidentId) {
  const data = await getIncidentData(incidentId);
  
  const durationMs = data.incident.ended_at 
    ? new Date(data.incident.ended_at) - new Date(data.incident.started_at)
    : new Date() - new Date(data.incident.started_at);
  const durationMins = Math.round(durationMs / 60000);

  return {
    incidentId: data.incident.id,
    type: data.incident.type,
    status: data.incident.status,
    durationMins,
    summary: data.incident.summary,
    totalEvidenceFiles: data.files.length,
    totalLocationsTracked: data.locations.length,
    totalNotes: data.notes.length
  };
}

module.exports = {
  startIncident,
  saveEvidenceFile,
  saveIncidentLocation,
  addIncidentNote,
  closeIncident,
  getIncidentData,
  generateReportSummary
};
