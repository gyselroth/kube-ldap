// @flow

/** Class for Healthz API route */
export default class Healthz {
  /**
  * Run API route
  * @param {Object} req - Request.
  * @param {Object} res - Response.
  */
  run(req: Object, res: Object) {
    res.send('OK');
  }
}
