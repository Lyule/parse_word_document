'use strict';

module.exports = appInfo => {
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1536573591148_4058';

  // add your config here
  config.middleware = [];

  config.multipart = {
    fileExtensions: [ '.docx', '.doc' ], // 增加对 .apk 扩展名的支持
  };

  config.view = {
    defaultViewEngine: 'nunjucks',
  };
  config.nunjucks = {
    // dir: 'path/to/template/dir',  // default to `{app_root}/app/view`
    cache: true, // local env is false
  };

  config.security = {
    csrf: false,
  };

  return config;
};
