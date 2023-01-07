import { User } from "../models/users.js";
import { sendMail } from "../utils/sendMail.js";
import { sendToken } from "../utils/sendToken.js";
import cloudinary from "cloudinary"
import fs from 'fs'
export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const avatar  = req.files.avatar.tempFilePath
        // console.log(avatar);

        
        let user = await User.findOne({ email })

        if (user) {
            return res.status(400).json({
                success: false,
                message: "User Already Registered"
            })
        }
        const otp = Math.floor(Math.random() * 1000000)
        const mycloud = await cloudinary.v2.uploader.upload(avatar,{
            folder:'todoapp'
        })

        fs.rmSync("./tmp",{recursive:true})
        
        user = await User.create({
            name,
            email,
            password,
            avatar: {
                public_id: mycloud.public_id,
                url: mycloud.secure_url
            },
            otp,
            otp_expiry: new Date(Date.now() + process.env.OTP_EXPIRE * 60 * 1000)
        })

        await sendMail(email, "Verify your Account", `Your Otp is ${otp}`)
        sendToken(res, user, 201, "OTP SENT TO EMAIL")

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const verify = async (req, res) => {
    try {
        const otp = Number(req.body.otp);
        const user = await User.findById(req.user._id)

        if (user.otp !== otp || user.otp_expiry < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid Otp or Has Been Expired" })
        }
        user.verified = true,
            user.otp = null,
            user.otp_expiry = null

        await user.save()
        sendToken(res, user, 200, "Account Verified")


    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select("+password")

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email or Password"
            })
        }

        sendToken(res, user, 200, "Login Suucessfully")

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const logout = async (req, res) => {
    try {
        res.status(200).cookie("token", null, {
            expires: new Date(Date.now())
        }).json({ success: true, message: "Logout Successfully" })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const addTask = async (req, res) => {
    try {
        const { title, description } = req.body

        const user = await User.findById(req.user._id)

        user.tasks.push({
            title,
            description,
            completed: false,
            createdAt: new Date(Date.now())
        })

        await user.save()
        res.status(200).json({ success: true, message: "Task add Successfully" })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const removeTask = async (req, res) => {
    try {
        const { taskId } = req.params

        const user = await User.findById(req.user._id)

        user.tasks = user.tasks.filter(task => task._id.toString() !== taskId)

        await user.save()

        res.status(200).json({ success: true, message: "Task remove Successfully" })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params

        const user = await User.findById(req.user._id)

        user.task = user.tasks.find((task) => task._id.toString() === taskId.toString())

        user.task.completed = !user.task.completed
        await user.save()

        res.status(200).json({ success: true, message: "Task update Successfully" })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const getMyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        sendToken(res, user, 200, `welcome ${user.name}`)

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        const { name } = req.body;

        const avatar  = req.files.avatar.tempFilePath

        if (name) user.name = name;
        if (avatar) {
            await cloudinary.v2.uploader.destroy(user.avatar.public_id)

            const mycloud = await cloudinary.v2.uploader.upload(avatar)
                
            fs.rmSync("./tmp",{recursive:true})

    
            
            user.avatar = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url
            }
        }
        await user.save()

        res.status(200).json({ success: true, message: "Profile update Successfully" })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const updatePassword = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password")

        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            res.status(200).json({ success: false, message: "Plz enter all field" })
        }

        const isMatch = await user.comparePassword(oldPassword)

        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Old Password"
            })
        }

        user.password = newPassword

        await user.save()
        res.status(200).json({ success: true, message: "Password update Successfully" })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const forgotPassword = async (req, res) => {
    try {

        const { email } = req.body;

        const user = await User.findOne({ email })

        if (!user) {
            res.status(200).json({ success: false, message: "Invalid Eamil" })
        }

        const otp = Math.floor(Math.random() * 1000000)

        user.resetPasswordOTP = otp
        user.resetPasswordotp_expiry = Date.now() + 10 * 60 * 1000

        await user.save()


        await sendMail(email, "Request For Reset Password", `Your Otp is ${otp}`)
        sendToken(res, user, 201, "OTP SENT TO EMAIL")


        res.status(200).json({ success: true, message: `Otp Send To ${email}` })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}
export const restPassword = async (req, res) => {
    try {

        const { otp, newPassword } = req.body;

        const user = await User.findOne({
            resetPasswordOTP: otp,
            resetPasswordotp_expiry: { $gt: Date.now() }
        }).select("+password")

        if (!user) {
            res.status(200).json({ success: false, message: "Otp Expire" })
        }

        user.password = newPassword
        user.resetPasswordOTP = null
        user.resetPasswordotp_expiry = null

        await user.save()


        res.status(200).json({ success: true, message: "Password Updated" })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}




