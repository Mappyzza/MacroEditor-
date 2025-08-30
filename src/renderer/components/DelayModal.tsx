import React, { useState } from 'react';
import './DelayModal.css';

interface DelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (delay: number) => void;
}

const DelayModal: React.FC<DelayModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [delay, setDelay] = useState<number>(1000);
  const [customValue, setCustomValue] = useState<string>('');

  if (!isOpen) return null;

  const presetDelays = [
    { label: '0.5 seconde', value: 500 },
    { label: '1 seconde', value: 1000 },
    { label: '2 secondes', value: 2000 },
    { label: '3 secondes', value: 3000 },
    { label: '5 secondes', value: 5000 },
    { label: '10 secondes', value: 10000 },
  ];

  const handlePresetClick = (value: number) => {
    setDelay(value);
    setCustomValue('');
  };

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setDelay(numValue);
    }
  };

  const handleConfirm = () => {
    if (delay > 0) {
      onConfirm(delay);
      onClose();
      setCustomValue('');
      setDelay(1000);
    }
  };

  const handleCancel = () => {
    onClose();
    setCustomValue('');
    setDelay(1000);
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) {
      return `${ms} ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)} seconde${ms !== 1000 ? 's' : ''}`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = (ms % 60000) / 1000;
      return `${minutes} min ${seconds > 0 ? `${seconds} sec` : ''}`;
    }
  };

  return (
    <div className="delay-modal-overlay" onClick={handleCancel}>
      <div className="delay-modal" onClick={(e) => e.stopPropagation()}>
        <div className="delay-modal-header">
          <h3>⏱️ Ajouter un délai</h3>
          <button className="close-button" onClick={handleCancel}>
            ✕
          </button>
        </div>

        <div className="delay-modal-content">
          <div className="delay-section">
            <h4>Délais prédéfinis</h4>
            <div className="preset-delays">
              {presetDelays.map((preset) => (
                <button
                  key={preset.value}
                  className={`preset-button ${delay === preset.value && !customValue ? 'active' : ''}`}
                  onClick={() => handlePresetClick(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="delay-section">
            <h4>Délai personnalisé</h4>
            <div className="custom-delay">
              <input
                type="number"
                value={customValue}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="Entrez une valeur"
                min="1"
                max="3600000"
                className="delay-input"
              />
              <span className="delay-unit">millisecondes</span>
            </div>
          </div>

          <div className="delay-preview">
            <strong>Délai sélectionné : </strong>
            <span className="delay-value">{formatTime(delay)}</span>
          </div>
        </div>

        <div className="delay-modal-footer">
          <button className="btn btn-secondary" onClick={handleCancel}>
            Annuler
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={delay <= 0}
          >
            Ajouter le délai
          </button>
        </div>
      </div>
    </div>
  );
};

export default DelayModal;
