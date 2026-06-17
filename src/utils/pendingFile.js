// pendingFile — hands a picked File from the home AttachSheet to the Decoder,
// so the user picks once (no double-pick). Module-level, in-memory, one-shot.
let _file = null;
export const setPendingFile = (f) => { _file = f; };
export const takePendingFile = () => { const f = _file; _file = null; return f; };
