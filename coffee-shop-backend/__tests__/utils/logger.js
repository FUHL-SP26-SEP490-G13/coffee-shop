const createDivider = (char = '=', length = 90) => char.repeat(length);

const safeStringify = (value) => {
  if (value instanceof Error) {
    return JSON.stringify(
      {
        name: value.name,
        message: value.message,
        stack: value.stack,
      },
      null,
      2,
    );
  }

  const seen = new WeakSet();
  return JSON.stringify(
    value,
    (key, current) => {
      if (typeof current === 'bigint') {
        return `${current.toString()}n`;
      }

      if (typeof current === 'function') {
        return `[Function: ${current.name || 'anonymous'}]`;
      }

      if (current === undefined) {
        return '[undefined]';
      }

      if (current && typeof current === 'object') {
        if (seen.has(current)) {
          return '[Circular]';
        }
        seen.add(current);
      }

      return current;
    },
    2,
  );
};

const block = (label, payload) => {
  const content = payload === undefined ? '[undefined]' : safeStringify(payload);
  return `${label}:\n${content}`;
};

const logTestCase = ({ name = 'Unnamed Test Case', input, expected, actual, group } = {}) => {
  const top = createDivider('=', 90);
  const mid = createDivider('-', 90);
  const title = group ? `${group} | ${name}` : name;

  const message = [
    '',
    top,
    `TEST CASE: ${title}`,
    mid,
    block('INPUT', input),
    '',
    block('EXPECTED', expected),
    '',
    block('ACTUAL', actual),
    top,
  ].join('\n');

  console.log(message);
};

module.exports = { logTestCase };