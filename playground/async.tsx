import {
  createElement,
  createRoot,
  Fragment,
  suspend,
  Suspense,
  unsuspend,
  update,
} from "../src/client.ts";

/**
 * Example demonstrating async components in Radi
 *
 * This example shows how to create and use async components that return Promises.
 * Async components automatically integrate with the Suspense boundary system.
 */

// Simple async component that resolves immediately
function ImmediateAsyncComponent() {
  return Promise.resolve(
    <div
      style={() => ({
        padding: "10px",
        background: "#e8f5e8",
        margin: "5px 0",
      })}
    >
      <h3>Immediate Async Component</h3>
      <p>This component resolved immediately</p>
    </div>,
  );
}

// Async component that fetches data
function UserProfile(props: JSX.Props<{ userId: number }>) {
  // Simulate an API call
  return new Promise<{ name: string; email: string }>((resolve) => {
    console.log("A");
    setTimeout(() => {
      console.log("B");
      resolve({
        name: `User ${props().userId}`,
        email: `user${props().userId}@example.com`,
      });
    }, 1_000 * props().userId); // Delay based on userId
  }).then((user) => (
    <div
      style={() => ({
        padding: "10px",
        background: "#e3f2fd",
        margin: "5px 0",
      })}
    >
      <h3>User Profile</h3>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
    </div>
  ));
}

// Async component that might fail
function UnreliableComponent(props: JSX.Props<{ shouldFail: boolean }>) {
  if (props().shouldFail) {
    return Promise.reject(new Error("Failed to load component"));
  }

  return Promise.resolve(
    <div
      style={() => ({
        padding: "10px",
        background: "#fff3e0",
        margin: "5px 0",
      })}
    >
      <h3>Unreliable Component</h3>
      <p>This component loaded successfully!</p>
    </div>,
  );
}

function PassThru(props: JSX.Props<{ children: JSX.Element }>) {
  return props().children;
}

function Controller(this: HTMLElement) {
  let firstCount = 0;
  let resolver = {};
  let rejecter = {};

  function FirstAsyncComponent() {
    // console.log("RENDER?");
    // suspend(this);
    // resolver.first = () => {
    //   // resolve(
    //   //   <div
    //   //     style={() => ({
    //   //       padding: "10px",
    //   //       background: "#f3e5f5",
    //   //       margin: "5px 0",
    //   //     })}
    //   //   >
    //   //     <h3>First Async Component</h3>
    //   //     <p>Load count: {firstCount}</p>
    //   //   </div>,
    //   // );
    //   unsuspend(this);
    // };
    // return <div>poop</div>;

    return new Promise((resolve, reject) => {
      console.log(1, resolver);
      resolver.first = () => {
        resolve(
          <div
            style={() => ({
              padding: "10px",
              background: "#f3e5f5",
              margin: "5px 0",
            })}
          >
            <h3>First Async Component</h3>
            <p>Load count: {firstCount}</p>
          </div>,
        );
      };

      rejecter.first = () => {
        reject(new Error("First Async Component failed to load"));
      };
    });
  }

  function Static() {
    return (
      <div>
        I'm static content.
      </div>
    );
  }

  return (
    <div>
      <h1>Async Components Demo</h1>
      <button type="button" onclick={() => update(this)}>Refresh</button>
      <button
        type="button"
        onclick={() => {
          firstCount++;
          update(this);
        }}
      >
        Load first
      </button>
      <button
        type="button"
        onclick={() => {
          resolver.first();
        }}
      >
        Resolve first
      </button>
      <button
        type="button"
        onclick={() => {
          rejecter.first();
        }}
      >
        Reject first
      </button>

      <hr />

      <Suspense fallback={() => <div>Loading immediate component...</div>}>
        {/*<div>*/}
        <FirstAsyncComponent />
        {/*</div>*/}
      </Suspense>

      <PassThru>
        <FirstAsyncComponent />
        <Static />
      </PassThru>
    </div>
  );
}

// Main app component
function App() {
  let userId = 1;
  let shouldFail = false;

  return (
    <div
      style={() => ({
        fontFamily: "sans-serif",
        maxWidth: "800px",
        margin: "0 auto",
        padding: "20px",
      })}
    >
      <Controller />

      <hr />

      <h1>Async Components Example</h1>

      <div style={() => ({ margin: "20px 0" })}>
        <button
          onclick={() => {
            userId = userId === 3 ? 1 : userId + 1;
            update(this);
          }}
        >
          Change User (Current: {userId})
        </button>

        <button
          onclick={() => {
            shouldFail = !shouldFail;
            update(this);
          }}
          style={() => ({ marginLeft: "10px" })}
        >
          Toggle Failure ({shouldFail ? "Fail" : "Success"})
        </button>
      </div>

      <Suspense fallback={() => <div>Loading immediate component...</div>}>
        {() => <UserProfile userId={2} />}
      </Suspense>

      <h2>Immediate Async Component</h2>
      <Suspense fallback={() => <div>Loading immediate component...</div>}>
        <ImmediateAsyncComponent />
      </Suspense>

      <h2>User Profile (Async with Delay)</h2>
      <Suspense fallback={() => <div>Loading user profile...</div>}>
        {() => <UserProfile userId={userId} />}
      </Suspense>

      <h2>Unreliable Component</h2>
      <Suspense fallback={() => <div>Attempting to load component...</div>}>
        {() => <UnreliableComponent shouldFail={shouldFail} />}
      </Suspense>

      <h2>Mixed Components</h2>
      <Suspense fallback={() => <div>Loading mixed components...</div>}>
        <ImmediateAsyncComponent />
        {() => <UserProfile userId={2} />}
        {() => <UnreliableComponent shouldFail={false} />}
      </Suspense>
    </div>
  );
}

// Mount the app
createRoot(document.body).render(<App />);
