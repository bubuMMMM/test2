/**
 * @typedef {Object} PriorArt
 * @property {string} name
 * @property {string} url
 *
 * @typedef {Object} App
 * @property {string} slug
 * @property {string} name
 * @property {string} domain
 * @property {string} category
 * @property {number} priceMonthly
 * @property {'yes'|'kinda'|'no'} verdict
 * @property {string[]} whatYouLose
 * @property {PriorArt[]} priorArt
 * @property {string} prompt
 * @property {string} notes
 */

/** @type {Record<string, App>} */
const modules = /** @type {Record<string, App>} */ (
  import.meta.glob('../../data/apps/*.json', { eager: true, import: 'default' })
);

/** @type {App[]} */
export const apps = Object.values(modules).sort((a, b) => a.name.localeCompare(b.name));

/** @type {Record<string, {emoji: string, label: string}>} */
export const categoryMeta = {
  Scheduling: { emoji: '📅', label: 'Scheduling' },
  Forms: { emoji: '🧾', label: 'Forms' },
  Creator: { emoji: '🔗', label: 'Creator' },
  Website: { emoji: '🧱', label: 'Website' },
  Video: { emoji: '🎥', label: 'Video' },
  Social: { emoji: '📡', label: 'Social' },
  Email: { emoji: '✉️', label: 'Email' },
  Knowledge: { emoji: '🧠', label: 'Knowledge' },
  Project: { emoji: '🗂️', label: 'Project' },
  Support: { emoji: '🎧', label: 'Support' },
  Documents: { emoji: '✍️', label: 'Documents' },
  Storage: { emoji: '🗄️', label: 'Storage' }
};

/** @type {Record<string, number>} */
export const seedVotes = {
  calendly: 684,
  typeform: 521,
  linktree: 477,
  carrd: 433,
  buffer: 318,
  loom: 271,
  mailchimp: 248,
  notion: 214,
  linear: 173,
  webflow: 128,
  intercom: 91,
  docusign: 54,
  dropbox: 39
};

/** @param {string} slug @returns {App | undefined} */
export function getApp(slug) {
  return apps.find((app) => app.slug === slug);
}

/** @param {App} app @param {number} [limit] @returns {App[]} */
export function getRelated(app, limit = 3) {
  const same = apps.filter((candidate) => candidate.slug !== app.slug && candidate.category === app.category);
  const others = apps.filter((candidate) => candidate.slug !== app.slug && candidate.category !== app.category);
  return [...same, ...others].slice(0, limit);
}

/** @param {'yes'|'kinda'|'no'} verdict */
export function verdictLabel(verdict) {
  return verdict === 'yes' ? 'YES' : verdict === 'kinda' ? 'KINDA' : 'NOT REALLY';
}

/** @param {Record<string, number>} voteCounts @returns {number} */
export function monthlyMRR(voteCounts) {
  return apps.reduce((total, app) => total + app.priceMonthly * (voteCounts[app.slug] || 0), 0);
}
