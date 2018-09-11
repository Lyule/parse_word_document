'use strict';

const Service = require('egg').Service;
const parseWordDocGetJson = require('./parseWordDoc').getJson;

class IndexService extends Service {
  parseWordDoc(fileName) {
    return parseWordDocGetJson(fileName);
  }
}

module.exports = IndexService;
