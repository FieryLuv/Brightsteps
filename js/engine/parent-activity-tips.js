/**
 * Parent-friendly, age-aware home activities for BrightSteps progress insights.
 * Used by ProgressEngine instead of raw ECCD procedures (too technical for parents).
 *
 * Age bands (months):
 *   infant   0–11
 *   toddler  12–35
 *   preschool 36+
 */
var ParentActivityTips = {
  ageBand(ageMonths) {
    const m = Number(ageMonths);
    if (m == null || isNaN(m) || m < 0) return 'toddler';
    if (m < 12) return 'infant';
    if (m < 36) return 'toddler';
    return 'preschool';
  },

  /** Soft domain activities when no item-specific match (still age-filtered). */
  domainTips: {
    GM: {
      infant: [
        'Give supervised tummy time several times a day so your baby can push up and look around.',
        'Hold your baby upright against your chest so they can practice keeping their head steady.',
        'Place a favorite toy just out of reach during tummy time to encourage reaching and rolling.',
        'Support your baby under the arms and gently bounce or sway while you sing.'
      ],
      toddler: [
        'Play “stand and clap” or hold both hands while they take steps between furniture.',
        'Roll a soft ball back and forth on the floor to practice bending and balancing.',
        'Let them climb a low, safe step or sofa cushion with you close by.',
        'Dance together to music—marching, swaying, and stomping in place.'
      ],
      preschool: [
        'Play outdoor games: run to a tree, hop to a mark, or kick a soft ball.',
        'Practice balancing on one foot for a few seconds, then switch sides—make it a game.',
        'Set up a simple obstacle path (walk on a line, step over a pillow, crawl under a chair).',
        'Throw and catch a soft ball or beanbag at short distance.'
      ]
    },
    FM: {
      infant: [
        'Offer safe rattles or soft toys they can grasp and bring to the mouth.',
        'During play, gently help them hold a toy in each hand for a moment.',
        'Let them bat at hanging toys while lying on their back.',
        'Give finger foods (when ready) so they can practice picking up small pieces.'
      ],
      toddler: [
        'Stack large blocks or plastic cups together.',
        'Scribble with thick crayons on big paper.',
        'Play with playdough—squeeze, pinch, and roll simple shapes.',
        'Put large beads or pasta on a thick string with your help.'
      ],
      preschool: [
        'Draw, color, and cut simple shapes with child scissors (with supervision).',
        'Button a large button or zip a jacket together as a daily routine game.',
        'Build with small blocks or simple puzzles (4–12 pieces).',
        'Practice writing lines and circles in sand, flour, or on paper.'
      ]
    },
    SH: {
      infant: [
        'Hold a soft spoon near their mouth during meals so they can touch and explore it.',
        'Let them hold a bottle or cup with both hands when they are ready.',
        'Talk through diaper and dressing steps so routines feel familiar.',
        'Praise any try at wiping hands or face with a soft cloth.'
      ],
      toddler: [
        'Let them try feeding themselves with a spoon—even if it is messy.',
        'Practice pulling off socks or a loose hat after outdoor play.',
        'Wash hands together: soap, rinse, dry—count the steps out loud.',
        'Offer choices of two outfits so they can help with dressing.'
      ],
      preschool: [
        'Encourage putting on shoes, shirt, or shorts with less help each week.',
        'Practice using the toilet and washing hands as a consistent routine.',
        'Let them pour water from a small pitcher into a cup at snack time.',
        'Ask them to pack a small bag or put toys away before meals.'
      ]
    },
    RL: {
      infant: [
        'Talk face-to-face and name what you are doing (“I’m washing your hands”).',
        'Point to body parts and objects while saying their names.',
        'Play peek-a-boo and pause so they can watch and respond.',
        'Read simple board books and point to pictures together.'
      ],
      toddler: [
        'Give one simple direction at a time (“Please bring the ball”).',
        'Read a short picture book and ask them to point to animals or colors.',
        'Play “show me” games: show me your nose, show me the cup.',
        'Sing action songs (“Head, shoulders…”) and do the movements together.'
      ],
      preschool: [
        'Give two-step directions in play (“Get the book and sit on the mat”).',
        'Ask questions about a story: “Where did the dog go?”',
        'Play Simon Says with easy actions.',
        'Talk about the day: what happened first, next, and last.'
      ]
    },
    EL: {
      infant: [
        'Copy their sounds (babbling) and wait for them to “talk” back.',
        'Name feelings and needs: “You’re hungry,” “You’re happy.”',
        'Sing short songs and leave a pause for them to fill with sounds.',
        'Celebrate any new sound or word with smiles and clapping.'
      ],
      toddler: [
        'Ask simple questions and wait patiently for a word or gesture.',
        'Expand what they say: if they say “ball,” you say “Yes, red ball!”',
        'Sing nursery rhymes and encourage them to join familiar words.',
        'Talk about pictures in books—ask “What’s that?” and listen.'
      ],
      preschool: [
        'Invite them to tell a short story about their drawing or day.',
        'Play pretend phone calls or store games so they practice talking.',
        'Learn new words during walks: names of plants, vehicles, and places.',
        'Encourage full sentences: “I want juice, please.”'
      ]
    },
    COG: {
      infant: [
        'Hide a toy under a cloth and reveal it—play simple peek games.',
        'Offer two toys and notice which one they look at or reach for.',
        'Stack two soft blocks and let them knock them down.',
        'Explore safe household objects (wooden spoon, plastic bowl) with you watching.'
      ],
      toddler: [
        'Sort spoons and cups by size during clean-up.',
        'Match two picture cards or identical toys.',
        'Complete a simple 2–4 piece puzzle together.',
        'Count steps as you walk (“One, two, three…”)'
      ],
      preschool: [
        'Sort objects by color, shape, or size in a game.',
        'Play simple memory games with a few picture cards.',
        'Count objects at snack (crackers, fruit pieces) up to five or ten.',
        'Ask “what happens next?” during familiar routines or stories.'
      ]
    },
    SE: {
      infant: [
        'Respond quickly to cries with calm holding and soft talk.',
        'Smile and make eye contact during feeding and play.',
        'Keep a short, predictable daily routine so they feel secure.',
        'Introduce new people slowly while you stay close.'
      ],
      toddler: [
        'Name feelings: “You look frustrated; let’s take a breath.”',
        'Practice short turn-taking with a toy (“My turn, your turn”).',
        'Praise kind acts: sharing a toy or hugging a sibling.',
        'Stay nearby during playdates so they can check in with you.'
      ],
      preschool: [
        'Role-play saying “please,” “thank you,” and “I’m sorry.”',
        'Practice waiting for a turn in a board game or line.',
        'Talk about friends’ feelings after preschool or play.',
        'Give small jobs at home (wipe table, water plants) to build confidence.'
      ]
    }
  },

  /**
   * Skill-specific tips matched from checklist item titles.
   * minMonths / maxMonths limit when a tip is appropriate.
   */
  skillPatterns: [
    // --- Gross motor ---
    {
      domain: 'GM',
      match: /lift(?:s)? head|head upright|head erect|chin is off/i,
      minMonths: 0,
      maxMonths: 12,
      tips: [
        'During supervised tummy time, place a colorful toy in front so your baby lifts their head to look.',
        'Hold your baby upright on your shoulder and slowly lean back a little so they practice steadying the head.'
      ]
    },
    {
      domain: 'GM',
      match: /roll|rolling/i,
      minMonths: 2,
      maxMonths: 18,
      tips: [
        'Place a toy slightly to the side during tummy or back time so your baby turns and practices rolling.',
        'Gently help them roll from back to tummy once, then let them try while you stay close.'
      ]
    },
    {
      domain: 'GM',
      match: /sit|sitting/i,
      minMonths: 4,
      maxMonths: 24,
      tips: [
        'Sit your child between your legs or on a firm cushion and play face-to-face with toys.',
        'Place toys around them in a circle so they reach without losing balance while sitting.'
      ]
    },
    {
      domain: 'GM',
      match: /crawl|creep|on (all )?fours|hands and knees/i,
      minMonths: 5,
      maxMonths: 24,
      tips: [
        'Put a favorite toy a short distance away on the floor so they move toward it on hands and knees.',
        'Make a small tunnel with pillows or a low chair for them to crawl through with you watching.'
      ]
    },
    {
      domain: 'GM',
      match: /stand|standing|pulls? to stand|upright position/i,
      minMonths: 6,
      maxMonths: 30,
      tips: [
        'Let them hold the edge of a low table or sofa and play with toys while standing.',
        'Sit on the floor and hold both hands while they practice standing and bouncing gently.',
        'Place sturdy furniture close together so they can cruise (side-step) between supports.'
      ]
    },
    {
      domain: 'GM',
      match: /walk|steps|cruising/i,
      minMonths: 8,
      maxMonths: 36,
      tips: [
        'Hold both hands and take slow steps together indoors on a clear floor.',
        'Encourage walking from you to another familiar adult a few steps away.',
        'Push a stable push-toy or small cart on a flat surface for support.'
      ]
    },
    {
      domain: 'GM',
      match: /run|running/i,
      minMonths: 18,
      maxMonths: 72,
      tips: [
        'Play chase games in a safe open space—walk fast first, then short runs together.',
        'Set two markers a short distance apart and race slowly side by side.'
      ]
    },
    {
      domain: 'GM',
      match: /jump|hop|skip/i,
      minMonths: 24,
      maxMonths: 72,
      tips: [
        'Jump off a very low step while holding your hands.',
        'Jump in place to music or over a soft rope on the floor.'
      ]
    },
    {
      domain: 'GM',
      match: /kick|ball|throw|catch|balance|one foot/i,
      minMonths: 18,
      maxMonths: 72,
      tips: [
        'Roll or gently kick a soft ball back and forth outdoors or in a hallway.',
        'Practice standing on one foot while holding your hand, then try alone for 2–3 seconds.',
        'Throw a soft ball or beanbag into a basket from a short distance.'
      ]
    },
    {
      domain: 'GM',
      match: /climb|stairs|ladder/i,
      minMonths: 12,
      maxMonths: 72,
      tips: [
        'Practice going up and down 2–3 steps while you hold their hand.',
        'Use a low playground step or sturdy stool with close supervision.'
      ]
    },
    // --- Fine motor ---
    {
      domain: 'FM',
      match: /grasp|hold|reach|rattle|grasp/i,
      minMonths: 0,
      maxMonths: 18,
      tips: [
        'Offer a light rattle or soft ring and wait for them to reach and hold it.',
        'Place toys at different heights so they practice reaching in several directions.'
      ]
    },
    {
      domain: 'FM',
      match: /pincer|pick up|small object|crumb|pellet/i,
      minMonths: 7,
      maxMonths: 36,
      tips: [
        'Offer safe finger foods (soft pieces) so they practice the thumb-and-finger pick-up.',
        'Play with large buttons or bottle caps in a bowl—pick up and drop in a container.'
      ]
    },
    {
      domain: 'FM',
      match: /stack|block|tower/i,
      minMonths: 10,
      maxMonths: 60,
      tips: [
        'Stack two or three large blocks together, then let them knock the tower down.',
        'Build a short tower and take turns adding one block each.'
      ]
    },
    {
      domain: 'FM',
      match: /draw|scribble|write|crayon|pencil|color/i,
      minMonths: 12,
      maxMonths: 72,
      tips: [
        'Give thick crayons and large paper for free scribbling every day.',
        'Draw big circles and lines together; let them copy if they want.'
      ]
    },
    {
      domain: 'FM',
      match: /bead|string|thread|scissors|cut/i,
      minMonths: 24,
      maxMonths: 72,
      tips: [
        'String large beads or pasta on a thick shoelace with your help.',
        'Practice snipping paper strips with child scissors while you watch.'
      ]
    },
    // --- Self-help ---
    {
      domain: 'SH',
      match: /feed|spoon|cup|drink|eat/i,
      minMonths: 6,
      maxMonths: 60,
      tips: [
        'Let them hold a spoon or cup during meals even if you still help.',
        'Offer small portions so self-feeding practice stays short and positive.'
      ]
    },
    {
      domain: 'SH',
      match: /dress|undress|shirt|socks|shoes|button|zip/i,
      minMonths: 12,
      maxMonths: 72,
      tips: [
        'Let them pull off socks or push arms through sleeves; finish the rest together.',
        'Practice large buttons or a zipper on a jacket laid on the table as a game.'
      ]
    },
    {
      domain: 'SH',
      match: /wash|hand|toilet|potty|hygiene/i,
      minMonths: 12,
      maxMonths: 72,
      tips: [
        'Wash hands together after meals—sing a short song while scrubbing.',
        'Keep a small step stool by the sink so they can reach with less help.'
      ]
    },
    // --- Language ---
    {
      domain: 'RL',
      match: /point|identify|name|picture|follow.*direction|command|understand/i,
      minMonths: 6,
      maxMonths: 72,
      tips: [
        'Ask them to point to familiar things: “Where is the ball?” “Show me your nose.”',
        'Give one clear direction during routines: “Please bring your shoes.”'
      ]
    },
    {
      domain: 'EL',
      match: /babble|sound|word|speak|say|name|sentence|talk|verbal/i,
      minMonths: 0,
      maxMonths: 72,
      tips: [
        'Talk about what you both see and do; pause so they can answer with sounds or words.',
        'Repeat and gently expand their words into a short phrase without pressure.'
      ]
    },
    // --- Cognitive ---
    {
      domain: 'COG',
      match: /object permanence|find|hide|cover|search/i,
      minMonths: 4,
      maxMonths: 24,
      tips: [
        'Hide a toy under a washcloth in front of them and ask “Where is it?”',
        'Play peek-a-boo with a blanket, then hide a toy the same way.'
      ]
    },
    {
      domain: 'COG',
      match: /match|sort|same|different|puzzle|count|number|color|shape/i,
      minMonths: 18,
      maxMonths: 72,
      tips: [
        'Sort spoons and forks into two piles together.',
        'Match pairs of socks or picture cards as a quick game.'
      ]
    },
    // --- Social-emotional ---
    {
      domain: 'SE',
      match: /smile|eye contact|social|wave|bye|stranger|emotion|share|turn|friend|play with/i,
      minMonths: 0,
      maxMonths: 72,
      tips: [
        'Practice waving bye-bye and saying hello to familiar people.',
        'Take turns with a toy for a few seconds and say “my turn / your turn.”',
        'Name feelings in daily life: happy, sad, tired—so they learn the words.'
      ]
    }
  ],

  /**
   * @param {{ title?: string, itemTitle?: string, domainCode?: string }} item
   * @param {number|null} ageMonths
   * @returns {string[]}
   */
  tipsForItem(item, ageMonths) {
    const title = String((item && (item.itemTitle || item.title || item.name)) || '');
    const domain = (item && (item.domainCode || item.domain_code)) || '';
    const band = this.ageBand(ageMonths);
    const m = Number(ageMonths);
    const ageOk = (min, max) => {
      if (m == null || isNaN(m)) return true;
      if (min != null && m < min) return false;
      if (max != null && m > max) return false;
      return true;
    };

    const out = [];
    const seen = new Set();
    this.skillPatterns.forEach(p => {
      if (domain && p.domain && p.domain !== domain) return;
      if (!ageOk(p.minMonths, p.maxMonths)) return;
      if (!p.match.test(title)) return;
      (p.tips || []).forEach(tip => {
        if (!seen.has(tip)) {
          seen.add(tip);
          out.push(tip);
        }
      });
    });
    return out;
  },

  tipsForDomain(domainCode, ageMonths, limit) {
    const band = this.ageBand(ageMonths);
    const block = this.domainTips[domainCode] || this.domainTips[String(domainCode).toUpperCase()];
    if (!block) return [];
    const list = block[band] || block.toddler || [];
    return list.slice(0, limit == null ? 3 : limit);
  },

  /**
   * Build parent tip lines for a set of missing items + domains.
   * Prefers skill-specific, age-safe tips; falls back to domain activities.
   */
  buildTipLines(focusItems, domainCodes, ageMonths, maxLines) {
    const max = maxLines || 10;
    const lines = [];
    const seen = new Set();
    const push = (domainName, tip) => {
      if (!tip || seen.has(tip) || lines.length >= max) return;
      seen.add(tip);
      const prefix = domainName ? (domainName + ': ') : '';
      lines.push(prefix + tip);
    };

    const items = Array.isArray(focusItems) ? focusItems : [];
    items.forEach(fi => {
      if (lines.length >= max) return;
      const tips = this.tipsForItem(fi, ageMonths);
      const dName = fi.domainName || fi.domainCode || '';
      if (tips.length) {
        push(dName, tips[0]);
        if (tips[1] && lines.length < max) push(dName, tips[1]);
      }
    });

    (domainCodes || []).forEach(code => {
      if (lines.length >= max) return;
      const nameMap = {
        GM: 'Gross Motor', FM: 'Fine Motor', SH: 'Self-Help',
        RL: 'Receptive Language', EL: 'Expressive Language',
        COG: 'Cognitive', SE: 'Social-Emotional'
      };
      const dName = nameMap[code] || code;
      this.tipsForDomain(code, ageMonths, 2).forEach(tip => push(dName, tip));
    });

    return lines;
  }
};

if (typeof window !== 'undefined') window.ParentActivityTips = ParentActivityTips;
