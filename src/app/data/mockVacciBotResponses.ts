/** VacciBot mock intelligent responses — Sprint 6 */

import type { AppContext } from '../lib/botContext';

export interface BotResponse {
  id: string;
  triggers: string[];
  response: (ctx: AppContext) => string;
}

export const botResponses: BotResponse[] = [
  // ─── Coverage ────────────────────────────────────────────────────────────────
  {
    id: 'dtc3-national',
    triggers: ['couverture nationale', 'dtc3 national', 'taux national', 'couverture globale', 'niveau national'],
    response: (ctx) => {
      const nat = ctx.getNationalDtc3();
      const top = ctx.getTopProvinces(1)[0];
      const bot = ctx.getBottomProvinces(1)[0];
      return `📊 La couverture DTC3 nationale est actuellement de **${nat}%**.\n\n` +
        `- Province la mieux couverte : **${top.name}** (${top.coverage}%)\n` +
        `- Province nécessitant le plus d'attention : **${bot.name}** (${bot.coverage}%)\n\n` +
        `*Données au 14 mai 2026. Objectif OMS : 90%.*`;
    },
  },
  {
    id: 'coverage-lac',
    triggers: ['couverture lac', 'province du lac', 'lac province', 'lac dtc3', 'taux lac'],
    response: (ctx) => {
      const cov = ctx.getLacCoverage();
      const status = cov >= 80 ? '🟢 satisfaisante' : cov >= 60 ? '🟡 à améliorer' : '🔴 critique';
      return `Province du **Lac** — Couverture DTC3 : **${cov}%** (${status})\n\n` +
        `Cette province héberge une forte population nomade, ce qui complexifie l'atteinte de la cible. ` +
        `${cov < 80 ? 'Des sorties supplémentaires en mode nomade sont recommandées.' : 'Les équipes maintiennent de bonnes performances.'}`;
    },
  },
  {
    id: 'coverage-kanem',
    triggers: ['couverture kanem', 'province kanem', 'kanem dtc3', 'taux kanem'],
    response: (ctx) => {
      const cov = ctx.getKanemCoverage();
      return `Province du **Kanem** — Couverture DTC3 : **${cov}%**.\n\n` +
        `Le Kanem est une zone d'accès difficile avec des défis logistiques importants (routes en saison des pluies). ` +
        `${cov < 70 ? 'Une révision du micro-plan est conseillée pour renforcer la stratégie avancée.' : 'Les itinéraires actuels semblent adaptés.'}`;
    },
  },
  {
    id: 'provinces-faibles',
    triggers: ['provinces faibles', 'provinces basses', 'mauvaise couverture', 'provinces problèmes', 'problèmes couverture', 'zones sous-couvertes'],
    response: (ctx) => {
      const bottom = ctx.getBottomProvinces(5);
      const list = bottom.map((p) => `  - ${p.name} : **${p.coverage}%**`).join('\n');
      return `🔴 Provinces avec la couverture DTC3 la plus faible :\n\n${list}\n\n` +
        `Ces provinces sont prioritaires pour la prochaine campagne. Consultez le tableau de bord exécutif pour une analyse détaillée.`;
    },
  },
  {
    id: 'provinces-top',
    triggers: ['meilleures provinces', 'top provinces', 'bonne performance', 'provinces excellentes', 'objectif atteint'],
    response: (ctx) => {
      const top = ctx.getTopProvinces(5);
      const list = top.map((p) => `  - ${p.name} : **${p.coverage}%**`).join('\n');
      return `🟢 Provinces avec la meilleure couverture DTC3 :\n\n${list}\n\n` +
        `Ces provinces peuvent servir de modèle pour les stratégies d'extension.`;
    },
  },

  // ─── Missions & équipes ───────────────────────────────────────────────────────
  {
    id: 'missions-actives',
    triggers: ['missions actives', 'missions en cours', 'combien de missions', 'missions actuelles', 'état des missions'],
    response: (ctx) => {
      const missions = ctx.getActiveMissionsCount();
      const teams = ctx.getActiveTeamsCount();
      const issues = ctx.getMissionsWithIssues();
      return `🚑 **${missions} mission${missions > 1 ? 's' : ''}** en cours avec **${teams} équipe${teams > 1 ? 's' : ''}** sur le terrain.\n\n` +
        `${issues > 0 ? `⚠️ ${issues} mission${issues > 1 ? 's ont' : ' a'} signalé des incidents (route bloquée, problème chaîne de froid, etc.).` : '✅ Aucun incident majeur signalé pour le moment.'}`;
    },
  },
  {
    id: 'meilleure-equipe',
    triggers: ['meilleure équipe', 'équipe performante', 'top équipe', 'équipe efficace', 'quelle équipe'],
    response: (ctx) => {
      const best = ctx.getBestTeam();
      const worst = ctx.getWorstTeam();
      return `🏆 **${best.name}** est l'équipe la plus performante avec **${best.coverage}%** de couverture.\n\n` +
        `L'équipe **${worst.name}** (${worst.coverage}%) mérite un accompagnement supplémentaire. ` +
        `Une supervision de proximité ou un débriefing peut aider à identifier les obstacles rencontrés.`;
    },
  },

  // ─── Villages & enfants ────────────────────────────────────────────────────────
  {
    id: 'villages-non-visites',
    triggers: ['villages non visités', 'jamais visités', 'villages oubliés', 'villages manqués', 'villages zéro dose'],
    response: (ctx) => {
      const count = ctx.getNeverVisitedCount();
      return `🗺️ **${count} village${count > 1 ? 's' : ''}** n'ont pas encore été visités dans les micro-plans actifs.\n\n` +
        `Ces villages représentent un risque de "zéro-dose". Il est recommandé de les inclure en priorité dans la prochaine révision du micro-plan.`;
    },
  },
  {
    id: 'enfants-manques',
    triggers: ['enfants manqués', 'non vaccinés', 'enfants zero dose', 'combien enfants', 'enfants non atteints'],
    response: (ctx) => {
      const missed = ctx.getMissedChildrenTotal();
      const total = ctx.getTotalChildrenNational();
      const pct = Math.round((missed / total) * 1000) / 10;
      return `👶 **${missed.toLocaleString('fr-FR')} enfants** n'ont pas reçu le DTC3 sur un total national de ${total.toLocaleString('fr-FR')} enfants cibles (soit **${pct}%** non atteints).\n\n` +
        `La stratégie avancée et les sessions en mode nomade sont cruciales pour réduire ce chiffre.`;
    },
  },

  // ─── Plans & itinéraires ─────────────────────────────────────────────────────
  {
    id: 'plans-actifs',
    triggers: ['plans actifs', 'micro-plans', 'plans validés', 'combien de plans', 'planification'],
    response: (ctx) => {
      const active = ctx.getActivePlansCount();
      const pending = ctx.getPlansAwaitingValidation();
      const itins = ctx.getTotalItineraries();
      return `📋 **${active} micro-plan${active > 1 ? 's' : ''}** en cours d'exécution ou validés, représentant **${itins} itinéraires** planifiés.\n\n` +
        `${pending > 0 ? `⏳ **${pending} plan${pending > 1 ? 's** sont' : '** est'} en attente de validation superviseur.` : '✅ Tous les plans soumis ont été traités.'}`;
    },
  },
  {
    id: 'validation-plans',
    triggers: ['valider plan', 'validation', 'approbation', 'soumettre plan', 'en attente validation'],
    response: (ctx) => {
      const pending = ctx.getPlansAwaitingValidation();
      if (pending === 0) {
        return `✅ Aucun micro-plan n'est actuellement en attente de validation. Tous les plans soumis ont été traités.`;
      }
      return `⏳ **${pending} micro-plan${pending > 1 ? 's sont' : ' est'} en attente de validation.**\n\n` +
        `Accédez à **Planification → Mes plans** pour les examiner et les valider. Un délai de validation trop long peut retarder l'exécution des campagnes.`;
    },
  },

  // ─── Nomades ─────────────────────────────────────────────────────────────────
  {
    id: 'opportunites-nomades',
    triggers: ['opportunités nomades', 'populations nomades', 'nomades', 'groupes mobiles', 'communautés nomades', 'arrêts nomades'],
    response: (ctx) => {
      const open = ctx.getNomadOpportunitiesOpen();
      const ytd = ctx.getNomadContactsYTD();
      const recent = ctx.getRecentNomadOpportunities();
      const list = recent.map((r) => `  - ${r.name} (${r.children} enfants estimés)`).join('\n');
      return `⛺ **${open} opportunité${open > 1 ? 's' : ''} nomade${open > 1 ? 's' : ''}** identifiée${open > 1 ? 's' : ''} et en attente de planification.\n\n` +
        `Contacts nomades enregistrés cette année : **${ytd}**\n\n` +
        (recent.length > 0 ? `Groupes récents :\n${list}\n\n` : '') +
        `Rendez-vous sur le **Nomade Hub** pour planifier ces fenêtres de vaccination.`;
    },
  },

  // ─── Stock ────────────────────────────────────────────────────────────────────
  {
    id: 'stock-critique',
    triggers: ['stock critique', 'rupture stock', 'vaccins disponibles', 'stock vaccins', 'approvisionnement', 'pénurie'],
    response: (ctx) => {
      const alerts = ctx.getStockAlertsCount();
      const items = ctx.getCriticalStockItems();
      if (alerts === 0) {
        return `✅ **Aucune rupture de stock** détectée dans les dépôts surveillés. Les niveaux sont conformes aux seuils minimaux.`;
      }
      const list = items.map((i) => `  - ${i.antigen} — ${i.facility} (${i.level})`).join('\n');
      return `⚠️ **${alerts} alerte${alerts > 1 ? 's' : ''} de stock** détectée${alerts > 1 ? 's' : ''} :\n\n${list}\n\n` +
        `Consultez **Logistique → Stock** pour déclencher une demande de réapprovisionnement.`;
    },
  },

  // ─── Allocations ─────────────────────────────────────────────────────────────
  {
    id: 'allocations',
    triggers: ['allocations', 'ressources allouées', 'matériel alloué', 'dotations'],
    response: (ctx) => {
      const pending = ctx.getPendingAllocationsCount();
      return `📦 **${pending} allocation${pending > 1 ? 's' : ''}** de ressources en statut "réservé" en attente de chargement.\n\n` +
        `Vérifiez la page **Planification → Ressources** pour confirmer les chargements avant le départ des équipes.`;
    },
  },

  // ─── Résumé général ──────────────────────────────────────────────────────────
  {
    id: 'resume-general',
    triggers: ['résumé', 'bilan', 'tableau de bord', 'situation actuelle', 'point de situation', 'état général', 'synthèse'],
    response: (ctx) => {
      const summary = ctx.getNationalSummary();
      const bot = ctx.getBottomProvinces(1)[0];
      return `📊 **Point de situation — ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}**\n\n` +
        `- Couverture DTC3 nationale : **${summary.dtc3NationalCoverage}%**\n` +
        `- BCG national : **${summary.bcgNationalCoverage}%**\n` +
        `- Missions actives : **${summary.activeMissions}** | Équipes terrain : **${summary.activeTeams}**\n` +
        `- Provinces ≥ 80% : **${summary.provincesAbove80}** | Provinces < 50% : **${summary.provincesBelow50}**\n` +
        `- Contacts nomades YTD : **${summary.nomadContactsYTD}**\n\n` +
        `🔴 Point d'attention : **${bot.name}** (${bot.coverage}% DTC3) nécessite une intervention prioritaire.`;
    },
  },

  // ─── Aide & navigation ────────────────────────────────────────────────────────
  {
    id: 'aide',
    triggers: ['aide', 'help', 'que sais-tu faire', 'que peux-tu faire', 'fonctionnalités', 'questions possibles', 'exemples'],
    response: () =>
      `🤖 **VacciBot — Vos questions, mes réponses**\n\n` +
      `Je peux vous aider sur :\n\n` +
      `📊 **Couverture** : "Couverture nationale", "Taux au Lac", "Provinces faibles"\n` +
      `🚑 **Missions** : "Missions actives", "Meilleure équipe"\n` +
      `🗺️ **Planification** : "Plans actifs", "Villages non visités"\n` +
      `⛺ **Nomades** : "Opportunités nomades", "Contacts nomades"\n` +
      `💉 **Stock** : "Stock critique", "Rupture de stock"\n` +
      `📋 **Synthèse** : "Résumé", "Point de situation"\n\n` +
      `Posez votre question en langage naturel !`,
  },
  {
    id: 'bonjour',
    triggers: ['bonjour', 'bonsoir', 'salut', 'hello', 'bonne journée', 'allô', 'coucou'],
    response: (ctx) => {
      const nat = ctx.getNationalDtc3();
      return `👋 **Bonjour !** Je suis VacciBot, votre assistant IA VACCI360.\n\n` +
        `La couverture DTC3 nationale est aujourd'hui à **${nat}%**. ` +
        `Comment puis-je vous aider ? (Tapez "aide" pour voir mes capacités)`;
    },
  },
];

export const defaultBotResponse: BotResponse = {
  id: 'default',
  triggers: [],
  response: () =>
    `🤔 Je n'ai pas bien compris votre question. Voici quelques exemples de ce que vous pouvez me demander :\n\n` +
    `- "Quelle est la couverture DTC3 nationale ?"\n` +
    `- "Combien de missions sont actives ?"\n` +
    `- "Y a-t-il des ruptures de stock ?"\n` +
    `- "Résumé de la situation"\n\n` +
    `Tapez **"aide"** pour voir toutes mes fonctionnalités.`,
};

/** Find matching response for a user message */
export function findBotResponse(message: string): BotResponse {
  const lower = message.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  for (const r of botResponses) {
    if (r.triggers.some((t) => lower.includes(normalize(t)))) return r;
  }
  return defaultBotResponse;
}
