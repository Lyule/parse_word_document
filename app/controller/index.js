'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const ctx = this.ctx;
    await ctx.render('home.html');
  }

  async upload() {
    const { ctx } = this;

    const parseWordDocGetJson = await ctx.service.index.parseWordDoc();

    ctx.body = {
      data: parseWordDocGetJson,
      msg: 'success',
    };
  }
}

module.exports = HomeController;
