import { useNavigate } from 'react-router';
import { MapPinOff } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
      <MapPinOff size={64} className="text-stone-400" />
      <h1 className="mt-6 text-stone-900">Page introuvable</h1>
      <p className="mt-2 text-stone-600 max-w-md">
        Cette page n'existe pas ou a été déplacée.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => navigate('/dashboard')}>Retour au tableau de bord</Button>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Signaler un problème
        </Button>
      </div>
    </div>
  );
}
