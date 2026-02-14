// Simulate the test scenario
const installingWorker = {
  state: "installing",
  addEventListener: function() { console.log("addEventListener called!", arguments); }
};

const mockRegistration = {
  installing: null,
  waiting: null,
  active: { state: "activated" },
  scope: "/",
  update: function() {},
  unregister: function() {},
  addEventListener: function() {}
};

const registrationWithInstalling = {
  ...mockRegistration,
  installing: installingWorker,
};

console.log("registration.installing:", registrationWithInstalling.installing);
console.log("Same object?", registrationWithInstalling.installing === installingWorker);
console.log("Has addEventListener?", typeof registrationWithInstalling.installing.addEventListener);

// Simulate trackInstalling
function trackInstalling(worker) {
  console.log("trackInstalling called with:", worker);
  worker.addEventListener("statechange", () => {});
}

if (registrationWithInstalling.installing) {
  console.log("About to call trackInstalling");
  trackInstalling(registrationWithInstalling.installing);
}
