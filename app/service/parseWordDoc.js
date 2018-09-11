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
  console.log(json);
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
    // 是否为多选题
    const multipleChoice = isMultipleChoice(item);
    const trXmls = parseTblXML(item);
    trXmls.forEach((trXml, trIndex) => {
      if (trIndex === 0) return;
      const examQuestion = Object.create({});
      examQuestion.isMultipleChoice = multipleChoice;
      const tcXmls = parseTrXML(trXml);
      examQuestion.id = parseTpXML(parseTcXML(tcXmls[0])[0]);
      // parseTpXML(parseTcXML(tcXml)[tcIndex])
      const testQuestion = parseTestQuestion(tcXmls[1]);
      examQuestion.title = testQuestion.shift();

      // answer string
      const testAnswerStr = parseTestAnswer(tcXmls[2]);
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
  return parseTpXML(parseTcXML(parseTrXML(parseTblXML(tblXml)[0])[0])[0]) === '多选题';
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
    console.log(err);
  }
  return text;
}

module.exports = {
  getJson,
  getJsonPath,
};
