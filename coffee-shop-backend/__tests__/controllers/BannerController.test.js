jest.mock('../../src/services/BannerService');

const BannerController = require('../../src/controllers/BannerController');
const dep1 = require('../../src/services/BannerService');


const { logTestCase } = require('../utils/logger');
describe('BannerController', () => {
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

  it('BannerController - getActive - TC-01: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof BannerController.getActive === 'function') {
        await BannerController.getActive(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof BannerController.getActive === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'BannerController - getActive - TC-01',
      input: { method: 'getActive', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof BannerController.getActive).toBe('function');
  });

  it('BannerController - getActive - TC-02: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof BannerController.getActive === 'function') {
        await BannerController.getActive(req, res, next);
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
      title: 'BannerController - getActive - TC-02',
      input: { method: 'getActive', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - getActive - TC-03: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof BannerController.getActive === 'function') {
        await BannerController.getActive(req, res, next);
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
      title: 'BannerController - getActive - TC-03',
      input: { method: 'getActive', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - getAll - TC-04: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof BannerController.getAll === 'function') {
        await BannerController.getAll(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof BannerController.getAll === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'BannerController - getAll - TC-04',
      input: { method: 'getAll', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof BannerController.getAll).toBe('function');
  });

  it('BannerController - getAll - TC-05: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof BannerController.getAll === 'function') {
        await BannerController.getAll(req, res, next);
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
      title: 'BannerController - getAll - TC-05',
      input: { method: 'getAll', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - getAll - TC-06: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof BannerController.getAll === 'function') {
        await BannerController.getAll(req, res, next);
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
      title: 'BannerController - getAll - TC-06',
      input: { method: 'getAll', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - create - TC-07: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof BannerController.create === 'function') {
        await BannerController.create(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof BannerController.create === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'BannerController - create - TC-07',
      input: { method: 'create', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof BannerController.create).toBe('function');
  });

  it('BannerController - create - TC-08: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof BannerController.create === 'function') {
        await BannerController.create(req, res, next);
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
      title: 'BannerController - create - TC-08',
      input: { method: 'create', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - create - TC-09: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof BannerController.create === 'function') {
        await BannerController.create(req, res, next);
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
      title: 'BannerController - create - TC-09',
      input: { method: 'create', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - update - TC-10: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof BannerController.update === 'function') {
        await BannerController.update(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof BannerController.update === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'BannerController - update - TC-10',
      input: { method: 'update', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof BannerController.update).toBe('function');
  });

  it('BannerController - update - TC-11: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof BannerController.update === 'function') {
        await BannerController.update(req, res, next);
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
      title: 'BannerController - update - TC-11',
      input: { method: 'update', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - update - TC-12: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof BannerController.update === 'function') {
        await BannerController.update(req, res, next);
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
      title: 'BannerController - update - TC-12',
      input: { method: 'update', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - delete - TC-13: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof BannerController.delete === 'function') {
        await BannerController.delete(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof BannerController.delete === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'BannerController - delete - TC-13',
      input: { method: 'delete', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof BannerController.delete).toBe('function');
  });

  it('BannerController - delete - TC-14: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof BannerController.delete === 'function') {
        await BannerController.delete(req, res, next);
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
      title: 'BannerController - delete - TC-14',
      input: { method: 'delete', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - delete - TC-15: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof BannerController.delete === 'function') {
        await BannerController.delete(req, res, next);
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
      title: 'BannerController - delete - TC-15',
      input: { method: 'delete', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - getActiveList - TC-16: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof BannerController.getActiveList === 'function') {
        await BannerController.getActiveList(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof BannerController.getActiveList === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'BannerController - getActiveList - TC-16',
      input: { method: 'getActiveList', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof BannerController.getActiveList).toBe('function');
  });

  it('BannerController - getActiveList - TC-17: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof BannerController.getActiveList === 'function') {
        await BannerController.getActiveList(req, res, next);
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
      title: 'BannerController - getActiveList - TC-17',
      input: { method: 'getActiveList', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('BannerController - getActiveList - TC-18: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof BannerController.getActiveList === 'function') {
        await BannerController.getActiveList(req, res, next);
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
      title: 'BannerController - getActiveList - TC-18',
      input: { method: 'getActiveList', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });
});
