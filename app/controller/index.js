'use strict';

const Controller = require('egg').Controller;
const fs = require('fs');
const awaitWriteStream = require('await-stream-ready').write;
const path = require('path');

class HomeController extends Controller {
  async index() {
    const ctx = this.ctx;
    await ctx.render('home.html');
  }

  async upload() {
    const { ctx } = this;
    const srcStream = await ctx.getFileStream();
    const file = path.join(path.resolve('./app/file/'), srcStream.filename);
    const stream = srcStream.pipe(fs.createWriteStream(file));
    await awaitWriteStream(stream);

    const parseWordDocGetJson = await ctx.service.index.parseWordDoc(file);

    ctx.body = {
      code: 200,
      data: parseWordDocGetJson,
      msg: 'success',
    };
  }
}

module.exports = HomeController;
