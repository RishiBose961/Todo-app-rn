import express from 'express';
import { addTask, forgotPassword, getMyProfile, login, logout, register, removeTask, restPassword, updatePassword, updateProfile, updateTask, verify } from '../controller/User.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();
router.route('/register').post(register)
router.route('/login').post(login)
router.route('/verify').post(isAuthenticated, verify)
router.route('/newtask').post(isAuthenticated, addTask)
router.route('/me').get(isAuthenticated, getMyProfile)
router.route('/task/:taskId').delete(isAuthenticated, removeTask)
router.route('/task/:taskId')
    .get(isAuthenticated, updateTask)
    .delete(isAuthenticated, removeTask)

router.route("/updateprofile").put(isAuthenticated,updateProfile)
router.route("/updatepassword").put(isAuthenticated,updatePassword)
router.route("/forgotpassword").post(forgotPassword)
router.route("/restpassword").put(restPassword)
router.route('/logout').get(logout)


export default router