/**
 * ClassStore — center class / section definitions.
 * Seeds sample classes; teacher can add custom classes (name, age range, notes).
 * Key: brightsteps_classes_v1
 */

const ClassStore = {
  KEY: 'brightsteps_classes_v1',

  DEFAULTS: [
    {
      key: 'explorers',
      name: 'Little Explorers',
      ageMinYears: 0,
      ageMaxYears: 3,
      ageLabel: '0–3 yrs',
      description: 'Infants and toddlers',
      isSample: true,
      active: true
    },
    {
      key: 'stars',
      name: 'Little Stars',
      ageMinYears: 3,
      ageMaxYears: 4,
      ageLabel: '3–4 yrs',
      description: 'Young preschool',
      isSample: true,
      active: true
    },
    {
      key: 'sunshine',
      name: 'Sunshine Group',
      ageMinYears: 4,
      ageMaxYears: 5,
      ageLabel: '4–5 yrs',
      description: 'Older preschool / pre-K',
      isSample: true,
      active: true
    }
  ],

  _read() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch (e) {
      return null;
    }
  },

  _write(list) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  },

  /** Ensure defaults exist once; merge any missing sample keys. */
  ensureSeeded() {
    let list = this._read();
    if (!list || !list.length) {
      list = this.DEFAULTS.map(c => ({ ...c, createdAt: new Date().toISOString() }));
      this._write(list);
      return list;
    }
    // Re-add any missing default keys (don't overwrite teacher edits)
    let changed = false;
    this.DEFAULTS.forEach(d => {
      if (!list.some(c => c.key === d.key)) {
        list.push({ ...d, createdAt: new Date().toISOString() });
        changed = true;
      }
    });
    if (changed) this._write(list);
    return list;
  },

  listAll() {
    return this.ensureSeeded();
  },

  listActive() {
    return this.listAll().filter(c => c.active !== false);
  },

  get(key) {
    return this.listAll().find(c => c.key === key) || null;
  },

  /** Options for filters / dropdowns */
  options(includeAll) {
    const opts = this.listActive().map(c => ({
      key: c.key,
      label: c.ageLabel ? `${c.name} (${c.ageLabel})` : c.name,
      name: c.name,
      ageLabel: c.ageLabel || ''
    }));
    if (includeAll) {
      return [{ key: 'all', label: 'All classes', name: 'All classes', ageLabel: '' }, ...opts];
    }
    return opts;
  },

  _slug(name) {
    const base = String(name || 'class')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 24) || 'class';
    let key = base;
    let i = 2;
    const existing = this.listAll().map(c => c.key);
    while (existing.includes(key)) {
      key = base + '-' + i;
      i++;
    }
    return key;
  },

  _ageLabel(minY, maxY) {
    if (minY == null && maxY == null) return '';
    if (minY != null && maxY != null) return `${minY}–${maxY} yrs`;
    if (minY != null) return `${minY}+ yrs`;
    return `up to ${maxY} yrs`;
  },

  /**
   * Create a custom class.
   * @param {{ name, ageMinYears, ageMaxYears, description }} data
   */
  create(data) {
    const name = (data.name || '').trim();
    if (!name) return { ok: false, error: 'Class name is required.' };

    const ageMinYears = data.ageMinYears !== '' && data.ageMinYears != null
      ? Number(data.ageMinYears) : null;
    const ageMaxYears = data.ageMaxYears !== '' && data.ageMaxYears != null
      ? Number(data.ageMaxYears) : null;

    if (ageMinYears != null && ageMaxYears != null && ageMinYears > ageMaxYears) {
      return { ok: false, error: 'Minimum age cannot be greater than maximum age.' };
    }

    const list = this.listAll();
    const record = {
      key: this._slug(name),
      name,
      ageMinYears,
      ageMaxYears,
      ageLabel: this._ageLabel(ageMinYears, ageMaxYears),
      description: (data.description || '').trim(),
      isSample: false,
      active: true,
      createdAt: new Date().toISOString()
    };
    list.push(record);
    this._write(list);
    return { ok: true, class: record };
  },

  update(key, patch) {
    const list = this.listAll();
    const idx = list.findIndex(c => c.key === key);
    if (idx < 0) return { ok: false, error: 'Class not found.' };
    const cur = list[idx];
    const name = patch.name != null ? String(patch.name).trim() : cur.name;
    if (!name) return { ok: false, error: 'Class name is required.' };

    const ageMinYears = patch.ageMinYears !== undefined
      ? (patch.ageMinYears === '' || patch.ageMinYears == null ? null : Number(patch.ageMinYears))
      : cur.ageMinYears;
    const ageMaxYears = patch.ageMaxYears !== undefined
      ? (patch.ageMaxYears === '' || patch.ageMaxYears == null ? null : Number(patch.ageMaxYears))
      : cur.ageMaxYears;

    list[idx] = {
      ...cur,
      name,
      ageMinYears,
      ageMaxYears,
      ageLabel: this._ageLabel(ageMinYears, ageMaxYears),
      description: patch.description !== undefined ? String(patch.description || '').trim() : cur.description,
      active: patch.active !== undefined ? !!patch.active : cur.active,
      updatedAt: new Date().toISOString()
    };
    this._write(list);
    return { ok: true, class: list[idx] };
  },

  /** Soft-deactivate (keeps history for enrolled children). Sample classes can be deactivated too. */
  deactivate(key) {
    return this.update(key, { active: false });
  },

  displayName(key) {
    const c = this.get(key);
    return c ? c.name : key;
  }
};

if (typeof window !== 'undefined') window.ClassStore = ClassStore;
