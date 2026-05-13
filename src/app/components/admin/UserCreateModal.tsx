import React, { useState } from 'react';
import { ChevronRight, Mail, Shield, CheckCircle } from 'lucide-react';
import type { User, Role } from '../../types';
import { ROLE_LABEL, ROLE_SHORT } from '../../types';
import { usePermissions } from '../../lib/permissions-context';
import { useToast } from '../../lib/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { PermissionMatrix } from './PermissionMatrix';

interface UserCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserCreated?: (user: User) => void;
}

const FUNCTIONS = ['Médecin', 'Infirmier', 'Gestionnaire', 'Analyste', 'Autre'];

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Accès complet à tous les modules et paramètres système',
  gestionnaire_national: 'Gestion des opérations au niveau national',
  gestionnaire_provincial: 'Gestion des opérations au niveau provincial',
  superviseur_district: 'Supervision des activités au niveau district',
  agent_terrain: 'Terrain – collecte de données',
  analyste: 'Analyse et rapports – accès lecture seule',
};

interface FormData {
  name: string;
  email: string;
  phone: string;
  function: string;
  role: Role | '';
  scopes: string[];
  mfaEnabled: boolean;
  sendInvitation: boolean;
  forceMFA: boolean;
}

export function UserCreateModal({ open, onOpenChange, onUserCreated }: UserCreateModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    function: '',
    role: '',
    scopes: [],
    mfaEnabled: false,
    sendInvitation: true,
    forceMFA: false,
  });

  const { createUser } = usePermissions();
  const { addToast } = useToast();

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email) {
        addToast({
          type: 'warning',
          title: 'Champs requis',
          description: 'Veuillez remplir le nom et l\'email.',
        });
        return;
      }
      if (!formData.email.includes('@')) {
        addToast({
          type: 'warning',
          title: 'Email invalide',
          description: 'Veuillez entrer une adresse email valide.',
        });
        return;
      }
    } else if (step === 2) {
      if (!formData.role) {
        addToast({
          type: 'warning',
          title: 'Rôle requis',
          description: 'Veuillez sélectionner un rôle.',
        });
        return;
      }
    } else if (step === 3) {
      if (formData.role !== 'admin' && formData.role !== 'gestionnaire_national' && formData.scopes.length === 0) {
        addToast({
          type: 'warning',
          title: 'Scope requis',
          description: 'Veuillez sélectionner au moins un scope.',
        });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleCreate = () => {
    const newUser = createUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      function: formData.function || undefined,
      role: formData.role as Role,
      scopeIds: formData.scopes,
      avatar: null,
      status: 'pending_activation',
      mfaEnabled: formData.mfaEnabled || formData.forceMFA,
      lastLoginAt: null,
      createdBy: 'current-user', // In real app, use currentUser.id
    });

    addToast({
      type: 'success',
      title: 'Utilisateur créé',
      description: `${formData.name} a été ajouté avec succès.`,
    });

    onUserCreated?.(newUser);
    onOpenChange(false);
    setStep(1);
    setFormData({
      name: '',
      email: '',
      phone: '',
      function: '',
      role: '',
      scopes: [],
      mfaEnabled: false,
      sendInvitation: true,
      forceMFA: false,
    });
  };

  const isAdmin = formData.role === 'admin';
  const isGN = formData.role === 'gestionnaire_national';
  const scopeReadonly = isAdmin || isGN;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <div className="flex gap-1 mt-4">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-stone-200'}`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-6">
          {/* Étape 1: Informations */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Informations personnelles</h3>
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="jean@exemple.td"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  placeholder="+235 66 00 00 00"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="function">Fonction</Label>
                <Select value={formData.function} onValueChange={(v) => handleInputChange('function', v)}>
                  <SelectTrigger id="function">
                    <SelectValue placeholder="Sélectionner une fonction" />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNCTIONS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Étape 2: Rôle */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Sélectionner un rôle</h3>
              <p className="text-sm text-stone-600 bg-info-50 border border-info p-3 rounded">
                Le rôle détermine les modules. Portée géographique à l'étape suivante.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {(Object.keys(ROLE_LABEL) as Role[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => handleInputChange('role', role)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      formData.role === role
                        ? 'border-primary bg-primary-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="font-semibold text-stone-900">{ROLE_LABEL[role]}</div>
                    <div className="text-sm text-stone-600 mt-1">{ROLE_DESCRIPTIONS[role]}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape 3: Scope et Permissions */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Scope et Permissions</h3>

              {scopeReadonly ? (
                <div className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="text-sm font-medium text-stone-900">Scope: National Tchad</div>
                  <div className="text-xs text-stone-600 mt-1">Accès automatique pour ce rôle</div>
                </div>
              ) : (
                <div>
                  <Label>Sélectionner scope(s) *</Label>
                  <div className="mt-2 p-3 bg-info-50 border border-info rounded text-sm text-info-900">
                    Province → District (en cours de développement)
                  </div>
                </div>
              )}

              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-stone-900 font-semibold">Permissions</Label>
                  {!scopeReadonly && (
                    <button className="text-xs text-primary hover:underline">
                      Personnaliser
                    </button>
                  )}
                </div>
                <PermissionMatrix
                  permissions={{}}
                  mode="readonly"
                  rolePreset={formData.role as string}
                />
              </div>
            </div>
          )}

          {/* Étape 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Vérifier et créer</h3>

              <div className="bg-stone-50 rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-xs text-stone-600">Nom</div>
                  <div className="font-medium text-stone-900">{formData.name}</div>
                </div>
                <div>
                  <div className="text-xs text-stone-600">Email</div>
                  <div className="font-medium text-stone-900">{formData.email}</div>
                </div>
                <div>
                  <div className="text-xs text-stone-600">Rôle</div>
                  <div className="font-medium text-stone-900">
                    {ROLE_LABEL[formData.role as Role]}
                  </div>
                </div>
                {formData.scopes.length > 0 && (
                  <div>
                    <div className="text-xs text-stone-600">Scopes</div>
                    <div className="font-medium text-stone-900">{formData.scopes.join(', ')}</div>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-stone-200 pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={formData.sendInvitation}
                    onChange={(e) => handleInputChange('sendInvitation', e.target.checked)}
                  />
                  <div>
                    <div className="font-medium text-stone-900">Envoyer email d'invitation</div>
                    <div className="text-sm text-stone-600">Un lien de confirmation sera envoyé</div>
                  </div>
                </label>

                {(isAdmin || isGN) && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={formData.forceMFA}
                      onChange={(e) => handleInputChange('forceMFA', e.target.checked)}
                    />
                    <div>
                      <div className="font-medium text-stone-900">
                        Forcer MFA à première connexion
                      </div>
                      <div className="text-sm text-stone-600">
                        Recommandé pour ce niveau de privilège
                      </div>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end border-t border-stone-200 pt-4">
          {step > 1 && (
            <Button variant="secondary" onClick={handleBack}>
              Précédent
            </Button>
          )}
          {step < 4 && (
            <Button variant="primary" onClick={handleNext}>
              Suivant
              <ChevronRight size={16} />
            </Button>
          )}
          {step === 4 && (
            <Button variant="primary" onClick={handleCreate}>
              <CheckCircle size={16} />
              Créer le compte
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
