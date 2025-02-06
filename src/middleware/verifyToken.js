const TokenService = require('../services/tokenService');
const ResponseService = require('../services/responseService');
const constants = require('../utilities/constants');
const messages = require('../utilities/messages');

const verifyToken = async (req, res, next) => {
    try {

        const bearerHeader = req.header('Authorization');

        // Check if Authorization header exists
        if (!bearerHeader) {
            return res.status(constants.CODE.FORBIDDEN).send(
                ResponseService.responseService(
                    constants.STATUS.ERROR,
                    { auth: false },
                    messages.AUTHENTICATION
                )
            );
        }

        // Extract token from header
        const bearerToken = bearerHeader.split(' ')[1];
        if (!bearerToken) {
            return res.status(constants.CODE.FORBIDDEN).send(
                ResponseService.responseService(
                    constants.STATUS.ERROR,
                    { auth: false },
                    messages.AUTHENTICATION
                )
            );
        }

        // Verify the access token using TokenService
        const userData = await TokenService.verifyAccessToken(bearerToken);
        req.user = userData;
        next();
    } catch (error) {
        // Handle any token verification errors
        ResponseService.status = constants.CODE.UNAUTHORIZED;
        return res.status(ResponseService.status).send(
            ResponseService.responseService(
                constants.STATUS.ERROR,
                null,
                messages.UNAUTHORIZED
            )
        );
    }
};

module.exports = verifyToken;
