const { StatusCodes } = require('http-status-codes');
const { msg } = require('../constant');
const { sendErrorResponse } = require('../utils');

const getHealth = async (req, res) => {
  try {
    return res.status(StatusCodes.OK).json({
      status: StatusCodes.OK,
      msg: msg.healthCheck.successMsg,
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

module.exports = {
  getHealth,
};
