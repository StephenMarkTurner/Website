// Adding a comment, trying to trigger eslint.

// It is best not to calculate passing time by adding little timer intervals.
// This timer works by setting one start time, then comparing 'now'
// against that time, to determine elapsed time. If the timer is
// paused and restarted, the start time will have to be reset in order
// to not count the time that passed while paused. This means that the
// presently accumulated time has to be saved in another variable.

//#region Data.

const timerStates = {
  ready: "ready",
  running: "running",
  paused: "paused",
  finished: "finished"
};

// Timestamp.  Compare 'now' to this time to determine current elapsed time.
let absoluteStartTime = 0;
// Optimization, only need to run most code at a one second interval.
let previousElapsedSeconds = 0;
// Need to save the time accrued if the timer is paused.
let accumulatedMilliseconds = 0;
// Ready, running, paused, finished.
let timerState = timerStates.ready;

// Save the timer settings.
class MainTimerData {
  constructor() {
    this.m = 0;
    this.s = 0;
    this.d = 0;
    this.runForever = false;
    this.countUp = false;
    this.beepAfterDelay = false;
  }

  // Get the data from the specified elements, store here.
  setData(mId, sId, dId) {
    this.m = getElementIntValue(mId);
    this.s = getElementIntValue(sId);
    this.d = getElementIntValue(dId);
    this.runForever = getElementChecked("f-t1-run-forever");
    if (this.runForever) {
      setElementChecked("f-t1-count-up", true);
    }
    this.countUp = getElementChecked("f-t1-count-up");
    this.beepAfterDelay = getElementChecked("f-t1-beep-after-delay");
  }

  // Put the stored data in the specified elements.
  getData(mId, sId, dId) {
    setElementValue(mId, this.m);
    setElementValue(sId, this.s);
    setElementValue(dId, this.d);
    // Don't use any checkbox info of course.
  }
}
const mainTimer = new FitnessTimer();

// These are added on the fly by the user.
class SplitTimerData {
  constructor() {
    this.m = 0;
    this.s = 0;
    this.repeat = true;
    this.countUp = false;
    this.finished = false;
  }

  setData(mId, sId, repeatId, countUpId, finished) {
    this.m = getElementIntValue(mId);
    this.s = getElementIntValue(sId);
    this.repeat = getElementChecked(repeatId);
    this.countUp = getElementChecked(countUpId);
    this.finished = finished;
  }

  // Don't need to read the finished value (it doesn't go in any control).
  getData(mId, sId) {
    setElementValue(mId, this.m);
    setElementValue(sId, this.s);
    //setElementChecked(repeatId, this.repeat);
    //setElementChecked(countUpId, this.countUp);
  }
}
const splitTimers = [];

// Added on the fly.
class SplitDoubleTimerData {
  constructor() {
    this.m0 = 0;
    this.s0 = 0;
    this.m1 = 0;
    this.s1 = 0;
    this.countUp = false;
  }

  setData(m0Id, s0Id, m1Id, s1Id, countUpId) {
    this.m0 = getElementIntValue(m0Id);
    this.s0 = getElementIntValue(s0Id);
    this.m1 = getElementIntValue(m1Id);
    this.s1 = getElementIntValue(s1Id);
    this.countUp = getElementChecked(countUpId);
  }

  getData(m0Id, s0Id, m1Id, s1Id) {
    setElementValue(m0Id, this.m0);
    setElementValue(s0Id, this.s0);
    setElementValue(m1Id, this.m1);
    setElementValue(s1Id, this.s1);
  }
}
const splitDoubleTimers = [];

//#endregion

//#region Utility functions.

function elid(id) {
  return document.getElementById(id);
}

function getElementIntValue(id) {
  return parseInt(elid(id).value, 10);
}

function getElementChecked(id) {
  return elid(id).checked;
}

function setElementValue(id, val) {
  elid(id).value = val;
}

function setElementChecked(id, val) {
  elid(id).checked = val;
}

function setElementDisabled(id, val) {
  elid(id).disabled = val;
}

function setElementBackgroundColor(id, val) {
  elid(id).style.backgroundColor = val;
}

function getNow() {
  const now = new Date().getTime();
  return now;
}

function minSecToSec(m, s) {
  const mSec = m * 60;
  return mSec + s;
}

function secToMinSec(s) {
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return {
    min,
    sec
  };
}

// Best to only make one call to realtime function, then derive
// the various times that are useful.
function getTimeInformation() {
  const now = getNow();
  const currentElapsedMilliSeconds = now - absoluteStartTime;
  const currentElapsedSeconds = Math.floor(currentElapsedMilliSeconds / 1000);
  const totalElapsedMilliseconds =
    currentElapsedMilliSeconds + accumulatedMilliseconds;
  const totalElapsedSeconds = Math.floor(totalElapsedMilliseconds / 1000);
  return {
    now,
    currentElapsedMilliSeconds,
    currentElapsedSeconds,
    totalElapsedMilliseconds,
    totalElapsedSeconds
  };
}

function playSmallSound() {
  const a = new Audio("Sounds/beep-short.mp3");
  a.volume = 0.3;
  a.play();
}

function playBigSound() {
  const a = new Audio("Sounds/beep-long.mp3");
  a.play();
}

//#endregion

//#region Save and restore user data. Set colors for controls.

// Get data from html control settings, save.
function saveDataFromControls() {
  mainTimer.setData("f-t1-timemin", "f-t1-timesec", "f-delay");

  splitTimers.forEach((settings, i) => {
    //console.log(data, i);
    settings.setData(
      `f-st${i + 1}-timemin`,
      `f-st${i + 1}-timesec`,
      `f-st${i + 1}-repeat`,
      `f-st${i + 1}-count-up`,
      false
    );
  });

  splitDoubleTimers.forEach((settings, i) => {
    //console.log(data, i);
    settings.setData(
      `f-sdt${i + 1}-timemin0`,
      `f-sdt${i + 1}-timesec0`,
      `f-sdt${i + 1}-timemin1`,
      `f-sdt${i + 1}-timesec1`,
      `f-sdt${i + 1}-count-up`
    );
  });
}

// Reset the html controls with our saved data.
function restoreSavedDataToControls() {
  mainTimer.getData("f-t1-timemin", "f-t1-timesec", "f-delay");

  splitTimers.forEach((settings, i) => {
    //console.log(data, i);
    settings.getData(
      `f-st${i + 1}-timemin`,
      `f-st${i + 1}-timesec`,
      `f-st${i + 1}-repeat`
    );
    // This seems out of place?
    settings.finished = false;
  });

  splitDoubleTimers.forEach((settings, i) => {
    //console.log(data, i);
    settings.getData(
      `f-sdt${i + 1}-timemin0`,
      `f-sdt${i + 1}-timesec0`,
      `f-sdt${i + 1}-timemin1`,
      `f-sdt${i + 1}-timesec1`
    );
  });
}

function getTimerColor(state) {
  let currentColor = null;
  switch (state) {
    case timerStates.ready:
      currentColor = "rgb(90%, 90%, 90%)";
      break;
    case timerStates.running:
      currentColor = "rgb(50%, 90%, 50%)";
      break;
    case timerStates.paused:
      currentColor = "rgb(50%, 70%, 50%)";
      break;
    case timerStates.finished:
      currentColor = "rgb(90%, 30%, 30%)";
      break;
    default:
      currentColor = "rgb(30%, 30%, 30%)";
      break;
  }
  return currentColor;
}

// Color the timer number displays, depending on timer state.
function setTimerColors() {
  const currentColor = getTimerColor(timerState);
  setElementBackgroundColor("f-t1-timemin", currentColor);
  setElementBackgroundColor("f-t1-timesec", currentColor);
  setElementBackgroundColor("f-delay", currentColor);

  const finishedColor = getTimerColor(timerStates.finished);
  splitTimers.forEach((settings, i) => {
    // Split timers can be finished ahead of time.
    const color = settings.finished ? finishedColor : currentColor;
    setElementBackgroundColor(`f-st${i + 1}-timemin`, color);
    setElementBackgroundColor(`f-st${i + 1}-timesec`, color);
  });

  splitDoubleTimers.forEach((settings, i) => {
    // The settings data is not really needed.
    setElementBackgroundColor(`f-sdt${i + 1}-timemin0`, currentColor);
    setElementBackgroundColor(`f-sdt${i + 1}-timesec0`, currentColor);
    setElementBackgroundColor(`f-sdt${i + 1}-timemin1`, currentColor);
    setElementBackgroundColor(`f-sdt${i + 1}-timesec1`, currentColor);
  });
}

//#endregion

//#region Timer handler.

function timerHandler() {
  const timeInfo = getTimeInformation();
  const { currentElapsedSeconds } = timeInfo;
  if (currentElapsedSeconds > previousElapsedSeconds) {
    // Only run on the one second boundary, conserve resources.
    previousElapsedSeconds = currentElapsedSeconds;
    if (timerState == timerStates.running) {
      updateDisplay(timeInfo);
    }
    //updateDebugDisplay2(timeInfo);
  }
  //updateDebugDisplay1(timeInfo);
}

// Entry point from html.
function initTimerFunction() {
  absoluteStartTime = getNow();
  setTimerColors();
  setElementDisabled("f-b-reset", true);
  //setInterval(timerHandler, 250);
  setInterval(timerHandler, 100);
}

function updateDisplay(timeInfo) {
  const { d } = mainTimer;
  const { totalElapsedSeconds } = timeInfo;

  const secondsDelayRemaining = d - totalElapsedSeconds;
  if (secondsDelayRemaining >= 0) {
    // Still counting down the initial delay.
    updateDisplayDuringDelay(secondsDelayRemaining);
  } else {
    // The timer has run beyond the initial delay.
    const secondsElapsedAfterDelay = -secondsDelayRemaining;
    updateDisplayAfterDelay(secondsElapsedAfterDelay);
  }
}

function updateDisplayDuringDelay(secondsDelayRemaining) {
  setElementValue("f-delay", secondsDelayRemaining);
  document.title = `Delay: ${secondsDelayRemaining}`;
  if (secondsDelayRemaining == 0 && mainTimer.beepAfterDelay) {
    playSmallSound();
  }
}

function updateDisplayAfterDelay(secondsElapsedAfterDelay) {
  const { m, s } = mainTimer;
  const settingsTotalSeconds = minSecToSec(m, s);
  const secondsRemaining = settingsTotalSeconds - secondsElapsedAfterDelay;
  // Keep functions in this order. Main one might set the 'finished' flag.
  updateMainTimer(secondsRemaining, secondsElapsedAfterDelay);
  updateSplitTimers(secondsElapsedAfterDelay);
  updateSplitDoubleTimers(secondsElapsedAfterDelay);
}

function updateMainTimer(secondsRemaining, secondsElapsedAfterDelay) {
  const { countUp, runForever } = mainTimer;
  const { min, sec } =
    countUp || runForever
      ? secToMinSec(secondsElapsedAfterDelay)
      : secToMinSec(secondsRemaining);

  const minStr = min.toString().padStart(2, "0");
  const secStr = sec.toString().padStart(2, "0");
  setElementValue("f-t1-timemin", minStr);
  setElementValue("f-t1-timesec", secStr);
  document.title = `${minStr}:${secStr}`;
  // To be safe. This task can be missed,
  // if the pause / restart timing is perfectly bad.
  setElementValue("f-delay", 0);

  if (secondsRemaining <= 0 && runForever === false) {
    timerState = timerStates.finished;
    absoluteStartTime = getNow();
    accumulatedMilliseconds = 0;
    setTimerColors();
    playBigSound();
    //setElementDisabled("f-b-startpause", true);
    //setElementDisabled("f-b-addtimer", true);
    //setElementDisabled("f-b-adddoubletimer", true);
    //document.title = "Timers";
    // NOT SURE:  Automatically reset, or leave 'finished'?
    setElementDisabled("f-b-reset", false);
    const resetEle = elid("f-b-reset");
    resetEle.click();
  }
}

function updateSplitTimers(secondsElapsedAfterDelay) {
  splitTimers.forEach((settings, index) => {
    if (!settings.finished) {
      const settingsSeconds = minSecToSec(settings.m, settings.s);
      // Can't have a loop of zero seconds.
      if (settingsSeconds > 0) {
        const firstLoop = secondsElapsedAfterDelay <= settingsSeconds;
        if (firstLoop || settings.repeat) {
          updateSplitTimer(
            settings,
            index,
            secondsElapsedAfterDelay,
            settingsSeconds
          );
        }
      }
    }
  });
}

function updateSplitTimer(
  settings,
  index,
  secondsElapsedAfterDelay,
  settingsSeconds
) {
  const moduloSeconds = secondsElapsedAfterDelay % settingsSeconds;
  const completedLoop = moduloSeconds == 0;
  if (completedLoop) {
    // Don't play split timer sounds if main timer is finished.
    if (timerState != timerState.finished) {
      playSmallSound();
    }
    if (!settings.repeat) {
      // This timer only plays once.
      settings.finished = true;
      setTimerColors();
    }
  }

  // Display time as 1 to n, not 0 to (n-1).
  const displaySeconds1 = completedLoop ? settingsSeconds : moduloSeconds;
  const displaySeconds2 = settings.countUp
    ? displaySeconds1
    : settingsSeconds - displaySeconds1;
  const { min, sec } = secToMinSec(displaySeconds2);
  const minStr = min.toString().padStart(2, "0");
  const secStr = sec.toString().padStart(2, "0");
  setElementValue(`f-st${index + 1}-timemin`, minStr);
  setElementValue(`f-st${index + 1}-timesec`, secStr);
}

function updateSplitDoubleTimers(secondsElapsedAfterDelay) {
  splitDoubleTimers.forEach((settings, index) => {
    const settingsSeconds0 = minSecToSec(settings.m0, settings.s0);
    const settingsSeconds1 = minSecToSec(settings.m1, settings.s1);
    // Can't have a loop of zero seconds.
    if (settingsSeconds0 > 0 && settingsSeconds1 > 0) {
      updateSplitDoubleTimer(
        settings,
        index,
        secondsElapsedAfterDelay,
        settingsSeconds0,
        settingsSeconds1
      );
    }
  });
}

function updateSplitDoubleTimer(
  settings,
  index,
  secondsElapsedAfterDelay,
  settingsSeconds0,
  settingsSeconds1
) {
  let moduloTotalSeconds =
    secondsElapsedAfterDelay % (settingsSeconds0 + settingsSeconds1);
  if (moduloTotalSeconds == 0) {
    moduloTotalSeconds = settingsSeconds0 + settingsSeconds1;
  }

  if (moduloTotalSeconds <= settingsSeconds0) {
    // First timer is running.
    const moduloSeconds = moduloTotalSeconds % settingsSeconds0;
    const completedLoop = moduloSeconds == 0;
    if (completedLoop) {
      // Don't play split timer sounds if main timer is finished.
      if (timerState != timerState.finished) {
        playSmallSound();
      }
    }
    // Display time as 1 to n, not 0 to (n-1).
    const displaySeconds = completedLoop ? settingsSeconds0 : moduloSeconds;
    const displaySeconds1 = settings.countUp
      ? displaySeconds
      : settingsSeconds0 - displaySeconds;
    const { min, sec } = secToMinSec(displaySeconds1);

    const minStr = min.toString().padStart(2, "0");
    const secStr = sec.toString().padStart(2, "0");
    setElementValue(`f-sdt${index + 1}-timemin0`, minStr);
    setElementValue(`f-sdt${index + 1}-timesec0`, secStr);
  } else {
    // Second timer is running.
    // Careful with this calc.
    const moduloSeconds =
      (moduloTotalSeconds - settingsSeconds0) % settingsSeconds1;
    const completedLoop = moduloSeconds == 0;
    if (completedLoop) {
      // Don't play split timer sounds if main timer is finished.
      if (timerState != timerState.finished) {
        playSmallSound();
      }
    }
    // Display time as 1 to n, not 0 to (n-1).
    const displaySeconds = completedLoop ? settingsSeconds1 : moduloSeconds;
    const displaySeconds1 = settings.countUp
      ? displaySeconds
      : settingsSeconds1 - displaySeconds;
    const { min, sec } = secToMinSec(displaySeconds1);
    const minStr = min.toString().padStart(2, "0");
    const secStr = sec.toString().padStart(2, "0");
    setElementValue(`f-sdt${index + 1}-timemin1`, minStr);
    setElementValue(`f-sdt${index + 1}-timesec1`, secStr);
  }
}

//#endregion

//#region Button handlers.

// Toggle between running and paused / ready.
// eslint-disable-next-line no-unused-vars
function onClickStartPause() {
  if (timerState == timerStates.ready) {
    // Only do this here (from ready to running).
    saveDataFromControls();
    absoluteStartTime = getNow();
    previousElapsedSeconds = 0;
    accumulatedMilliseconds = 0;
    timerState = timerStates.running;
    setTimerColors();
    setElementDisabled("f-b-reset", true);
    setElementDisabled("f-b-addtimer", true);
    setElementDisabled("f-b-adddoubletimer", true);
    setElementDisabled("f-t1-run-forever", true);
    setElementDisabled("f-t1-count-up", true);
  } else if (timerState == timerStates.paused) {
    absoluteStartTime = getNow();
    previousElapsedSeconds = 0;
    timerState = timerStates.running;
    setTimerColors();
    setElementDisabled("f-b-reset", true);
  } else if (timerState == timerStates.running) {
    const { now, currentElapsedMilliSeconds } = getTimeInformation();
    accumulatedMilliseconds += currentElapsedMilliSeconds;
    absoluteStartTime = now;
    timerState = timerStates.paused;
    setTimerColors();
    setElementDisabled("f-b-reset", false);
  }
}

// eslint-disable-next-line no-unused-vars
function onClickReset() {
  if (
    timerState == timerStates.finished ||
    timerState == timerStates.paused
  ) {
    restoreSavedDataToControls();
    absoluteStartTime = getNow();
    previousElapsedSeconds = 0;
    accumulatedMilliseconds = 0;
    timerState = timerStates.ready;
    setTimerColors();
    setElementDisabled("f-b-startpause", false);
    setElementDisabled("f-b-reset", true);
    setElementDisabled("f-b-addtimer", false);
    setElementDisabled("f-b-adddoubletimer", false);
    setElementDisabled("f-t1-run-forever", false);
    setElementDisabled("f-t1-count-up", false);
    document.title = "Timers";
  }
}

// eslint-disable-next-line no-unused-vars
function onClickAddTimer() {
  if (timerState == timerStates.ready) {
    splitTimers.push(new SplitTimerData());
    const newSplitTimerElement = document.createElement("div");
    newSplitTimerElement.innerHTML = createSplitTimerHtml(splitTimers.length);
    // Insert at end of div that contains the split timers.
    const container = elid("additional-timers");
    container.insertBefore(newSplitTimerElement, null);
  }
}

function createSplitTimerHtml(currentTimerNum) {
  const html = `
  <div class="ba br2 pa1 mt2">
    <label>Split Timer <br>Min
    <input type="number" id="f-st${currentTimerNum}-timemin" name="" class="w3 br2 bw0 ma1 tr" min="0" step="1" value="0" />
    </label>

    <label class="ml2">Sec
    <input type="number" id="f-st${currentTimerNum}-timesec" name="" class="w3 br2 bw0 ma1 tr" min="0" max="59" step="1"
    value="0" />
    </label>

    <br>
    <label class="">Repeat
    <input type="checkbox" id="f-st${currentTimerNum}-repeat" name="" checked />
    </label>

    <label class="ml2">Count Up
    <input type="checkbox" id="f-st${currentTimerNum}-count-up" name=""/>
    </label>

    </div>
    `;

  return html;
}

// eslint-disable-next-line no-unused-vars
function onClickAddDoubleTimer() {
  if (timerState == timerStates.ready) {
    splitDoubleTimers.push(new SplitDoubleTimerData());
    const newSplitDoubleTimerElement = document.createElement("div");
    newSplitDoubleTimerElement.innerHTML = createSplitDoubleTimerHtml(
      splitDoubleTimers.length
    );
    // Insert at end of div that contains the split timers.
    const container = elid("additional-timers");
    container.insertBefore(newSplitDoubleTimerElement, null);
  }
}

function createSplitDoubleTimerHtml(currentTimerNum) {
  const html = `
    <div class="ba br2 pa1 mt2">
    <label>Split Double Timer <br>Min
    <input type="number" id="f-sdt${currentTimerNum}-timemin0" name="" class="w3 br2 bw0 ma1 tr" min="0" step="1" value="0" />
    </label>

    <label class="ml2">Sec
    <input type="number" id="f-sdt${currentTimerNum}-timesec0" name="" class="w3 br2 bw0 ma1 tr" min="0" max="59" step="1"
    value="0" />
    </label>

    <br>
    <label>Min
    <input type="number" id="f-sdt${currentTimerNum}-timemin1" name="" class="w3 br2 bw0 ma1 tr" min="0" step="1" value="0" />
    </label>

    <label class="ml2">Sec
    <input type="number" id="f-sdt${currentTimerNum}-timesec1" name="" class="w3 br2 bw0 ma1 tr" min="0" max="59" step="1"
    value="0" />
    </label>

    <br>
    <label class="">Count Up
    <input type="checkbox" id="f-sdt${currentTimerNum}-count-up" name=""/>
    </label>

    `;

  return html;
}

//#endregion

//#region Display debug info.

/*
function updateDebugDisplay1(timeInfo) {
  const {
    currentElapsedMilliSeconds
  } = timeInfo;
  const el = elid("out-para");
  el.innerHTML = `
  State: ${timerState}
  Start: ${new Date(absoluteStartTime).toLocaleTimeString()}
  <br>
  Current: ${(currentElapsedMilliSeconds / 1000).toFixed(2)}
  Accumulated: ${(accumulatedMilliseconds / 1000).toFixed(2)}
  `;
}


function updateDebugDisplay2(timeInfo) {
  const {
    currentElapsedMilliSeconds
  } = timeInfo;
  const el = elid("out-para2");
  el.innerHTML = `
  Current: ${(currentElapsedMilliSeconds / 1000).toFixed(2)}
  `;
}
 */

//#endregion

// eof
