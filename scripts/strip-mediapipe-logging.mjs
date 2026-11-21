// Build-time helper (design 10.1, requirement 9.6). Pure: no clock, no randomness, no file access.
//
// @mediapipe/tasks-vision 1.2.3 has a usage logger that POSTs statistics to a Google address.
// This function replaces the logger's send step so that the logger makes no request at all.
// The logger object stays, so the code that creates it, runs its 60-second cycle and closes it
// still works. Detection is not touched.
//
// The real code (read only, version 1.2.3) has this shape inside the logger's flush():
//   this.o.send({url:"https://odml.pa.googleapis.com/v1/log", ... },()=>{t?.()},t=>{ ... e?.("net-send-failed",t)})
// The match uses the endpoint text and the request call next to it, not the minified class name.

const ENDPOINT = 'odml.pa.googleapis.com';

const SEND_STEP =
  /[\w$]+\.[\w$]+\.send\(\{url:"https:\/\/odml\.pa\.googleapis\.com\/v1\/log",[\s\S]*?\},\(\)=>\{([\w$]+)\?\.\(\)\},[\w$]+=>\{[\s\S]*?"net-send-failed",[\w$]+\)\}\)/;

const CHANGED_MESSAGE =
  'MediaPipe code changed: the usage-logging removal no longer matches. ' +
  'Check scripts/strip-mediapipe-logging.mjs before updating the package.';

/**
 * @param {string} code text of vision_bundle.mjs from @mediapipe/tasks-vision 1.2.3
 * @returns {string} the same text where the logger sends nothing
 */
export function stripMediapipeLogging(code) {
  if (!code.includes(ENDPOINT)) {
    throw new Error(
      `@mediapipe/tasks-vision 1.2.3: usage logger endpoint not found in this file. ${CHANGED_MESSAGE}`,
    );
  }
  if (!SEND_STEP.test(code)) {
    throw new Error(`@mediapipe/tasks-vision 1.2.3: logger send step not found. ${CHANGED_MESSAGE}`);
  }
  // The success callback of the old send step is still called, so flush(callback) behaves as before.
  const result = code.replace(SEND_STEP, '$1?.()');
  if (result.includes(ENDPOINT)) {
    throw new Error(
      `@mediapipe/tasks-vision 1.2.3: the endpoint text is still present after removal. ${CHANGED_MESSAGE}`,
    );
  }
  return result;
}
