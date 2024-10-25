import { Log } from '../utils/log';
import { pacing } from '../utils/timing';
const log = Log('pacedFetch');
log.config({ maxLength: 120 });
/**
 * Provides a pacing mechanism
 * @param strategy the `PacingStrategy` to use
 * @param _fetch optional `fetch` function; defaults to the standard system `fetch`
 * @returns a customized `fetch` function that follows the `PacingStrategy`
 */
export function pacedFetcher(strategy, _fetch) {
    if (!strategy.pacing)
        return _fetch;
    if (!strategy.pacing.pace)
        strategy.pacing.pace = 100;
    const queue = pacing(strategy.pacing);
    const timings = {};
    return async (input, init) => {
        log.debug(() => `(queue=${queue.inQueue()} | sent=${queue.inProgress()}) queued ${init?.method ?? 'GET'} ${input}`);
        timings.queued = new Date();
        const key = input.toString();
        return (await queue.add(async () => {
            timings.started = new Date();
            const delay = timings.started.getTime() - timings.queued.getTime();
            log.debug(() => `(queue=${queue.inQueue()} | sent=${queue.inProgress()}) ${delay}ms calling ${init?.method ?? 'GET'} ${input}`);
            const result = await _fetch(input, init);
            log.info(() => `(queue=${queue.inQueue()} | sent=${queue.inProgress()}) received ${init?.method ?? 'GET'} ${result.status} ${input}`);
            timings.completed = new Date();
            result.pacing = timings;
            return result;
        }, key))?.actionOutcome;
    };
}
