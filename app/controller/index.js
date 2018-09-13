'use strict';

const Controller = require('egg').Controller;
const fs = require('fs');
const awaitWriteStream = require('await-stream-ready').write;
const path = require('path');
const { errorEvent } = require('../util/errorEvent');

class HomeController extends Controller {
  async index() {
    const ctx = this.ctx;
    await ctx.render('home.html');
  }

  async upload() {
    const { ctx } = this;
    const srcStream = await ctx.getFileStream();
    if (!/\.docx$|\.doc$/.test(srcStream.filename)) {
      errorEvent('fileType');
    }

    // 保存文件到改路径
    const file = path.join(path.resolve('./app/file/'), srcStream.filename);
    const stream = srcStream.pipe(fs.createWriteStream(file));
    await awaitWriteStream(stream);

    const parseWordDocGetJson = await ctx.service.index.parseWordDoc(file);

    ctx.body = {
      data: parseWordDocGetJson,
      msg: 'success',
    };
  }
}

module.exports = HomeController;
