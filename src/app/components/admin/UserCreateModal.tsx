import React, { useState } from 'react';
import { ChevronRight, CheckCircle, ShieldCheck, Globe, MapPin, Activity, BarChart2, Users, Check } from 'lucide-react';
import type { User, Role } from '../../types';
import { ROLE_LABEL } from '../../types';
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

const FUNCTIONS = [
  'Médecin Chef de District',
  'Gestionnaire PEV',
  'Infirmier Major',
  'Superviseur Vaccinal',
  'Analyste de Données',
  'Autre',
];

const ROLE_CARDS: { role: Role; icon: React.ElementType; description: string }[] = [
  { role: 'admin', icon: ShieldCheck, description: 'Accès total à toutes les fonctionnalités' },
  { role: 'gestionnaire_national', icon: Globe, description: 'Supervision nationale du programme PEV' },
  { role: 'gestionnaire_provincial', icon: MapPin, description: "Gestion opérationnelle d'une province" },
  { role: 'superviseur_district', icon: Activity, description: 'Supervision des équipes terrain' },
  { role: 'analyste', icon: BarChart2, description: 'Analyse et reporting des données' },
  { role: 'agent_terrain', icon: Users, description: 'Vaccination terrain (accès mobile uniquement)' },
];

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STEPS = ['Informations', 'Rôle', 'Scope & Permissions', 'Confirmation'];

export function UserCreateModal({ open, onOpenChange, onUserCreated }: UserCreateModalProps) {
  const [step, setStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
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
  const { toast } = useToast();

  const set = (field: keyof FormData, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const isStep1Valid = formData.name.trim() && EMAIL_RE.test(formData.email);
  const isStep2Valid = !!formData.role;
  const isAdmin = formData.role === 'admin';
  const isGN = formData.role === 'gestionnaire_national';
  const scopeReadonly = isAdmin || isGN;
  const isStep3Valid = scopeReadonly || formData.scopes.length > 0;

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) {
      toast({ type: 'warning', title: 'Champs requis', description: 'Veuillez remplir le nom et un email valide.' });
      return;
    }
    if (step === 2 && !isStep2Valid) {
      toast({ type: 'warning', title: 'Rôle requis', description: 'Veuillez sélectionner un rôle.' });
      return;
    }
    if (step === 3 && !isStep3Valid) {
      toast({ type: 'warning', title: 'Scope requis', description: 'Veuillez sélectionner au moins une zone géographique.' });
      return;
    }
    setCompletedSteps((prev) => new Set([...prev, step]));
    setStep(step + 1);
  };

  const handleCreate = () => {
    const newUser = createUser({
      name: formData.name,
      email: formData.email,
      phone: formData.phone || undefined,
      function: formData.function || undefined,
      role: formData.role as Role,
      scopeIds: scopeReadonly ? ['national'] : formData.scopes,
      initials: formData.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
      avatar: null,
      status: 'pending_activation',
      mfaEnabled: formData.mfaEnabled || formData.forceMFA,
      lastLoginAt: null,
      createdBy: 'current-user',
    });

    toast({
      type: 'success',
      title: 'Compte créé',
      description: formData.sendInvitation
        ? `Email d'invitation envoyé à ${formData.email}.`
        : `${formData.name} ajouté avec succès.`,
    });

    onUserCreated?.(newUser);
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setCompletedSteps(new Set());
      setFormData({ name: '', email: '', phone: '', function: '', role: '', scopes: [], mfaEnabled: false, sendInvitation: true, forceMFA: false });
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>

          {/* Stepper */}
          <div className="flex items-center gap-0 mt-4">
            {STEPS.map((label, i) => {
              const s = i + 1;
              const isActive = step === s;
              const isCompleted = completedSteps.has(s);
              return (
                <React.Fragment key={s}>
                  <button
                    className="flex flex-col items-center gap-1 flex-shrink-0"
                    onClick={() => isCompleted && setStep(s)}
                    disabled={!isCompleted && step !== s}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCompleted
                        ? 'bg-success text-white'
                        : isActive
                        ? 'bg-primary text-white'
                        : 'bg-stone-200 text-stone-400'
                    }`}>
                      {isCompleted ? <Check size={12} /> : s}
                    </div>
                    <span className={`text-xs whitespace-nowrap ${
                      isActive ? 'text-primary font-medium' : isCompleted ? 'text-stone-600' : 'text-stone-400'
                    }`}>{label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 mx-2 mb-4 ${isCompleted ? 'bg-success' : 'bg-stone-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </DialogHeader>

        <div className="py-4">
          {/* Step 1: Personal info */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Informations personnelles</h3>
              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input id="name" placeholder="Jean Dupont" value={formData.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email professionnel *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="prenom.nom@sante.td"
                  value={formData.email}
                  onChange={(e) => set('email', e.target.value)}
                  className={formData.email && !EMAIL_RE.test(formData.email) ? 'border-danger' : ''}
                />
                {formData.email && !EMAIL_RE.test(formData.email) && (
                  <p className="text-xs text-danger-700 mt-1">Email invalide</p>
                )}
              </div>
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" placeholder="+235 66 00 00 00" value={formData.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
              <div>
                <Label htmlFor="function">Fonction</Label>
                <Select value={formData.function} onValueChange={(v) => set('function', v)}>
                  <SelectTrigger id="function"><SelectValue placeholder="Sélectionner une fonction" /></SelectTrigger>
                  <SelectContent>
                    {FUNCTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Role */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Sélectionner un rôle</h3>
              <p className="text-sm text-stone-500 bg-info-50 border border-info-100 rounded-lg px-3 py-2">
                Le rôle détermine les modules accessibles. La portée géographique sera configurée à l'étape suivante.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ROLE_CARDS.map(({ role, icon: Icon, description }) => {
                  const selected = formData.role === role;
                  return (
                    <button
                      key={role}
                      onClick={() => set('role', role)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                        selected
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </div>
                      )}
                      <Icon size={20} className={selected ? 'text-primary mb-2' : 'text-stone-400 mb-2'} />
                      <div className="font-semibold text-stone-900 text-sm">{ROLE_LABEL[role]}</div>
                      <div className="text-xs text-stone-500 mt-0.5 leading-snug">{description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Scope & Permissions */}
          {step === 3 && (
            <div className="space-y-5">
              <h3 className="font-semibold text-stone-900">Scope et Permissions</h3>

              {scopeReadonly ? (
                <div className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-200">
                  <Globe size={18} className="text-primary flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-stone-900">National — Tchad complet</div>
                    <div className="text-xs text-stone-500">Accès automatique pour ce rôle</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label>Province(s) *</Label>
                    <div className="mt-2 p-3 bg-info-50 border border-info-100 rounded-lg text-sm text-info-700">
                      Sélecteur Province → District disponible prochainement.
                    </div>
                  </div>
                  <p className="text-xs text-stone-500">Au moins une zone géographique requise.</p>
                </div>
              )}

              <div className="border-t border-stone-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-stone-900 font-semibold">Permissions</Label>
                </div>
                <PermissionMatrix
                  permissions={{}}
                  mode="readonly"
                  rolePreset={formData.role as string}
                />
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-stone-900">Vérifier et créer</h3>

              <div className="bg-stone-50 rounded-xl p-4 space-y-3 border border-stone-200">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-stone-500 block">Nom</span>
                    <span className="font-medium text-stone-900">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-stone-500 block">Email</span>
                    <span className="font-medium text-stone-900 font-mono">{formData.email}</span>
                  </div>
                  {formData.phone && (
                    <div>
                      <span className="text-xs text-stone-500 block">Téléphone</span>
                      <span className="font-medium text-stone-900">{formData.phone}</span>
                    </div>
                  )}
                  {formData.function && (
                    <div>
                      <span className="text-xs text-stone-500 block">Fonction</span>
                      <span className="font-medium text-stone-900">{formData.function}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-xs text-stone-500 block">Rôle</span>
                    <span className="font-medium text-stone-900">{ROLE_LABEL[formData.role as Role]}</span>
                  </div>
                  <div>
                    <span className="text-xs text-stone-500 block">Scope</span>
                    <span className="font-medium text-stone-900">{scopeReadonly ? 'National' : formData.scopes.join(', ') || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-stone-200 pt-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox checked={formData.sendInvitation} onChange={(e) => set('sendInvitation', e.target.checked)} />
                  <div>
                    <div className="font-medium text-stone-900 text-sm">Envoyer un email d'invitation</div>
                    <div className="text-xs text-stone-500">Un lien d'activation sera envoyé à {formData.email}</div>
                  </div>
                </label>

                {(isAdmin || isGN) && (
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={formData.forceMFA} onChange={(e) => set('forceMFA', e.target.checked)} />
                    <div>
                      <div className="font-medium text-stone-900 text-sm">Forcer MFA à la première connexion</div>
                      <div className="text-xs text-stone-500">Recommandé pour ce niveau de privilège</div>
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
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Précédent</Button>
          )}
          {step < 4 && (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
            >
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
