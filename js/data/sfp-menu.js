/**
 * Official 15th Cycle SFP 20-day cycle menu (DSWD Field Office X).
 * Day numbers match the paper menu; Sat/Sun = Alternative Foods Products.
 * Source: DSWD-GF-010A | REV 00 | 22 SEP 2023 (as on NCDC copy).
 */
const SfpMenu = {
  cycleLabel: '15th Cycle',
  title: '20 Days Cycle Menu',
  regionNote: 'Province of Misamis Oriental, Camiguin, Misamis Occidental, Bukidnon & Iligan City',

  /** dayNumber (1-based) → { weekday, dish, isAlternative } */
  days: {
    1:  { weekday: 'Monday',    dish: 'Rice · Adobong String Beans', isAlternative: false },
    2:  { weekday: 'Tuesday',   dish: 'Rice · Chicken Adobo', isAlternative: false },
    3:  { weekday: 'Wednesday', dish: 'Meaty Spaghetti', isAlternative: false },
    4:  { weekday: 'Thursday',  dish: 'Rice · Sunny Side Up', isAlternative: false },
    5:  { weekday: 'Friday',    dish: 'Rice · Piniyangang Manok', isAlternative: false },
    6:  { weekday: 'Saturday',  dish: 'Alternative Foods Products', isAlternative: true },
    7:  { weekday: 'Sunday',    dish: 'Alternative Foods Products', isAlternative: true },
    8:  { weekday: 'Monday',    dish: 'Rice · Beef Nilaga with Cabbage', isAlternative: false },
    9:  { weekday: 'Tuesday',   dish: 'Rice · Tuna Flakes with Egg', isAlternative: false },
    10: { weekday: 'Wednesday', dish: 'Rice · Chicken with Oyster Sauce', isAlternative: false },
    11: { weekday: 'Thursday',  dish: 'Rice · Fried Fish', isAlternative: false },
    12: { weekday: 'Friday',    dish: 'Rice · Chicken Sotanghon Guisado', isAlternative: false },
    13: { weekday: 'Saturday',  dish: 'Alternative Foods Products', isAlternative: true },
    14: { weekday: 'Sunday',    dish: 'Alternative Foods Products', isAlternative: true },
    15: { weekday: 'Monday',    dish: 'Rice · Chicken Afritada', isAlternative: false },
    16: { weekday: 'Tuesday',   dish: 'Pancake', isAlternative: false },
    17: { weekday: 'Wednesday', dish: 'Rice · Beef Steak', isAlternative: false },
    18: { weekday: 'Thursday',  dish: 'Rice · Chicken Tinola', isAlternative: false },
    19: { weekday: 'Friday',    dish: 'Rice · Monggo Guisado with Dilis', isAlternative: false },
    20: { weekday: 'Saturday',  dish: 'Alternative Foods Products', isAlternative: true },
    21: { weekday: 'Sunday',    dish: 'Alternative Foods Products', isAlternative: true },
    22: { weekday: 'Monday',    dish: 'Rice · Tuna with Squash & Sayote', isAlternative: false },
    23: { weekday: 'Tuesday',   dish: 'Rice · Battered Chicken', isAlternative: false },
    24: { weekday: 'Wednesday', dish: 'Champorado', isAlternative: false },
    25: { weekday: 'Thursday',  dish: 'Rice · Beef with Teriyaki Sauce', isAlternative: false },
    26: { weekday: 'Friday',    dish: 'Rice · Tuna Lumpiang Hubad (Baguio beans, carrots, potato)', isAlternative: false },
    27: { weekday: 'Saturday',  dish: 'Alternative Foods Products', isAlternative: true },
    28: { weekday: 'Sunday',    dish: 'Alternative Foods Products', isAlternative: true }
  },

  get(dayNumber) {
    const n = Number(dayNumber);
    return this.days[n] || { weekday: '', dish: '—', isAlternative: false };
  },

  list() {
    return Object.keys(this.days)
      .map(Number)
      .sort((a, b) => a - b)
      .map(n => ({ dayNumber: n, ...this.days[n] }));
  }
};

if (typeof window !== 'undefined') window.SfpMenu = SfpMenu;
