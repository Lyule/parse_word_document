'use strict';
const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');

// table
const TblRegExp = /<w:tbl[\s\S]*?<\/w:tbl>/ig;
// table 行
const TrRegExp = /<w:tr[\s\S]*?<\/w:tr>/ig;
// table 列
const TcRegExp = /<w:tc[\s\S]*?<\/w:tc>/ig;
// 行
const PRegExp = /<w:p[\s\S]*?<\/w:p>/ig;
// 文字
const TextRegExp = /<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/ig;

async function getJson(pathname) {
  const { zippath } = parsePathname(pathname);
  await fs.renameSync(pathname, zippath);
  const zip = new AdmZip(zippath);
  const contentXml = zip.readAsText('word/document.xml'); // 将document.xml读取为text内容；
  const json = parseXML(contentXml);
  await fs.renameSync(zippath, pathname);
  return json;
}

async function getJsonPath(pathname) {
  const { zippath, jsonSavePath } = parsePathname(pathname);

  await fs.renameSync(pathname, zippath);

  const zip = new AdmZip(zippath);
  const contentXml = zip.readAsText('word/document.xml'); // 将document.xml读取为text内容；
  const json = parseXML(contentXml);

  await fs.writeFileSync(jsonSavePath, JSON.stringify(json));

  fs.renameSync(zippath, pathname);

  return jsonSavePath;
}

function parsePathname(pathname) {
  const basename = path.basename(pathname, path.extname(pathname));
  const zippath = `${path.dirname(pathname) + basename}.zip`;
  const jsonSavePath = `${path.dirname(pathname) + basename}.json`;

  return {
    pathname,
    zippath,
    jsonSavePath,
  };
}

function parseXML(wordDocXml) {
  const json = [];
  let jsonIndex = 0;
  parseWordXML(wordDocXml).forEach(item => {
    // 解析行
    const trXmls = parseTblXML(item);
    if (trXmls.length < 2) {
      throw new Error('This document is not properly formatted', 'There are not enough rows in the table');
    }

    // 是否为多选题
    const multipleChoice = isMultipleChoice(item);

    trXmls.forEach((trXml, trIndex) => {
      // 表头省略
      if (trIndex === 0) return;

      const examQuestion = Object.create(null);
      examQuestion.isMultipleChoice = multipleChoice;
      const tcXmls = parseTrXML(trXml);
      // 解析行中列文字的格式：parseTpXML(parseTcXML(tcXml)[trIndex])
      const id = parseTpXML(parseTcXML(tcXmls[0])[0]);
      if (!id) {
        throw new Error('This document is not properly formatted', 'tr\'s id was not found');
      }
      examQuestion.id = id;

      // 解析题目
      const testQuestion = parseTestQuestion(tcXmls[1]);
      if (testQuestion.length < 5) {
        throw new Error('This document is not properly formatted', 'tr\'s question format is not up to scratch');
      }

      // 题目为第一行
      examQuestion.title = testQuestion.shift();

      // 解析答案
      const testAnswerStr = parseTestAnswer(tcXmls[2]);
      if (!testAnswerStr) {
        throw new Error('This document is not properly formatted', 'tr\'s answer was not found');
      }
      const options = [];
      testQuestion.forEach(item => {
        const optionId = item.substring(0, 1);
        let correct = false;
        if (testAnswerStr.indexOf(optionId) >= 0) correct = true;
        options.push({
          option: optionId,
          optionName: item,
          correct,
        });
      });
      examQuestion.options = options;

      json[jsonIndex] = examQuestion;
      jsonIndex++;
    });
  });
  return json;
}

function isMultipleChoice(tblXml) {
  const tableType = parseTpXML(parseTcXML(parseTrXML(parseTblXML(tblXml)[0])[0])[0]);
  if (tableType === '多选题') {
    return true;
  } else if (tableType === '单选题') {
    return false;
  }

  throw new Error('Incorrect table headings');
}

function parseTestQuestion(tcXml) {
  const tpXmls = parseTcXML(tcXml);
  const tps = [];
  tpXmls.forEach(tpXml => {
    const tp = parseTpXML(tpXml);
    if (tp) tps.push(tp);
  });
  return tps;
}

function parseTestAnswer(tcXml) {
  const tpXmls = parseTcXML(tcXml);
  return parseTpXML(tpXmls[0]);
}

function parseWordXML(xml) {
  const tblArr = [];
  const tblXml = xml.match(TblRegExp);
  if (tblXml.length < 1) {
    throw new Error('This document is not properly formatted');
  }

  xml.match(TblRegExp).forEach(item => tblArr.push(item));
  return tblArr;
}

function parseTblXML(tblXml) {
  const trArr = [];
  tblXml.match(TrRegExp).forEach(item => trArr.push(item));
  return trArr;
}

function parseTrXML(trXml) {
  const tcArr = [];
  trXml.match(TcRegExp).forEach(tc => tcArr.push(tc));
  return tcArr;
}

function parseTcXML(tcXml) {
  const pArr = [];
  tcXml.match(PRegExp).forEach(p => pArr.push(p));
  return pArr;
}

function parseTpXML(tpXml) {
  let text = '';
  try {
    if (!tpXml.match(TextRegExp)) return;
    tpXml.match(TextRegExp).forEach(p => {
      text += p.replace(/<w:t[\s\S]*?>([\s\S]*?)<\/w:t>/ig, '$1');
    });
  } catch (err) {
    throw new Error(err);
  }
  return text;
}

module.exports = {
  getJson,
  getJsonPath,
};
