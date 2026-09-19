/**
 * Charlson Comorbidity Index condition weights (Charlson et al. 1987,
 * as commonly tabulated). Keys are normalized (lowercase, no punctuation)
 * so free-text CSV entries like "COPD" or "Diabetes w/ complications" match.
 */
const CHARLSON_WEIGHTS: Record<string, number> = {
  myocardialinfarction: 1,
  congestiveheartfailure: 1,
  chf: 1,
  peripheralvasculardisease: 1,
  pvd: 1,
  cerebrovasculardisease: 1,
  stroke: 1,
  cva: 1,
  dementia: 1,
  chroniclungdisease: 1,
  copd: 1,
  connectivetissuedisease: 1,
  rheumaticdisease: 1,
  pepticulcerdisease: 1,
  ulcerdisease: 1,
  mildliverdisease: 1,
  diabetes: 1,
  diabeteswithoutcomplications: 1,
  hemiplegia: 2,
  paraplegia: 2,
  moderatetoseverekidneydisease: 2,
  renaldisease: 2,
  ckd: 2,
  diabeteswithcomplications: 2,
  diabeteswithendorgandamage: 2,
  malignancy: 2,
  cancer: 2,
  leukemia: 2,
  lymphoma: 2,
  moderatetoseverelivediisease: 3,
  moderatetosevereliverdisease: 3,
  metastaticsolidtumor: 6,
  metastaticcancer: 6,
  aids: 6,
  hiv: 6,
}

function normalize(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
}

/** Sum of Charlson weights for a free-text list of conditions. */
export function charlsonScoreFromConditions(conditions: string[]): number {
  let score = 0
  for (const condition of conditions) {
    const key = normalize(condition)
    if (key && CHARLSON_WEIGHTS[key] !== undefined) {
      score += CHARLSON_WEIGHTS[key]
    }
  }
  return score
}
