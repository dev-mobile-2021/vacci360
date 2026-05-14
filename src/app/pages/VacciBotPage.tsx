import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Send, Bot, User as UserIcon, MessageSquare, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useScope } from '../lib/scope';
import { botContext } from '../lib/botContext';
import { findBotResponse, defaultBotResponse } from '../data/mockVacciBotResponses';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
  suggestedActions?: { label: string; route: string }[];
  sources?: string[];
}

// ─── Suggestion chips ─────────────────────────────────────────────────────────

const SUGGESTION_CHIPS = [
  { emoji: '📊', label: 'Couverture vaccinale', query: 'Couverture DTC3 nationale' },
  { emoji: '🗺️', label: 'Villages non visités', query: 'Villages jamais visités' },
  { emoji: '👥', label: 'Performance équipes', query: 'Meilleure équipe conformité' },
  { emoji: '💊', label: 'Stocks et logistique', query: 'Stock vaccins rupture' },
  { emoji: '🏕️', label: 'Opportunités nomades', query: 'Opportunités nomades urgentes' },
  { emoji: '📈', label: 'Comparaison campagnes', query: 'Résumé situation actuelle' },
  { emoji: '🚨', label: 'Alertes actives', query: 'Alertes critiques actives' },
  { emoji: '📄', label: 'Générer un rapport', query: "Rapport d'activité" },
];

// ─── Mock recent conversations ────────────────────────────────────────────────

const RECENT_CONVERSATIONS = [
  { id: '1', title: 'Analyse couverture Province du Lac', date: '13 mai 2026' },
  { id: '2', title: 'Villages zero-dose prioritaires', date: '12 mai 2026' },
  { id: '3', title: 'Bilan mission équipe Bol-1', date: '10 mai 2026' },
  { id: '4', title: 'Rupture stock DTC — Kanem', date: '9 mai 2026' },
  { id: '5', title: 'Opportunités nomades fenêtre Lac', date: '7 mai 2026' },
];

// ─── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const navigate = useNavigate();
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start`}>
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm"
        style={{ background: isUser ? '#1E5BA8' : '#E11D74', marginTop: 2 }}
      >
        {isUser ? <UserIcon size={13} /> : <Bot size={13} />}
      </div>

      <div className={`flex flex-col gap-1.5 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Bubble */}
        <div
          className="rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm"
          style={{
            background: isUser ? '#EFF6FF' : '#FFF1F5',
            borderTopRightRadius: isUser ? 4 : undefined,
            borderTopLeftRadius: isUser ? undefined : 4,
          }}
        >
          <div className="text-stone-800 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
            }}
          />
        </div>

        {/* Sources */}
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {msg.sources.map((s) => (
              <span key={s} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Suggested actions */}
        {msg.suggestedActions && msg.suggestedActions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.suggestedActions.map((a) => (
              <button
                key={a.route}
                onClick={() => navigate(a.route)}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: '#E11D74' }}
              >
                {a.label} <ChevronRight size={11} />
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-stone-400">
          {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingBubble() {
  return (
    <div className="flex gap-2.5 items-start">
      <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white shadow-sm" style={{ background: '#E11D74', marginTop: 2 }}>
        <Bot size={13} />
      </div>
      <div className="rounded-2xl px-4 py-3 shadow-sm" style={{ background: '#FFF1F5', borderTopLeftRadius: 4 }}>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-stone-500">VacciBot analyse</span>
          <div className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-pink-400"
                style={{ animation: `bounce 1.2s infinite ${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const SOURCES_MAP: Record<string, string[]> = {
  'dtc3-national': ['mockAnalytics', 'mockProvinceKPIs'],
  'coverage-lac': ['mockAnalytics'],
  'coverage-kanem': ['mockAnalytics'],
  'provinces-faibles': ['mockProvinceKPIs'],
  'provinces-top': ['mockProvinceKPIs'],
  'missions-actives': ['mockMissions'],
  'meilleure-equipe': ['mockMissions'],
  'villages-non-visites': ['mockMicroPlans', 'mockMissions'],
  'enfants-manques': ['mockProvinceKPIs'],
  'plans-actifs': ['mockMicroPlans'],
  'validation-plans': ['mockMicroPlans'],
  'opportunites-nomades': ['mockNomadOpportunities', 'mockAnalytics'],
  'stock-critique': ['mockStock'],
  'allocations': ['mockAllocations'],
  'resume-general': ['mockAnalytics', 'mockMissions', 'mockProvinceKPIs'],
  'aide': [],
  'bonjour': ['mockAnalytics'],
  'default': [],
};

const SUGGESTED_ACTIONS_MAP: Record<string, { label: string; route: string }[]> = {
  'coverage-lac': [{ label: 'Voir la carte', route: '/carte' }],
  'coverage-kanem': [{ label: 'Voir la carte', route: '/carte' }],
  'provinces-faibles': [{ label: 'Tableau de bord', route: '/executif' }],
  'provinces-top': [{ label: 'Tableau de bord', route: '/executif' }],
  'missions-actives': [{ label: 'Supervision', route: '/supervision' }],
  'meilleure-equipe': [{ label: 'Voir conformité', route: '/supervision/conformite' }],
  'villages-non-visites': [{ label: 'Voir les villages', route: '/referentiel/villages' }, { label: 'Créer un micro-plan', route: '/planification/nouveau' }],
  'plans-actifs': [{ label: 'Mes plans', route: '/planification' }],
  'validation-plans': [{ label: 'Voir les plans', route: '/planification' }],
  'opportunites-nomades': [{ label: 'Nomade Hub', route: '/nomades' }],
  'stock-critique': [{ label: 'Voir les stocks', route: '/logistique/stock' }],
  'allocations': [{ label: 'Logistique', route: '/logistique' }],
  'resume-general': [{ label: 'Tableau exécutif', route: '/executif' }],
};

export default function VacciBotPage() {
  const { user } = useAuth();
  const { current: scope } = useScope();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message
  useEffect(() => {
    const firstName = user?.name?.split(' ')[0] ?? 'utilisateur';
    const scopeLabel = scope?.name ?? 'National';
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text: `Bonjour ${firstName} 👋\n\nJe suis VacciBot, votre assistant d'analyse pour le PEV Tchad.\n\nVotre scope actif : **${scopeLabel}**\n\nJe peux analyser en temps réel :\n• La couverture vaccinale par zone et antigène\n• Les villages prioritaires non couverts\n• La performance et conformité des équipes\n• L'état des stocks et allocations\n• Les opportunités nomades identifiées\n• Les tendances et comparaisons de campagnes\n\nPosez votre question ou choisissez une suggestion.`,
        timestamp: new Date(),
        suggestedActions: [
          { label: 'Couverture nationale', route: '/executif' },
          { label: 'Missions actives', route: '/supervision' },
          { label: 'Stocks vaccins', route: '/logistique/stock' },
        ],
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const matched = findBotResponse(text);
      const isDefault = matched.id === defaultBotResponse.id;
      const responseText = isDefault
        ? defaultBotResponse.response()
        : matched.response(botContext);

      const botMsg: Message = {
        id: `b-${Date.now()}`,
        role: 'bot',
        text: responseText,
        timestamp: new Date(),
        suggestedActions: SUGGESTED_ACTIONS_MAP[matched.id] ?? [],
        sources: SOURCES_MAP[matched.id] ?? [],
      };
      setTyping(false);
      setMessages((prev) => [...prev, botMsg]);
    }, 1500);
  };

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      {/* ── Left panel (30%) ─────────────────────────────────────────────── */}
      <div className="w-[300px] flex-shrink-0 border-r border-stone-200 bg-stone-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 border-b border-stone-200 bg-white flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg shadow-md" style={{ background: '#E11D74' }}>
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="font-bold text-stone-900 leading-tight">VacciBot</h2>
            <p className="text-xs text-stone-500">Assistant IA · Données en temps réel</p>
          </div>
        </div>

        {/* Suggestions */}
        <div className="px-4 py-3 border-b border-stone-200">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Données disponibles</div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => sendMessage(chip.query)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 hover:border-pink-300 hover:text-pink-700 hover:bg-pink-50 transition-colors font-medium"
              >
                {chip.emoji} {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Recent conversations */}
        <div className="px-4 py-3 border-b border-stone-200 flex-1 overflow-y-auto">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Conversations récentes</div>
          <div className="space-y-1">
            {RECENT_CONVERSATIONS.map((conv) => (
              <button
                key={conv.id}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group"
              >
                <div className="flex items-start gap-2">
                  <MessageSquare size={13} className="text-stone-400 mt-0.5 flex-shrink-0 group-hover:text-pink-500" />
                  <div className="min-w-0">
                    <div className="text-xs text-stone-700 font-medium truncate">{conv.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-stone-400" />
                      <span className="text-[10px] text-stone-400">{conv.date}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* About */}
        <div className="px-4 py-3 bg-stone-50 border-t border-stone-200">
          <p className="text-[10px] text-stone-400 leading-relaxed">
            VacciBot utilise les données VACCI360 pour vous fournir des analyses contextuelles.
            Les données affichées sont celles de votre scope actif.
          </p>
        </div>
      </div>

      {/* ── Right panel (70%) — Chat ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {typing && <TypingBubble />}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer */}
        <div className="border-t border-stone-200 px-6 py-4 bg-white">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question sur les données VACCI360..."
                className="w-full px-4 py-3 pr-12 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent resize-none"
                disabled={typing}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || typing}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40 shadow-sm hover:opacity-90"
              style={{ background: '#E11D74' }}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] text-stone-400 mt-2 text-center">
            VacciBot analyse les données VACCI360. Vérifiez les informations importantes.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
