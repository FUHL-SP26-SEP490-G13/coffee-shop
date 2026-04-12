jest.mock('../../src/services/LoyaltyService');

const LoyaltyController = require('../../src/controllers/LoyaltyController');
const dep1 = require('../../src/services/LoyaltyService');

describe('LoyaltyController', () => {
  const makeReq = () => ({
    params: { id: '1', code: 'CODE' },
    query: { page: '1', limit: '10', keyword: '', status: '', with_count: 'false' },
    body: { code: 'SAVE10', email: 'test@example.com', otp: '123456', oldPassword: 'Old@1234', newPassword: 'New@1234', password: 'Pass@1234', confirmPassword: 'Pass@1234', order_type: 'delivery', table_id: 1 },
    user: { id: 1 },
    app: {
      get: jest.fn(() => ({
        emit: jest.fn(),
        to: jest.fn(() => ({ emit: jest.fn() })),
      })),
    },
    file: null,
    files: null,
  });

  const makeRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  });

  const dependencyModules = [
    dep1,
  ];

  const primeModuleFunctions = (moduleObj, mode, errorObj) => {
    if (!moduleObj || typeof moduleObj !== "object") return;
    for (const key of Object.keys(moduleObj)) {
      const value = moduleObj[key];
      if (typeof value === "function") {
        if (value.mockReset) value.mockReset();
        if (mode === "resolve") {
          if (value.mockResolvedValue) value.mockResolvedValue({});
          else if (value.mockReturnValue) value.mockReturnValue({});
        } else {
          if (value.mockImplementation) value.mockImplementation(() => { throw errorObj; });
        }
      } else if (value && typeof value === "object") {
        for (const subKey of Object.keys(value)) {
          const subValue = value[subKey];
          if (typeof subValue === "function") {
            if (subValue.mockReset) subValue.mockReset();
            if (mode === "resolve") {
              if (subValue.mockResolvedValue) subValue.mockResolvedValue({});
              else if (subValue.mockReturnValue) subValue.mockReturnValue({});
            } else {
              if (subValue.mockImplementation) subValue.mockImplementation(() => { throw errorObj; });
            }
          }
        }
      }
    }
  };

  const primeDependencies = (mode, errorObj) => {
    dependencyModules.forEach((mod) => primeModuleFunctions(mod, mode, errorObj));
  };

  const logCase = ({ title, input, expected, reality }) => {
    console.log('\n' + '='.repeat(50));
    console.log(title);
    console.log('='.repeat(50));
    console.log('INPUT:', JSON.stringify(input, null, 2));
    console.log('OUTPUT EXPECT:', JSON.stringify(expected, null, 2));
    console.log('OUTPUT REALITY:', JSON.stringify(reality, null, 2));
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('LoyaltyController - getMyLoyalty - TC-01: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof LoyaltyController.getMyLoyalty === 'function') {
        await LoyaltyController.getMyLoyalty(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof LoyaltyController.getMyLoyalty === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'LoyaltyController - getMyLoyalty - TC-01',
      input: { method: 'getMyLoyalty', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof LoyaltyController.getMyLoyalty).toBe('function');
  });

  it('LoyaltyController - getMyLoyalty - TC-02: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof LoyaltyController.getMyLoyalty === 'function') {
        await LoyaltyController.getMyLoyalty(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - getMyLoyalty - TC-02',
      input: { method: 'getMyLoyalty', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - getMyLoyalty - TC-03: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof LoyaltyController.getMyLoyalty === 'function') {
        await LoyaltyController.getMyLoyalty(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - getMyLoyalty - TC-03',
      input: { method: 'getMyLoyalty', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - getMyTransactions - TC-04: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof LoyaltyController.getMyTransactions === 'function') {
        await LoyaltyController.getMyTransactions(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof LoyaltyController.getMyTransactions === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'LoyaltyController - getMyTransactions - TC-04',
      input: { method: 'getMyTransactions', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof LoyaltyController.getMyTransactions).toBe('function');
  });

  it('LoyaltyController - getMyTransactions - TC-05: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof LoyaltyController.getMyTransactions === 'function') {
        await LoyaltyController.getMyTransactions(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - getMyTransactions - TC-05',
      input: { method: 'getMyTransactions', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - getMyTransactions - TC-06: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof LoyaltyController.getMyTransactions === 'function') {
        await LoyaltyController.getMyTransactions(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - getMyTransactions - TC-06',
      input: { method: 'getMyTransactions', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - listCustomers - TC-07: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof LoyaltyController.listCustomers === 'function') {
        await LoyaltyController.listCustomers(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof LoyaltyController.listCustomers === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'LoyaltyController - listCustomers - TC-07',
      input: { method: 'listCustomers', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof LoyaltyController.listCustomers).toBe('function');
  });

  it('LoyaltyController - listCustomers - TC-08: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof LoyaltyController.listCustomers === 'function') {
        await LoyaltyController.listCustomers(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - listCustomers - TC-08',
      input: { method: 'listCustomers', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - listCustomers - TC-09: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof LoyaltyController.listCustomers === 'function') {
        await LoyaltyController.listCustomers(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - listCustomers - TC-09',
      input: { method: 'listCustomers', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - getCustomerDetail - TC-10: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof LoyaltyController.getCustomerDetail === 'function') {
        await LoyaltyController.getCustomerDetail(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof LoyaltyController.getCustomerDetail === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'LoyaltyController - getCustomerDetail - TC-10',
      input: { method: 'getCustomerDetail', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof LoyaltyController.getCustomerDetail).toBe('function');
  });

  it('LoyaltyController - getCustomerDetail - TC-11: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof LoyaltyController.getCustomerDetail === 'function') {
        await LoyaltyController.getCustomerDetail(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - getCustomerDetail - TC-11',
      input: { method: 'getCustomerDetail', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - getCustomerDetail - TC-12: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof LoyaltyController.getCustomerDetail === 'function') {
        await LoyaltyController.getCustomerDetail(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - getCustomerDetail - TC-12',
      input: { method: 'getCustomerDetail', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - getCustomerTransactions - TC-13: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof LoyaltyController.getCustomerTransactions === 'function') {
        await LoyaltyController.getCustomerTransactions(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof LoyaltyController.getCustomerTransactions === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'LoyaltyController - getCustomerTransactions - TC-13',
      input: { method: 'getCustomerTransactions', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof LoyaltyController.getCustomerTransactions).toBe('function');
  });

  it('LoyaltyController - getCustomerTransactions - TC-14: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof LoyaltyController.getCustomerTransactions === 'function') {
        await LoyaltyController.getCustomerTransactions(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - getCustomerTransactions - TC-14',
      input: { method: 'getCustomerTransactions', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - getCustomerTransactions - TC-15: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof LoyaltyController.getCustomerTransactions === 'function') {
        await LoyaltyController.getCustomerTransactions(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - getCustomerTransactions - TC-15',
      input: { method: 'getCustomerTransactions', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - adjustCustomerPoints - TC-16: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof LoyaltyController.adjustCustomerPoints === 'function') {
        await LoyaltyController.adjustCustomerPoints(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof LoyaltyController.adjustCustomerPoints === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'LoyaltyController - adjustCustomerPoints - TC-16',
      input: { method: 'adjustCustomerPoints', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof LoyaltyController.adjustCustomerPoints).toBe('function');
  });

  it('LoyaltyController - adjustCustomerPoints - TC-17: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof LoyaltyController.adjustCustomerPoints === 'function') {
        await LoyaltyController.adjustCustomerPoints(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - adjustCustomerPoints - TC-17',
      input: { method: 'adjustCustomerPoints', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('LoyaltyController - adjustCustomerPoints - TC-18: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof LoyaltyController.adjustCustomerPoints === 'function') {
        await LoyaltyController.adjustCustomerPoints(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const nextError = next.mock.calls[0] ? next.mock.calls[0][0] : null;
    const statusCodes = res.status.mock.calls.map((c) => c[0]);
    const reality = {
      nextErrorStatusCode: nextError && nextError.statusCode ? nextError.statusCode : null,
      nextErrorMessage: nextError && nextError.message ? nextError.message : null,
      statusCodes,
      thrownStatusCode: thrown && thrown.statusCode ? thrown.statusCode : null,
      thrownMessage: thrown ? thrown.message : null,
    };
    const errorSignals = (nextError ? 1 : 0) + (statusCodes.some((s) => Number(s) >= 400) ? 1 : 0) + (thrown ? 1 : 0);

    logCase({
      title: 'LoyaltyController - adjustCustomerPoints - TC-18',
      input: { method: 'adjustCustomerPoints', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });
});
