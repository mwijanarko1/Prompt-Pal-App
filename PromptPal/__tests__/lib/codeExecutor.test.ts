import { CodeExecutor } from '@/lib/codeExecutor';

describe('CodeExecutor', () => {
  it('executes a named function', async () => {
    const result = await CodeExecutor.execute({
      code: 'function sum(a, b) { return a + b; }',
      inputs: [2, 3],
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe(5);
  });

  it('executes an arrow function', async () => {
    const result = await CodeExecutor.execute({
      code: 'const multiply = (a, b) => a * b;',
      inputs: [4, 6],
    });

    expect(result.success).toBe(true);
    expect(result.output).toBe(24);
  });

  it('returns a timeout error for infinite loops', async () => {
    const result = await CodeExecutor.execute({
      code: 'function loop() { while (true) {} }',
      inputs: [],
      timeoutMs: 50,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });

  it('rejects code with disallowed globals', async () => {
    await expect(
      CodeExecutor.execute({
        code: 'function grab() { return fetch("https://example.com"); }',
        inputs: [],
      })
    ).rejects.toThrow('Network access is not allowed.');
  });
});
