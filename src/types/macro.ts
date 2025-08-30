export interface MacroAction {
  id: string;
  type: 'click' | 'keypress' | 'wait' | 'type' | 'move' | 'scroll';
  target?: string;
  value?: string | number;
  coordinates?: { x: number; y: number };
  delay?: number;
  description?: string;
}

export interface Macro {
  id: string;
  name: string;
  description?: string;
  actions: MacroAction[];
  createdAt: Date;
  modifiedAt: Date;
  version: string;
}

export interface MacroProject {
  id: string;
  name: string;
  description?: string;
  macros: Macro[];
  createdAt: Date;
  modifiedAt: Date;
  filePath?: string;
}

export interface MacroExecutionContext {
  isRunning: boolean;
  currentActionIndex: number;
  pauseRequested: boolean;
  stopRequested: boolean;
}

export interface MacroRecordingContext {
  isRecording: boolean;
  recordedActions: MacroAction[];
  startTime: Date;
}

export type ActionType = MacroAction['type'];

export interface ActionTypeConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
  fields: ActionField[];
}

export interface ActionField {
  name: string;
  type: 'text' | 'number' | 'select' | 'coordinates' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}
