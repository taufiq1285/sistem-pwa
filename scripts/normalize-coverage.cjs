const fs = require('fs');
const path = require('path');

const coveragePath = path.resolve(process.cwd(), 'coverage/coverage-final.json');
const outputPath = path.resolve(process.cwd(), 'coverage/normalized-summary.json');

if (!fs.existsSync(coveragePath)) {
  console.error(`Coverage file not found: ${coveragePath}`);
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));

function normalizePath(filePath) {
  return filePath.replace(/\\/g, '/').toLowerCase();
}

function metric(entry) {
  const statements = Object.values(entry.s || {});
  const functions = Object.values(entry.f || {});
  const branches = Object.values(entry.b || {}).flat();

  return {
    statements: {
      covered: statements.filter((n) => n > 0).length,
      total: statements.length,
    },
    functions: {
      covered: functions.filter((n) => n > 0).length,
      total: functions.length,
    },
    branches: {
      covered: branches.filter((n) => n > 0).length,
      total: branches.length,
    },
  };
}

function pickBestEntry(entries) {
  let best = entries[0];
  let bestScore = -1;

  for (const entry of entries) {
    const m = metric(entry);
    const score =
      m.statements.covered + m.functions.covered + m.branches.covered;

    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  return best;
}

function addMetrics(target, m) {
  target.statements.covered += m.statements.covered;
  target.statements.total += m.statements.total;
  target.functions.covered += m.functions.covered;
  target.functions.total += m.functions.total;
  target.branches.covered += m.branches.covered;
  target.branches.total += m.branches.total;
}

function createAccumulator() {
  return {
    statements: { covered: 0, total: 0 },
    functions: { covered: 0, total: 0 },
    branches: { covered: 0, total: 0 },
    files: 0,
    duplicates: 0,
  };
}

function percentage(covered, total) {
  return total === 0 ? 0 : Number(((covered / total) * 100).toFixed(2));
}

const grouped = {};
for (const [filePath, entry] of Object.entries(raw)) {
  const normalized = normalizePath(filePath);
  if (!grouped[normalized]) grouped[normalized] = [];
  grouped[normalized].push({ originalPath: filePath, entry });
}

const overall = createAccumulator();
const byDir = {};
const duplicateFiles = [];

for (const [normalizedPath, entries] of Object.entries(grouped)) {
  const chosen = pickBestEntry(entries.map((item) => item.entry));
  const chosenMetrics = metric(chosen);
  addMetrics(overall, chosenMetrics);
  overall.files += 1;

  const libIndex = normalizedPath.indexOf('/src/lib/');
  if (libIndex !== -1) {
    const relative = normalizedPath.slice(libIndex + '/src/lib/'.length);
    const dir = relative.split('/')[0];

    if (!byDir[dir]) byDir[dir] = createAccumulator();
    addMetrics(byDir[dir], chosenMetrics);
    byDir[dir].files += 1;

    if (entries.length > 1) {
      byDir[dir].duplicates += 1;
    }
  }

  if (entries.length > 1) {
    overall.duplicates += 1;
    duplicateFiles.push({
      normalizedPath,
      variants: entries.map((item) => item.originalPath),
    });
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  source: 'coverage/coverage-final.json',
  note: 'Summary ini menormalisasi path coverage Windows agar file yang sama dengan casing drive berbeda tidak dihitung dua kali.',
  overall: {
    files: overall.files,
    duplicates: overall.duplicates,
    statements: percentage(overall.statements.covered, overall.statements.total),
    functions: percentage(overall.functions.covered, overall.functions.total),
    branches: percentage(overall.branches.covered, overall.branches.total),
    raw: overall,
  },
  byDirectory: Object.fromEntries(
    Object.entries(byDir)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([dir, acc]) => {
        return [
          dir,
          {
            files: acc.files,
            duplicates: acc.duplicates,
            statements: percentage(acc.statements.covered, acc.statements.total),
            functions: percentage(acc.functions.covered, acc.functions.total),
            branches: percentage(acc.branches.covered, acc.branches.total),
            raw: acc,
          },
        ];
      }),
  ),
  duplicateFiles,
};

fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

console.log('Normalized coverage summary written to:');
console.log(outputPath);
console.log('Overall:');
console.log(
  `- files=${summary.overall.files}, duplicates=${summary.overall.duplicates}, statements=${summary.overall.statements}%, functions=${summary.overall.functions}%, branches=${summary.overall.branches}%`,
);
console.log('By directory:');
for (const [dir, data] of Object.entries(summary.byDirectory)) {
  console.log(
    `- ${dir}: files=${data.files}, duplicates=${data.duplicates}, statements=${data.statements}%, functions=${data.functions}%, branches=${data.branches}%`,
  );
}
