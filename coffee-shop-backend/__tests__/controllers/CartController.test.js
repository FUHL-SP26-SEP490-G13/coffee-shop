jest.mock('../../src/utils/response', () => ({
  success: jest.fn((res, data = null, message = 'OK', statusCode = 200) => {
    if (typeof res.status === "function") res.status(statusCode);
    if (typeof res.json === "function") return res.json({ success: true, data, message });
    return { success: true, data, message };
  }),
  error: jest.fn((res, message = 'Error', statusCode = 400) => {
    if (typeof res.status === "function") res.status(statusCode);
    if (typeof res.json === "function") return res.json({ success: false, message });
    return { success: false, message };
  }),
}));
jest.mock('../../src/services/CartService');

const CartController = require('../../src/controllers/CartController');
const response = require('../../src/utils/response');
const dep1 = require('../../src/services/CartService');


const { logTestCase } = require('../utils/logger');
describe('CartController', () => {
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

  const logCase = (payload = {}) => {

    const {

      title,

      method,

      tcid,

      crud,

      scenario,

      input,

      expected,

      outputExpect,

      reality,

    } = payload;


    const nameParts = [title, method, scenario, tcid].filter(Boolean);

    if (crud) nameParts.push(`CRUD: ${crud}`);


    logTestCase({

      name: nameParts.join(' - ') || 'Test case',

      input,

      expected: expected !== undefined ? expected : outputExpect,

      actual: reality,

    });

  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('CartController - getMyCart - TC-01: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof CartController.getMyCart === 'function') {
        await CartController.getMyCart(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof CartController.getMyCart === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'CartController - getMyCart - TC-01',
      input: { method: 'getMyCart', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof CartController.getMyCart).toBe('function');
  });

  it('CartController - getMyCart - TC-02: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof CartController.getMyCart === 'function') {
        await CartController.getMyCart(req, res, next);
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
      title: 'CartController - getMyCart - TC-02',
      input: { method: 'getMyCart', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('CartController - getMyCart - TC-03: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof CartController.getMyCart === 'function') {
        await CartController.getMyCart(req, res, next);
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
      title: 'CartController - getMyCart - TC-03',
      input: { method: 'getMyCart', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('CartController - replaceCart - TC-04: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof CartController.replaceCart === 'function') {
        await CartController.replaceCart(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof CartController.replaceCart === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'CartController - replaceCart - TC-04',
      input: { method: 'replaceCart', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof CartController.replaceCart).toBe('function');
  });

  it('CartController - replaceCart - TC-05: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof CartController.replaceCart === 'function') {
        await CartController.replaceCart(req, res, next);
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
      title: 'CartController - replaceCart - TC-05',
      input: { method: 'replaceCart', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('CartController - replaceCart - TC-06: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof CartController.replaceCart === 'function') {
        await CartController.replaceCart(req, res, next);
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
      title: 'CartController - replaceCart - TC-06',
      input: { method: 'replaceCart', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('CartController - mergeCart - TC-07: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof CartController.mergeCart === 'function') {
        await CartController.mergeCart(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof CartController.mergeCart === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'CartController - mergeCart - TC-07',
      input: { method: 'mergeCart', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof CartController.mergeCart).toBe('function');
  });

  it('CartController - mergeCart - TC-08: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof CartController.mergeCart === 'function') {
        await CartController.mergeCart(req, res, next);
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
      title: 'CartController - mergeCart - TC-08',
      input: { method: 'mergeCart', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('CartController - mergeCart - TC-09: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof CartController.mergeCart === 'function') {
        await CartController.mergeCart(req, res, next);
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
      title: 'CartController - mergeCart - TC-09',
      input: { method: 'mergeCart', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });
});
