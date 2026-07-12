// Pure assistant logic: the scripted offline fallback bank, language
// detection, and the demo access gates. Split out of StadiumSync.jsx so
// that file exports only the default component (no mixed component /
// non-component exports, which is what breaks Fast Refresh) and so this
// logic is independently unit-testable.

export const STAFF_PIN = "2026"; // demo-only gate for the staff console (see README)
// Real ticket IDs are unique per fan, so there's no single "correct" value to
// check against — validate the shape instead (letters/digits/dashes, 6+ chars).
export const TICKET_FORMAT = /^[A-Za-z0-9-]{6,}$/;

export const ASSISTANT_SCRIPT = {
  en: {
    greet: "Hi! I'm your StadiumSync assistant. Ask me anything — directions, food, transport, accessibility.",
    replies: {
      restroom: "The nearest restroom is 40m past Section 118, to your left after the merch stand. It's showing low wait right now.",
      exit: "Your fastest exit is Gate 4 — but it's busy (97% capacity). I'd suggest Concourse S, it's 6 minutes slower to walk but you'll exit faster overall.",
      food: "Churro + Dip has the shortest wait right now (3 min). Want me to add it to your order?",
      default: "Got it — routing that to the right place. For live wayfinding, tap Navigate; for food, tap Order.",
    },
  },
  es: {
    greet: "¡Hola! Soy tu asistente de StadiumSync. Pregúntame lo que sea — direcciones, comida, transporte, accesibilidad.",
    replies: {
      restroom: "El baño más cercano está a 40m pasando la Sección 118, a tu izquierda después de la tienda. Ahora mismo casi no hay fila.",
      exit: "Tu salida más rápida es la Puerta 4, pero está muy llena (97%). Te sugiero la Explanada S, tarda 6 minutos más caminando pero saldrás más rápido en total.",
      food: "Churro + Dip tiene la espera más corta ahora mismo (3 min). ¿Lo agrego a tu pedido?",
      default: "Entendido — te dirijo al lugar correcto. Para direcciones usa Navegar; para comida usa Pedir.",
    },
  },
  pt: {
    greet: "Oi! Sou o assistente StadiumSync. Pergunte qualquer coisa — direções, comida, transporte, acessibilidade.",
    replies: {
      restroom: "O banheiro mais próximo fica 40m após a Seção 118, à esquerda após a loja. Fila baixa agora.",
      exit: "Sua saída mais rápida é o Portão 4, mas está lotado (97%). Sugiro o Saguão S — 6 min a mais andando, mas sai mais rápido no total.",
      food: "Churro + Dip tem a menor espera agora (3 min). Quer que eu adicione ao pedido?",
      default: "Entendido — encaminhando para o lugar certo. Para rotas, toque em Navegar; para comida, toque em Pedir.",
    },
  },
  fr: {
    greet: "Salut ! Je suis l'assistant StadiumSync. Demandez-moi n'importe quoi — directions, nourriture, transport, accessibilité.",
    replies: {
      restroom: "Les toilettes les plus proches sont à 40m après la Section 118, à gauche après la boutique. L'attente est faible en ce moment.",
      exit: "Votre sortie la plus rapide est la Porte 4 — mais elle est bondée (97%). Je vous suggère l'Esplanade S, 6 minutes de marche en plus mais vous sortirez plus vite au total.",
      food: "Churro + sauce a la file la plus courte en ce moment (3 min). Je l'ajoute à votre commande ?",
      default: "Compris — je vous oriente vers le bon endroit. Pour l'itinéraire, appuyez sur Naviguer ; pour la nourriture, appuyez sur Commander.",
    },
  },
  de: {
    greet: "Hallo! Ich bin dein StadiumSync-Assistent. Frag mich alles — Wegbeschreibung, Essen, Transport, Barrierefreiheit.",
    replies: {
      restroom: "Die nächste Toilette ist 40m hinter Abschnitt 118, links nach dem Fanshop. Gerade kurze Wartezeit.",
      exit: "Dein schnellster Ausgang ist Tor 4 — aber stark ausgelastet (97%). Ich empfehle Bereich S, 6 Minuten mehr Fußweg, aber insgesamt schneller draußen.",
      food: "Churro + Dip hat gerade die kürzeste Wartezeit (3 Min). Soll ich es zu deiner Bestellung hinzufügen?",
      default: "Verstanden — ich leite dich weiter. Für Wegbeschreibung tippe auf Navigieren, für Essen auf Bestellen.",
    },
  },
};

const LANG_DETECT_MARKERS = {
  es: [/\bdónde\b/, /\bbaño\b/, /\bsalida\b/, /\bcomida\b/, /\bcómo\b/, /\bhola\b/, /\bgracias\b/, /[ñ¿¡]/],
  pt: [/\bbanheiro\b/, /\bsaída\b/, /\bcomida\b/, /\bonde\b/, /\bobrigad[oa]\b/, /[ãõç]/],
  fr: [/\btoilettes?\b/, /\bsortie\b/, /\bnourriture\b/, /\boù\b/, /\bmerci\b/, /\bbonjour\b/, /[àâçèêëîïôûù]/],
  de: [/\btoilette\b/, /\bausgang\b/, /\bessen\b/, /\bwo\b/, /\bdanke\b/, /\bhallo\b/, /[äöüß]/],
  en: [/\bwhere\b/, /\brestroom\b/, /\bexit\b/, /\bfood\b/, /\bthanks?\b/, /\bhello\b/, /\bhi\b/],
};

// Best-effort language guess from free text — used to auto-switch the
// assistant's fallback script bank when the fan types instead of tapping a
// language pill. Returns null when no language scores a confident match.
export function detectLang(text) {
  const t = ` ${text.toLowerCase()} `;
  let best = null;
  let bestScore = 0;
  for (const [lang, patterns] of Object.entries(LANG_DETECT_MARKERS)) {
    const score = patterns.reduce((s, p) => s + (p.test(t) ? 1 : 0), 0);
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }
  return best;
}

export function pickReply(lang, text) {
  const t = text.toLowerCase();
  const bank = ASSISTANT_SCRIPT[lang].replies;
  if (t.includes("bath") || t.includes("restroom") || t.includes("baño") || t.includes("banheiro") || t.includes("toilette")) return bank.restroom;
  if (t.includes("exit") || t.includes("salida") || t.includes("saída") || t.includes("sortie") || t.includes("ausgang") || t.includes("leave")) return bank.exit;
  if (t.includes("food") || t.includes("snack") || t.includes("comida") || t.includes("nourriture") || t.includes("essen") || t.includes("hungry") || t.includes("eat")) return bank.food;
  return bank.default;
}
