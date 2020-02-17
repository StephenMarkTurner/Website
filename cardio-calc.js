/* eslint-disable array-element-newline */
/* eslint-disable multiline-ternary */
/* eslint-disable no-ternary */
/* eslint-disable max-statements */
/* eslint-disable id-length */
/* eslint no-use-before-define: ["error", { "functions": false }]*/


// This code calculates heart rate data based on maximum,
// and possibly resting, heart rates. Read html controls,
// and do the calculations from there.


// Per unit zone boundaries (ie first one is 90% to 100%, last one is 40% to 50%).
const zones = [
  [0.9, 1.0],
  [0.8, 0.9],
  [0.7, 0.8],
  [0.6, 0.7],
  [0.5, 0.6],
  [0.4, 0.5]
];


// Utility functions.
function el(id) {
  const ele = document.getElementById(id);
  return ele;
}

function ck(id) {
  const ele = el(id);
  const ch = ele.checked;
  return ch;
}

function val(id) {
  const ele = el(id);
  const v = parseInt(ele.value, 10);
  return v;
}


// Calculate max heart rate from age and formula.
function calculateMHR() {
  let mhr = 0;
  const age = val('form1-age');

  if (ck('form1-haskell')) {
    mhr = parseInt(220 - age, 10);
  } else if (ck('form1-tanaka')) {
    mhr = parseInt(206.9 - (0.67 * age), 10);
  } else if (ck('form1-gulati')) {
    mhr = parseInt(206 - (0.88 * age), 10);
  }
  return mhr;
}


// As the calculator values are changed, change the tables in real time.
// eslint-disable-next-line no-unused-vars
function onInput() {
  // Get both specified and calculated max heart rates.
  const specMHR = val('form1-mhr');
  const calcMHR = calculateMHR();
  // Pick the 'actual' one.
  const chosenMHR = ck('form1-spec-mhr') ? specMHR : calcMHR;

  // Output display is for calculated value.
  const o = el('form1-out1');
  o.value = calcMHR;

  // Always show regular training zone data.
  createRegularZoneData(chosenMHR);

  // Only show Karvonen data if corresponding check box checked.
  const karvTable = el('form1-karv-data');
  if (ck('form1-create-karv')) {
    createKarvZoneData(chosenMHR);
    karvTable.style.display = 'table';
  } else {
    karvTable.style.display = 'none';
  }
}


// Convert zones to percentages of the max heart rate.
function createRegularZoneData(mhr) {
  const heartrates = zones.map(zone => zone.map(zi => parseInt(mhr * zi, 10)));
  updateZoneTable(heartrates, 'form1-regular-data');
}


// Convert zones to percentage of the reserve, plus the resting heart rate.
function createKarvZoneData(mhr) {
  // Karvonen data needs resting heart rate.
  const rhr = val('form1-rhr');
  // The reserve is the difference between max and resting.
  const hrr = mhr - rhr;
  const heartrates = zones.map(zone => zone.map(zi => parseInt((hrr * zi) + rhr, 10)));
  updateZoneTable(heartrates, 'form1-karv-data');
}


// Write the data into the html tables.
function updateZoneTable(heartrates, tableid) {
  const table = el(tableid);
  // Skip thead.
  const [, tbody] = table.children;
  const rows = Array.from(tbody.children);
  rows.forEach((row, index) => {
    const tds = row.children;
    const curheartrates = heartrates[index];
    // First two td elements are for heart rate percentages.
    // eslint-disable-next-line array-element-newline
    [tds[2].innerHTML, tds[3].innerHTML] = curheartrates;
  });
}

// eof
