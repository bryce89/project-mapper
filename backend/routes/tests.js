const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const backendDir = path.join(__dirname, '..');
const frontendDir = path.join(__dirname, '../../frontend');
const jestOutputFile = '/tmp/pm-jest-results.json';

function run(cmd, cwd) {
  return new Promise(resolve => {
    exec(cmd, { cwd, timeout: 90000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ err, stdout, stderr });
    });
  });
}

function normaliseSuite(raw) {
  if (!raw) return null;
  return {
    numPassed: raw.numPassedTests ?? 0,
    numFailed: raw.numFailedTests ?? 0,
    suites: (raw.testResults || []).map(suite => ({
      name: path.basename(suite.testFilePath || suite.name || ''),
      status: suite.status,
      tests: (suite.assertionResults || suite.testResults || []).map(t => ({
        name: [...(t.ancestorTitles || []), t.title].join(' › '),
        status: t.status,
        duration: t.duration ?? null,
        error: t.failureMessages?.join('\n') || null,
      })),
    })),
  };
}


router.get('/run', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Test runner is disabled in production to protect live data.' });
  }
  const start = Date.now();

  const [jestRun, vitestRun] = await Promise.all([
    run(
      `./node_modules/.bin/jest --json --outputFile=${jestOutputFile} --forceExit`,
      backendDir
    ),
    run(
      `./node_modules/.bin/vitest run --reporter=json`,
      frontendDir
    ),
  ]);

  let jestRaw = null;
  try { jestRaw = JSON.parse(fs.readFileSync(jestOutputFile, 'utf8')); } catch {}

  let vitestRaw = null;
  try { vitestRaw = JSON.parse(vitestRun.stdout); } catch {}

  res.json({
    timestamp: new Date().toISOString(),
    duration: Date.now() - start,
    backend: normaliseSuite(jestRaw),
    frontend: normaliseSuite(vitestRaw),
  });
});

module.exports = router;
