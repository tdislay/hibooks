/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Test as OriginalTest } from "supertest";

declare module "supertest" {
  interface Test {
    expectPartial: (errorCode: number, body: object) => OriginalTest;
  }
}

(OriginalTest.prototype as OriginalTest).expectPartial = function expectPartial(
  statusCode: number,
  body: object
) {
  // @ts-ignore
  this._asserts.push(
    // @ts-ignore
    wrapAssertFn((res: Response) => this._assertStatus(statusCode, res))
  );
  // @ts-ignore
  this._asserts.push(
    wrapAssertFn((res: Response) => expect(res.body).toMatchObject(body))
  );
  return this;
};

// Typescript friendly supertest's wrapAssertFn
function wrapAssertFn(
  assertFn: (res: Response) => void | Error
): (res: Response) => void | Error {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const savedStack = new Error().stack!.split("\n").slice(3);

  // eslint-disable-next-line func-names
  return function (res: Response) {
    let badStack;
    let err: void | Error;
    try {
      err = assertFn(res);
    } catch (e) {
      err = e as Error;
    }
    if (err instanceof Error && err.stack != null) {
      badStack = err.stack.replace(err.message, "").split("\n").slice(1);
      err.stack = [err.toString()]
        .concat(savedStack)
        .concat("----")
        .concat(badStack)
        .join("\n");
    }
    return err;
  };
}
