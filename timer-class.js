
//////////////////////////////////////////
/////////////////////////////////////////
////////////////////////////////////////
//
// Super duper fitness timer.
// 


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
}

// Convenience arrays for forEach. 
const timerMainDisplays = ["f-timemin", "f-timesec"];
const timerWorkDisplays = ["f-workmin", "f-worksec", "f-workheadsup"];
const timerRunningWorkDisplays = ["f-workmin", "f-worksec"]; // headsup doesn't run.
const timerRestDisplays = ["f-restmin", "f-restsec"];
const timerAllDisplays = [
    'f-delay',
    ...timerMainDisplays,
    ...timerWorkDisplays,
    ...timerRestDisplays
];
const timerElementsToDisable = [
    ...timerAllDisplays,
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
Object.freeze(timerAllDisplays);
Object.freeze(timerElementsToDisable);


/////////////////////////////////////////
/////////////////////////////////////////
// Utility functions.
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
function initTimerFunction() {
    systemTimerInfo.absoluteStartMilliseconds = getNow();
    setTimerColors();
    setElementDisabled("f-reset", false);
    setInterval(timerHandler, 500);
    //setInterval(timerHandler, 100);
}


////////////////////////
///////////////////////
////////////////////////
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

/////////////////
/////////////////
////////////////
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
    timerAllDisplays.forEach(id => setElementBackgroundColor(id, currentColor));
}

function setRunningTimerColors() {
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
//
// Handler, run perhaps 10 times per second to update time information.
// Update screen display every second.
//
function timerHandler() {
    const timeInfo = getTimeInformation();
    const { currentElapsedSeconds } = timeInfo;
    if (currentElapsedSeconds > systemTimerInfo.previousElapsedSeconds) {
        // Only run on the one second boundary, conserve resources.
        systemTimerInfo.previousElapsedSeconds = currentElapsedSeconds;
        if (timerState == timerStates.running) {
            updateDisplay(timeInfo);
        }
    }
    updateDebugDisplay1(timeInfo);
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


//////////////////////////////////////////////////////
///////////////////////////////////////////////////////
//////////////////////////////////////////////////////
// Update the running time info.
//
function updateDisplay(timeInfo) {
    // If this is called, then probably a full second,
    // has elapsed, ie there will be work to do.
    const tes = timeInfo.totalElapsedSeconds;
    console.assert(tes > 0, "update display error");

    if (tes <= timerInfo.initialDelay) {
        updateDisplayInitialDelay(tes);
        // Nothing else to do if still in initial delay.
        return;
    }

    // Remove the initial delay from the calcs.
    const tesAfterDelay = tes - timerInfo.initialDelay;
    const initTotalSeconds = timerInfo.timeMin * 60 + timerInfo.timeSec;
    updateDisplayMainDisplay(tesAfterDelay, initTotalSeconds);

    if (timerInfo.useIntervalTimer) {
        updateDisplayIntervalDisplay(tesAfterDelay);
    }
}

function updateDisplayInitialDelay(tes) {
    const newVal = timerInfo.initialDelay - tes;
    setElementValue('f-delay', newVal);
}

function updateDisplayMainDisplay(tesAfterDelay, initTotalSeconds) {
    if (timerInfo.countUp) {
        const displayMin = Math.floor(tesAfterDelay / 60);
        const displaySec = tesAfterDelay % 60;
        setElementValue('f-timemin', displayMin);
        setElementValue('f-timesec', displaySec);
    } else {
        if (initTotalSeconds >= tesAfterDelay) {
            const secRemaining = initTotalSeconds - tesAfterDelay;
            const displayMin = Math.floor(secRemaining / 60);
            const displaySec = secRemaining % 60;
            setElementValue('f-timemin', displayMin);
            setElementValue('f-timesec', displaySec);
        }
    }
}

function updateDisplayIntervalDisplay(tesAfterDelay) {
    if (timerInfo.countUp) {
        const loopSeconds = timerInfo.workMin * 60 + timerInfo.workSec;
        let modsec = tesAfterDelay % loopSeconds;
        if (modsec == 0) {
            modsec = loopSeconds;
        }
        setElementValue('f-worksec', modsec);
    } else if (initTotalSeconds >= tesAfterDelay) {
        const loopSeconds = timerInfo.workMin * 60 + timerInfo.workSec;
        const modsec = tesAfterDelay % loopSeconds;
        let modsec2 = loopSeconds - modsec;
        if (initTotalSeconds == tesAfterDelay) {
            // Finished.
            modsec2 = 0;
        }

        //setElementValue('f-workmin', displayMin);
        setElementValue('f-worksec', modsec2);
    }
}


///////////////////////////////////////////////////////
////////////////////////////////////////////////////////
///////////////////////////////////////////////////
//
//#region Button handlers.
//
// Toggle between running and paused / ready.
//
// eslint-disable-next-line no-unused-vars
function onClickStartPause() {
    if (timerState == timerStates.ready) {
        // Only do this here (from ready to running).
        saveVolatileUserSettings();
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
        restoreVolatileUserSettings();
        absoluteStartTime = getNow();
        previousElapsedSeconds = 0;
        accumulatedMilliseconds = 0;
        timerState = timerStates.ready;
        setTimerColors();
    }
}

function disableElements() {
    timerElementsToDisable.forEach(id => setElementDisabled(id, true));
}

function enableElements() {
    timerElementsToDisable.forEach(id => setElementDisabled(id, false));
}

// Save control settings. Some change during timer running.
function saveVolatileUserSettings() {
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
}

// Put display back to before the timer was run.
function restoreVolatileUserSettings() {
    setElementValue('f-delay', timerInfo.initialDelay);
    setElementValue('f-timemin', timerInfo.timeMin);
    setElementValue('f-timesec', timerInfo.timeSec);
    setElementValue('f-restmin', timerInfo.restMin);
    setElementValue('f-restsec', timerInfo.restSec);
    setElementValue('f-workmin', timerInfo.workMin);
    setElementValue('f-worksec', timerInfo.workSec);

}


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