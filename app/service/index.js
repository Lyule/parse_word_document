'use strict';

const Service = require('egg').Service;
const fs = require('fs');
const path = require('path');
const awaitWriteStream = require('await-stream-ready').write;

const { errorEvent } = require('../util/errorEvent');
const { getJson: parseWordDocGetJson/* , getJsonPath: parseWordDocGetJsonFile */ } = require('./parseWordDoc');

class IndexService extends Service {
  async parseWordDoc() {
    const { ctx } = this;
    const srcStream = await ctx.getFileStream();
    if (!/\.docx$|\.doc$/.test(srcStream.filename)) {
      errorEvent('fileType');
    }
    // 保存文件到改路径
    const file = path.join(path.resolve('./app/file/'), srcStream.filename);
    const stream = srcStream.pipe(fs.createWriteStream(file));
    await awaitWriteStream(stream);

    // getFile
    // return parseWordDocGetJsonFile(file)

    // getJson
    return parseWordDocGetJson(file);
  }
}

module.exports = IndexService;
