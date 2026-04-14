const logTestCase = ({ name, input, expected, actual }) => {
  console.log(`
================ TEST CASE: ${name} ================
INPUT:
${JSON.stringify(input, null, 2)}

EXPECTED:
${JSON.stringify(expected, null, 2)}

ACTUAL:
${JSON.stringify(actual, null, 2)}
===================================================
  `);
};

module.exports = { logTestCase };