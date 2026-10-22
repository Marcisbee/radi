import { assert, test } from '@marcisbee/rion/test';

test('playground updates every tenth retained row and changes selection', async () => {
  await import('../../playground/table2.tsx');
  document.querySelector<HTMLButtonElement>('#run')!.click();
  const rows = Array.from(document.querySelectorAll('tbody tr'));
  const label = (row: Element) => row.querySelector('td:nth-of-type(2) a')!;
  const original = rows.map((row) => label(row).textContent);
  assert.equal(rows.length, 1000);

  for (const suffix of [' !!!', ' !!! !!!']) {
    document.querySelector<HTMLButtonElement>('#update')!.click();
    const current = document.querySelectorAll('tbody tr');
    for (const [index, row] of rows.entries()) {
      assert.equal(current[index], row);
      assert.equal(
        label(row).textContent,
        original[index] + (index % 10 === 0 ? suffix : ''),
      );
    }
  }

  (label(rows[0]) as HTMLElement).click();
  assert.equal(rows[0].className, 'danger');
  (label(rows[1]) as HTMLElement).click();
  assert.equal(rows[0].className, '');
  assert.equal(rows[1].className, 'danger');
});

await test.run();
