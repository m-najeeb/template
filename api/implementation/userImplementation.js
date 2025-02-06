const ResponseService = require('../../src/services/responseService');
const tokenService = require('../../src/services/tokenService');
const constants = require('../../src/utilities/constants');
const messages = require('../../src/utilities/messages');
const { sendOTP } = require('../../src/services/emailService');
const UserQueries = require('../../src/queries/userQueries');
const bcrypt = require('bcrypt');


class UserImplementation {
    async signUp(data) {
        try {
            const { email, username, phone } = data;
            const errorMessages = [];

            // Check if any user already exists with the given email, username, or phone
            const existingUser = await UserQueries.getUserDetailsByData(data);

            if (existingUser) {
                // Check individually and add corresponding error messages
                if (existingUser.email === email) errorMessages.push(messages.EMAIL_EXISTS);
                if (existingUser.username === username) errorMessages.push(messages.USERNAME_EXISTS);
                if (existingUser.phone === phone) errorMessages.push(messages.PHONE_NUMBER_EXISTS);
            }

            // If there are any error messages, send them in the response
            if (errorMessages.length > 0) {
                ResponseService.status = constants.CODE.BAD_REQUEST;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    errorMessages
                );
            }
            //hashedPassword
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);
            data.password = hashedPassword;

            const response = await UserQueries.createUser(data);
            if (response) {
                // Generate and send OTP via email
                const otp = await sendOTP(email);

                ResponseService.status = constants.CODE.OK;
                return ResponseService.responseService(
                    constants.STATUS.SUCCESS,
                    response,
                    messages.SUCCESSFULLY_SIGN_UP
                );
            }
        } catch (error) {
            console.log(error);
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return ResponseService.responseService(
                constants.STATUS.EXCEPTION,
                error.message,
                messages.EXCEPTION
            );
        }
    }

    async signIn(data) {
        try {
            const user = await UserQueries.getUserByEmail(data.email);

            if (!user) {
                ResponseService.status = constants.CODE.BAD_REQUEST;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.USER_NOT_FOUND
                );
            }

            if(user.isEmailVerified === false){
                const otp = await sendOTP(data.email);
                
                ResponseService.status = constants.CODE.NON_AUTHORITIVE_INFORMATION;
                return ResponseService.responseService(
                    constants.STATUS.SUCCESS,
                    null,
                    messages.OTP_SENT
                );
            }

            const isMatch = await bcrypt.compare(data.password, user.password);

            if (!isMatch) {
                ResponseService.status = constants.CODE.BAD_REQUEST;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.INVALID_CREDENTIALS
                );
            }
            const userData = { id: user._id, email: user.email, role: user.role };

            const accessToken = await tokenService.accessToken(userData);
            const refreshToken = await tokenService.refreshToken(user._id);
            user.isOnline = true;
            user.refreshToken = refreshToken;
            await user.save();

            ResponseService.status = constants.CODE.OK;
            return ResponseService.responseService(
                constants.STATUS.SUCCESS,
                { accessToken: accessToken, user: user },
                messages.RECORD_FOUND
            );
        } catch (error) {
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return ResponseService.responseService(
                constants.STATUS.EXCEPTION,
                error.message,
                messages.EXCEPTION
            );
        }
    }

    async editBasicProfile(data) {
        try {
            const id = data.id;
            const existingUser = await UserQueries.getUserDetailsById(id);

            if (!existingUser) {
                ResponseService.status = constants.CODE.BAD_REQUEST;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.USER_NOT_FOUND
                );
            }

            // Only update fields if they exist in data
            if (data.fullName) existingUser.fullName = data.fullName;
            if (data.profilePicture) existingUser.profilePicture = data.profilePicture;

            const response = await existingUser.save();

            if (response) {
                ResponseService.status = constants.CODE.OK;
                return ResponseService.responseService(
                    constants.STATUS.SUCCESS,
                    response,
                    messages.BASIC_PROFILE_UPDATE
                );
            }


        } catch (error) {
            console.log(error);
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return ResponseService.responseService(
                constants.STATUS.EXCEPTION,
                error.message,
                messages.EXCEPTION
            );
        }
    }

    async refreshAccessToken(data) {
        try {
            const { refreshToken } = data;

            // Check if refresh token is provided
            if (!refreshToken) {
                ResponseService.status = constants.CODE.BAD_REQUEST;
                return res.status(ResponseService.status).send(
                    ResponseService.responseService(
                        constants.STATUS.ERROR,
                        { auth: false },
                        messages.INVALID_DATA
                    )
                );
            }

            // Verify the refresh token and generate a new access token
            const newAccessToken = await tokenService.updateAccessToken(refreshToken);

            // Check if an error occurred during token generation
            if (!newAccessToken || ResponseService.status !== constants.CODE.OK) {
                return res.status(ResponseService.status).send(newAccessToken);
            }

            ResponseService.status = constants.CODE.OK;
            return ResponseService.responseService(
                constants.STATUS.SUCCESS,
                { accessToken: newAccessToken },
                messages.TOKEN_REFRESHED
            );
        } catch (error) {
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return res.status(ResponseService.status).send(
                ResponseService.responseService(
                    constants.STATUS.EXCEPTION,
                    error.message,
                    messages.EXCEPTION
                )
            );
        }
    }

    async forgotPassword(email) {
        try {
            // Check if the email exists in the database
            const user = await UserQueries.getUserByEmail(email);
            if (!user) {
                ResponseService.status = constants.CODE.NOT_FOUND;
                return res.status(ResponseService.status).send(
                    ResponseService.responseService(
                        constants.STATUS.ERROR,
                        { message: 'Email not found' },
                        messages.EMAIL_NOT_FOUND
                    )
                );
            }

            // Send the OTP via email
            const otp = await sendOTP(email);

            const expirationTime = Date.now() + 10 * 60 * 1000;

            // Save OTP and expiration time to the user's record
            user.otp = otp;
            user.otpExpiration = new Date(expirationTime);
            await user.save();

            ResponseService.status = constants.CODE.OK;
            return ResponseService.responseService(
                constants.STATUS.SUCCESS,
                { message: 'OTP sent successfully' },
                messages.OTP_SENT
            );
        } catch (error) {
            console.log(error);
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return ResponseService.responseService(
                constants.STATUS.EXCEPTION,
                error.message,
                messages.EXCEPTION
            );
        }
    }

    async verifyOTP(email, providedOtp) {
        try {
            const user = await UserQueries.getUserByEmail(email);
            if (!user) {
                ResponseService.status = constants.CODE.ACCEPTED;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.USER_NOT_FOUND
                );
            }

            // Check if OTP is expired
            const currentTime = new Date();
            if (currentTime > user.otpExpiration) {
                ResponseService.status = constants.CODE.ACCEPTED;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.OTP_EXPIRED
                );
            }

            // Verify the OTP
            if (user.otp !== providedOtp) {
                ResponseService.status = constants.CODE.ACCEPTED;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.INVALID_OTP
                );
            }

            // OTP is valid; you can proceed with further actions (like password reset)
            ResponseService.status = constants.CODE.OK;
            return ResponseService.responseService(
                constants.STATUS.SUCCESS,
                [],
                messages.OTP_VERIFIED
            );

        } catch (error) {
            console.log(error);
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return ResponseService.responseService(
                constants.STATUS.EXCEPTION,
                error.message,
                messages.EXCEPTION
            );
        }
    }

    async changePassword(data) {
        try {
            const email = data.email;
            const currentPassword = data.currentPassword;
            const newPassword = data.newPassword;

            // Check if the email exists in the database
            const user = await UserQueries.getUserByEmail(email);
            if (!user) {
                ResponseService.status = constants.CODE.NOT_FOUND;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.EMAIL_NOT_FOUND
                );
            }

            // Verify if the provided current password matches the database password
            const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordMatch) {
                ResponseService.status = constants.CODE.ACCEPTED;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.PASSWORD_MISMATCH
                );
            }

            // Check if the new password is the same as the current password
            const isNewPasswordSame = await bcrypt.compare(newPassword, user.password);
            if (isNewPasswordSame) {
                ResponseService.status = constants.CODE.ACCEPTED;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.PASSWORD_SAME_AS_OLD
                );
            }

            // Hash the new password and update it in the database
            const salt = await bcrypt.genSalt(10);
            const hashedNewPassword = await bcrypt.hash(newPassword, salt);
            const response = await UserQueries.updateUserPassword(email, hashedNewPassword);

            ResponseService.status = constants.CODE.OK;
            return ResponseService.responseService(
                constants.STATUS.SUCCESS,
                [],
                messages.PASSWORD_UPDATED
            );
        } catch (error) {
            console.log(error);
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return ResponseService.responseService(
                constants.STATUS.EXCEPTION,
                error.message,
                messages.EXCEPTION
            );
        }
    }

    async sendOTP(data) {
        try {
            const email = data.email;
            // Check if the email exists in the database
            const user = await UserQueries.getUserByEmail(email);
            if (!user) {
                ResponseService.status = constants.CODE.ACCEPTED;
                return ResponseService.responseService(
                    constants.STATUS.ERROR,
                    [],
                    messages.USER_NOT_FOUND
                );
            }

            const otp = await sendOTP(email);

            ResponseService.status = constants.CODE.OK;
            return ResponseService.responseService(
                constants.STATUS.SUCCESS,
                [],
                messages.OTP_SENT
            );
        } catch (error) {
            console.log(error);
            ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
            return ResponseService.responseService(
                constants.STATUS.EXCEPTION,
                error.message,
                messages.EXCEPTION
            );
        }
    }

    async signOut(userId) {
        try {
            // Nullify the user's refresh token in the database
            const user = await UserQueries.getUser(userId);
            if (!user) {
                ResponseService.status = constants.CODE.BAD_REQUEST;
                return res.status(ResponseService.status).send(
                    ResponseService.responseService(
                        constants.STATUS.ERROR,
                        [],
                        messages.USER_NOT_FOUND
                    )
                );
            }
            user.isOnline = false;
            user.refreshToken = null;
            await user.save();

            // Return success response
            ResponseService.status = constants.CODE.OK;
            return ResponseService.responseService(
                constants.STATUS.SUCCESS,
                [],
                messages.SIGN_OUT_SUCCESSFULLY
            );
        } catch (error) {
            console.log(error);
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
module.exports = new UserImplementation();