const IDLE = 0;
const ACTIVE = 1;
const DONE = 2;
const noop = () => {};

class Observable {
  constructor(producer) {
    this.producer = producer;
  }

  map(fn) {
    return new Observable((open, next, fail, done, external) => {
      this.listen(open, (value) => next(fn(value)), fail, done, external);
    });
  }

  tap(fn) {
    return this.map((value) => {
      fn(value);
      return value;
    });
  }

  filter(fn) {
    return new Observable((open, next, fail, done, external) => {
      this.listen(
        open,
        (value) => fn(value) && next(value),
        fail,
        done,
        external
      );
    });
  }

  take(amount) {
    return new Observable((open, next, fail, done, external) => {
      let count = 0;
      const emitter = new Emitter(external);
      this.listen(
        open,
        (value) => {
          next(value);
          if (++count >= amount) emitter.next([Observable.CANCEL])
        },
        fail,
        done,
        emitter
      );
    });
  }

  listen(
    open = noop,
    next = noop,
    fail = noop,
    done = noop,
    external = new Observable(noop)
  ) {
    const teardown = new Teardown(external);
    let state = IDLE;
    this.producer(
      () => {
        if (state === IDLE) {
          state = ACTIVE;
          open();
        } 
      },
      (value) => {
        if (state === ACTIVE) {
          try {
            next(value);
          } catch (error) {
            fail(error);
          }
        }
      },
      (error) => {
        if (state === ACTIVE) fail(error);
      },
      (cancelled) => {
        if (state === ACTIVE) {
          teardown.run()
          done(cancelled);
          state = DONE
        }
      },
      teardown.filter(() => state === ACTIVE)
    );
  }
}

Observable.CANCEL = Symbol("CANCEL");

class Emitter extends Observable {
  constructor(observable = new Observable(noop)) {
    super((...args) => observable.listen(...args));
    this.next = noop;
  }

  listen(
    open = noop,
    next = noop,
    fail = noop,
    done = noop,
    external = new Observable(noop)
  ) {
    open();
    this.next = next;
    this.producer(open, next, fail, done, external);
  }
}

class Teardown extends Observable {
  constructor(observable = new Observable(noop)) {
    super((...args) => observable.listen(...args));
    this.run = noop;
  }

  listen(
    open = noop,
    next = noop,
    fail = noop,
    done = noop,
    external = new Observable(noop)
  ) {
    open();
    const source = new Emitter(external);
    this.run = () => source.next([Observable.CANCEL]);
    this.producer(open, next, fail, done, source);
  }
}

module.exports.Observable = Observable;
module.exports.Emitter = Emitter;
module.exports.Teardown = Teardown;
