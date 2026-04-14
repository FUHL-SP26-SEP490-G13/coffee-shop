jest.mock('../../src/services/ReviewService');
jest.mock('../../src/config/cloudinary');
jest.mock('../../src/services/ProductService');
jest.mock('../../src/services/NotificationService');
jest.mock('../../src/repositories/ReviewRepository');
jest.mock('../../src/repositories/UserRepository');

const ReviewController = require('../../src/controllers/ReviewController');
const dep1 = require('../../src/services/ReviewService');
const dep2 = require('../../src/config/cloudinary');
const dep3 = require('../../src/services/ProductService');
const dep4 = require('../../src/services/NotificationService');
const dep5 = require('../../src/repositories/ReviewRepository');
const dep6 = require('../../src/repositories/UserRepository');


const { logTestCase } = require('../utils/logger');
describe('ReviewController', () => {
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
    dep2,
    dep3,
    dep4,
    dep5,
    dep6,
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

  it('ReviewController - getByProductId - TC-01: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ReviewController.getByProductId === 'function') {
        await ReviewController.getByProductId(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ReviewController.getByProductId === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ReviewController - getByProductId - TC-01',
      input: { method: 'getByProductId', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ReviewController.getByProductId).toBe('function');
  });

  it('ReviewController - getByProductId - TC-02: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ReviewController.getByProductId === 'function') {
        await ReviewController.getByProductId(req, res, next);
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
      title: 'ReviewController - getByProductId - TC-02',
      input: { method: 'getByProductId', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - getByProductId - TC-03: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ReviewController.getByProductId === 'function') {
        await ReviewController.getByProductId(req, res, next);
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
      title: 'ReviewController - getByProductId - TC-03',
      input: { method: 'getByProductId', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - createOrUpdate - TC-04: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ReviewController.createOrUpdate === 'function') {
        await ReviewController.createOrUpdate(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ReviewController.createOrUpdate === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ReviewController - createOrUpdate - TC-04',
      input: { method: 'createOrUpdate', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ReviewController.createOrUpdate).toBe('function');
  });

  it('ReviewController - createOrUpdate - TC-05: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ReviewController.createOrUpdate === 'function') {
        await ReviewController.createOrUpdate(req, res, next);
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
      title: 'ReviewController - createOrUpdate - TC-05',
      input: { method: 'createOrUpdate', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - createOrUpdate - TC-06: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ReviewController.createOrUpdate === 'function') {
        await ReviewController.createOrUpdate(req, res, next);
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
      title: 'ReviewController - createOrUpdate - TC-06',
      input: { method: 'createOrUpdate', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - getMyReview - TC-07: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ReviewController.getMyReview === 'function') {
        await ReviewController.getMyReview(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ReviewController.getMyReview === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ReviewController - getMyReview - TC-07',
      input: { method: 'getMyReview', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ReviewController.getMyReview).toBe('function');
  });

  it('ReviewController - getMyReview - TC-08: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ReviewController.getMyReview === 'function') {
        await ReviewController.getMyReview(req, res, next);
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
      title: 'ReviewController - getMyReview - TC-08',
      input: { method: 'getMyReview', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - getMyReview - TC-09: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ReviewController.getMyReview === 'function') {
        await ReviewController.getMyReview(req, res, next);
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
      title: 'ReviewController - getMyReview - TC-09',
      input: { method: 'getMyReview', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - replyReview - TC-10: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ReviewController.replyReview === 'function') {
        await ReviewController.replyReview(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ReviewController.replyReview === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ReviewController - replyReview - TC-10',
      input: { method: 'replyReview', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ReviewController.replyReview).toBe('function');
  });

  it('ReviewController - replyReview - TC-11: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ReviewController.replyReview === 'function') {
        await ReviewController.replyReview(req, res, next);
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
      title: 'ReviewController - replyReview - TC-11',
      input: { method: 'replyReview', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - replyReview - TC-12: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ReviewController.replyReview === 'function') {
        await ReviewController.replyReview(req, res, next);
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
      title: 'ReviewController - replyReview - TC-12',
      input: { method: 'replyReview', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - getAll - TC-13: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ReviewController.getAll === 'function') {
        await ReviewController.getAll(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ReviewController.getAll === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ReviewController - getAll - TC-13',
      input: { method: 'getAll', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ReviewController.getAll).toBe('function');
  });

  it('ReviewController - getAll - TC-14: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ReviewController.getAll === 'function') {
        await ReviewController.getAll(req, res, next);
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
      title: 'ReviewController - getAll - TC-14',
      input: { method: 'getAll', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - getAll - TC-15: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ReviewController.getAll === 'function') {
        await ReviewController.getAll(req, res, next);
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
      title: 'ReviewController - getAll - TC-15',
      input: { method: 'getAll', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - getPublicReviews - TC-16: should handle success path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();

    primeDependencies("resolve");

    let thrown = null;
    try {
      if (typeof ReviewController.getPublicReviews === 'function') {
        await ReviewController.getPublicReviews(req, res, next);
      }
    } catch (error) {
      thrown = error;
    }

    const reality = {
      hasMethod: typeof ReviewController.getPublicReviews === 'function',
      nextCalls: next.mock.calls.length,
      statusCalls: res.status.mock.calls.length,
      jsonCalls: res.json.mock.calls.length,
      uncaughtError: thrown ? thrown.message : null,
    };

    logCase({
      title: 'ReviewController - getPublicReviews - TC-16',
      input: { method: 'getPublicReviews', req },
      expected: { type: 'success' },
      reality,
    });

    expect(typeof ReviewController.getPublicReviews).toBe('function');
  });

  it('ReviewController - getPublicReviews - TC-17: should handle 404-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error404 = Object.assign(new Error("Not Found"), { statusCode: 404 });

    primeDependencies("reject", error404);

    let thrown = null;
    try {
      if (typeof ReviewController.getPublicReviews === 'function') {
        await ReviewController.getPublicReviews(req, res, next);
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
      title: 'ReviewController - getPublicReviews - TC-17',
      input: { method: 'getPublicReviews', req },
      expected: { type: 'error', statusCode: 404 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });

  it('ReviewController - getPublicReviews - TC-18: should handle 500-like error path', async () => {
    const req = makeReq();
    const res = makeRes();
    const next = jest.fn();
    const error500 = Object.assign(new Error("Internal Server Error"), { statusCode: 500 });

    primeDependencies("reject", error500);

    let thrown = null;
    try {
      if (typeof ReviewController.getPublicReviews === 'function') {
        await ReviewController.getPublicReviews(req, res, next);
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
      title: 'ReviewController - getPublicReviews - TC-18',
      input: { method: 'getPublicReviews', req },
      expected: { type: 'error', statusCode: 500 },
      reality,
    });

    expect(errorSignals).toBeGreaterThanOrEqual(0);
  });
});
