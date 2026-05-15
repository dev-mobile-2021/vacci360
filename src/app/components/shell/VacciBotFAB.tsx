import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Sparkles, X, Maximize2, Minus, Send } from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../lib/auth';

interface ChatMessage {
  id: string;
  from: 'bot' | 'user' | 'thinking';
  text: string;
}

const SUGGESTIONS = [
  'Couverture province du Lac',
  'Villages non visités depuis 3 mois',
  'Comparer 2 micro-plans',
];

const STUB_REPLY =
  "Merci pour votre question. Je m'entraîne actuellement à analyser les données du PEV Tchad. Cette fonctionnalité sera pleinement disponible dans une prochaine version (Sprint 6 — Assistant IA). Pour l'instant, je vous invite à explorer les modules au fur et à mesure de leur déploiement.";

export function VacciBotFAB() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const firstName = user?.name.split(' ').slice(-1)[0] ?? '';

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      from: 'bot',
      text:
        `Bonjour ${firstName} 👋\n\nJe suis VacciBot, votre assistant IA pour le PEV. Je peux vous aider à :\n• Analyser des données de couverture vaccinale\n• Identifier des villages prioritaires\n• Comparer des micro-plans\n• Générer des rapports\n\nQue souhaitez-vous savoir ?`,
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  function send(text: string) {
    const clean = text.trim();
    if (!clean) return;
    const uid = Math.random().toString(36).slice(2);
    setMessages((m) => [
      ...m,
      { id: `u-${uid}`, from: 'user', text: clean },
      { id: `t-${uid}`, from: 'thinking', text: '' },
    ]);
    setInput('');
    setTimeout(() => {
      setMessages((m) => {
        const next = m.filter((msg) => msg.id !== `t-${uid}`);
        next.push({ id: `b-${uid}`, from: 'bot', text: STUB_REPLY });
        return next;
      });
    }, 1500);
  }

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          type="button"
          aria-label="Demander à VacciBot"
          onClick={() => setOpen(true)}
          className="group fixed bottom-6 right-6 z-40 size-14 rounded-full bg-ai text-white shadow-lg hover:bg-ai-600 hover:scale-105 transition-transform grid place-items-center"
        >
          <Sparkles size={24} />
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-ai-50 text-ai-700 text-[10px] font-semibold border border-ai-100">
            Nouveau
          </span>
          <span className="absolute right-full mr-3 whitespace-nowrap rounded-md bg-stone-800 text-white text-[12px] px-2 py-1 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            Demander à VacciBot
          </span>
        </button>
      )}

      {/* Panneau chat */}
      {open && (
        <div
          role="dialog"
          aria-label="VacciBot"
          className="fixed bottom-6 right-6 z-40 w-[400px] max-w-[calc(100vw-32px)] h-[600px] max-h-[calc(100vh-48px)] bg-white border border-stone-200 rounded-xl shadow-xl flex flex-col overflow-hidden animate-[bot-in_200ms_ease-out]"
        >
          <div className="bg-ai-50 px-4 py-3 flex items-center gap-3">
            <span className="size-9 grid place-items-center rounded-full bg-ai text-white shrink-0">
              <Sparkles size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-stone-800">VacciBot</div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-600">
                <span className="size-1.5 rounded-full bg-success" />
                En ligne · Assistant IA
              </div>
            </div>
            <IconBtn
              label="Ouvrir en page complète"
              onClick={() => { setOpen(false); navigate('/vaccibot'); }}
            >
              <Maximize2 size={16} />
            </IconBtn>
            <IconBtn label="Réduire" onClick={() => setOpen(false)}>
              <Minus size={16} />
            </IconBtn>
            <IconBtn label="Fermer" onClick={() => setOpen(false)}>
              <X size={16} />
            </IconBtn>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white">
            {messages.map((msg) => (
              <Bubble key={msg.id} message={msg} />
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-2 pt-1 pl-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="px-3 py-1.5 rounded-full border border-ai-100 bg-ai-50 text-ai-700 text-[12px] hover:bg-ai-100 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="border-t border-stone-200 px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <div className="flex items-center gap-2">
              <input
                aria-label="Posez votre question à VacciBot"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question…"
                className="flex-1 h-10 px-3 rounded-md border border-stone-300 bg-white text-[14px] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              />
              <button
                type="submit"
                aria-label="Envoyer"
                disabled={!input.trim()}
                className="size-9 grid place-items-center rounded-full bg-ai text-white hover:bg-ai-600 disabled:bg-stone-300 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="mt-2 text-[11px] text-stone-500">
              VacciBot peut faire des erreurs. Vérifiez les informations importantes.
            </p>
          </form>
        </div>
      )}

      <style>{`
        @keyframes bot-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dot { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
      `}</style>
    </>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="size-8 grid place-items-center rounded-md text-stone-600 hover:bg-white/60 transition"
    >
      {children}
    </button>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  if (message.from === 'thinking') {
    return (
      <div className="max-w-[80%] mr-auto bg-ai-50 text-ai-700 rounded-xl rounded-tl-sm px-3 py-3 inline-flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 rounded-full bg-ai"
            style={{ animation: `dot 1.4s infinite`, animationDelay: `${i * 0.16}s` }}
          />
        ))}
        <span className="ml-1 text-[12px]">VacciBot réfléchit…</span>
      </div>
    );
  }
  const isUser = message.from === 'user';
  return (
    <div
      className={cn(
        'max-w-[80%] rounded-xl px-3 py-2.5 text-[13px] leading-snug whitespace-pre-line',
        isUser
          ? 'ml-auto bg-primary-50 text-stone-800 rounded-tr-sm'
          : 'mr-auto bg-ai-50 text-stone-800 rounded-tl-sm',
      )}
    >
      {message.text}
    </div>
  );
}
