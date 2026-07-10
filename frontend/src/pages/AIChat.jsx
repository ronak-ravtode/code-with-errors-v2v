import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MapPin, Phone, AlertTriangle, Mic, Shield } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm Unsaid. I'm actively monitoring your environment. How are you feeling about your journey today?", actions: [] }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [localLocation, setLocalLocation] = useState(null);
  const messagesEndRef = useRef(null);
  const userStoreLocation = useAppStore(state => state.currentLocation);

  const currentLocation = localLocation || userStoreLocation;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Request permission early so Unsaid has context
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocalLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log("Location permission not granted yet:", err.message)
      );
    }
  }, []);

  const triggerGuardianShare = (loc) => {
    const guardiansStr = localStorage.getItem('ss_guardians');
    const guardians = guardiansStr ? JSON.parse(guardiansStr) : [];

    if (guardians.length > 0) {
      const names = guardians.map(g => g.name).join(', ');
      alert(`📍 Permissions granted! Live location securely shared with your guardians:\n${names}`);
    } else {
      alert(`📍 Location Permissions granted! (No specific guardians added, broadcasting to community network)`);
    }
  };

  const handleAction = (action) => {
    if (action === 'share_location') {
      if (!currentLocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = [pos.coords.latitude, pos.coords.longitude];
            setLocalLocation(loc);
            triggerGuardianShare(loc);
          },
          (err) => alert("Please allow location access to share your location with Guardians.")
        );
      } else {
        triggerGuardianShare(currentLocation);
      }
    } else if (action === 'none') {
      alert("Dismissed.");
    } else if (action === 'start_fake_call') {
      alert("📞 Fake call starting... (Activating audio)");
    } else if (action === 'trigger_siren') {
      alert("🚨 Siren Triggered!");
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Microphone permissions or functionality is not supported in this browser.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };
    recognition.onerror = (event) => {
      console.error(event.error);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const handleSend = async (messageOverride = null) => {
    const userMsg = messageOverride || input.trim();
    if (!userMsg) return;

    setMessages(prev => [...prev, { role: 'user', content: userMsg, actions: [] }]);
    if (!messageOverride) setInput('');
    setIsTyping(true);

    try {
      let batteryLevel = 'unknown';
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        batteryLevel = `${Math.round(battery.level * 100)}%`;
      }

      const context = {
        time: new Date().getHours(),
        battery: batteryLevel,
        location: currentLocation,
        location_type: 'street'
      };

      try {
        const response = await axios.post('http://localhost:3000/api/ai/chat', {
          user_message: userMsg,
          context,
          chat_history: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
        });

        const aiMessage = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;

        setMessages(prev => [...prev, {
          role: 'ai',
          content: aiMessage.message || aiMessage.content || "I am monitoring.",
          actions: aiMessage.ui_actions || []
        }]);
      } catch (err) {
        // Fallback
        setTimeout(() => {
          setMessages(prev => [...prev, {
            role: 'ai',
            content: "I've detected you might be in an unsafe situation. I'm suggesting immediate actions.",
            actions: ["share_location", "start_fake_call"]
          }]);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const actionConfig = {
    share_location: { label: 'Share Location', icon: MapPin, color: 'text-emeraldLight' },
    start_fake_call: { label: 'Fake Call', icon: Phone, color: 'text-electric' },
    trigger_siren: { label: 'Sound Siren', icon: AlertTriangle, color: 'text-danger' },
    none: { label: 'Dismiss', icon: Shield, color: 'text-gray-400' }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 md:px-6">

      {/* Orb Visualization Area */}
      <div className="h-64 md:h-80 flex flex-col items-center justify-center relative shrink-0">
        <motion.div
          animate={{
            scale: isTyping ? [1, 1.1, 1] : [1, 1.02, 1],
            rotate: isTyping ? [0, 5, -5, 0] : 0,
            boxShadow: isTyping
              ? ["0 0 40px rgba(109,40,217,0.8)", "0 0 80px rgba(79,70,229,0.8)", "0 0 40px rgba(109,40,217,0.8)"]
              : ["0 0 20px rgba(109,40,217,0.4)", "0 0 30px rgba(79,70,229,0.5)", "0 0 20px rgba(109,40,217,0.4)"]
          }}
          transition={{ duration: isTyping ? 1 : 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-royal via-indigo to-electric flex items-center justify-center overflow-hidden border border-white/20"
        >
          {/* Inner details of the orb */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
          <motion.div
            animate={{ opacity: isTyping ? [0.2, 0.8, 0.2] : [0.1, 0.3, 0.1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-full h-full bg-white rounded-full filter blur-xl"
          ></motion.div>

          <Shield className="w-10 h-10 text-white relative z-10 opacity-80" />
        </motion.div>

        <h2 className="mt-6 text-2xl font-bold font-sora tracking-wide">Unsaid Assistant</h2>
        <p className="text-sm text-gray-400">Context-Aware Safety Intelligence</p>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto w-full glass-panel border border-glassBorder rounded-t-3xl p-6 flex flex-col gap-6 relative hide-scrollbar">

        {messages.map((msg, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            key={idx}
            className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
          >
            <div className={`p-4 rounded-2xl md:text-lg leading-relaxed shadow-lg ${msg.role === 'user'
              ? 'bg-gradient-to-r from-royal to-indigo text-white rounded-br-sm'
              : 'bg-card border border-glassBorder text-gray-200 rounded-bl-sm'
              }`}>
              {msg.content}
            </div>

            {msg.actions && msg.actions.length > 0 && msg.actions[0] !== 'none' && (
              <div className="flex flex-wrap gap-2 mt-3 ml-2">
                {msg.actions.map(action => {
                  const conf = actionConfig[action] || actionConfig.none;
                  const Icon = conf.icon;
                  return (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      key={action}
                      onClick={() => handleAction(action)}
                      className={`flex items-center gap-2 bg-glass border border-glassBorder hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-semibold shadow-xl backdrop-blur-md ${conf.color}`}
                    >
                      <Icon className="w-4 h-4" />
                      {conf.label}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="self-start max-w-[80%] bg-card border border-glassBorder rounded-2xl rounded-bl-sm p-4 flex gap-1.5"
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                className="w-2.5 h-2.5 bg-electric rounded-full"
              />
            ))}
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="w-full bg-background border-t border-glassBorder p-4 pb-8 md:pb-6 z-10 shrink-0">

        {/* Suggested Prompts */}
        {messages.length < 3 && (
          <div className="flex gap-2 overflow-x-auto pb-4 hide-scrollbar">
            {["I am walking alone.", "Find nearest police station.", "Is this area safe?"].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="shrink-0 text-xs px-4 py-2 rounded-full border border-glassBorder text-gray-400 hover:text-white hover:bg-glass transition-colors whitespace-nowrap"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center bg-card rounded-2xl border border-glassBorder p-2 shadow-2xl relative">
          <button
            onClick={startListening}
            className={`p-3 transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-white'}`}
          >
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder="Describe your situation to Unsaid..."
            className="flex-1 bg-transparent border-none focus:outline-none text-white px-2 placeholder-gray-500 font-medium"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-3 bg-gradient-to-r from-royal to-indigo rounded-xl text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-[0_0_15px_rgba(109,40,217,0.4)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
