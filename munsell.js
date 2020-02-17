/* eslint-disable no-undefined */
/* eslint-disable quote-props */
/* eslint-disable no-ternary */
/* eslint-disable no-undef */
/* eslint-disable no-else-return */
/* eslint-disable dot-location */
/* eslint-disable object-property-newline */
/* eslint-disable object-curly-spacing */
/* eslint-disable sort-keys */
/* eslint-disable no-warning-comments */
/* eslint-disable func-style */
/* eslint-disable no-plusplus */
/* eslint-disable multiline-comment-style */
/* eslint-disable array-element-newline */
/* eslint-disable max-statements */
/* eslint-disable id-length */
/* eslint-disable no-use-before-define */
/* eslint no-unused-vars: ["error", { "vars": "local" }] */
//

const gMunsellCsvDataFileName = "Data/real_sRGB.csv";

const gMunsellData = [];
let gMunsellDataIndex = 0;

let gTimerTime = 1000;
let gPaused = false;
let gFwd = true;

const mapNameToHue100 = new Map(
  [
    ['R', 0],
    ['YR', 10],
    ['Y', 20],
    ['GY', 30],
    ['G', 40],
    ['BG', 50],
    ['B', 60],
    ['PB', 70],
    ['P', 80],
    ['RP', 90]
  ]
);


// Normalize in the Munsell way (want to include 100, exclude 0).
function normalizeHue(h100) {
  const h = parseFloat(h100);
  let normh = h % 100.0;
  if (normh == 0) {
    normh = 100;
  }
  return normh;
}


function relativeHue(h100, steps) {
  const relHue = normalizeHue(parseFloat(h100) + parseFloat(steps));
  return relHue;
}


// Match hue first, try to preserve value before chroma.
function getMunsellData(h100, v, c) {
  let retVal;
  // Try to get exact hue value chroma.  If not, start giving on chroma.
  const hvMatches = gMunsellData.filter(line => line.h100 == h100 && line.v == v);
  if (hvMatches.length > 0) {
    // Choose exact or next largest chroma.
    let bestChroma = 0;
    hvMatches.forEach(line => {
      const curChroma = parseInt(line.c, 10);
      const chromaIsBigger = curChroma > bestChroma;
      const chromaNotTooBig = curChroma <= parseInt(c, 10);
      if (chromaIsBigger && chromaNotTooBig) {
        retVal = line;
        bestChroma = curChroma;
      }
    });
  }
  return retVal;
}


function initMunsell() {
  // Get the Munsell renotation data.
  getDataViaAjax();
  // 'Live' part of page.
  setTimeout(timerFunc, gTimerTime);
}


function onClickFaster() {
  gTimerTime *= 0.7;
  gTimerTime = parseInt(gTimerTime, 10);
}


function onClickSlower() {
  gTimerTime *= 1.3;
  gTimerTime = parseInt(gTimerTime, 10);
}


function onClickPause() {
  gPaused = !gPaused;
}


function onClickRev() {
  gFwd = !gFwd;
}


// Get the raw csv data.
function getDataViaAjax() {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function onreadystatechange() {
    const ready = 4;
    const ok = 200;
    if (this.readyState == ready && this.status == ok) {
      processCsvData(this.responseText);
    }
  };
  xhr.open("GET", gMunsellCsvDataFileName, true);
  xhr.send();
}


// Process raw csv data.
function processCsvData(munsellCsvData) {
  const lines = munsellCsvData.split('\n');
  lines.forEach(line => {
    const lineArray = line.split(',');
    if (lineArray.length == 6) {
      processCsvDataLine(lineArray);
    }
  });
}


function processCsvDataLine(lineArray) {
  // Each line is comma separated data.
  const [h, v, c, r, g, b] = lineArray;
  // Match one or two hues.
  const [nameMatch] = h.match(/[RYGBP]{1,2}/iu);
  const name = nameMatch.toUpperCase();
  const numf = parseFloat(h);
  const num = numf.toString();
  const h100i = mapNameToHue100.get(name) + numf;
  const h100 = h100i.toString();
  gMunsellData.push({ h, num, name, v, c, r, g, b, h100 });
}


function nextMunsellDataIndex() {
  const f = gFwd
    ? incrementMunsellDataIndex
    : decrementMunsellDataIndex;
  f();
}


function incrementMunsellDataIndex() {
  gMunsellDataIndex++;
  if (gMunsellDataIndex == gMunsellData.length) {
    gMunsellDataIndex = 0;
  }
}


function decrementMunsellDataIndex() {
  if (gMunsellDataIndex == 0) {
    gMunsellDataIndex = gMunsellData.length;
  }
  gMunsellDataIndex--;
}


function timerFunc() {
  if (!gPaused) {
    const d = gMunsellData[gMunsellDataIndex];
    updateDisplay1(d);
    updateDisplay2(d);
    nextMunsellDataIndex();
  }
  setTimeout(timerFunc, gTimerTime);
}


function updateDisplay1(data) {
  const ele = elid('output1');
  const eleh = elid('output1-h');
  const { h, v, c, r, g, b, h100 } = data;
  ele.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  eleh.innerHTML = `
    Munsell ${h} ${v} ${c} (hue ${h100})<br>   rgb ${r} ${g} ${b}
  `;
}


function updateDisplay2(data) {
  const { v: vp, c: cp, h100: h100p } = data;
  const rh = relativeHue(h100p, 50);
  const ele = elid('output2');
  const eleh = elid('output2-h');
  const compData = getMunsellData(rh.toString(), vp, cp);
  if (typeof compData !== 'object') {
    console.log("compData not object", data);
  }
  const { h, v, c, r, g, b, h100 } = compData;
  ele.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  eleh.innerHTML = `
    Complement, Munsell ${h} ${v} ${c} (hue ${h100})<br>   rgb ${r} ${g} ${b}
  `;
}

// eof
