const Observable = require("./Observable");

jest.useFakeTimers();

describe("Observable", () => {
  it("should propagate data", () => {
    const observable = new Observable((open, next, fail, done, external) => {
      open();
      next(1);
      next(2);
      done(false);
    });

    const received = [];
    const open = jest.fn();
    const next = jest.fn(value => received.push(value));
    const fail = jest.fn();
    const done = jest.fn(cancelled => expect(cancelled).toEqual(false));

    observable.listen(open, next, fail, done);

    expect(open).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(2);
    expect(fail).toHaveBeenCalledTimes(0);
    expect(done).toHaveBeenCalledTimes(1);
    expect(received).toEqual([1, 2]);
  });

  it("should cancel the propagation", () => {
    // Observable timer that produces
    // data base on specified duration
    const timer = duration =>
      new Observable((open, next, fail, done, external) => {
        open();
        const id = setInterval(() => next(1), duration);
        const cancel = () => {
          clearInterval(id);
          done(true);
        };

        // listens to external
        // entity for cancellation token
        external
          .filter(([value]) => value === Observable.CANCEL)
          .tap(cancel)
          .listen();
      });

    const received = [];
    const open = jest.fn();
    const next = jest.fn(value => received.push(value));
    const fail = jest.fn();
    const done = jest.fn(cancelled => expect(cancelled).toEqual(true));
    const cancel = jest.fn();

    // Observable timer that produces
    // cancellation token every 3 second
    const cancellation = timer(3000)
      .tap(cancel)
      .map(() => [Observable.CANCEL]);

    // Observable timer that produces
    // data every second
    timer(1000).listen(open, next, fail, done, cancellation);

    // advance to 9 second
    // to check if cancellation observable
    // has been cleaned up too
    jest.advanceTimersByTime(9000);

    expect(open).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(3);
    expect(fail).toHaveBeenCalledTimes(0);
    expect(done).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(received).toEqual([1, 1, 1]);
  });
});
