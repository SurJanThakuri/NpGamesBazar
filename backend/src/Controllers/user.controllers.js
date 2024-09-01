import jwt from 'jsonwebtoken';
import { User } from '../Models/User.js';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js"

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        console.log(`Generating tokens for user ID: ${userId}`);
        
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }
        console.log('User found:', user);
        
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        console.log('Generated tokens:', { accessToken, refreshToken });

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        console.error('Error generating tokens:', error);
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get admin details from frontend
    const { name, email, username, password, role } = req.body

    // validation - not empty
    if ([name, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required")
    }

    // check if account already exists - email
    const existedUser = await User.findOne({ email })
    if (existedUser) {
        throw new ApiError(409, "User with this email already exists")
    }

    // create admin object - create entry in db
    const user = await User.create({
        name,
        email,
        username,
        password,
        role: role || "user"
    })

    // check for admin creation - remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Failed to create user")
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User created successfully")
    )
})

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    const { email, password } = req.body

    // check email
    if (!email) {
        throw new ApiError(400, "email is required")
    }

    // find the user
    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User with this email does not exist")
    }

    // passwordd check 
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid Credentials")
    }

    // access and refresh token
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    //remove password and refresh token from response
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // send cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    admin: loggedInUser, accessToken, refreshToken
                },
                "Admin logged in successfully"
            )
        )

})

const logoutAdmin = asyncHandler(async (req, res) => {
    await Admin.findByIdAndUpdate(
        req.admin._id,
        {
            $set: {
                refreshToken: 1
            }
        },
        {
            new: true,
        }
    )
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Admin logged Out"))

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const admin = await Admin.findById(decodedToken?._id)

        if (!admin) {
            throw new ApiError(401, "invalid refresh token")
        }

        if (incomingRefreshToken !== admin?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(admin._id)
        console.log(accessToken, refreshToken);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access Token Refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const admin = await Admin.findById(req.admin?._id)
    const isPasswordCorrect = await admin.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Old Password")
    }

    admin.password = newPassword
    await admin.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "Password Changed Successfully")
        )
})

const getCurrentAdmin = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.admin, "Current Admin Fetched Successfully")
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { name, email, phone, address } = req.body;

    if (!name || !email || !phone || !address) {
        throw new ApiError(400, "All fields are required")
    }

    const admin = await Admin.findByIdAndUpdate(
        req.admin?._id,
        {
            $set: {
                name: name,
                email: email,
                address: address,
                phone: phone,
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, admin, "Account details updated successfully"))
})

export {
    registerUser,
    loginUser,
    logoutAdmin,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentAdmin,
    updateAccountDetails
}