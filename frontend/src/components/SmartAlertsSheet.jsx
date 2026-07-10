import React, { useState } from 'react';
import axios from 'axios';
import { useAppStore } from '../store/useAppStore';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime';

export default function SmartAlertsSheet() {
  const { activeAlerts, aiSummary, addAlert, activeJourneyId } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // Listen for new alerts in real-time
  useSupabaseRealtime('alerts', (newAlert) => {
    addAlert({
      id: newAlert.id,
      type: newAlert.type,
      severity: newAlert.severity,
      title: newAlert.type, // Fallback if no specific title
      message: newAlert.message || 'New alert triggered on route.',
      recommendation: 'Check map for details.'
    });
  }, 'journey_id', activeJourneyId);

  const getBorderColor = (severity) => {
    switch (severity) {
      case 'LOW': return 'border-green-500';
      case 'MEDIUM': return 'border-yellow-500';
      case 'HIGH': return 'border-orange-500';
      case 'CRITICAL': return 'border-red-500';
      default: return 'border-blue-500';
    }
  };

  return (
    <div 
      className={`absolute left-4 right-4 z-[1000] bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col transition-all duration-300 ease-in-out
        ${isExpanded ? 'h-[50vh] bottom-20' : 'h-16 bottom-20'}
        md:bottom-8 md:right-8 md:left-auto md:w-80 md:h-auto md:max-h-[60vh] md:rounded-xl`}
    >
      {/* Mobile Drag Handle */}
      <div className="flex justify-center pt-2 pb-1 md:hidden cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="w-12 h-1.5 bg-gray-600 rounded-full"></div>
      </div>

      {/* Header */}
      <div 
        className="px-4 py-2 border-b border-gray-700/50 flex items-center justify-between bg-gray-900/40 cursor-pointer md:cursor-default"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center">
          <span className="text-lg mr-2 animate-pulse">✨</span>
          <h3 className="font-bold text-white tracking-wide text-sm">Route Intelligence</h3>
        </div>
        <div className="md:hidden text-gray-400">
          {isExpanded ? '↓' : '↑'}
        </div>
      </div>

      {/* Content - Hidden on mobile when collapsed, always visible on desktop */}
      <div className={`overflow-y-auto p-4 space-y-4 ${!isExpanded ? 'hidden md:block' : 'block'}`}>
        {/* AI Summary Box */}
        {aiSummary && (
          <div className="bg-blue-900/30 border border-blue-500/50 p-3 rounded-xl shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/20 blur-xl rounded-full translate-x-4 -translate-y-4"></div>
            <p className="text-sm text-blue-100 leading-relaxed relative z-10">{aiSummary}</p>
          </div>
        )}

        {/* Alert Cards */}
        <div className="space-y-3">
          {activeAlerts.map((alert, idx) => (
            <div 
              key={idx} 
              className={`bg-gray-900/70 p-3 rounded-r-xl border-l-4 ${getBorderColor(alert.severity)} border-y border-r border-gray-700/50 shadow-md`}
            >
              <h4 className="font-bold text-white text-sm mb-1">{alert.title}</h4>
              <p className="text-xs text-gray-300 mb-2">{alert.message}</p>
              <div className="bg-black/30 rounded p-1.5 inline-block">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Action: </span>
                <span className="text-[10px] text-indigo-300 font-semibold">{alert.recommendation}</span>
              </div>
            </div>
          ))}
          {activeAlerts.length === 0 && (
            <div className="text-center p-4">
              <p className="text-gray-400 text-sm">No active alerts on your route.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
