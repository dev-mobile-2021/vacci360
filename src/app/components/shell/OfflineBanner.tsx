import { useEffect, useRef } from 'react';
import { CloudOff } from 'lucide-react';
import { useOnlineStatus } from '../../lib/offline';
import { useToast } from '../../lib/toast';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const { toast } = useToast();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current && isOnline) {
      wasOffline.current = false;
      toast({
        type: 'success',
        title: 'Connexion rétablie',
        description: '0 élément en attente de synchronisation',
        duration: 4000,
      });
    }
  }, [isOnline, toast]);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-40 bg-stone-700 text-white px-6 py-3 flex items-center gap-2 text-[14px] animate-[slide-down_200ms_ease-out]"
    >
      <CloudOff size={16} />
      <span>Mode hors ligne — Vos modifications seront synchronisées dès la reconnexion</span>
      <span className="ml-auto text-[12px] text-stone-300">0 élément en attente</span>
      <style>{`@keyframes slide-down {
        from { transform: translateY(-100%); }
        to { transform: translateY(0); }
      }`}</style>
    </div>
  );
}
