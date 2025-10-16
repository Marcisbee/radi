import {
	connectedEvent,
	createAbortSignal,
	dispatchEventSink,
	Radi,
	update,
} from "~/main.ts";

// function createEvent() {

// }

// const eventName = createEvent("eventName", () => {

// });

// eventName(this, )

type Updater<T> = T | ((prev: T | undefined) => T);

interface ChannelAccessor<T> {
	(): T;
	set(next: Updater<T>): void;
	update(): void;
	readonly provider: Element | null;
	readonly resolved: boolean;
}

interface ChannelContainer<T> {
	value: T;
	provider: Element;
	disposed: boolean;
	accessor: ChannelAccessor<T>;
}

interface Channel<T> {
	provide(root: Element, initial: Updater<T>): ChannelAccessor<T>;
	use(root: Element): ChannelAccessor<T>;
	key: symbol;
	defaultValue: T;
}

const CHANNELS_SYMBOL = Symbol("mini-fw:channels");

function getChannelMap(el: any): Map<symbol, ChannelContainer<any>> {
	if (!el[CHANNELS_SYMBOL]) el[CHANNELS_SYMBOL] = new Map();
	return el[CHANNELS_SYMBOL];
}

export function createChannel<T>(defaultValue: T): Channel<T> {
	const key = Symbol("channel");

	function resolveInitial(prev: T | undefined, init: Updater<T>): T {
		return typeof init === "function"
			? (init as (p: T | undefined) => T)(prev)
			: (init as T);
	}

	function makeAccessor<T2>(
		container: ChannelContainer<T2>,
	): ChannelAccessor<T2> {
		const fn: any = () => container.value;
		Object.defineProperties(fn, {
			provider: { get: () => container.provider },
			resolved: { get: () => true },
		});
		fn.set = (next: Updater<T2>) => {
			if (container.disposed) return;
			const prev = container.value;
			const val =
				typeof next === "function"
					? (next as (p: T2) => T2)(prev)
					: (next as T2);
			if (val !== prev) {
				container.value = val;
				update(container.provider);
			}
		};
		fn.update = () => {
			if (!container.disposed) update(container.provider);
		};
		return fn;
	}

	function provide(root: Element, initial: Updater<T>): ChannelAccessor<T> {
		const map = getChannelMap(root);
		let container = map.get(key) as ChannelContainer<T> | undefined;
		if (!container) {
			const value = resolveInitial(undefined, initial);
			container = {
				value,
				provider: root,
				disposed: false,
				accessor: undefined as any,
			};
			container.accessor = makeAccessor(container);
			map.set(key, container);
			root.addEventListener(
				"disconnect",
				() => {
					container!.disposed = true;
				},
				{ once: true },
			);
		} else if (!container.disposed) {
			const next = resolveInitial(container.value, initial);
			if (next !== container.value) {
				container.value = next;
				update(container.provider);
			}
		}
		return container.accessor;
	}

	function findNearest(start: Element): ChannelContainer<T> | null {
		let cur: any = start;
		while (cur) {
			const map: Map<symbol, ChannelContainer<T>> | undefined =
				cur[CHANNELS_SYMBOL];
			if (map && map.has(key)) {
				const c = map.get(key)!;
				if (!c.disposed) return c;
			}
			cur = cur.parentNode;
		}
		return null;
	}

	function use(root: Element): ChannelAccessor<T> {
		let container: ChannelContainer<T> | null = null;
		let cached = defaultValue;
		let resolved = false;

		const fn: any = () => {
			if (!resolved && root.isConnected) attemptResolve();
			return container ? container.value : cached;
		};

		function attemptResolve() {
			if (resolved) return;
			container = findNearest(root);
			if (container) {
				resolved = true;
				cached = container.value;
				update(root); // Re-render if we were showing default
			}
		}

		Object.defineProperties(fn, {
			provider: { get: () => (container ? container.provider : null) },
			resolved: { get: () => resolved },
		});

		fn.set = (next: Updater<T>) => {
			if (!container) return; // ignore until resolved
			const prev = container.value;
			const val =
				typeof next === "function" ? (next as (p: T) => T)(prev) : (next as T);
			if (val !== prev) {
				container.value = val;
				update(container.provider);
			}
		};

		fn.update = () => {
			if (container) update(container.provider);
		};

		if (root.isConnected) {
			attemptResolve();
		} else {
			root.addEventListener(
				"connect",
				() => {
					attemptResolve();
				},
				{ once: true },
			);
		}

		return fn as ChannelAccessor<T>;
	}

	return { provide, use, key, defaultValue };
}

// ----

const Theme = createChannel<"light" | "dark">("light");

function ThemeProvider(
	this: DocumentFragment,
	props: () => { children: any[] },
) {
	// Provide (idempotent across re-renders unless you explicitly change value)
	const theme = Theme.provide(this, "light");
	// Example: toggle every 2s
	setInterval(() => {
		theme.set((prev) => (prev === "light" ? "dark" : "light"));
	}, 2000);
	return () => props().children;
}

function Badge(this: DocumentFragment) {
	const theme = Theme.use(this);
	return (
		<div
			style={() => ({
				background: theme() === "dark" ? "#222" : "#eee",
				color: theme() === "dark" ? "#eee" : "#222",
				padding: "4px 8px",
				borderRadius: "4px",
			})}
		>
			Theme: {theme}
			<button
				type="button"
				onClick={() => {
					theme.set((prev) => (prev === "light" ? "dark" : "light"));
				}}
				style={{ marginLeft: "8px" }}
			>
				toggle
			</button>
			<button
				type="button"
				onClick={() => {
					theme.update(); // force consumers to re-render without changing value
				}}
				style={{ marginLeft: "4px" }}
			>
				force update
			</button>
		</div>
	);
}

function Nested(this: DocumentFragment) {
	// Locally override provider:
	Theme.provide(this, "dark");
	const theme = Theme.use(this);
	return <div>Nested local theme: {theme}</div>;
}

const suspendEvent = new Event("suspend", {
	bubbles: true,
	composed: true,
	cancelable: true,
});
function suspend(target: any) {
	return target.dispatchEvent(suspendEvent);
}

const unsuspendEvent = new Event("unsuspend", {
	bubbles: true,
	composed: true,
	cancelable: true,
});
function unsuspend(target: any) {
	return target.dispatchEvent(unsuspendEvent);
}

function SuspendedChild(this: DocumentFragment) {
	let state = "suspended";

	this.addEventListener(
		"suspension",
		async () => {
			suspend(this);
			await new Promise((resolve) => setTimeout(resolve, 1000));
			state = "unsuspended";
			update(this);
			unsuspend(this);
		},
		{ once: true },
	);

	return (
		<div>
			<h1>I am {() => state}</h1>
		</div>
	);
}

function waitForUnsuspense(target: Node | Node[], finish: () => void) {
	const targets = Array.isArray(target) ? target : [target];

	let suspendCount = 0;
	const onSuspend = (e?: Event) => {
		e?.preventDefault();
		e?.stopPropagation();
		e?.stopImmediatePropagation();

		console.log("suspend");
		suspendCount++;
	};

	for (const t of targets) {
		t.addEventListener("suspend", onSuspend);
		dispatchEventSink(t, new Event("suspension"));
	}

	Promise.resolve().then(() => {
		for (const t of targets) {
			t.removeEventListener("suspend", onSuspend);
		}

		if (suspendCount === 0) {
			finish();
			return;
		}

		let remaining = suspendCount;
		const onUnsuspend = (e?: Event) => {
			e?.preventDefault();
			e?.stopPropagation();
			e?.stopImmediatePropagation();

			console.log("unsuspend");
			remaining--;
			if (remaining <= 0) {
				for (const t of targets) {
					t.removeEventListener("unsuspend", onUnsuspend);
				}
				finish();
			}
		};

		for (const t of targets) {
			t.addEventListener("unsuspend", onUnsuspend);
		}
	});
}

function Suspense(
	this: DocumentFragment,
	props: () => { children: any[]; fallback: any },
) {
	// @TODO improve update logic, what if children or fallback props update
	const { children, fallback } = props();
	console.log({ children, fallback });
	const target = children;
	let output = fallback;

	waitForUnsuspense(target, () => {
		output = target;
		update(this);
	});

	return () => output;
}

function createSignal<T = any>(initialValue: T) {
	let value = initialValue;

	const subscribers: Node[] = [];

	const addSubscriber = (node: Node) => {
		if (subscribers.indexOf(node) === -1) subscribers.push(node);
	};

	const removeSubscriber = (node: Node) => {
		const idx = subscribers.indexOf(node);
		if (idx !== -1) subscribers.splice(idx, 1);
	};

	const attachNodeListeners = (node: Node) => {
		const onConnect = (e: Event) => {
			e.stopImmediatePropagation();
			addSubscriber(node);
		};
		const onDisconnect = (e: Event) => {
			e.stopImmediatePropagation();
			removeSubscriber(node);
		};
		node.addEventListener("connect", onConnect);
		node.addEventListener("disconnect", onDisconnect);
	};

	return ((...args: [] | [T | ((map: T) => any)]) => {
		if (args.length === 0) {
			return value;
		}

		const newValue = args[0];

		if (newValue instanceof Node) {
			attachNodeListeners(newValue);
			return value;
		}

		if (typeof newValue === "function") {
			const mapper = newValue as (map: T) => T;
			return (el: Node) => {
				attachNodeListeners(el);
				return mapper(value);
			};
		}

		try {
			value = newValue as T;
			return value;
		} finally {
			for (const target of subscribers) {
				update(target);
			}
		}
	}) as {
		(): T;
		(newValue: T | ((map: T) => any)): T;
	};
}

function CounterSignal(this: DocumentFragment, props: () => { count: number }) {
	const countSignal = createSignal(props().count);

	return (
		<button
			type="button"
			onClick={() => {
				countSignal(countSignal() + 1);
			}}
			disabled={countSignal((c) => c >= 10)}
			style={{
				color: "orange",
			}}
		>
			Signal: {countSignal}
		</button>
	);
}

function Drummer(this: DocumentFragment, props: () => { bpm: () => number }) {
	const { bpm } = props();
	const signal = createAbortSignal(this);

	// let interval: ReturnType<typeof setInterval>;
	// const setup = () => {
	//   clearInterval(interval);
	//   interval = setInterval(() => {
	//     console.log('BPM', bpm());
	//   }, bpm());
	// };
	// this.addEventListener('update', setup, { signal });
	// setup();

	document.addEventListener(
		"keydown",
		(e) => {
			if (e.key === "ArrowUp") {
				e.preventDefault();
				e.stopImmediatePropagation();
				this.dispatchEvent(new CustomEvent("bpm:increment", { bubbles: true }));
			}
			if (e.key === "ArrowDown") {
				e.preventDefault();
				e.stopImmediatePropagation();
				this.dispatchEvent(new CustomEvent("bpm:decrement", { bubbles: true }));
			}
		},
		{ signal },
	);

	const random = Math.random();

	return () => (
		<div
			className="asd"
			style={{
				color: `hsl(${bpm()},95%,55%)`,
			}}
		>
			{bpm() > 120 ? <s>down</s> : <u>up</u>} [{bpm()}]{" "}
			<strong>{random}</strong> asd
		</div>
	);

	// return (
	//   <div
	//     className='asd'
	//     style={() => ({
	//       color: `hsl(${bpm()},95%,55%)`,
	//     })}
	//   >
	//     {() => (bpm() > 120 ? <s>down</s> : <u>up</u>)} [{bpm}]{' '}
	//     {() => <strong>{Math.random()}</strong>} asd
	//   </div>
	// );
}

function CustomInput(
	this: DocumentFragment,
	props: () => { defaultValue?: string },
) {
	let value = props().defaultValue || "";

	return (
		<>
			<input
				type="text"
				value={() => value}
				onInput={(e: Event) => {
					const input = e.target as HTMLInputElement;
					value = input.value;
					update(this);
				}}
			/>
			<br />
			{() => value}
		</>
	);
}

function Counter(this: DocumentFragment, props: () => { count: number }) {
	let count = props().count;
	return (
		<button
			type="button"
			onClick={() => {
				count++;
				update(this);
			}}
			disabled={() => count >= 10}
		>
			{() => count}
		</button>
	);
}

function Tab1(this: DocumentFragment) {
	const signal = createAbortSignal(this);

	signal.addEventListener("abort", () => console.log("aborted"));

	return <div>Tab1</div>;
}

function Tab2(this: DocumentFragment) {
	const events: string[] = [];
	this.addEventListener("connect", () => {
		console.log("Connected 2", this.isConnected);
	});
	this.addEventListener("disconnect", () => {
		console.log("Disconnected 2", this.isConnected);
	});
	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				const formData = new FormData(e.target);
				const formObject = Object.fromEntries(formData.entries());

				events.push(formObject.event);
				e.target.reset();
				update(this);
			}}
		>
			<input type="text" name="event" />
			<button type="submit">submit</button>
			<ul>{() => events.map((event) => <li>{event}</li>)}</ul>
		</form>
	);
}

function Tabber(this: DocumentFragment) {
	let tab = "tab1";

	return (
		<div>
			<button
				type="button"
				onClick={() => {
					tab = "tab1";
					update(this);
				}}
			>
				tab1
			</button>
			<button
				type="button"
				onClick={() => {
					tab = "tab2";
					update(this);
				}}
			>
				tab2
			</button>
			<div>{() => (tab === "tab1" ? <Tab1 /> : <Tab2 />)}</div>
		</div>
	);
}

function Sub1(this: DocumentFragment) {
	setInterval(() => {
		update(this);
	}, 1000);

	return () => <Sub2 value={Math.random()} />;
}

function Sub2(props: () => { value: number }) {
	console.log("render");
	return <h3>Value: {() => props().value}</h3>;
}

function App(this: DocumentFragment, props: () => { name: string }) {
	let bpm = 120;

	const signal = createAbortSignal(this);
	this.addEventListener(
		"bpm:increment",
		() => {
			bpm++;
			update(this);
		},
		{ signal },
	);

	this.addEventListener(
		"bpm:decrement",
		() => {
			bpm--;
			update(this);
		},
		{ signal },
	);

	const ref = <strong>this is gray</strong>;
	ref.style.color = "gray";

	return (
		<div>
			<h1>
				Hey {() => props().name} {() => bpm}
			</h1>
			{ref}
			<br />
			<Counter count={5} />
			<Counter count={2} />
			<CounterSignal count={1} />
			<Drummer bpm={() => bpm} />
			{/*<Drummer bpm={() => 120 - bpm} />*/}
			<CustomInput defaultValue="Hey" />
			<Tabber />
			<hr />
			<div>
				Suspense:
				<div>
					<Suspense fallback={<strong>Loading...</strong>}>
						<SuspendedChild />
						asd
					</Suspense>
				</div>
			</div>
			<hr />
			<ThemeProvider>
				<h1>Channel Demo</h1>
				<Badge />
				<Nested />
			</ThemeProvider>
			<hr />
			<Sub1 />
		</div>
	);
}

Radi.render(<App name="Radi?" />, document.body);
