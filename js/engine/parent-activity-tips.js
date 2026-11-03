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
    if (m == null || isNaN(m) || m < 0) return 'earlyToddler';
    if (m < 12) return 'infant';
    if (m < 24) return 'earlyToddler';  // 12–23 mo
    if (m < 36) return 'lateToddler';   // 24–35 mo
    return 'preschool';                 // 36+ mo
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
      earlyToddler: [
        'Hold both hands and practice standing or a few supported steps indoors.',
        'Roll a soft ball back and forth while they sit or kneel.',
        'Cruise along a low sofa or table with toys placed a step apart.',
        'Sway and bounce to music while you support them under the arms.'
      ],
      lateToddler: [
        'Play “stand and clap” or walk a short clear path holding one finger.',
        'Kick or roll a soft ball outdoors for a few minutes.',
        'Practice 2–3 low steps while you hold their hand.',
        'Dance together—march, stomp, and freeze when the music stops.'
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
      earlyToddler: [
        'Put large blocks into a box and dump them out again.',
        'Scribble freely with thick crayons on big paper.',
        'Stack 2–3 large cups or soft blocks together.',
        'Turn the pages of a board book with your help.'
      ],
      lateToddler: [
        'Stack 4–6 blocks or plastic cups into a short tower.',
        'Draw simple lines and circles with crayons.',
        'Play with playdough—squeeze, pinch, and roll snakes.',
        'String large beads or pasta on a thick lace with help.'
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
      earlyToddler: [
        'Let them hold a spoon or cup during meals even if you still feed them.',
        'Practice pulling off socks or a loose hat after going outside.',
        'Wash hands together and sing a short scrubbing song.',
        'Help them push arms through sleeves; finish buttons yourself.'
      ],
      lateToddler: [
        'Encourage self-feeding with a spoon for part of the meal.',
        'Practice taking off shoes and socks after outdoor play.',
        'Wash hands with less help: soap, rinse, dry.',
        'Offer two outfit choices and let them try putting on a shirt.'
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
      earlyToddler: [
        'Give one short direction in play (“Give me the ball”).',
        'Point to pictures in a book and name them together.',
        'Play “show me”: show me your nose, show me the cup.',
        'Sing action songs and guide their hands through the moves.'
      ],
      lateToddler: [
        'Give one clear direction at a time (“Please bring your shoes”).',
        'Read a short book and ask them to point to animals or colors.',
        'Play Simon Says with easy actions (clap, sit, wave).',
        'Ask them to fetch a familiar object from another room.'
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
      earlyToddler: [
        'Name objects they hand you and wait for any sound or word back.',
        'Expand one-word tries: if they say “ball,” reply “Yes, big ball!”',
        'Sing short rhymes and leave a pause for them to fill a sound.',
        'Talk about pictures—ask “What’s that?” and accept gestures.'
      ],
      lateToddler: [
        'Ask simple questions and wait for a word or short phrase.',
        'Expand their words into a short sentence without correcting harshly.',
        'Invite them to finish lines in familiar songs.',
        'Encourage “more,” “help,” and “please” during daily routines.'
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
      earlyToddler: [
        'Hide a toy under a cloth and find it together.',
        'Put lids on containers and take them off again.',
        'Match two identical toys or picture cards.',
        'Count “one, two” while stacking blocks.'
      ],
      lateToddler: [
        'Sort spoons and cups by size during clean-up.',
        'Match pairs of picture cards or socks.',
        'Complete a simple 3–6 piece puzzle together.',
        'Count steps or snacks up to three or four.'
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
      earlyToddler: [
        'Stay close during new situations so they can check in with you.',
        'Name feelings simply: happy, sad, tired.',
        'Practice short turn-taking with one toy (“My turn, your turn”).',
        'Praise gentle touches and sharing tries.'
      ],
      lateToddler: [
        'Name feelings: “You look frustrated; let’s take a breath.”',
        'Practice waiting for a turn in a short game.',
        'Role-play saying hello and bye to familiar people.',
        'Praise kind acts like sharing a toy with a sibling.'
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
      match: /reaches for and grasps|reaches for and holds|rattle|dangling object/i,
      minMonths: 0,
      maxMonths: 18,
      tips: [
        'Offer a light rattle or soft ring and wait for them to reach and hold it.',
        'Place toys at different heights so they practice reaching in several directions.'
      ]
    },
    {
      domain: 'FM',
      match: /pincer grasp|thumb and index|pads of his thumb|neat pincer|picks up objects with thumb/i,
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

    // --- More Gross Motor (checklist titles) ---
    {
      domain: 'GM',
      match: /bounces? when held standing|bearing weight on legs/i,
      minMonths: 4,
      maxMonths: 18,
      tips: [
        'Hold your baby under the arms and let their feet touch your lap—gentle bounces while you sing.',
        'Support them standing on your thighs for short moments during play.'
      ]
    },
    {
      domain: 'GM',
      match: /walks? sideways|holds furniture with both hands/i,
      minMonths: 8,
      maxMonths: 24,
      tips: [
        'Place toys along a low sofa so they side-step (cruise) while holding on.',
        'Put sturdy chairs a step apart so they move sideways between them with support.'
      ]
    },
    {
      domain: 'GM',
      match: /walks? backwards|backward/i,
      minMonths: 12,
      maxMonths: 36,
      tips: [
        'Hold both hands and take a few steps backward together in an open room.',
        'Play “come to me” then gently guide one step back while facing you.'
      ]
    },
    {
      domain: 'GM',
      match: /walks? (up|down) stairs|handrail|alternate feet/i,
      minMonths: 14,
      maxMonths: 72,
      tips: [
        'Practice 2–3 home steps: hold one hand and go slowly, same foot or alternating.',
        'Use a safe stair with a rail and stay one step below them.'
      ]
    },
    {
      domain: 'GM',
      match: /climbs? on chair|elevated furniture/i,
      minMonths: 12,
      maxMonths: 48,
      tips: [
        'With you beside them, let them climb onto a low sturdy chair or sofa cushion.',
        'Make a “mountain” of firm floor pillows to climb up and down.'
      ]
    },
    // --- More Fine Motor (checklist titles) ---
    {
      domain: 'FM',
      match: /hands? .* open|predominantly open/i,
      minMonths: 0,
      maxMonths: 12,
      tips: [
        'Stroke open palms with a soft cloth or rattle so hands stay relaxed and open.',
        'Offer lightweight toys that fit easily into an open hand.'
      ]
    },
    {
      domain: 'FM',
      match: /midline|hands together/i,
      minMonths: 2,
      maxMonths: 12,
      tips: [
        'Hold a soft toy at the center of their chest so both hands meet on it.',
        'During dressing, gently bring both hands together on a button or zipper for a moment.'
      ]
    },
    {
      domain: 'FM',
      match: /transfers? object|one hand to the other/i,
      minMonths: 4,
      maxMonths: 18,
      tips: [
        'Give a toy to one hand, then offer a second toy so they pass or switch hands.',
        'Play “give and take”: they hand you a block, you hand it back to the other hand.'
      ]
    },
    {
      domain: 'FM',
      match: /raking grasp|all five fingers to get/i,
      minMonths: 5,
      maxMonths: 18,
      tips: [
        'Scatter a few large soft pieces of food or toys on a tray so they rake them toward themselves.',
        'Use a shallow bowl of safe toys and let them scoop with the whole hand.'
      ]
    },
    {
      domain: 'FM',
      match: /neat pincer|thumb and index|pincer grasp/i,
      minMonths: 8,
      maxMonths: 36,
      tips: [
        'Offer small soft finger foods so they pinch with thumb and pointer finger.',
        'Put large buttons or bottle caps in a muffin tray—pick up one at a time.'
      ]
    },
    {
      domain: 'FM',
      match: /pulls? toy with string|string/i,
      minMonths: 10,
      maxMonths: 36,
      tips: [
        'Tie a short soft string to a favorite toy and show how to pull it toward them.',
        'Play “pull the duck” across a smooth floor for a few steps.'
      ]
    },
    {
      domain: 'FM',
      match: /hand preference|definite hand/i,
      minMonths: 12,
      maxMonths: 48,
      tips: [
        'Place crayons or spoons at the middle of the table and notice which hand they choose.',
        'Offer toys at the center so they can freely pick a preferred hand—no forcing.'
      ]
    },
    {
      domain: 'FM',
      match: /puts? small objects into a container|into a container/i,
      minMonths: 10,
      maxMonths: 36,
      tips: [
        'Give a plastic container and large bottle caps to drop in and dump out.',
        'Use a clean empty bottle and drop clothespins or large beads in together.'
      ]
    },
    {
      domain: 'FM',
      match: /pushes? or pulls a wheeled|wheeled toy/i,
      minMonths: 12,
      maxMonths: 36,
      tips: [
        'Offer a small push car or toy with wheels on a clear floor path.',
        'Sit facing them and roll a wheeled toy back and forth.'
      ]
    },
    {
      domain: 'FM',
      match: /holds? crayon with fingers|not fist|tripod|five fingers.*crayon/i,
      minMonths: 18,
      maxMonths: 60,
      tips: [
        'Offer short thick crayons so fingers naturally rest near the tip.',
        'Scribble together on big paper; gently model a fingertip hold without forcing.'
      ]
    },
    {
      domain: 'FM',
      match: /unscrews?|lid of (a )?(bottle|jar|container)/i,
      minMonths: 18,
      maxMonths: 60,
      tips: [
        'Practice opening a large plastic jar lid together during snack clean-up.',
        'Play “open the container” with a loosely screwed lid on a toy box.'
      ]
    },
    {
      domain: 'FM',
      match: /scribbles? spontaneously|scribbles? vertical|horizontal lines|draws? circle|human figure|draws? a house/i,
      minMonths: 12,
      maxMonths: 72,
      tips: [
        'Keep crayons and paper where they can scribble freely every day.',
        'Draw big lines and circles; invite them to copy only if they want.',
        'Talk about their marks: “You made a long line!” to keep drawing fun.'
      ]
    },
    {
      domain: 'FM',
      match: /imitates drawing|builds? a tower|tower of/i,
      minMonths: 12,
      maxMonths: 60,
      tips: [
        'Stack large blocks together—start with 2–3, then try one more.',
        'Take turns placing one block each to build a short tower.'
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
    const m = Number(ageMonths);
    const ageOk = (min, max) => {
      if (m == null || isNaN(m)) return true;
      if (min != null && m < min) return false;
      if (max != null && m > max) return false;
      return true;
    };

    const out = [];
    const seen = new Set();
    // Prefer more specific matches: longer pattern sources first by scanning all, keep order in array (specific patterns listed before broad ones)
    this.skillPatterns.forEach(p => {
      if (domain && p.domain && p.domain !== domain) return;
      if (!ageOk(p.minMonths, p.maxMonths)) return;
      if (!title || !p.match.test(title)) return;
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
    const list = block[band] || block.earlyToddler || block.lateToddler || block.infant || block.preschool || [];
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
    // 1) Item-specific tips first (tied to unchecked skills)
    items.forEach(fi => {
      if (lines.length >= max) return;
      const itemTips = this.tipsForItem(fi, ageMonths);
      const dName = fi.domainName || fi.domainCode || '';
      itemTips.slice(0, 2).forEach(tip => push(dName, tip));
    });

    // 2) Domain fallback only for domains that still need a tip (max 1 each)
    if (lines.length < Math.min(4, max)) {
      const nameMap = {
        GM: 'Gross Motor', FM: 'Fine Motor', SH: 'Self-Help',
        RL: 'Receptive Language', EL: 'Expressive Language',
        COG: 'Cognitive', SE: 'Social-Emotional'
      };
      const codes = (domainCodes || []).filter((c, i, arr) => c && arr.indexOf(c) === i);
      codes.forEach(code => {
        if (lines.length >= max) return;
        const already = lines.some(l => l.indexOf((nameMap[code] || code) + ':') === 0);
        if (already) return;
        const dName = nameMap[code] || code;
        const one = this.tipsForDomain(code, ageMonths, 1);
        if (one[0]) push(dName, one[0]);
      });
    }

    return lines;
  }
};

if (typeof window !== 'undefined') window.ParentActivityTips = ParentActivityTips;
