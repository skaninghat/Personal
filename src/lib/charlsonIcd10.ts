/**
 * Charlson Comorbidity Index, ICD-10 coding algorithm (Quan et al., "Coding
 * Algorithms for Defining Comorbidities in ICD-9-CM and ICD-10 Administrative
 * Data", Medical Care 2005). Each category lists exact code roots and/or
 * inclusive ranges of 3-character ICD-10 roots; matching ignores the decimal
 * point and any digits past the root, e.g. "N18.30" matches root "N18".
 */
interface CharlsonCategory {
  weight: number
  roots: string[]
  ranges?: [string, string][]
}

const CHARLSON_ICD10_CATEGORIES: CharlsonCategory[] = [
  { weight: 1, roots: ['I21', 'I22', 'I252'] }, // Myocardial infarction
  {
    weight: 1,
    roots: ['I099', 'I110', 'I130', 'I132', 'I255', 'I420', 'I425', 'I426', 'I427', 'I428', 'I429', 'P290'],
    ranges: [['I43', 'I43'], ['I50', 'I50']],
  }, // Congestive heart failure
  {
    weight: 1,
    roots: ['I731', 'I738', 'I739', 'I771', 'I790', 'I792', 'K551', 'K558', 'K559', 'Z958', 'Z959'],
    ranges: [['I70', 'I71']],
  }, // Peripheral vascular disease
  { weight: 1, roots: ['H340'], ranges: [['G45', 'G46'], ['I60', 'I69']] }, // Cerebrovascular disease
  { weight: 1, roots: ['F051', 'G311'], ranges: [['F00', 'F03'], ['G30', 'G30']] }, // Dementia
  {
    weight: 1,
    roots: ['I278', 'I279', 'J684', 'J701', 'J703'],
    ranges: [['J40', 'J47'], ['J60', 'J67']],
  }, // Chronic pulmonary disease
  { weight: 1, roots: ['M051', 'M052', 'M32', 'M33', 'M34', 'M351', 'M353', 'M360'], ranges: [['M05', 'M06']] }, // Rheumatic disease
  { weight: 1, roots: [], ranges: [['K25', 'K28']] }, // Peptic ulcer disease
  {
    weight: 1,
    roots: ['K700', 'K701', 'K702', 'K703', 'K709', 'K713', 'K714', 'K715', 'K717', 'K760', 'K762', 'K763', 'K764', 'K768', 'K769', 'Z944'],
    ranges: [['B18', 'B18'], ['K73', 'K74']],
  }, // Mild liver disease
  {
    weight: 1,
    roots: ['E100', 'E101', 'E106', 'E108', 'E109', 'E110', 'E111', 'E116', 'E118', 'E119', 'E120', 'E121', 'E126', 'E128', 'E129', 'E130', 'E131', 'E136', 'E138', 'E139', 'E140', 'E141', 'E146', 'E148', 'E149'],
  }, // Diabetes without chronic complication
  {
    weight: 2,
    roots: ['E102', 'E103', 'E104', 'E105', 'E107', 'E112', 'E113', 'E114', 'E115', 'E117', 'E122', 'E123', 'E124', 'E125', 'E127', 'E132', 'E133', 'E134', 'E135', 'E137', 'E142', 'E143', 'E144', 'E145', 'E147'],
  }, // Diabetes with chronic complication
  { weight: 2, roots: ['G041', 'G114', 'G801', 'G802', 'G830', 'G831', 'G832', 'G833', 'G834', 'G839'], ranges: [['G81', 'G82']] }, // Hemiplegia or paraplegia
  {
    weight: 2,
    roots: ['I120', 'I131', 'N250'],
    ranges: [['N03', 'N03'], ['N05', 'N05'], ['N18', 'N19'], ['Z490', 'Z492'], ['Z940', 'Z940'], ['Z992', 'Z992']],
  }, // Renal disease
  {
    weight: 2,
    ranges: [['C00', 'C26'], ['C30', 'C34'], ['C37', 'C41'], ['C43', 'C43'], ['C45', 'C58'], ['C60', 'C76'], ['C81', 'C85'], ['C88', 'C88'], ['C90', 'C97']],
    roots: [],
  }, // Malignancy (excl. skin)
  {
    weight: 3,
    roots: ['I850', 'I859', 'I864', 'I982', 'K704', 'K711', 'K721', 'K729', 'K765', 'K766', 'K767'],
  }, // Moderate/severe liver disease
  { weight: 6, roots: [], ranges: [['C77', 'C80']] }, // Metastatic solid tumor
  { weight: 6, roots: [], ranges: [['B20', 'B22'], ['B24', 'B24']] }, // AIDS/HIV
]

function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/\./g, '').trim()
}

function matchesCategory(code: string, category: CharlsonCategory): boolean {
  const root3 = code.slice(0, 3)
  if (category.roots.some((r) => code.startsWith(r))) return true
  if (category.ranges?.some(([lo, hi]) => root3 >= lo && root3 <= hi)) return true
  return false
}

/**
 * Sums Charlson category weights for a list of active ICD-10 diagnosis
 * codes, counting each of the 17 categories at most once (matching the
 * standard Charlson methodology).
 */
export function charlsonScoreFromIcd10Codes(codes: string[]): number {
  let score = 0
  for (const category of CHARLSON_ICD10_CATEGORIES) {
    const normalized = codes.map(normalizeCode)
    if (normalized.some((code) => matchesCategory(code, category))) {
      score += category.weight
    }
  }
  return score
}
