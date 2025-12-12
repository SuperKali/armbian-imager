import { Check } from 'lucide-react';
import armbianLogo from '../assets/armbian-logo.png';
import type { BoardInfo, ImageInfo, BlockDevice } from '../types';
import type { Manufacturer } from './ManufacturerModal';

interface HeaderProps {
  selectedManufacturer?: Manufacturer | null;
  selectedBoard?: BoardInfo | null;
  selectedImage?: ImageInfo | null;
  selectedDevice?: BlockDevice | null;
}

export function Header({
  selectedManufacturer,
  selectedBoard,
  selectedImage,
  selectedDevice,
}: HeaderProps) {
  const isCustomImage = selectedImage?.is_custom;

  // For custom images, show different steps
  const steps = isCustomImage
    ? [
        { label: 'Image', completed: !!selectedImage },
        { label: 'Storage', completed: !!selectedDevice },
      ]
    : [
        { label: 'Manufacturer', completed: !!selectedManufacturer },
        { label: 'Board', completed: !!selectedBoard },
        { label: 'OS', completed: !!selectedImage },
        { label: 'Storage', completed: !!selectedDevice },
      ];

  return (
    <header className="header">
      <div className="header-left">
        <img src={armbianLogo} alt="Armbian" className="logo-main" />
      </div>
      <div className="header-steps">
        {steps.map((step, index) => (
          <div key={step.label} className={`header-step ${step.completed ? 'completed' : ''}`}>
            <span className="header-step-indicator">
              {step.completed ? <Check size={14} /> : (index + 1)}
            </span>
            <span className="header-step-label">{step.label}</span>
          </div>
        ))}
      </div>
    </header>
  );
}
