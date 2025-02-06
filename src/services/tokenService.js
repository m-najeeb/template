const ResponseService = require('../../src/services/responseService');
const constants = require('../../src/utilities/constants');
const messages = require('../../src/utilities/messages');
const UserQueries = require('../queries/userQueries');
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const mongoose = require('mongoose')
require("dotenv").config();

class TokenService {
    async accessToken(data) {
        const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), process.env.CRYPTOJS_SECRET).toString();
        const token = jwt.sign({ data: encryptedData }, process.env.JWT_SECRET, { expiresIn: "15min" });
        return token;
    }

    async refreshToken(userId) {
        const payload = { userId };
        const encryptedPayload = CryptoJS.AES.encrypt(JSON.stringify(payload), process.env.CRYPTOJS_SECRET).toString();
        const refreshToken = jwt.sign({ data: encryptedPayload }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return refreshToken;
    }

    async verifyAccessToken(bearerToken) {
        try {

            // Verify the JWT token
            const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);

            // Decrypt user data
            const bytes = CryptoJS.AES.decrypt(decoded.data, process.env.CRYPTOJS_SECRET);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            // Validate decrypted data and parse as JSON
            let userData;
            try {
                userData = JSON.parse(decryptedData);
            } catch (err) {
                return res.status(constants.CODE.UNAUTHORIZED).send(
                    ResponseService.responseService(
                        constants.STATUS.ERROR,
                        { auth: false },
                        messages.INVALID_TOKEN
                    )
                );
            }

            // Verify user exists and has a refresh token
            const user = await UserQueries.getUserDetailsById(userData.id);
            if (!user || !user.refreshToken) {
                return res.status(constants.CODE.UNAUTHORIZED).send(
                    ResponseService.responseService(
                        constants.STATUS.ERROR,
                        { auth: false },
                        messages.INVALID_TOKEN
                    )
                );
            }

            return userData;
        } catch (error) {
            // Handle token-specific errors or general exceptions
            const status = error.name === 'TokenExpiredError'
                ? constants.CODE.UNAUTHORIZED
                : constants.CODE.INTERNAL_SERVER_ERROR;

            const message = error.name === 'TokenExpiredError'
                ? messages.TOKEN_EXPIRED
                : messages.INVALID_TOKEN;

            return res.status(status).send(
                ResponseService.responseService(
                    constants.STATUS.ERROR,
                    { auth: false },
                    message
                )
            );
        }
    }


    async verifyRefreshToken(token) {
        try {
            if (!token) {
                // No token provided
                ResponseService.status = constants.CODE.FORBIDDEN;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    { auth: false },
                    messages.AUTHENTICATION
                );
            }

            // Verify the refresh token
            let decoded;
            try {
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                // Handle token verification errors
                ResponseService.status = constants.CODE.UNAUTHORIZED;

                // Check if the error is for token expiration
                if (err.name === 'TokenExpiredError') {
                    return ResponseService.responseService(
                        constants.STATUS.ERROR,
                        { auth: false },
                        messages.TOKEN_EXPIRED
                    );
                }

                // Handle other JWT errors
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    { auth: false },
                    messages.INVALID_TOKEN
                );
            }

            // Decrypt the user data from the token
            const bytes = CryptoJS.AES.decrypt(decoded.data, process.env.CRYPTOJS_SECRET);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);

            // Check if decrypted data is valid JSON
            let userData;
            try {
                userData = JSON.parse(decryptedData);
            } catch (error) {
                ResponseService.status = constants.CODE.UNAUTHORIZED;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    { auth: false },
                    messages.INVALID_TOKEN
                );
            }

            // Return the decrypted user data (which contains userId)
            ResponseService.status = constants.CODE.OK;
            return userData;

        } catch (error) {
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return ResponseService.responseService(
                constants.STATUS.EXCEPTION,
                error.message,
                messages.EXCEPTION
            );
        }
    }

    async updateAccessToken(refreshToken) {
        try {
            // Verify the refresh token first
            const payload = await this.verifyRefreshToken(refreshToken);

            if (!payload || ResponseService.status !== constants.CODE.OK) {
                return ResponseService.responseService(
                    constants.STATUS.FAILURE,
                    "Invalid refresh token",
                    messages.INVALID_TOKEN
                );
            }

            // Properly instantiate ObjectId using 'new'
            const userDetails = await UserQueries.getUserByIdForRefreshToken(payload.userId);


            // Check if the user exists
            if (!userDetails) {
                ResponseService.status = constants.CODE.UNAUTHORIZED;
                return ResponseService.responseService(
                    constants.STATUS.FAILURE,
                    "User not found",
                    messages.EXCEPTION
                );
            }

            // Create a new access token with the user's data
            const userData = { id: userDetails.id, email: userDetails.email, role: userDetails.role };

            const newAccessToken = await this.accessToken(userData);

            return newAccessToken;
        } catch (error) {
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return ResponseService.responseService(
                constants.STATUS.EXCEPTION,
                error.message,
                messages.EXCEPTION
            );
        }
    }

}

// Export an instance of the class to use its methods
module.exports = new TokenService();
