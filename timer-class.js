
//////////////////////////////////////////
/////////////////////////////////////////
////////////////////////////////////////
//
// Super duper fitness timer.
// 


/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
//
// Data structures.
//
const timerStates = {
    ready: "ready",
    running: "running",
    paused: "paused",
    finished: "finished"
};
Object.freeze(timerStates);
// Keep current timer state.
let timerState = timerStates.ready;

const timerColors = {};
timerColors[timerStates.ready] = 'rgb(80%, 80%, 80%)';
timerColors[timerStates.running] = 'rgb(50%, 90%, 50%)';
timerColors[timerStates.paused] = 'rgb(50%, 70%, 50%)';
timerColors[timerStates.finished] = 'rgb(90%, 30%, 30%)';
Object.freeze(timerColors);

// Data that interacts with the system timer.
const systemTimerInfo = {
    // Timestamp.  Compare 'now' to this time to determine current elapsed time.
    absoluteStartMilliseconds: 0,
    // Need to save the time accrued if the timer is paused.
    accumulatedMilliseconds: 0,
    // Optimization, only need to run most code at a one second interval.
    previousElapsedSeconds: 0
}

// Translate system timer info, user configuration.
//
const timerInfo = {
    // Data that stays constant when timer runs.
    beepAfterDelay: false,
    countUp: false,
    useIntervalTimer: false,
    workHeadsup: 0,
    useRestInterval: false,

    // Initial info from user. Used to init and reset the timer.
    initialDelay: 0,
    timeMin: 0,
    timeSec: 0,
    workMin: 0,
    workSec: 0,
    restMin: 0,
    restSec: 0,

    // Data derived from initial info.
    initTotalSeconds: 0,
    workTotalSeconds: 0,
    restTotalSeconds: 0,
    intervalTotalSeconds: 0,

    // Beep info
    needBeep: false,
    needLoudBeep: false,
    audioPlayer: null,
    beepVolume: 0

}

// Convenience arrays for forEach. 
const timerMainDisplays = ["f-timemin", "f-timesec"];
const timerWorkDisplays = ["f-workmin", "f-worksec", "f-workheadsup"];
const timerRunningWorkDisplays = ["f-workmin", "f-worksec"]; // headsup doesn't run.
const timerRestDisplays = ["f-restmin", "f-restsec"];
const timerRunningDisplays = [
    'f-delay',
    ...timerMainDisplays,
    ...timerWorkDisplays,
    ...timerRestDisplays
];
const timerElementsToDisable = [
    ...timerRunningDisplays,
    'f-delay',
    "f-beepafterdelay",
    "f-countup",
    'f-useintervaltimer',
    'f-userestinterval',
    'f-reset'
];
Object.freeze(timerMainDisplays);
Object.freeze(timerWorkDisplays);
Object.freeze(timerRunningWorkDisplays);
Object.freeze(timerRestDisplays);
Object.freeze(timerRunningDisplays);
Object.freeze(timerElementsToDisable);


/////////////////////////////////////////
/////////////////////////////////////////
/////////////////////////////////////////
//
// Utility functions.
//
function elid(id) {
    return document.getElementById(id);
}
function setElementBackgroundColor(id, val) {
    elid(id).style.backgroundColor = val;
}
function setElementDisabled(id, val) {
    elid(id).disabled = val;
}
function getNow() {
    return new Date().getTime();
}
function getElementIntValue(id) {
    return parseInt(elid(id).value, 10);
}
function setElementValue(id, val) {
    elid(id).value = val;
}
function setElementChecked(id, val) {
    elid(id).checked = val;
}
function getElementChecked(id) {
    return elid(id).checked;
}


///////////////////////////////////////
//////////////////////////////////////
/////////////////////////////////////
////////////////////////////////////
///////////////////////////////////
//
// Entry point from html.
//
function initTimerFunction() {
    systemTimerInfo.absoluteStartMilliseconds = getNow();
    setInterval(timerHandler, 250);
    setTimerColors();
    setElementDisabled("f-reset", false);
    timerInfo.audioPlayer = new Audio("Sounds/beep-short.mp3");
    const volControl = elid('f-beepvolume');
    volControl.addEventListener('click', beepVolumeListener);
    //console.log('init');
}

function beepVolumeListener(ev) {
    const value = ev.target.value;
    timerInfo.beepVolume = value;
    //console.log(value);
}

///////////////////////////////////////
/////////////////////////////////////
////////////////////////////////////////
//
// Update system timer data in response to
// buttons pressed by user.
//
function initOrResetSystemTimerInfo() {
    systemTimerInfo.absoluteStartMilliseconds = getNow();
    systemTimerInfo.accumulatedMilliseconds = 0;
    systemTimerInfo.previousElapsedSeconds = 0;
}

// Restart after a pause.
function restartSystemTimerInfo() {
    systemTimerInfo.absoluteStartMilliseconds = getNow();
    systemTimerInfo.previousElapsedSeconds = 0;
}

function pauseSystemTimerInfo() {
    ({ currentElapsedMilliSeconds } = getTimeInformation());
    systemTimerInfo.accumulatedMilliseconds += currentElapsedMilliSeconds;
    systemTimerInfo.absoluteStartMilliseconds = getNow();
}

/////////////////////////
///////////////////////////
////////////////////////////
//
//  Colour related code
//
// Color the timer number displays, depending on timer state.
function setTimerColors() {
    if (timerState == timerStates.ready) {
        setReadyTimerColors();
    }
    else if (timerState == timerStates.running) {
        setRunningTimerColors()
    }
    else if (timerState == timerStates.paused) {
        setPausedTimerColors()
    }
}

function setReadyTimerColors() {
    // Set everything to ready colour.
    const currentColor = timerColors[timerState];
    timerRunningDisplays.forEach(id => setElementBackgroundColor(id, currentColor));
    setElementBackgroundColor('f-beepvolume', currentColor);
}

function setRunningTimerColors() {
    const currentColor = timerColors[timerState];
    timerMainDisplays.forEach(id => setElementBackgroundColor(id, currentColor));

    if (timerInfo.useIntervalTimer) {
        timerRunningWorkDisplays.forEach(id => setElementBackgroundColor(id, currentColor));
        if (timerInfo.useRestInterval) {
            timerRestDisplays.forEach(id => setElementBackgroundColor(id, currentColor));
        }
        else {
            setElementChecked('f-userestinterval', false);
        }
    }
}

function setPausedTimerColors() {
    const currentColor = timerColors[timerState];
    timerMainDisplays.forEach(id => setElementBackgroundColor(id, currentColor));
    if (timerInfo.initialDelay > 0) {
        setElementBackgroundColor("f-delay", currentColor);
    }

    if (timerInfo.useIntervalTimer) {
        timerRunningWorkDisplays.forEach(id => setElementBackgroundColor(id, currentColor));
        if (timerInfo.workHeadsup > 0) {
            setElementBackgroundColor("f-workheadsup", currentColor);
        }
        if (timerInfo.useRestInterval) {
            timerRestDisplays.forEach(id => setElementBackgroundColor(id, currentColor));
        }
    }
}


///////////////////////////////////////////////
///////////////////////////////////////////////
///////////////////////////////////////////////
//
// Handler, run perhaps 10 times per second to update time information.
// Update screen display every second.
//
function timerHandler() {
    if (timerState == timerStates.finished) {
        setElementDisabled("f-reset", false);
    }
    const timeInfo = getTimeInformation();
    const { currentElapsedSeconds } = timeInfo;
    if (currentElapsedSeconds > systemTimerInfo.previousElapsedSeconds) {
        // Only run on the one second boundary, conserve resources.
        systemTimerInfo.previousElapsedSeconds = currentElapsedSeconds;
        if (timerState == timerStates.running) {
            updateDisplay(timeInfo);
        }
    }
    //updateDebugDisplay1(timeInfo);

    const ti = timerInfo;
    if (ti.needLoudBeep) {
        ti.needLoudBeep = false;
        playLoudBeep();
        setTimeout(playLoudBeep, 2000);
    } else if (ti.needBeep) {
        ti.needBeep = false;
        // Don't want both sounds.
        const totalElapsed = ti.initTotalSeconds + ti.initialDelay;
            if ( timerInfo.countUp || totalElapsed - currentElapsedSeconds > 0) {
            playBeep();
        }
    }
}

// System time functions.
//
// It is best not to calculate passing time by adding little timer intervals.
// This timer works by setting one start time, then comparing 'now'
// against that time, to determine elapsed time. If the timer is
// paused and restarted, the start time will have to be reset in order
// to not count the time that passed while paused. This means that the
// presently accumulated time has to be saved in another variable.
//
function getTimeInformation() {
    // Current time in ms.
    const now = getNow();
    // Subtract start time from now to get elapsed ms.
    const currentElapsedMilliSeconds =
        now - systemTimerInfo.absoluteStartMilliseconds;
    // Add in any accumulated time since last pause to get total elapsed.
    const totalElapsedMilliseconds =
        currentElapsedMilliSeconds + systemTimerInfo.accumulatedMilliseconds;
    // Round time (down) to nearest second.
    const currentElapsedSeconds = Math.floor(currentElapsedMilliSeconds / 1000);
    const totalElapsedSeconds = Math.floor(totalElapsedMilliseconds / 1000);

    return {
        now,
        currentElapsedMilliSeconds,
        totalElapsedMilliseconds,
        currentElapsedSeconds,
        totalElapsedSeconds
    };
}


/////////////////////////////
///////////////////////////////////
//////////////////////////////////////
// Audio
//
function playBeep() {
    //
    timerInfo.audioPlayer.volume = timerInfo.beepVolume / 10;
    timerInfo.audioPlayer.play();
    //timerInfo.audioPlayer = null;
}

function playLoudBeep() {
    let volume = timerInfo.beepVolume + 2;
    if (volume > 10) {
        volume = 10;
    }
    timerInfo.audioPlayer.volume = volume / 10;
    timerInfo.audioPlayer.play();
    //timerInfo.audioPlayer = null;
}

//////////////////////////////////////////////////////
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
//
// Update the running time info.
//
function updateDisplay() {
    // If this is called, then probably a full second,
    // has elapsed, ie there will be work to do.
    const t = getTimeInformation();
    console.assert(t.totalElapsedSeconds > 0, "update display error");

    if (t.totalElapsedSeconds < timerInfo.initialDelay) {
        return;
    }
    if (t.totalElapsedSeconds == timerInfo.initialDelay) {
        if (timerInfo.beepAfterDelay) {
            timerInfo.needBeep = true;
        }
        return;
    }

    // Remove the initial delay from the elapsed time.
    const elapsedAfterDelay = t.totalElapsedSeconds - timerInfo.initialDelay;
    updateDisplayMainDisplay(elapsedAfterDelay);

    //console.log(t.totalElapsedSeconds, elapsedAfterDelay);

    if (timerInfo.useIntervalTimer) {
        updateDisplayIntervalDisplay(elapsedAfterDelay);
    }
}

function updateDisplayMainDisplay(elapsedSecAfterDelay) {
    if (timerInfo.countUp) {
        const displayMin = Math.floor(elapsedSecAfterDelay / 60);
        const displaySec = elapsedSecAfterDelay % 60;
        setElementValue('f-timemin', displayMin);
        setElementValue('f-timesec', displaySec);
    } else {
        const secRemaining = timerInfo.initTotalSeconds - elapsedSecAfterDelay;
        if (secRemaining >= 0) {
            const displayMin = Math.floor(secRemaining / 60);
            const displaySec = secRemaining % 60;
            setElementValue('f-timemin', displayMin);
            setElementValue('f-timesec', displaySec);
            if (secRemaining == 0) {
                timerState = timerStates.finished;
                timerInfo.needLoudBeep = true;
            }
        }
    }
}

// Interval timers always count down.
function updateDisplayIntervalDisplay(elapsedSecAfterDelay) {
    const i = timerInfo;
    let loopElapsed = elapsedSecAfterDelay % i.intervalTotalSeconds;
    if (loopElapsed == 0) {
        loopElapsed = i.intervalTotalSeconds;
    }

    if (loopElapsed <= i.workTotalSeconds) {
        let downSec = i.workTotalSeconds - loopElapsed;
        let workMin = Math.floor(downSec / 60);
        let workSec = downSec % 60;
        //console.log('work', elapsedSecAfterDelay, loopElapsed, downSec, workMin, workSec);
        setElementValue('f-workmin', workMin);
        setElementValue('f-worksec', workSec);
        if (downSec == 0) {
            timerInfo.needBeep = true;
        }
    } else {
        loopElapsed -= i.workTotalSeconds;
        let downSec = i.restTotalSeconds - loopElapsed;
        let restMin = Math.floor(downSec / 60);
        let restSec = downSec % 60;
        //console.log('rest', elapsedSecAfterDelay, loopElapsed, downSec, restMin, restSec);
        setElementValue('f-restmin', restMin);
        setElementValue('f-restsec', restSec);
        const hu = timerInfo.workHeadsup;
        if (hu > 0 && hu == downSec) {
            timerInfo.needBeep = true;
        }
        if (downSec == 0) {
            timerInfo.needBeep = true;
        }
    }
}

///////////////////////////////////////////////////////
////////////////////////////////////////////////////////
///////////////////////////////////////////////////
//
// Toggle between running and paused / ready.
//
// eslint-disable-next-line no-unused-vars
function onClickStartPause() {
    if (timerState == timerStates.ready) {
        // Only do this here (from ready to running).
        saveInitUserSettings();
        initOrResetSystemTimerInfo();
        timerState = timerStates.running;
        setTimerColors();
        disableElements();
    } else if (timerState == timerStates.paused) {
        restartSystemTimerInfo();
        timerState = timerStates.running;
        setTimerColors();
        setElementDisabled("f-reset", true);
    } else if (timerState == timerStates.running) {
        pauseSystemTimerInfo();
        timerState = timerStates.paused;
        setTimerColors();
        setElementDisabled("f-reset", false);
    }
}

// eslint-disable-next-line no-unused-vars
function onClickReset() {
    if (
        timerState == timerStates.finished ||
        timerState == timerStates.paused
    ) {
        restoreInitUserSettings();
        absoluteStartTime = getNow();
        previousElapsedSeconds = 0;
        accumulatedMilliseconds = 0;
        timerState = timerStates.ready;
        setTimerColors();
        enableElements();
    }
}

function disableElements() {
    timerElementsToDisable.forEach(id => setElementDisabled(id, true));
}

function enableElements() {
    timerElementsToDisable.forEach(id => setElementDisabled(id, false));
}

function saveInitUserSettings() {
    timerInfo.initialDelay = getElementIntValue('f-delay');
    timerInfo.beepAfterDelay = getElementChecked('f-beepafterdelay');
    timerInfo.timeMin = getElementIntValue('f-timemin');
    timerInfo.timeSec = getElementIntValue('f-timesec');
    timerInfo.countUp = getElementChecked('f-countup');
    timerInfo.useIntervalTimer = getElementChecked('f-useintervaltimer');
    timerInfo.workMin = getElementIntValue('f-workmin');
    timerInfo.workSec = getElementIntValue('f-worksec');
    timerInfo.workHeadsup = getElementIntValue('f-workheadsup');
    timerInfo.useRestInterval = getElementChecked('f-userestinterval');
    timerInfo.restMin = getElementIntValue('f-restmin');
    timerInfo.restSec = getElementIntValue('f-restsec');
    timerInfo.beepVolume = getElementIntValue('f-beepvolume');

    timerInfo.initTotalSeconds = timerInfo.timeMin * 60 + timerInfo.timeSec;
    timerInfo.workTotalSeconds = timerInfo.workMin * 60 + timerInfo.workSec;
    timerInfo.restTotalSeconds = timerInfo.useRestInterval ?
        timerInfo.restMin * 60 + timerInfo.restSec : 0;
    timerInfo.intervalTotalSeconds = timerInfo.workTotalSeconds + timerInfo.restTotalSeconds;
}

// Put display back to before the timer was run.
function restoreInitUserSettings() {
    setElementValue('f-delay', timerInfo.initialDelay);
    setElementValue('f-timemin', timerInfo.timeMin);
    setElementValue('f-timesec', timerInfo.timeSec);
    setElementValue('f-restmin', timerInfo.restMin);
    setElementValue('f-restsec', timerInfo.restSec);
    setElementValue('f-workmin', timerInfo.workMin);
    setElementValue('f-worksec', timerInfo.workSec);

}


///////////////////////
///////////////////////
///////////////////////
// Debug displays
//
function updateDebugDisplay1(timeInfo) {
    const { currentElapsedMilliSeconds } = timeInfo;
    const el = elid("out-para");
    el.innerHTML = `
    State: ${timerState}
    Start: ${new Date(systemTimerInfo.absoluteStartMilliseconds).toLocaleTimeString()}
    <br>
    Current: ${(currentElapsedMilliSeconds / 1000).toFixed(2)}
    Accumulated: ${(systemTimerInfo.accumulatedMilliseconds / 1000).toFixed(2)}
    `;
}


//////
// eof
/////