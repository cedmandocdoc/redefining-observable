# Redefining Observable

_A shift of perspective on Observable_

This article is a shift of perspective to what an Observable is. It discusses the current model of Observable and dissects its properties in the hope to define what it is at its core.

Observable has been defined as a function that propagates values to an observer and returns a means to cancel that propagation. This model has two fundamental properties: propagation and cancellation.

Propagation is the act of an Observable to send data to an observer. On the basic level, this be can done through a simple callback function.

```javascript
const observable = callback => {
  // connects the callback to something
  // that produces values
  window.addEventListener("scroll", e => callback(e));
};

const observer = data => console.log(data);

observable(observer);
```

The code shows that the Observable connects the `callback` to an event listener which produces a scroll event and when it gets called it transfers the data to the observer. This process is called propagation, it exists on all kinds of Observable and fundamentally intertwined with its definition and cannot be separated. This what makes the Observable "observable" - a capability of being observed.

The last property from the current model is the cancellation. This property enables the Observable to stop the data propagation to the observer. This is normally done through a cleanup function which is returned by the Observable.

```javascript
const observable = callback => {
  const listener = e => callback(e);

  window.addEventListener("scroll", listener);

  // return a clean up function
  return () => window.removeEventListener("scroll", listener);
};

const cleanup = observable(e => console.log(e));

// run cleanup after a second
setTimeout(() => cleanup(), 1000);
```

Cancellation seems like it is a fundamental part of Observable but more likely it is an emergent property simply because it doesn't exist to all kinds of Observable. It just emerges to some because of the need for it. Some observer doesn't care about cancellation they just want to listen as long as the Observable emits data.

Cancellation is just a part of an infinite number of emergent properties because the need for it depends on the logic of the application and logic could demand more, for instance a logic that demands pause in an Observable timer.

Emergent properties act as a medium to notify an Observable. The process is similar to what Observable does, it propagates data to an entity, which in this case the source of data is reversed, the observer is the one that sends it and the observable is the one that listens to it. From the perspective of how they work, it implies that these emergent properties are indeed an Observable.

```javascript
const scrollObservable = (callback, external) => {
  const listener = e => callback(e);

  // listen for a
  // cancellation token
  external(data => {
    if (data === "CANCEL") window.removeEventListener("scroll", listener);
  });

  window.addEventListener("scroll", listener);
};

const cancelObservable = callback => {
  // after a second sends
  // a cancellation token
  setTimeout(() => callback("CANCEL"), 1000);
};

scrollObservable(e => console.log(e), cancelObservable);
```

The code shows that the Observable now accepts another parameter named `external` which is also another Observable that is provided from the outside. As the Observable propagates data, it also listens to the `external` for a cancellation token named `CANCEL` which stops the propagation. This enables the Observable to react accordingly with the entity outside. This approach serves better both the Observable and outside entity, it provides concrete communication between them.

With all that in mind, Observable, therefore, has the natural ability to propagate data and also to listen to the outside entity and react accordingly. It brings two fundamental properties: propagation and interaction. For a complete implementation of the idea, check out [Observable.js](https://github.com/cedmandocdoc/redefining-observable/blob/master/Observable.js) and for actual usage, check [examples](https://github.com/cedmandocdoc/redefining-observable/tree/master/examples) folder.
