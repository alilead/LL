import React, { useState } from 'react';
import { Button } from './Button';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import { Input } from './Input';
import { Pipette, Palette } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const presetColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#6B7280', '#1E40AF', '#B91C1C', '#047857',
    '#D97706', '#7C3AED', '#BE185D', '#374151', '#000000', '#FFFFFF'
  ];

  const handleColorSelect = (color: string) => {
    onChange(color);
    setInputValue(color);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Basic validation for hex colors
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
      onChange(newValue);
    }
  };

  const handleInputBlur = () => {
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(inputValue)) {
      setInputValue(value);
    }
  };

  const handleEyeDropper = async () => {
    try {
      // @ts-ignore - EyeDropper API is experimental
      if (!window.EyeDropper) {
        alert('EyeDropper API is not supported in your browser');
        return;
      }

      // @ts-ignore
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      handleColorSelect(result.sRGBHex);
    } catch (error) {
      console.error('EyeDropper failed:', error);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-10 h-10 p-0 border-2"
            style={{ backgroundColor: value, borderColor: 'rgba(0,0,0,0.2)' }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="space-y-4">
            <div className="grid grid-cols-8 gap-1">
              {presetColors.map((color) => (
                <button
                  key={color}
                  className="w-6 h-6 rounded border-2 hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: color,
                    borderColor: color === '#FFFFFF' ? '#E5E7EB' : 'transparent'
                  }}
                  onClick={() => handleColorSelect(color)}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                placeholder="#000000"
                className="flex-1 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEyeDropper}
                title="Pick color from screen"
              >
                <Pipette className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        placeholder="#000000"
        className="w-24 font-mono text-sm"
      />
    </div>
  );
};

export { ColorPicker };