Promise.resolve().then(() => {
  let o = {
    binaryType: "blob",

    bufferedAmount: 0,
    extensions: "",

    onclose: null,

    onerror: null,

    onmessage: null,

    onopen: null,

    protocol: "",

    readyState: 1,

    url: "ws://64.225.12.53/ws",
  };
  console.log(o);
  o.bufferedAmount = 3;
});
