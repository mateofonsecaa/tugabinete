import * as service from "./stats.service.js";

export const getStats = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const stats = await service.getStats(userId);
        res.json(stats);
    } catch (err) {
        next(err);
    }
};
