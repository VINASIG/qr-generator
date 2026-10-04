import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';
import dictionary from '../src/locales/vi.json' with { type: 'json' };
await test('every authored validation sentence has a reviewed Vietnamese translation', async () => {
  const missing: string[] = [];
  for (const file of [
    'src/lib/payloads.ts',
    'src/lib/qr.ts',
    'src/scripts/generator.ts',
    'src/scripts/date-control.ts',
  ]) {
    const source = ts.createSourceFile(
      file,
      await readFile(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    );
    function visit(node: ts.Node): void {
      if (
        ts.isStringLiteralLike(node) &&
        /^(?:Enter|Use|Choose|Remove|The |This |A |An |Keep|Check|Unable|Could|Start|End)/.test(
          node.text,
        ) &&
        node.text.endsWith('.') &&
        !Object.hasOwn(dictionary, node.text)
      )
        missing.push(node.text);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.deepEqual(missing, []);
});
