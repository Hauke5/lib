import { Log } from './log';
const log = Log('timing');
/**
 * ## delay
 * Returns a `Promise` that resolves after `ms` milliseconds.
 * Calling `delay.restart()` while the delay is unresolved will reset the internal timer
 * such that the initial call to `delay()` will resolve at least `ms` milliseconds after calling `restart`.
 * Calling `delay.cancel()` will cause the initial `delay()` call to resolve immediately.
 * ### Examples
 * ```
 * returns a promise that resolves after 20ms or later:
 *    delay(20)
 *
 * wait for at least 20ms:
 *    await delay(20)
 *
 * wait for at least 20ms, then call the callback:
 *    await delay(20)
 *    console.log('done')
 *
 * restart example:
 *    const d = delay(20)        // start a 20ms timer
 *    delay(15).then(d.restart)  // restart the timer after 15ms
 *    await d                    // wait for timer to complete after 35ms
 *
 * cancel example:
 *    const d = delay(20)        // start a 20ms timer
 *    delay(15).then(d.cancel)   // cancel the timer after 15ms
 *    await d                    // wait for timer to complete after 15ms
 * ```
 * @param ms
 */
export function delay(ms) {
    let addedMS = Date.now();
    let timer;
    let resolver;
    const cancel = () => timer ? clearTimeout(timer) : null;
    const conclude = () => resolver(Date.now() - addedMS);
    const result = new Promise((resolve) => {
        resolver = resolve;
        timer = setTimeout(conclude, ms);
    });
    result.cancel = () => {
        cancel();
        conclude();
    };
    result.restart = () => {
        addedMS = Date.now();
        cancel();
        timer = setTimeout(conclude, ms);
    };
    return result;
}
/**
 * sets an alarm `at` the specifed datetime, at which `action` is executed.
 * if `each` is set in the options, the alarm will repeat every such interval.
 * The function returns an `Alarm` object with a `cancel` method that will end the timer.
 */
export function alarm(at, options, action) {
    let msUntilAlarm = 10;
    let alarmClock;
    cycle();
    return { at, cancel, each: options.each };
    function cancel() {
        msUntilAlarm = -1;
        alarmClock.cancel();
    }
    async function cycle() {
        while (msUntilAlarm > 0) {
            msUntilAlarm = at.getTime() - Date.now();
            alarmClock = delay(msUntilAlarm);
            await Promise.all([alarmClock]);
            if (msUntilAlarm < 0)
                break; // in case alarm was canceled in the meantime
            alarmClock.then(() => {
                log.info(`alarm triggered @${new Date().toString()}, calling action`);
                action();
                switch (options.each) {
                    case 'day':
                        at.setDate(at.getDate() + 1);
                        break;
                    case 'hour':
                        at.setHours(at.getHours() + 1);
                        break;
                    case 'minute':
                        at.setMinutes(at.getMinutes() + 1);
                        break;
                    case 'second':
                        at.setSeconds(at.getSeconds() + 1);
                        break;
                    default: msUntilAlarm = -1;
                }
                if (msUntilAlarm > 0) {
                    log.info(`alarm action called, setting next trigger for ${at.toString()}`);
                }
            });
        }
    }
}
/**
 * resolves a series of sequential `Actions` at a preset rate (`pace` ms per action), while
 * - not resolving more concurrent actions then a preset limit `maxConcurrent`
 * - waiting for a minimum `collectionPeriod` before executing an `Action`.
 * During this period, adding a new `action` with a known key will kick the call back
 * to the end of the queue.
 *
 * ### Parameters:
 * - `pace`: the number of ms to wait between `Action` calls; defaults to 100
 * - `maxConcurrent`: the number of allowed concurrent `Action` calls; defaults to 1
 * - `collectionPeriod`: the minimum amount of ms to wait before issuing an `Action` call; defaults to 0
 * - `timeout`: the number of ms before a timeout occurs. The `timeout` applies to the wait
 * for the `maxConcurrent` condition to be met after the pacing delay.
 *
 * <p>
 * **Usage:**
 * ```
 * const q = new PacingQueue({pace:100, maxConcurrent:10}); // 100ms between calls, at most 10 unresolved
 * ...
 * const result = await q.add((ms) => `I have been called after ${ms}ms`;})
 * console.log(result));     // prints: I have been called after 105ms`
 * ```
 */
export function pacing({ pace = 100, maxConcurrent = 1, collectionPeriod = 0, timeout = 10000 }) {
    /** `actions` that have been called, but have not resolved yet. */
    let started = 0;
    /** the number of `actions` waiting in queue */
    let waiting = 0;
    /** the queue holding callback `Items` */
    let done = 0;
    /** keeps track of when the last item `Action was started */
    let lastStarted = 0;
    /** used to track timeout loop */
    let timer;
    /** the queue holding callback `Items` */
    const queue = {};
    /** number of functions currently waiting in queue */
    const inQueue = () => waiting;
    /** functions that have been called, but have not resolved yet. */
    const inProgress = () => started;
    /** functions that have been called, but have not resolved yet. */
    const completed = () => done;
    const randomKey = (now) => `${now}-${Math.floor(Math.random() * 100000)}`;
    return { add, inQueue, inProgress, completed };
    /**
     * adds the function to the queue. After an appropriate time has passed,
     * the function will be called with the delay in ms as parameter.
     * @param action the `Action` to call when all conditions are mmet.
     * @return a promise that resolved to the result of `action`
     */
    async function add(action, key) {
        key = key || randomKey(Date.now());
        return queue[key]
            ? await restartItem(key, action)
            : await createItem(key, action);
    }
    /** restart the pacing for the action linked to `key` */
    async function restartItem(key, action) {
        const item = queue[key];
        item.addedAt = Date.now(); // update the base time, pushing item to end of queue
        item.action = action; // update to new `action`
        return await queue[key].completion; // reuse same `action` call chain
    }
    async function createItem(key, action) {
        // const waitMS = Math.max(collectionPeriod, waiting*(pace))
        waiting++;
        // const d = delay(waitMS)
        const item = {
            addedAt: Date.now(), key, action,
        };
        item.completion = new Promise((resolve, reject) => {
            item.resolver = resolve; // actual function
            item.rejecter = reject; // actual function
        });
        queue[key] = item;
        if (!timer)
            processItems();
        return await item.completion;
    }
    function processItems() {
        let wait = 5;
        timer = null;
        if (inProgress() < maxConcurrent && Date.now() - lastStarted > pace) { // ready for next Action
            const keys = Object.keys(queue);
            const earliestKey = keys.reduce((earliest, key) => queue[key].addedAt < queue[earliest].addedAt ? key : earliest, keys[0]);
            if (Date.now() - queue[earliestKey].addedAt > collectionPeriod) {
                processAction(earliestKey);
                wait = pace;
            }
        }
        if (!timer && inQueue() > 0)
            timer = setTimeout(processItems, wait);
    }
    async function processAction(key) {
        const item = queue[key];
        if (!item)
            throw new Error(`processAction did not find item for key ${key}`);
        // remove item from queue, so new queue entry created if `add` is called while
        // executing `item.action` 
        delete queue[key];
        const startDelay = Date.now() - item.addedAt;
        waiting--;
        started++;
        lastStarted = Date.now();
        const actionOutcome = await item.action(startDelay);
        const actionDuration = Date.now() - item.addedAt - startDelay;
        started--;
        done++;
        item.resolver({ actionOutcome, key, addedAt: item.addedAt, startDelay, actionDuration });
    }
}
/**
 * Returns a throttling function that ensures
 * - actions are not called with less than `pace` ms between calls
 * - no more than `maxConcurrent` (default:1) actions are in progress at any time
 * @returns a throttle function to queue up new calls. This function takes
 * - a `key` that allows subsequent calls to update the `action` and `...args`
 * - a `priority`: if `true`, the action will be inserted at the front of the queue;
 * otherwise actions are addes at the end, implementing a FIFO.
 * - an asyncronous `action` to call in due time.
 * - the `...args` to provide as arguments to `action`
 * In addition, the returned function provides two functions on the state of the queue:
 * - `.inQueued()` gives the number of currently queued actions waiting to be called.
 * - `.inProgress()` gives the number of actions currently being executed.
 */
export function getThrottle({ pace, maxConcurrent = 1 }) {
    /** the queue holding callback `Items` */
    const queue = [];
    /** `actions` that have been called, but have not resolved yet. */
    let started = 0;
    /** the number of `actions` waiting in queue */
    let waiting = 0;
    /** number of functions currently waiting in queue */
    const inQueue = () => waiting;
    /** functions that have been called, but have not resolved yet. */
    const inProgress = () => started;
    /** tracks if the queue is running) */
    let isRunning = false;
    throttleFn.inQueue = inQueue;
    throttleFn.inProgress = inProgress;
    return throttleFn;
    function throttleFn(key, priority, action, ...args) {
        let item = queue.find(item => item.stats.key === key);
        if (!item) {
            log.debug(() => `new item ${key}`);
            item = { action, args, stats: { key, updated: 0, addedAt: Date.now(), startedAfter: -1, endedAfter: -1 } };
            if (priority)
                queue.push(item); // add to beginning of list, first one out 
            else
                queue.unshift(item); // add to end of list, last one out: normal FIFO
        }
        else {
            log.debug(() => `retrigger item ${key}`);
            item.stats.updated++;
            item.action = action;
            item.args = args;
        }
        waiting = queue.length;
        if (!isRunning)
            startProcess();
        return item.stats;
    }
    function startProcess() {
        isRunning = true;
        setTimeout(processNextItem, 0);
    }
    function stopProcess() {
        isRunning = false;
    }
    async function processNextItem() {
        const item = queue.pop();
        let lastStart = 0;
        if (item) {
            waiting--;
            while (started >= maxConcurrent)
                await delay(10);
            started++;
            lastStart = Date.now();
            item.stats.startedAfter = Date.now() - item.stats.addedAt;
            await item.action(...item.args);
            item.stats.endedAfter = Date.now() - item.stats.startedAfter - item.stats.addedAt;
            started--;
        }
        const wait = Math.max(0, pace - (Date.now() - lastStart)); // remaining time since last call
        await delay(wait);
        if (queue.length === 0)
            stopProcess();
        else
            processNextItem();
    }
}
/**
 * Triggers an action after a delay of `periodMS` milliseconds.
 * During the delay, additional calls with the same `key` will reset the delay.
 * After no calls with the same `key` have been called for `periodMS` milliseconds,
 * the `action` will be executed with `...args` as parameters
 * @param periodMS
 * @returns a function that takes
 * - a `key` for the actions. Subsequent calls will use `key` to reset the timer
 * - the period to wait for bounces, in ms
 * - an `action` to call at the end of the debounc period
 * - a set of arguments (`...args`) to pass to the `action` upon execution
 */
export function getDebouncer() {
    const requests = {};
    const debounce = (key, periodMS, action, ...args) => {
        // clear any prior pending saveRequest
        if (requests[key]) {
            log.debug(() => `recreating ${key}...`);
            clearTimeout(requests[key].timer);
        }
        else
            log.debug(() => `creating ${key}...`);
        // overwrite any previous save request with the current content 
        requests[key] = {
            args, action,
            timer: setTimeout(() => executeAction(key), periodMS)
        };
    };
    debounce.cancel = (key, withActionCall = false) => {
        if (requests[key]?.timer) {
            log.info(() => `canceling ${key}${withActionCall ? ' with action' : ''}...`);
            clearTimeout(requests[key].timer);
            if (withActionCall)
                executeAction(key);
            if (requests[key])
                delete requests[key];
        }
    };
    debounce.pending = (key) => requests[key]?.timer ? true : false;
    return debounce;
    // called when timer expires:
    async function executeAction(key) {
        if (requests[key]) {
            log.debug(() => `executing ${key}${requests[key] ? '' : ' (not found)'}...`);
            requests[key].action(...requests[key].args);
            delete requests[key];
        }
    }
}
