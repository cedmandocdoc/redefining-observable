# Redefining Observable

_A shift of perspective on Observable_

This article is a shift of perspective to what an Observable is. It discusses the current model of Observable and dissects its properties in the hope to define what it is at its core.

Observable has been [defined](https://medium.com/@benlesh/learning-observable-by-building-observable-d5da57405d87) as a function that propagates values to an observer and returns a means to cancel that propagation. This model has two fundamental properties: propagation and cancellation.

Propagation is the act of an Observable to send data to an observer. On the basic level, this can done through a simple callback function. Let's take a look of the code below:

```javascript
const observable = callback => {
  // connects the callback to something
  // that produces values
  window.addEventListener("scroll", e => callback(e));
};

const observer = data => console.log(data);

observable(observer);
```

The code shows that the Observable connects the `callback` to an event listener which produces a scroll event and when it gets called it transfers the data to the observer. This process is called propagation. It can happen in any number of times between zero and infinite depending on the Observable implementation. One interesting example is zero-emission or what is called an empty Observable, this may not seem helpful at first hand but this makes sense especially for composition. Propagation exists on all kinds of Observable. It is fundamentally intertwined with its definition and cannot be separated. This what makes the Observable "observable" - a capability of being observed so without a sense of sending data, Observable cease to exists.

The last property from the current model is the cancellation. This property enables the Observable to stop the data propagation to the observer. Back on the scroll example, if the observer decided to stop the scroll event propagation, the Observable should somehow provide a way to stop that. One way to implement it is to return a function that removes the listener to the scroll event. Take a look of the code below:

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

The `cleanup` function enables the outside entity to stop the Observable propagation. Unlike the propagation, cancellation is not as fundamental as the way it seems. It is more likely to be an emergent property instead of a fundamental one, simply because it doesn't exist to all kinds of Observable. It just emerges to some because of the need for it. Some observer doesn't care about cancellation they just want to listen as long as the Observable emits data. The need for cancellation, **depends** on the logic of the application.

The example above shows that it cancels the scroll event after a second but that is not part or concern of the Observable, which is part of the application logic. What if the application demands for more, like be able to pause and resume the propagation. That is not an impossible use case for an application to have, for instance, a timer Observable that produces time is very near to have the ability to pause, resume, or reset the time. So in general, Observable **does** react to the outside world whether be able to cancel or just pause, it could be anything, they emerge depends on the demand of the application.

To cope up with that problem, instead of returning just a function, Observable could return an object with a bunch of functions that the application can use. This is fine but it will not be good for composition because object properties can collide with each other. Imagine a composition of two Observable with different return object, after the composition what could be the end returned object, is it a combination of the two (possible collision) or just either of the two (lose control of the other) It turns out that these emergent properties are hard to compose and just bring inconsistencies. To solve this, let's take a step back and find what those properties mean.

Emergent properties like cancellation, are the things that are demanded and used by an outside entity to be able to **talkback** to an Observable forming a complete interaction. Observable communicates through data propagation and outside entity communicates back through Observable's returned object or function.

These properties act as a medium to notify an Observable. The process is similar to what Observable does, it propagates data to an entity, which in this case the source of data is reversed, the observer is the one that sends it and the observable is the one that listens to it. From the perspective of how they work, it implies that these emergent properties are indeed an Observable. Let's see if this idea removes the inconsistencies previously encountered. Back to the scroll example:

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

The code above shows that the Observable now accepts another parameter named `external` which is also another Observable that is provided from the outside. As the Observable propagates data, it also listens to the `external` for a cancellation token named `CANCEL` which stops the propagation. This enables the Observable to react accordingly with the entity outside. Also, this approach will do better in composition rather than just returning an object. This approach serves better both the Observable and outside entity, it provides concrete communication between them.

With all that in mind, Observable, therefore, has the natural ability to propagate data and also to listen to the outside entity and react accordingly. It brings two fundamental properties: propagation and interaction. For a complete implementation of the idea, check out [Observable.js](https://github.com/cedmandocdoc/redefining-observable/blob/master/Observable.js) and for actual usage, check [examples](https://github.com/cedmandocdoc/redefining-observable/tree/master/examples) folder.
