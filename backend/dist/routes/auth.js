"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../utils/validation");
const router = (0, express_1.Router)();
exports.authRouter = router;
// 公開ルート
router.post('/register', (0, validation_1.validate)(validation_1.registerSchema), authController_1.register);
router.post('/login', (0, validation_1.validate)(validation_1.loginSchema), authController_1.login);
// 認証必須ルート
router.get('/profile', auth_1.authenticateToken, authController_1.getProfile);
// システム情報
router.get('/info', (req, res) => {
    res.json({
        service: 'L-TRACK® Authentication Service',
        version: '1.0.0',
        endpoints: {
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            profile: 'GET /api/auth/profile'
        }
    });
});
