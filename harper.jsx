/**
 * Harper - Harmonica Position Guide
 * 
 * An interactive harmonica learning tool that shows note layouts across different
 * positions, plays notes, and helps visualize bends and overblows.
 * 
 * @author linuxcaffe
 * @license MIT
 * @repository https://github.com/linuxcaffe/Harper
 * 
 * Usage:
 *   import HarmonicaPositionGuide from './harper.jsx';
 *   
 *   function App() {
 *     return <HarmonicaPositionGuide />;
 *   }
 * 
 * Dependencies:
 *   - react (with hooks)
 *   - lucide-react (for icons)
 *   - tone (for audio synthesis)
 * 
 * MIT License
 * 
 * Copyright (c) 2024 linuxcaffe
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Music, Menu, Settings, X } from 'lucide-react';
import * as Tone from 'tone';

const HarmonicaPositionGuide = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Key and mode settings
  const [playingInKey, setPlayingInKey] = useState('G'); // The musical key we want to play in
  const [keyMode, setKeyMode] = useState('major'); // Major or minor mode
  const [selectedPosition, setSelectedPosition] = useState('2nd'); // Harmonica position (1st-5th)
  
  // UI state
  const [showKeyChooser, setShowKeyChooser] = useState(false); // Toggle key selection modal
  const [showMenu, setShowMenu] = useState(false); // Toggle position info menu
  const [showSettings, setShowSettings] = useState(false); // Toggle settings modal
  
  // User preferences
  const [darkMode, setDarkMode] = useState(true); // Dark/light theme
  const [soundEnabled, setSoundEnabled] = useState(true); // Enable/disable audio
  const [showNoteNumbers, setShowNoteNumbers] = useState(true); // Show hole numbers
  const [showBentNotes, setShowBentNotes] = useState(true); // Show bent note indicators
  const [showOverbendNotes, setShowOverbendNotes] = useState(true); // Show overblow/overdraw indicators
  
  // Refs for audio and state tracking
  const synthRef = useRef(null); // Tone.js synthesizer instance
  const previousKeyRef = useRef('G'); // Track previous key for transition sound
  const activeNotesRef = useRef({}); // Track currently playing notes

  // ============================================================================
  // CONSTANTS
  // ============================================================================
  
  // All musical keys in chromatic order
  const keys = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];
  const chromaticScale = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];
  
  // ============================================================================
  // POSITION CALCULATION
  // ============================================================================
  
  /**
   * Calculate which harmonica key to use for a given playing key and position
   * 
   * Position theory:
   * - 1st Position (Straight Harp): Play in the same key as the harmonica
   * - 2nd Position (Cross Harp): Play 5 semitones up from harp key (blues standard)
   * - 3rd Position: Play 10 semitones up (minor blues)
   * - 4th Position: Play 2 semitones up (dorian mode)
   * - 5th Position: Play 7 semitones up (minor phrygian)
   * 
   * @param {string} playingKey - The key you want to play in
   * @param {string} position - The position (1st, 2nd, 3rd, 4th, 5th)
   * @returns {string} The harmonica key to use
   */
  const getHarpKeyForPosition = (playingKey, position) => {
    const index = chromaticScale.indexOf(playingKey);
    if (index === -1) return playingKey;
    
    // Calculate the harmonica key based on position intervals
    if (position === '1st') return playingKey;
    if (position === '2nd') return chromaticScale[(index + 5) % 12];
    if (position === '3rd') return chromaticScale[(index + 10) % 12];
    if (position === '4th') return chromaticScale[(index + 2) % 12];
    if (position === '5th') return chromaticScale[(index + 7) % 12];
    return playingKey;
  };

  // Calculate the actual harmonica key needed
  const harpKey = getHarpKeyForPosition(playingInKey, selectedPosition);

  // ============================================================================
  // NOTE LAYOUT GENERATION
  // ============================================================================
  
  /**
   * Generate the note layout for a harmonica in a given key
   * 
   * A standard 10-hole diatonic harmonica has a specific pattern of intervals:
   * - Blow notes follow a major chord pattern
   * - Draw notes fill in the scale
   * 
   * @param {string} key - The harmonica key
   * @returns {object} Object with blow and draw note arrays
   */
  const getNoteLayout = (key) => {
    // Intervals (in semitones) from the root note for each hole
    const blowIntervals = [0, 4, 7, 12, 16, 19, 24, 28, 31, 36]; // Holes 1-10 blow
    const drawIntervals = [2, 7, 11, 14, 17, 21, 23, 26, 29, 33]; // Holes 1-10 draw
    
    const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keyIndex = noteSequence.findIndex(n => key.includes(n.split('#')[0]));
    const baseOctave = 3; // Starting octave
    
    /**
     * Convert semitone interval to note name and octave
     */
    const intervalsToNote = (semitones) => {
      const totalSemitones = keyIndex + semitones;
      const noteIndex = totalSemitones % 12;
      const octave = baseOctave + Math.floor(totalSemitones / 12);
      return { note: noteSequence[noteIndex], octave: octave };
    };
    
    return {
      blow: blowIntervals.map(intervalsToNote),
      draw: drawIntervals.map(intervalsToNote)
    };
  };

  const layout = getNoteLayout(harpKey);

  // ============================================================================
  // SCALE AND MUSIC THEORY
  // ============================================================================
  
  /**
   * Get intervals for different scale types
   * 
   * @param {string} type - Scale type (major, blues, minor)
   * @returns {array} Array of semitone intervals from root
   */
  const getScaleIntervals = (type) => {
    if (type === 'major') return [0, 2, 4, 5, 7, 9, 11]; // Major scale: W-W-H-W-W-W-H
    if (type === 'blues') return [0, 3, 5, 6, 7, 10]; // Blues scale: minor pentatonic + b5
    if (type === 'minor') return [0, 2, 3, 5, 7, 8, 10]; // Natural minor scale
    return [0];
  };

  /**
   * Determine which scale to use based on position and mode
   * - 1st position uses major or minor (based on user selection)
   * - 2nd position uses blues scale (standard for blues harp)
   * - Other positions use minor scales
   */
  const scaleType = useMemo(() => {
    return selectedPosition === '1st' 
      ? (keyMode === 'major' ? 'major' : 'minor')
      : selectedPosition === '2nd' ? 'blues' : 'minor';
  }, [selectedPosition, keyMode]);
    
  const scaleIntervals = useMemo(() => getScaleIntervals(scaleType), [scaleType]);

  // ============================================================================
  // BENT NOTES AND OVERBLOWS
  // ============================================================================
  
  /**
   * Calculate the bent (lowered) version of a note
   * Bending lowers the pitch by one semitone
   * 
   * @param {object} noteObj - Note object with note and octave
   * @returns {object|null} Bent note or null
   */
  const getBentNote = (noteObj) => {
    const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const cleanNote = noteObj.note.split('/')[0];
    const noteIndex = noteSequence.indexOf(cleanNote);
    if (noteIndex === -1) return null;
    const bentIndex = (noteIndex - 1 + 12) % 12;
    return { note: noteSequence[bentIndex], octave: noteObj.octave };
  };

  /**
   * Calculate the overblow/overdraw (raised) version of a note
   * Overblowing raises the pitch by one semitone
   * 
   * @param {object} noteObj - Note object with note and octave
   * @returns {object|null} Overbent note or null
   */
  const getOverbendNote = (noteObj) => {
    const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const cleanNote = noteObj.note.split('/')[0];
    const noteIndex = noteSequence.indexOf(cleanNote);
    if (noteIndex === -1) return null;
    const overbendIndex = (noteIndex + 1) % 12;
    return { note: noteSequence[overbendIndex], octave: noteObj.octave };
  };

  /**
   * Check if a hole can be bent (draw bends on holes 1-6, blow bends on holes 8-10)
   */
  const canBend = (holeIndex, isBlow) => {
    if (isBlow) {
      return holeIndex >= 7 && holeIndex <= 9; // Blow bends on holes 8-10
    } else {
      return holeIndex >= 0 && holeIndex <= 5; // Draw bends on holes 1-6
    }
  };

  /**
   * Check if a hole can be overblown/overdrawn
   * Overblows on draw reeds (holes 1-6), overdraws on blow reeds (holes 7-10)
   */
  const canOverbend = (holeIndex, isBlow) => {
    if (isBlow) {
      return holeIndex >= 6 && holeIndex <= 9; // Overdraws on holes 7-10 (blow side)
    } else {
      return holeIndex >= 0 && holeIndex <= 5; // Overblows on holes 1-6 (draw side)
    }
  };

  /**
   * Check if a note is in the current scale
   * 
   * @param {object} noteObj - Note object to check
   * @returns {boolean} True if note is in scale
   */
  const isNoteInScale = (noteObj) => {
    if (!noteObj || !noteObj.note) return false;
    const noteSequence = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const cleanKey = playingInKey.split('/')[0];
    const rootIndex = noteSequence.indexOf(cleanKey);
    if (rootIndex === -1) return false;
    const cleanNote = noteObj.note.split('/')[0];
    const noteIndex = noteSequence.indexOf(cleanNote);
    if (noteIndex === -1) return false;
    const interval = (noteIndex - rootIndex + 12) % 12;
    return scaleIntervals.includes(interval);
  };

  /**
   * Determine the visual style for a note based on what techniques are in scale
   * 
   * @param {object} noteObj - The note object
   * @param {number} holeIndex - The hole number (0-9)
   * @param {boolean} isBlow - True if blow note, false if draw
   * @returns {object} Style data with colors and bent note info
   */
  const getNoteStyle = (noteObj, holeIndex, isBlow) => {
    const normalInScale = isNoteInScale(noteObj);
    const canBendNote = showBentNotes && canBend(holeIndex, isBlow);
    const canOverbendNote = showOverbendNotes && canOverbend(holeIndex, isBlow);
    
    let bentInScale = false;
    let overbendInScale = false;
    let bentNote = null;
    let overbendNote = null;
    
    // Check if bent note is in scale
    if (canBendNote) {
      bentNote = getBentNote(noteObj);
      if (bentNote) bentInScale = isNoteInScale(bentNote);
    }
    
    // Check if overbend note is in scale
    if (canOverbendNote) {
      overbendNote = getOverbendNote(noteObj);
      if (overbendNote) overbendInScale = isNoteInScale(overbendNote);
    }
    
    // Determine color scheme based on which techniques are in scale
    // Green = normal, Orange = bent, Blue = overblow/overdraw
    return {
      style: normalInScale && bentInScale ? 'split-green-orange' :
             normalInScale && overbendInScale ? 'split-green-blue' :
             bentInScale && overbendInScale ? 'split-orange-blue' :
             normalInScale ? 'solid-green' :
             bentInScale ? 'solid-orange' :
             overbendInScale ? 'solid-blue' : 'none',
      bentNote: bentNote,
      overbendNote: overbendNote,
      normalInScale: normalInScale,
      bentInScale: bentInScale,
      overbendInScale: overbendInScale
    };
  };

  // Position definitions
  const positions = {
    '1st': '1st', '2nd': '2nd', '3rd': '3rd', '4th': '4th', '5th': '5th'
  };

  // ============================================================================
  // THEME COLORS
  // ============================================================================
  
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';

  // ============================================================================
  // AUDIO SYNTHESIS (Tone.js)
  // ============================================================================
  
  /**
   * Initialize the Tone.js synthesizer on component mount
   * Creates a polyphonic synth with harmonica-like characteristics
   */
  useEffect(() => {
    synthRef.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth', harmonicity: 2 },
      envelope: { attack: 0.08, decay: 0.15, sustain: 0.8, release: 0.4 },
      filter: { Q: 6, type: 'bandpass', rolloff: -24 },
      filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3, baseFrequency: 200, octaves: 3 }
    }).toDestination();
    
    // Add reverb for a more natural sound
    const reverb = new Tone.Reverb({ decay: 1.5, wet: 0.2 }).toDestination();
    synthRef.current.connect(reverb);
    
    // Cleanup on unmount
    return () => {
      if (synthRef.current) synthRef.current.dispose();
      reverb.dispose();
    };
  }, []);

  /**
   * Play a tone when the playing key changes
   * Provides audio feedback for key selection
   */
  useEffect(() => {
    if (previousKeyRef.current !== playingInKey && synthRef.current && soundEnabled) {
      const playKeyTone = async () => {
        await Tone.start();
        const noteToPlay = playingInKey.replace('/', '');
        synthRef.current.triggerAttackRelease(`${noteToPlay}4`, '1n');
      };
      playKeyTone();
      previousKeyRef.current = playingInKey;
    }
  }, [playingInKey, soundEnabled]);

  /**
   * Start playing a note when user presses a button
   * Handles both mouse and touch events
   */
  const startNote = async (noteObj, holeIndex, isBlow) => {
    if (!synthRef.current || !soundEnabled) return;
    await Tone.start();
    const noteKey = `${holeIndex}-${isBlow}`;
    const noteToPlay = noteObj.note.replace('/', '');
    const fullNote = `${noteToPlay}${noteObj.octave}`;
    
    // Stop any existing note on this hole
    if (activeNotesRef.current[noteKey]) {
      try { synthRef.current.triggerRelease(activeNotesRef.current[noteKey]); } catch (e) {}
      delete activeNotesRef.current[noteKey];
    }
    
    // Start the new note
    try {
      synthRef.current.triggerAttack(fullNote);
      activeNotesRef.current[noteKey] = fullNote;
    } catch (e) {}
  };

  /**
   * Stop playing a note when user releases a button
   */
  const stopNote = (noteObj, holeIndex, isBlow) => {
    if (!synthRef.current) return;
    const noteKey = `${holeIndex}-${isBlow}`;
    const storedNote = activeNotesRef.current[noteKey];
    if (storedNote) {
      try { synthRef.current.triggerRelease(storedNote); } catch (e) {}
      delete activeNotesRef.current[noteKey];
    }
  };

  /**
   * Global event handlers to stop all notes when user releases mouse/touch anywhere
   * Prevents stuck notes
   */
  useEffect(() => {
    const handleGlobalUp = () => {
      Object.entries(activeNotesRef.current).forEach(([key, fullNote]) => {
        try { if (synthRef.current) synthRef.current.triggerRelease(fullNote); } catch (e) {}
      });
      activeNotesRef.current = {};
    };

    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    window.addEventListener('touchcancel', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
      window.removeEventListener('touchcancel', handleGlobalUp);
    };
  }, []);

  /**
   * Stop all notes when sound is disabled
   */
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        try { synthRef.current.releaseAll(); } catch (e) {}
      }
      activeNotesRef.current = {};
    };
  }, [soundEnabled]);

  /**
   * Stop all notes when key or position changes
   */
  useEffect(() => {
    if (synthRef.current) {
      try { synthRef.current.releaseAll(); } catch (e) {}
    }
    activeNotesRef.current = {};
  }, [playingInKey, selectedPosition]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className={`min-h-screen ${bgColor} transition-colors`}>
      {/* Header */}
      <div className={`${cardBg} shadow-lg border-b ${borderColor}`}>
        <div className="flex items-center justify-between px-3 py-2">
          <button onClick={() => setShowMenu(!showMenu)} className={`p-1.5 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 ${textPrimary}`}>
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Music className={`w-3.5 h-3.5 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
            <h1 className={`text-xs font-semibold ${textPrimary}`}>Harmonica Position Guide</h1>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-1.5 rounded-lg hover:bg-opacity-10 hover:bg-gray-500 ${textPrimary}`}>
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-lg p-6 shadow-xl max-w-md w-full mx-4 border ${borderColor}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-bold ${textPrimary}`}>Settings</h2>
              <button onClick={() => setShowSettings(false)} className={textSecondary}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className={textPrimary}>Dark Mode</span>
                <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {/* Sound Toggle */}
              <div className="flex items-center justify-between">
                <span className={textPrimary}>Sound</span>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-12 h-6 rounded-full transition-colors ${soundEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${soundEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {/* Show Note Numbers Toggle */}
              <div className="flex items-center justify-between">
                <span className={textPrimary}>Show Note Numbers</span>
                <button onClick={() => setShowNoteNumbers(!showNoteNumbers)} className={`w-12 h-6 rounded-full transition-colors ${showNoteNumbers ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${showNoteNumbers ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {/* Show Bent Notes Toggle */}
              <div className="flex items-center justify-between">
                <span className={textPrimary}>Show Bent Notes</span>
                <button onClick={() => setShowBentNotes(!showBentNotes)} className={`w-12 h-6 rounded-full transition-colors ${showBentNotes ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${showBentNotes ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              {/* Show Overblows/Overdraws Toggle */}
              <div className="flex items-center justify-between">
                <span className={textPrimary}>Show Overblows/Overdraws</span>
                <button onClick={() => setShowOverbendNotes(!showOverbendNotes)} className={`w-12 h-6 rounded-full transition-colors ${showOverbendNotes ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${showOverbendNotes ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Position Info Menu */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${cardBg} rounded-lg p-6 shadow-xl max-w-2xl w-full mx-4 border ${borderColor}`}>
            <div className="flex justify-between items-start mb-4">
              <h2 className={`text-xl font-bold ${textPrimary}`}>Position Quick Reference</h2>
              <button onClick={() => setShowMenu(false)} className={textSecondary}><X className="w-5 h-5" /></button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50'}`}>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>1st Position</h3>
                <p className={`text-sm ${textSecondary}`}>Same key as harp. Folk, country.</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-green-900 bg-opacity-30' : 'bg-green-50'}`}>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-green-300' : 'text-green-900'}`}>2nd Position</h3>
                <p className={`text-sm ${textSecondary}`}>BLUES STANDARD!</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-purple-900 bg-opacity-30' : 'bg-purple-50'}`}>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-purple-300' : 'text-purple-900'}`}>3rd Position</h3>
                <p className={`text-sm ${textSecondary}`}>Minor blues, jazz.</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-orange-900 bg-opacity-30' : 'bg-orange-50'}`}>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-orange-300' : 'text-orange-900'}`}>4th Position</h3>
                <p className={`text-sm ${textSecondary}`}>Dorian mode.</p>
              </div>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-pink-900 bg-opacity-30' : 'bg-pink-50'}`}>
                <h3 className={`font-bold mb-2 ${darkMode ? 'text-pink-300' : 'text-pink-900'}`}>5th Position</h3>
                <p className={`text-sm ${textSecondary}`}>Advanced minor.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6 max-w-4xl mx-auto">
        {/* Key Display and Mode Toggle */}
        <div className="text-center mb-8 mt-4 flex items-center justify-center gap-4">
          <button onClick={() => setShowKeyChooser(!showKeyChooser)} className={`text-7xl font-bold ${textPrimary} hover:opacity-80 transition-opacity`}>
            {playingInKey}
          </button>
          <button onClick={() => setKeyMode(keyMode === 'major' ? 'minor' : 'major')} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
            {keyMode === 'major' ? 'Major' : 'Minor'}
          </button>
        </div>

        {/* Key Chooser Modal */}
        {showKeyChooser && (
          <div className={`${cardBg} rounded-lg p-6 shadow-xl mb-6 border ${borderColor}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${textPrimary}`}>Choose Key</h3>
              <button onClick={() => setShowKeyChooser(false)} className={textSecondary}><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2 justify-center mb-4">
              <button onClick={() => setKeyMode('major')} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${keyMode === 'major' ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Major</button>
              <button onClick={() => setKeyMode('minor')} className={`px-6 py-2 rounded-lg font-semibold transition-colors ${keyMode === 'minor' ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Minor</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {keys.map(key => (
                <button key={key} onClick={() => { setPlayingInKey(key); setShowKeyChooser(false); }} className={`py-3 px-2 rounded-lg font-bold text-lg transition-colors ${playingInKey === key ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{key}</button>
              ))}
            </div>
          </div>
        )}

        {/* Position Selector - Shows which harmonica to use for each position */}
        <div className="flex gap-2 justify-center mb-6 flex-wrap">
          {Object.entries(positions).map(([key, label]) => {
            const harpForThisPos = getHarpKeyForPosition(playingInKey, key);
            return (
              <button key={key} onClick={() => setSelectedPosition(key)} className={`px-4 py-2 rounded-lg font-semibold transition-colors ${selectedPosition === key ? 'bg-indigo-600 text-white' : darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <div className="text-xs opacity-75 mb-0.5">{label}</div>
                <div className="text-lg">{harpForThisPos}</div>
              </button>
            );
          })}
        </div>

        {/* Color Legend */}
        <div className="mb-4 flex items-center justify-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span className={textSecondary}>Normal</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-500 rounded"></div><span className={textSecondary}>Bent</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-500 rounded"></div><span className={textSecondary}>Overblow</span></div>
          <div className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div><span className={textSecondary}>Out</span></div>
        </div>

        {/* Harmonica Layout */}
        <div className="space-y-6">
          {/* Blow Notes */}
          <div>
            <div className={`text-sm font-semibold ${textSecondary} mb-3 flex items-center gap-2`}>
              <span className={`px-3 py-1 rounded ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>BLOW ↓</span>
            </div>
            <div className="flex gap-1">
              {layout.blow.map((noteObj, idx) => {
                const styleData = getNoteStyle(noteObj, idx, true);
                const style = styleData.style;
                
                // Determine background color based on style
                let bgClass = style === 'solid-green' ? 'bg-green-500 text-white' : 
                             style === 'solid-orange' ? 'bg-orange-500 text-white' : 
                             style === 'solid-blue' ? 'bg-blue-500 text-white' : 
                             style === 'split-green-orange' ? 'bg-gradient-to-b from-green-500 from-50% to-orange-500 to-50% text-white' : 
                             style === 'split-green-blue' ? 'bg-gradient-to-b from-blue-500 from-30% via-green-500 via-70% to-green-500 to-100% text-white' : 
                             style === 'split-orange-blue' ? 'bg-gradient-to-b from-blue-500 from-30% via-orange-500 via-70% to-orange-500 to-100% text-white' : 
                             darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600';
                
                const showSplitLabels = style.includes('split');
                
                return (
                  <div key={`blow-${idx}`} className="flex-1 text-center flex flex-col">
                    <button 
                      onMouseDown={() => startNote(noteObj, idx, true)} 
                      onMouseUp={() => stopNote(noteObj, idx, true)} 
                      onMouseLeave={() => stopNote(noteObj, idx, true)} 
                      onTouchStart={(e) => { e.preventDefault(); startNote(noteObj, idx, true); }} 
                      onTouchEnd={(e) => { e.preventDefault(); stopNote(noteObj, idx, true); }} 
                      className={`w-full py-4 rounded-t-lg font-bold text-lg transition-all hover:brightness-110 active:brightness-90 select-none flex flex-col justify-between ${bgClass}`}
                    >
                      {showSplitLabels ? (
                        <>
                          <div className="text-sm">{style === 'split-green-blue' ? (styleData.overbendNote?.note || '') : (styleData.normalInScale ? noteObj.note : (style === 'split-orange-blue' ? (styleData.overbendNote?.note || '') : ''))}</div>
                          <div className="text-sm mt-auto">{style === 'split-green-orange' ? (styleData.bentNote?.note || '') : (style === 'split-green-blue' ? noteObj.note : (styleData.bentNote?.note || ''))}</div>
                        </>
                      ) : (
                        <div className="text-lg my-auto">{noteObj.note}</div>
                      )}
                    </button>
                    {showNoteNumbers && (
                      <div className={`py-1 text-xs font-semibold rounded-b-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-700 text-white'}`}>{idx + 1}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Draw Notes */}
          <div>
            <div className={`text-sm font-semibold ${textSecondary} mb-3 flex items-center gap-2`}>
              <span className={`px-3 py-1 rounded ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>DRAW ↑</span>
            </div>
            <div className="flex gap-1">
              {layout.draw.map((noteObj, idx) => {
                const styleData = getNoteStyle(noteObj, idx, false);
                const style = styleData.style;
                
                // Determine background color based on style
                let bgClass = style === 'solid-green' ? 'bg-green-500 text-white' : 
                             style === 'solid-orange' ? 'bg-orange-500 text-white' : 
                             style === 'solid-blue' ? 'bg-blue-500 text-white' : 
                             style === 'split-green-orange' ? 'bg-gradient-to-b from-green-500 from-50% to-orange-500 to-50% text-white' : 
                             style === 'split-green-blue' ? 'bg-gradient-to-b from-blue-500 from-30% via-green-500 via-70% to-green-500 to-100% text-white' : 
                             style === 'split-orange-blue' ? 'bg-gradient-to-b from-blue-500 from-30% via-orange-500 via-70% to-orange-500 to-100% text-white' : 
                             darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-300 text-gray-600';
                
                const showSplitLabels = style.includes('split');
                
                return (
                  <div key={`draw-${idx}`} className="flex-1 text-center flex flex-col">
                    <button 
                      onMouseDown={() => startNote(noteObj, idx, false)} 
                      onMouseUp={() => stopNote(noteObj, idx, false)} 
                      onMouseLeave={() => stopNote(noteObj, idx, false)} 
                      onTouchStart={(e) => { e.preventDefault(); startNote(noteObj, idx, false); }} 
                      onTouchEnd={(e) => { e.preventDefault(); stopNote(noteObj, idx, false); }} 
                      className={`w-full py-4 rounded-t-lg font-bold text-lg transition-all hover:brightness-110 active:brightness-90 select-none flex flex-col justify-between ${bgClass}`}
                    >
                      {showSplitLabels ? (
                        <>
                          <div className="text-sm">{style === 'split-green-blue' ? (styleData.overbendNote?.note || '') : (styleData.normalInScale ? noteObj.note : (style === 'split-orange-blue' ? (styleData.overbendNote?.note || '') : ''))}</div>
                          <div className="text-sm mt-auto">{style === 'split-green-orange' ? (styleData.bentNote?.note || '') : (style === 'split-green-blue' ? noteObj.note : (styleData.bentNote?.note || ''))}</div>
                        </>
                      ) : (
                        <div className="text-lg my-auto">{noteObj.note}</div>
                      )}
                    </button>
                    {showNoteNumbers && (
                      <div className={`py-1 text-xs font-semibold rounded-b-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-700 text-white'}`}>{idx + 1}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HarmonicaPositionGuide;