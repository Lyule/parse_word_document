'use strict';

const ERROR_MSG = {
  fileType: '文件格式错误！',
  fileParse: '文件解析错误！',
};

const ErrorEvent = (ctx, errorType) => {
  ctx.status = 500;
  ctx.body = {
    msg: ERROR_MSG[errorType],
  };
};

const SuccessEvent = (ctx, successType) => {
  ctx.status = 200;
  ctx.body = {
    msg: ERROR_MSG[successType],
  };
};

module.exports = {
  ErrorEvent,
  SuccessEvent,
};
