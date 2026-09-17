import type { SessionMode } from '../types';

interface Props {
  mode: SessionMode;
  onChange: (mode: SessionMode) => void;
}

export function TogglePanel({ mode, onChange }: Props) {
  const toggle = (key: keyof SessionMode) => {
    onChange({ ...mode, [key]: !mode[key] });
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-lg font-medium">Customize how this session supports you</h2>
      <p className="text-sm text-muted-foreground">
        Turn features on or off. The goal is to reach a clear state so you can take the next real step.
      </p>

      {(Object.keys(mode) as (keyof SessionMode)[]).map((key) => (
        <label key={key} className="flex items-center justify-between">
          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
          <input type="checkbox" checked={mode[key]} onChange={() => toggle(key)} />
        </label>
      ))}
    </div>
  );
}
