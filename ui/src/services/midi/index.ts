/**
 * MIDI Module - Index
 *
 * Web MIDI API integration for Weyl Compositor.
 * Enables MIDI controller input for real-time property control.
 */

export {
  MIDIService,
  getMIDIService,
  disposeMIDIService,
  midiNoteToName,
  noteNameToMidi,
  ccToNormalized,
  normalizedToCC,
  type MIDIDeviceInfo,
  type MIDIMessage,
  type MIDIMessageType,
  type MIDIFilter,
  type MIDIMapping,
  type MIDIEventCallback
} from './MIDIService';
