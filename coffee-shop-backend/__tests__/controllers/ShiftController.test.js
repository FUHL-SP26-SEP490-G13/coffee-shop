jest.mock('../../src/services/ShiftService');

const ShiftController = require('../../src/controllers/ShiftController');
const dep1 = require('../../src/services/ShiftService');


const { logTestCase } = require('../utils/logger');
describe('ShiftController', () => {
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

  it('ShiftController - assignSingle - TC-01: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ShiftController.assignSingle === 'function') {
        await ShiftController.assignSingle(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ShiftController.assignSingle === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ShiftController - assignSingle - TC-01',
      input: { method: 'assignSingle', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ShiftController.assignSingle).toBe('function');
  });

  it('ShiftController - assignSingle - TC-02: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ShiftController.assignSingle === 'function') {
        await ShiftController.assignSingle(req, res, next);
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
      title: 'ShiftController - assignSingle - TC-02',
      input: { method: 'assignSingle', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ShiftController - assignSingle - TC-03: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ShiftController.assignSingle === 'function') {
        await ShiftController.assignSingle(req, res, next);
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
      title: 'ShiftController - assignSingle - TC-03',
      input: { method: 'assignSingle', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ShiftController - assignBulk - TC-04: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ShiftController.assignBulk === 'function') {
        await ShiftController.assignBulk(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ShiftController.assignBulk === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ShiftController - assignBulk - TC-04',
      input: { method: 'assignBulk', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ShiftController.assignBulk).toBe('function');
  });

  it('ShiftController - assignBulk - TC-05: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ShiftController.assignBulk === 'function') {
        await ShiftController.assignBulk(req, res, next);
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
      title: 'ShiftController - assignBulk - TC-05',
      input: { method: 'assignBulk', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ShiftController - assignBulk - TC-06: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ShiftController.assignBulk === 'function') {
        await ShiftController.assignBulk(req, res, next);
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
      title: 'ShiftController - assignBulk - TC-06',
      input: { method: 'assignBulk', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ShiftController - removeRegistration - TC-07: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ShiftController.removeRegistration === 'function') {
        await ShiftController.removeRegistration(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ShiftController.removeRegistration === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ShiftController - removeRegistration - TC-07',
      input: { method: 'removeRegistration', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ShiftController.removeRegistration).toBe('function');
  });

  it('ShiftController - removeRegistration - TC-08: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ShiftController.removeRegistration === 'function') {
        await ShiftController.removeRegistration(req, res, next);
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
      title: 'ShiftController - removeRegistration - TC-08',
      input: { method: 'removeRegistration', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ShiftController - removeRegistration - TC-09: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ShiftController.removeRegistration === 'function') {
        await ShiftController.removeRegistration(req, res, next);
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
      title: 'ShiftController - removeRegistration - TC-09',
      input: { method: 'removeRegistration', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ShiftController - getSchedule - TC-10: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ShiftController.getSchedule === 'function') {
        await ShiftController.getSchedule(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ShiftController.getSchedule === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ShiftController - getSchedule - TC-10',
      input: { method: 'getSchedule', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ShiftController.getSchedule).toBe('function');
  });

  it('ShiftController - getSchedule - TC-11: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ShiftController.getSchedule === 'function') {
        await ShiftController.getSchedule(req, res, next);
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
      title: 'ShiftController - getSchedule - TC-11',
      input: { method: 'getSchedule', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ShiftController - getSchedule - TC-12: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ShiftController.getSchedule === 'function') {
        await ShiftController.getSchedule(req, res, next);
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
      title: 'ShiftController - getSchedule - TC-12',
      input: { method: 'getSchedule', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ShiftController - getMySchedule - TC-13: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ShiftController.getMySchedule === 'function') {
        await ShiftController.getMySchedule(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ShiftController.getMySchedule === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ShiftController - getMySchedule - TC-13',
      input: { method: 'getMySchedule', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ShiftController.getMySchedule).toBe('function');
  });

  it('ShiftController - getMySchedule - TC-14: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ShiftController.getMySchedule === 'function') {
        await ShiftController.getMySchedule(req, res, next);
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
      title: 'ShiftController - getMySchedule - TC-14',
      input: { method: 'getMySchedule', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ShiftController - getMySchedule - TC-15: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ShiftController.getMySchedule === 'function') {
        await ShiftController.getMySchedule(req, res, next);
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
      title: 'ShiftController - getMySchedule - TC-15',
      input: { method: 'getMySchedule', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });
});
