// Fichier obsolète - utilisez simpleActions.ts à la place
export interface ActionPayload {
  type: 'click' | 'keypress' | 'type' | 'wait' | 'move' | 'scroll';
  coordinates?: { x: number; y: number };
  value?: string;
  delay?: number;
  button?: 'left' | 'right';
  clickCount?: number;
}

export class RealActions {
  static async executeAction(payload: ActionPayload): Promise<void> {
    console.log('Fichier obsolète - utilisez SimpleActions');
  }
}