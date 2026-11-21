import { describe, expect, it, vi } from 'vitest';
import { stripMediapipeLogging } from '../scripts/strip-mediapipe-logging.mjs';

// Hand-written fixture shaped like the logger class of @mediapipe/tasks-vision 1.2.3
// (read from vision_bundle.mjs, minified names kept). `vh` is the sender that, in the real
// package, ends in fetch / sendBeacon / XMLHttpRequest.
const LOGGER = [
  'xh=class{constructor(t){this.i=[],this.o=new vh,this.l=t??"",this.h=setInterval(()=>{this.flush()},6e4)}',
  'close(){void 0!==this.h&&(clearInterval(this.h),this.h=void 0),this.flush()}',
  'flush(t,e){if(this.error)e?.("net-send-failed");else if(0===this.i.length)t?.();else{var r=this.i;this.i=[],',
  'r=function(t){var e=new Sh;return Rr(e=sr(e,2,ee(1786)),3,t)}(r),r=Lh(r),',
  'this.o.send({url:"https://odml.pa.googleapis.com/v1/log",bb:"POST",la:1e4,body:r,gb:2,',
  'ab:{"Content-Type":"application/x-protobuf","x-goog-api-key":this.l},withCredentials:!1},',
  '()=>{t?.()},t=>{this.error=Error(`Logging failed with HTTP error: ${t}`),this.i=[],',
  'void 0!==this.h&&(clearInterval(this.h),this.h=void 0),e?.("net-send-failed",t)})}}};',
].join('');

const AFTER = 'class Rh{constructor(){this.ba=0}}';

describe('stripsLoggingCall', () => {
  it('removes the endpoint and the send call, and keeps the logger and its close', () => {
    const out = stripMediapipeLogging(`var a=1;var ${LOGGER}${AFTER}`);
    expect(out).not.toContain('odml.pa.googleapis.com');
    expect(out).not.toMatch(/\.send\(/);
    expect(out).not.toMatch(/fetch|sendBeacon|XMLHttpRequest/);
    expect(out).toContain('xh=class{constructor(t)');
    expect(out).toContain('close(){');
    expect(out).toContain('setInterval');
    expect(out).toContain(AFTER);
  });

  it('makes no request of any kind when the logger runs and closes', () => {
    const out = stripMediapipeLogging(LOGGER);
    const fetchFake = vi.fn();
    const beaconFake = vi.fn();
    const xhrFake = vi.fn();
    const sendFake = vi.fn((_request: unknown, ok: () => void) => {
      // A real sender would use one of the three fakes below.
      fetchFake();
      beaconFake();
      xhrFake();
      ok();
    });
    const makeLogger = new Function(
      'vh',
      'Sh',
      'Rr',
      'sr',
      'ee',
      'Lh',
      'fetch',
      'navigator',
      'XMLHttpRequest',
      `var ${out.replace(/;$/, '')}; return xh;`,
    );
    const Sender = class {
      send = sendFake;
    };
    const Logger = makeLogger(
      Sender,
      class {},
      (e: unknown) => e,
      (e: unknown) => e,
      (e: unknown) => e,
      (r: unknown) => r,
      fetchFake,
      { sendBeacon: beaconFake },
      xhrFake,
    ) as new (key: string) => { i: unknown[]; flush: (cb?: () => void) => void; close: () => void };

    vi.useFakeTimers();
    try {
      const logger = new Logger('key');
      logger.i.push('usage');
      const done = vi.fn();
      logger.flush(done);
      expect(done).toHaveBeenCalledTimes(1);
      logger.i.push('usage again');
      logger.close();
      vi.advanceTimersByTime(120_000);
    } finally {
      vi.useRealTimers();
    }
    expect(sendFake).not.toHaveBeenCalled();
    expect(fetchFake).not.toHaveBeenCalled();
    expect(beaconFake).not.toHaveBeenCalled();
    expect(xhrFake).not.toHaveBeenCalled();
  });
});

describe('failsWhenPatternMissing', () => {
  it('throws, naming 1.2.3, for text without the logger', () => {
    const text = 'var a=1;function f(){return 2}';
    expect(() => stripMediapipeLogging(text)).toThrowError(/1\.2\.3/);
  });

  it('throws, naming 1.2.3, when the endpoint is there but the send step has changed', () => {
    const changed = 'var u="https://odml.pa.googleapis.com/v1/log";navigator.sendBeacon(u,data);';
    expect(() => stripMediapipeLogging(changed)).toThrowError(/1\.2\.3/);
    const changedSend = LOGGER.replace('this.o.send(', 'this.o.post(');
    expect(() => stripMediapipeLogging(changedSend)).toThrowError(/1\.2\.3/);
  });

  it('never returns the input unchanged', () => {
    for (const text of ['', 'odml.pa.googleapis.com', LOGGER.replace('.send(', '.put(')]) {
      let result: string | undefined;
      try {
        result = stripMediapipeLogging(text);
      } catch {
        result = undefined;
      }
      expect(result).toBeUndefined();
    }
    expect(stripMediapipeLogging(LOGGER)).not.toBe(LOGGER);
  });
});
