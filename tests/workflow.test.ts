import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const workflow = readFileSync(
  new URL('../.github/workflows/deploy.yml', import.meta.url),
  'utf8',
);

void test('CI checks each supported browser on Windows and Linux', () => {
  assert.match(workflow, /os: \[ubuntu-latest, windows-latest\]/u);
  assert.match(workflow, /browser: \[chromium, firefox, webkit\]/u);
  assert.match(
    workflow,
    /run: npx --yes npm@12\.2\.0 run test:browser -- --project=\$\{\{ matrix\.browser \}\}/u,
  );
});

void test('each browser runner installs its own engine and retains unique evidence', () => {
  assert.match(
    workflow,
    /playwright -- install --with-deps \$\{\{ matrix\.browser \}\}/u,
  );
  assert.match(
    workflow,
    /name: verification-\$\{\{ matrix\.os \}\}-\$\{\{ matrix\.browser \}\}/u,
  );
  assert.match(workflow, /output\/responsive\/\s+output\/playwright\//u);
});

void test('performance and the single publication artifact use Linux Chromium', () => {
  for (const step of [
    'Check lab performance budgets',
    'Package checked Pages files',
  ]) {
    const section = workflow
      .split(`- name: ${step}`)[1]
      ?.split('\n      - name:')[0];
    assert.ok(section);
    assert.match(
      section,
      /if: runner\.os == 'Linux' && matrix\.browser == 'chromium'/u,
    );
  }
});

void test('deployment waits for all verification jobs', () => {
  const deployment = workflow.split('\n  deploy:')[1];
  assert.ok(deployment);
  assert.match(deployment, /needs: verify/u);
});
