import React, { useState, useEffect } from 'react';
import { CheckCircle, Eye, EyeOff, Minus } from 'lucide-react';
import type { RolePermissions, PermissionState } from '../../types';
import { rolePresets, MODULES, ACTIONS } from '../../lib/permissions';
import { Tooltip } from '../ui/tooltip';
import { Button } from '../ui/button';

interface PermissionMatrixProps {
  permissions: RolePermissions;
  mode?: 'readonly' | 'editable';
  onChange?: (perms: RolePermissions) => void;
  rolePreset?: string;
}

const PERMISSION_INFO: Record<PermissionState, { label: string; description: string; bgColor: string; iconColor: string }> = {
  FULL: {
    label: 'Accès complet',
    description: 'Action permise + lecture cross-scope',
    bgColor: 'bg-success',
    iconColor: 'text-white',
  },
  READ_ALL: {
    label: 'Lecture tous scopes',
    description: 'Lecture de tous les scopes',
    bgColor: 'bg-info',
    iconColor: 'text-white',
  },
  READ_OWN: {
    label: 'Lecture scope assigné',
    description: 'Lecture limitée au scope assigné',
    bgColor: 'bg-info-100',
    iconColor: 'text-stone-700',
  },
  HIDDEN: {
    label: 'Masqué',
    description: 'Fonction non accessible',
    bgColor: 'bg-stone-200',
    iconColor: 'text-stone-700',
  },
};

const STATE_CYCLE: PermissionState[] = ['FULL', 'READ_ALL', 'READ_OWN', 'HIDDEN'];

function PermissionIcon({ state }: { state: PermissionState }) {
  const iconProps = { size: 20, className: PERMISSION_INFO[state].iconColor };

  switch (state) {
    case 'FULL':
      return <CheckCircle {...iconProps} />;
    case 'READ_ALL':
      return <Eye {...iconProps} />;
    case 'READ_OWN':
      return <EyeOff {...iconProps} />;
    case 'HIDDEN':
      return <Minus {...iconProps} />;
  }
}

export function PermissionMatrix({
  permissions: initialPermissions,
  mode = 'readonly',
  onChange,
  rolePreset,
}: PermissionMatrixProps) {
  const [permissions, setPermissions] = useState<RolePermissions>(initialPermissions);

  // Load preset if provided
  useEffect(() => {
    if (rolePreset && rolePresets[rolePreset]) {
      const preset = rolePresets[rolePreset];
      setPermissions(preset);
      onChange?.(preset);
    }
  }, [rolePreset]);

  const handleCellClick = (module: string, action: string) => {
    if (mode !== 'editable') return;

    const currentState = permissions[module]?.[action] as PermissionState;
    const currentIndex = STATE_CYCLE.indexOf(currentState);
    const nextState = STATE_CYCLE[(currentIndex + 1) % STATE_CYCLE.length];

    const updated = {
      ...permissions,
      [module]: {
        ...permissions[module],
        [action]: nextState,
      },
    };

    setPermissions(updated);
    onChange?.(updated);
  };

  const handleResetPreset = () => {
    if (!rolePreset || !rolePresets[rolePreset]) return;
    const preset = rolePresets[rolePreset];
    setPermissions(preset);
    onChange?.(preset);
  };

  return (
    <div className="space-y-4">
      {mode === 'editable' && rolePreset && rolePresets[rolePreset] && (
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetPreset}
        >
          Réinitialiser au préset {rolePreset}
        </Button>
      )}

      <div className="overflow-x-auto my-6">
        <table className="w-full border-collapse border border-stone-200">
          <thead>
            <tr className="bg-stone-50">
              <th className="h4 text-stone-700 p-3 text-left border border-stone-200" />
              {ACTIONS.map((action) => (
                <th
                  key={action}
                  className="h4 text-stone-700 p-3 text-center border border-stone-200 text-sm font-semibold"
                >
                  {action}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((module, idx) => (
              <tr key={module} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                <td className="font-medium text-stone-900 p-3 border border-stone-200 w-40">
                  {module}
                </td>
                {ACTIONS.map((action) => {
                  const state = (permissions[module]?.[action] || 'HIDDEN') as PermissionState;
                  const info = PERMISSION_INFO[state];

                  return (
                    <td
                      key={`${module}-${action}`}
                      className="p-2 border border-stone-200"
                    >
                      <Tooltip content={`${info.label}: ${info.description}`}>
                        <button
                          onClick={() => handleCellClick(module, action)}
                          disabled={mode === 'readonly'}
                          className={`
                            w-12 h-12 rounded-md flex items-center justify-center
                            ${info.bgColor}
                            ${mode === 'editable' ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}
                            ${mode === 'readonly' ? 'disabled:opacity-100' : ''}
                          `}
                          title={info.label}
                        >
                          <PermissionIcon state={state} />
                        </button>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mode === 'editable' && (
        <div className="text-xs text-stone-600 pt-2">
          💡 Cliquez sur les cellules pour changer les permissions (cycle: Accès complet → Lecture tous → Lecture assigné → Masqué)
        </div>
      )}
    </div>
  );
}
