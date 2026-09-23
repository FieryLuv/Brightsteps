/**
 * BrightSteps + Official ECCD Scoring Engine
 *
 * Official pipeline:
 *   raw score → scaled score (age band table) → sum → standard score → interpretation
 *
 * BrightSteps additions:
 *   strengths / needs, parent-friendly draft text
 */

const ProgressEngine = {
  version: '0.5.0-trends',
  tables: null,

  async loadTables() {
    if (this.tables) return this.tables;
    try {
      const res = await fetch('js/data/eccd_scoring_tables.json');
      this.tables = await res.json();
      return this.tables;
    } catch (e) {
      console.warn('[ProgressEngine] scoring tables not loaded', e);
      this.tables = null;
      return null;
    }
  },

  resolveAgeBand(recordKey, ageMonths) {
    if (!this.tables || ageMonths == null) return null;
    const bands = this.tables.ageBands[recordKey] || [];
    return bands.find(b => ageMonths >= b.minMonths && ageMonths <= b.maxMonths) || null;
  },

  lookupScaledScore(ageBandId, domainCode, rawScore) {
    if (!this.tables || rawScore == null) return null;
    const table = this.tables.scaledScoreTables[ageBandId];
    if (!table || !table.rows) return null;
    const raw = Number(rawScore);
    for (const row of table.rows) {
      const range = row[domainCode];
      if (!range) continue;
      const [lo, hi] = range;
      if (raw >= lo && raw <= hi) return row.scaled;
    }
    return null;
  },

  /** Sum of scaled scores → standard score (official table) */
  lookupStandardScore(recordKey, sumScaled) {
    if (!this.tables || sumScaled == null) return null;
    const table = this.tables.standardScoreTables && this.tables.standardScoreTables[recordKey];
    if (!table || !table.rows || !table.rows.length) return null;
    const sum = Number(sumScaled);
    // exact match first
    const exact = table.rows.find(r => r.sum === sum);
    if (exact) return exact.standard;
    // nearest lower sum (table may have gaps)
    let best = null;
    for (const r of table.rows) {
      if (r.sum <= sum && (best == null || r.sum > best.sum)) best = r;
    }
    return best ? best.standard : null;
  },

  interpretScaled(scaled) {
    if (scaled == null || !this.tables) return null;
    return this.tables.scaledScoreInterpretation.find(
      b => scaled >= b.min && scaled <= b.max
    ) || null;
  },

  interpretStandard(standard) {
    if (standard == null || !this.tables) return null;
    return this.tables.standardScoreInterpretation.find(
      b => standard >= b.min && standard <= b.max
    ) || null;
  },

  /**
   * @param {object} assessment
   *   recordType, ageMonths, period,
   *   domainScores: { CODE: { present, total, percent, name } }
   * @returns {Promise<object>} insight
   */
  async analyze(assessment) {
    await this.loadTables();

    const recordKey = assessment.recordType === 2 ? 'record2' : 'record1';
    const ageMonths = assessment.ageMonths;
    const band = this.resolveAgeBand(recordKey, ageMonths);

    const domainResults = [];
    let sumScaled = 0;
    let scaledCount = 0;
    const strengths = [];
    const needs = [];

    const order = (this.tables && this.tables.domainOrder) || Object.keys(assessment.domainScores || {});

    for (const code of order) {
      const ds = (assessment.domainScores || {})[code];
      if (!ds) continue;

      const raw = ds.present;
      const scaled = band ? this.lookupScaledScore(band.id, code, raw) : null;
      const interp = this.interpretScaled(scaled);
      const name = (this.tables && this.tables.domainNames[code]) || ds.name || code;

      if (scaled != null) {
        sumScaled += scaled;
        scaledCount++;
      }

      domainResults.push({
        code,
        name,
        raw,
        total: ds.total,
        percent: ds.percent,
        scaled,
        interpretation: interp
          ? {
              code: interp.code,
              label: interp.label,
              description: interp.description,
              level: interp.level
            }
          : null
      });

      if (interp && scaled != null) {
        if (scaled >= 14) strengths.push(`${name}: ${interp.label}`);
        else if (scaled >= 10 && scaled <= 13) strengths.push(`${name}: average`);
        if (interp.level === 'needs_support' || interp.level === 'emerging') {
          needs.push(`${name}: ${interp.label}`);
        }
      } else if (ds.percent != null) {
        // Temporary fallback until age-band table is filled (BrightSteps B)
        if (ds.percent >= 85) strengths.push(`${name}: ${ds.percent}% items present`);
        if (ds.percent < 60) needs.push(`${name}: ${ds.percent}% present — review`);
      }
    }

    // Standard score when we have scaled scores for all 7 domains
    let standardScore = null;
    let standardInterp = null;
    if (scaledCount === 7) {
      standardScore = this.lookupStandardScore(recordKey, sumScaled);
      standardInterp = this.interpretStandard(standardScore);
    }

    let overallInterpretation;
    if (standardInterp) {
      overallInterpretation = {
        code: standardInterp.code,
        label: standardInterp.label,
        description: standardInterp.description +
          (standardScore != null ? ` (Standard Score: ${standardScore}; Sum of Scaled: ${sumScaled}).` : ''),
        level: standardInterp.level
      };
    } else {
      const withInterp = domainResults.filter(d => d.interpretation);
      if (!withInterp.length) {
        overallInterpretation = {
          code: 'INCOMPLETE',
          label: 'Scaled table not yet available for this age',
          description:
            'Official domain interpretation needs the scaled-score table for this age band. Raw scores are still recorded.',
          level: 'unknown'
        };
      } else {
        const n = withInterp.filter(d => d.interpretation.level === 'needs_support').length;
        const e = withInterp.filter(d => d.interpretation.level === 'emerging').length;
        if (n > 0) {
          overallInterpretation = {
            code: 'MONITOR',
            label: 'Some domains need monitoring',
            description: `${n} domain(s) in the 3-month monitor range.`,
            level: 'needs_support'
          };
        } else if (e > 0) {
          overallInterpretation = {
            code: 'WATCH',
            label: 'Watch and support',
            description: `${e} domain(s) in the 6-month monitor band.`,
            level: 'emerging'
          };
        } else {
          overallInterpretation = {
            code: 'AVERAGE_OR_ABOVE',
            label: 'Average or above',
            description: 'Scored domains are within average or advanced ranges.',
            level: 'age_appropriate'
          };
        }
      }
    }

    const parentFriendlyDraft = [
      assessment.period ? `Assessment period: ${assessment.period}.` : '',
      overallInterpretation.description,
      strengths.length ? 'Strengths: ' + strengths.slice(0, 4).join('; ') + '.' : '',
      needs.length ? 'Areas to support: ' + needs.slice(0, 4).join('; ') + '.' : '',
      'Based on the ECCD checklist. Teacher will review before sharing with parents.'
    ]
      .filter(Boolean)
      .join(' ');

    const stdTable = this.tables && this.tables.standardScoreTables && this.tables.standardScoreTables[recordKey];
    return {
      status: 'ok',
      engineVersion: this.version,
      recordKey,
      ageMonths,
      ageBand: band ? { id: band.id, label: band.label } : null,
      period: assessment.period || null,
      domains: domainResults,
      sumOfScaledScores: scaledCount ? sumScaled : null,
      scaledScoresAvailable: scaledCount,
      standardScore,
      overallInterpretation,
      strengths,
      needs,
      parentFriendlyDraft,
      tablesComplete: !!(
        band &&
        this.tables &&
        this.tables.scaledScoreTables[band.id] &&
        this.tables.scaledScoreTables[band.id].rows &&
        stdTable &&
        stdTable.rows
      )
    };
  },

  /**
   * Compare assessments across periods for one child.
   * @param {Array} assessments — from AssessmentStore.listForChild (ordered)
   * @returns {object} trends summary
   */
  compareTrends(assessments) {
    if (!assessments || assessments.length === 0) {
      return { status: 'empty', periods: [], domains: {}, overall: [], summary: 'No saved assessments yet.' };
    }

    const periods = assessments.map(a => ({
      period: a.period,
      savedAt: a.savedAt,
      standardScore: a.insight && a.insight.standardScore != null ? a.insight.standardScore : null,
      sumScaled: a.insight && a.insight.sumOfScaledScores != null ? a.insight.sumOfScaledScores : null,
      overallLabel: a.insight && a.insight.overallInterpretation
        ? a.insight.overallInterpretation.label
        : null
    }));

    const domainCodes = (this.tables && this.tables.domainOrder) ||
      ['GM', 'FM', 'SH', 'RL', 'EL', 'COG', 'SE'];
    const domainNames = (this.tables && this.tables.domainNames) || {};

    const domains = {};
    domainCodes.forEach(code => {
      const series = assessments.map(a => {
        const d = a.insight && a.insight.domains
          ? a.insight.domains.find(x => x.code === code)
          : null;
        const ds = a.domainScores && a.domainScores[code];
        return {
          period: a.period,
          raw: d ? d.raw : (ds ? ds.present : null),
          scaled: d ? d.scaled : null,
          percent: d ? d.percent : (ds ? ds.percent : null)
        };
      });

      // Trend: compare last two scaled (or percent)
      let trend = 'stable';
      let delta = null;
      if (series.length >= 2) {
        const prev = series[series.length - 2];
        const curr = series[series.length - 1];
        const pVal = prev.scaled != null ? prev.scaled : prev.percent;
        const cVal = curr.scaled != null ? curr.scaled : curr.percent;
        if (pVal != null && cVal != null) {
          delta = cVal - pVal;
          if (delta >= 2) trend = 'improving';
          else if (delta <= -2) trend = 'declining';
          else trend = 'stable';
        }
      }

      domains[code] = {
        name: domainNames[code] || code,
        series,
        trend,
        delta
      };
    });

    const improving = Object.values(domains).filter(d => d.trend === 'improving').map(d => d.name);
    const declining = Object.values(domains).filter(d => d.trend === 'declining').map(d => d.name);

    let summary;
    if (assessments.length === 1) {
      summary = `One assessment saved (${assessments[0].period}). Encode another period to see trends.`;
    } else if (declining.length && improving.length) {
      summary = `Mixed trends: improving in ${improving.slice(0, 3).join(', ')}; watch ${declining.slice(0, 3).join(', ')}.`;
    } else if (improving.length) {
      summary = `Improving in: ${improving.join(', ')}.`;
    } else if (declining.length) {
      summary = `Needs attention — declining in: ${declining.join(', ')}.`;
    } else {
      summary = `Stable across ${assessments.length} assessments.`;
    }

    // Overall standard score trend
    const overallSeries = periods.filter(p => p.standardScore != null);
    let overallTrend = null;
    if (overallSeries.length >= 2) {
      const d = overallSeries[overallSeries.length - 1].standardScore -
        overallSeries[overallSeries.length - 2].standardScore;
      overallTrend = d >= 5 ? 'improving' : d <= -5 ? 'declining' : 'stable';
    }

    return {
      status: 'ok',
      periods,
      domains,
      overall: overallSeries,
      overallTrend,
      improving,
      declining,
      summary
    };
  }
};
