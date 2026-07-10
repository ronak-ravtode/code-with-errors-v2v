import { create } from 'zustand';

export const useAppStore = create((set) => ({
  // User State
  currentLocation: { lat: 22.307, lng: 73.181 }, // Default fallback
  activeJourneyId: 'demo-journey-123',
  
  // Emergency State
  isEmergencyActive: false,
  emergencyChecklist: {
    guardianNotified: false,
    audioStarted: false,
    locationShared: false,
    safePlaceFound: false
  },
  
  // Guardian State
  guardianTimeline: [
    { id: 1, title: 'Journey Started', time: '10:00 AM' },
    { id: 2, title: 'Deviated from path', time: '10:15 AM' }
  ],
  guardianEmergencyState: null, // Holds session data if emergency

  // Smart Alerts State
  activeAlerts: [
    { id: 1, type: 'WEATHER', severity: 'LOW', title: 'Light Rain Expected', message: 'Carry an umbrella just in case.', recommendation: 'Proceed with caution' },
    { id: 2, type: 'CROWD', severity: 'MEDIUM', title: 'Festival Nearby', message: 'Heavy crowds reported near Main St.', recommendation: 'Stay aware of surroundings' }
  ],
  aiSummary: "Your route looks mostly clear, but there are some minor crowds ahead. Stay aware.",

  // Actions
  setCurrentLocation: (loc) => set({ currentLocation: loc }),
  setActiveJourney: (id) => set({ activeJourneyId: id }),
  triggerEmergency: () => set({ isEmergencyActive: true }),
  updateChecklist: (key) => set((state) => ({ 
    emergencyChecklist: { ...state.emergencyChecklist, [key]: true } 
  })),
  resetEmergency: () => set({ 
    isEmergencyActive: false, 
    emergencyChecklist: { 
      guardianNotified: false, 
      audioStarted: false, 
      locationShared: false, 
      safePlaceFound: false 
    } 
  }),

  // New Actions for Guardian & Alerts
  addTimelineEvent: (event) => set((state) => ({
    guardianTimeline: [...state.guardianTimeline, event]
  })),
  setGuardianEmergency: (session) => set({ guardianEmergencyState: session }),
  addAlert: (alert) => set((state) => ({
    activeAlerts: [alert, ...state.activeAlerts]
  })),
  setAiSummary: (summary) => set({ aiSummary: summary })
}));
