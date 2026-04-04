const SwapRequestService = require('../services/SwapRequestService');
class SwapRequestController {
    /**
     * POST /swap-requests
     * Body: { requester_shift_id, receiver_id, receiver_shift_id? }
     */
    async createSwapRequest(req, res, next) {
        try {
            const result = await SwapRequestService.createSwapRequest({
                requester_id: req.user.id,
                ...req.body,
            });
            return res.status(201).json({
                success: true,
                data: result,
                message: 'Đã gửi yêu cầu đổi ca',
            });
        } catch (err) {
            next(err);
        }
    }
    /**
     * POST /swap-requests/:id/cancel
     */
    async cancelSwapRequest(req, res, next) {
        try {
            const result = await SwapRequestService.cancelSwapRequest(
                Number(req.params.id),
                req.user.id,
            );
            return res.json({
                success: true,
                data: result,
                message: 'Đã hủy yêu cầu đổi ca',
            });
        } catch (err) {
            next(err);
        }
    }
    /**
     * POST /swap-requests/:id/accept
     */
    async acceptSwapRequest(req, res, next) {
        try {
            const result = await SwapRequestService.acceptSwapRequest(
                Number(req.params.id),
                req.user.id,
            );
            return res.json({
                success: true,
                data: result,
                message: 'Đã chấp nhận đổi ca',
            });
        } catch (err) {
            next(err);
        }
    }
    /**
     * POST /swap-requests/:id/reject
     */
    async rejectSwapRequest(req, res, next) {
        try {
            const result = await SwapRequestService.rejectSwapRequest(
                Number(req.params.id),
                req.user.id,
            );
            return res.json({
                success: true,
                data: result,
                message: 'Đã từ chối yêu cầu đổi ca',
            });
        } catch (err) {
            next(err);
        }
    }
    /**
     * GET /swap-requests
     */
    async getMySwapRequests(req, res, next) {
        try {
            const result = await SwapRequestService.getMySwapRequests(req.user.id);
            return res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }
    /**
     * GET /swap-requests/:id
     */
    async getSwapRequestById(req, res, next) {
        try {
            const result = await SwapRequestService.getSwapRequestById(
                Number(req.params.id),
                req.user.id,
            );
            return res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }
}
module.exports = new SwapRequestController();