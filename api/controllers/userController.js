const ResponseService = require("../../src/services/responseService");
const constants = require("../../src/utilities/constants");
const messages = require("../../src/utilities/messages");
const userImplementation = require("../implementation/userImplementation");
const userValidation = require("../../src/validations/userValidations");

class UserController {
  async signUp(req, res) {
    try {
      const data = req.body;
      const { error, value } = await userValidation.signUp(data);
      if (error) {
        ResponseService.status = constants.CODE.BAD_REQUEST;
        return res
          .status(ResponseService.status)
          .send(
            ResponseService.responseService(
              constants.STATUS.ERROR,
              error.details[0].message,
              messages.INVALID_DATA
            )
          );
      }
      const response = await userImplementation.signUp(value);
      res.status(ResponseService.status).send(response);
    } catch (error) {
      ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
      return ResponseService.responseService(
        constants.STATUS.EXCEPTION,
        error.message,
        messages.EXCEPTION
      );
    }
  }

  async signIn(req, res) {
    try {
      const data = req.body;
      const { error, value } = await userValidation.signIn(data);
      // Check for validation errors
      if (error) {
        ResponseService.status = constants.CODE.BAD_REQUEST;
        return res
          .status(ResponseService.status)
          .send(
            ResponseService.responseService(
              constants.STATUS.ERROR,
              error.details[0].message,
              messages.INVALID_DATA
            )
          );
      }
      const response = await userImplementation.signIn(value);
      res.status(ResponseService.status).send(response);
    } catch (error) {
      ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
      return ResponseService.responseService(
        constants.STATUS.EXCEPTION,
        error.message,
        messages.EXCEPTION
      );
    }
  }

  async editBasicProfile(req, res) {
    try {
      console.log("ahmed");
      const data = req.body;
      const { error, value } = await userValidation.editBasicProfile(data);
      // Check for validation errors
      if (error) {
        ResponseService.status = constants.CODE.BAD_REQUEST;
        return res
          .status(ResponseService.status)
          .send(
            ResponseService.responseService(
              constants.STATUS.ERROR,
              error.details[0].message,
              messages.INVALID_DATA
            )
          );
      }
      const response = await userImplementation.editBasicProfile(value);
      res.status(ResponseService.status).send(response);
    } catch (error) {
      ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
      return ResponseService.responseService(
        constants.STATUS.EXCEPTION,
        error.message,
        messages.EXCEPTION
      );
    }
  }

  async refreshAccessToken(req, res) {
    try {
      const data = req.body;
      // Check for validation errors
      if (!data) {
        ResponseService.status = constants.CODE.BAD_REQUEST;
        return res
          .status(ResponseService.status)
          .send(
            ResponseService.responseService(
              constants.STATUS.ERROR,
              error.details[0].message,
              messages.INVALID_DATA
            )
          );
      }
      const response = await userImplementation.refreshAccessToken(data);
      res.status(ResponseService.status).send(response);
    } catch (error) {
      ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
      return ResponseService.responseService(
        constants.STATUS.EXCEPTION,
        error.message,
        messages.EXCEPTION
      );
    }
  }

  async forgotPassword(req, res) {
    try {
      const data = req.body;
      // Check for validation errors
      if (!data) {
        ResponseService.status = constants.CODE.BAD_REQUEST;
        return res
          .status(ResponseService.status)
          .send(
            ResponseService.responseService(
              constants.STATUS.ERROR,
              error.details[0].message,
              messages.INVALID_DATA
            )
          );
      }

      const email = data.email.toLowerCase();
      const response = await userImplementation.forgotPassword(email);
      res.status(ResponseService.status).send(response);
    } catch (error) {
      ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
      return ResponseService.responseService(
        constants.STATUS.EXCEPTION,
        error.message,
        messages.EXCEPTION
      );
    }
  }

  async verifyOTP(req, res) {
    try {
      const data = req.body;
      // Check for validation errors
      if (!data) {
        ResponseService.status = constants.CODE.BAD_REQUEST;
        return res
          .status(ResponseService.status)
          .send(
            ResponseService.responseService(
              constants.STATUS.ERROR,
              error.details[0].message,
              messages.INVALID_DATA
            )
          );
      }

      const email = data.email.toLowerCase();
      const otp = data.otp;
      const response = await userImplementation.verifyOTP(email, otp);
      res.status(ResponseService.status).send(response);
    } catch (error) {
      ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
      return ResponseService.responseService(
        constants.STATUS.EXCEPTION,
        error.message,
        messages.EXCEPTION
      );
    }
  }

  async changePassword(req, res) {
    try {
      const data = req.body;
      // Check for validation errors
      if (!data) {
        ResponseService.status = constants.CODE.BAD_REQUEST;
        return res
          .status(ResponseService.status)
          .send(
            ResponseService.responseService(
              constants.STATUS.ERROR,
              error.details[0].message,
              messages.INVALID_DATA
            )
          );
      }

      const response = await userImplementation.changePassword(data);
      res.status(ResponseService.status).send(response);
    } catch (error) {
      ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
      return ResponseService.responseService(
        constants.STATUS.EXCEPTION,
        error.message,
        messages.EXCEPTION
      );
    }
  }

  async sendOTP(req, res) {
    try {
      const data = req.body;
      const response = await userImplementation.sendOTP(data);
      res.status(ResponseService.status).send(response);
    } catch (error) {
      ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
      return ResponseService.responseService(
        constants.STATUS.EXCEPTION,
        error.message,
        messages.EXCEPTION
      );
    }
  }

  async signOut(req, res) {
    try {
      const userId = req.params.id;
      const response = await userImplementation.signOut(userId);
      res.status(ResponseService.status).send(response);
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
module.exports = new UserController();
