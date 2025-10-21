/** @jsxRuntime classic */
/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import React, { memo, useReducer } from "npm:react";
import { createRoot } from "npm:react-dom/client";
import { flushSync } from "npm:react-dom";

let dispatch: any;

const random = (max: number) => Math.round(Math.random() * 1000) % max;

const A = [
  "pretty",
  "large",
  "big",
  "small",
  "tall",
  "short",
  "long",
  "handsome",
  "plain",
  "quaint",
  "clean",
  "elegant",
  "easy",
  "angry",
  "crazy",
  "helpful",
  "mushy",
  "odd",
  "unsightly",
  "adorable",
  "important",
  "inexpensive",
  "cheap",
  "expensive",
  "fancy",
];
const C = [
  "red",
  "yellow",
  "blue",
  "green",
  "pink",
  "brown",
  "purple",
  "brown",
  "white",
  "black",
  "orange",
];
const N = [
  "table",
  "chair",
  "house",
  "bbq",
  "desk",
  "car",
  "pony",
  "cookie",
  "sandwich",
  "burger",
  "pizza",
  "mouse",
  "keyboard",
];

let nextId = 1;

const buildData = (count: number) => {
  const data = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = {
      id: nextId++,
      label: `${A[random(A.length)]} ${C[random(C.length)]} ${
        N[random(N.length)]
      }`,
    };
  }
  return data;
};

const initialState = { data: [], selected: 0 };

const listReducer = (state: any, action: any) => {
  const { data, selected } = state;
  switch (action.type) {
    case "RUN":
      return { data: buildData(1000), selected: 0 };
    case "RUN_LOTS":
      return { data: buildData(10000), selected: 0 };
    case "ADD":
      return { data: data.concat(buildData(1000)), selected };
    case "UPDATE": {
      const newData = data.slice(0);
      for (let i = 0; i < newData.length; i += 10) {
        const r = newData[i];
        newData[i] = { id: r.id, label: r.label + " !!!" };
      }
      return { data: newData, selected };
    }
    case "CLEAR":
      return { data: [], selected: 0 };
    case "SWAP_ROWS":
      const newdata = [...data];
      if (data.length > 998) {
        const d1 = newdata[1];
        const d998 = newdata[998];
        newdata[1] = d998;
        newdata[998] = d1;
      }
      return { data: newdata, selected };
    case "REMOVE": {
      const idx = data.findIndex((d: any) => d.id === action.id);
      return {
        data: [...data.slice(0, idx), ...data.slice(idx + 1)],
        selected,
      };
    }
    case "SELECT":
      return { data, selected: action.id };
    default:
      return state;
  }
};

const Row = memo(
  ({ selected, item, dispatch }: any) => (
    <tr className={selected === item.id ? "danger" : ""}>
      <td className="col-md-1">{item.id}</td>
      <td className="col-md-4">
        <a
          onClick={() =>
            dispatch({ type: "SELECT", id: item.id })}
        >
          {item.label}
        </a>
      </td>
      <td className="col-md-1">
        <a onClick={() => dispatch({ type: "REMOVE", id: item.id })}>
          <span className="glyphicon glyphicon-remove" aria-hidden="true">
          </span>
        </a>
      </td>
      <td className="col-md-6"></td>
    </tr>
  ),
  (prevProps, nextProps) =>
    prevProps.selected === nextProps.selected &&
    prevProps.item === nextProps.item,
);

const Button = ({ id, cb, title }: any) => (
  <button
    type="button"
    id={id}
    className="btn btn-primary btn-block"
    onClick={cb}
  >
    {title}
  </button>
);

const Jumbotron = memo(({ dispatch }: any) => (
  <div className="row">
    <div className="col-md-6">
      <h1>React</h1>
    </div>
    <div className="col-md-6">
      <div className="row">
        <div className="col-sm-6 smallpad">
          <Button
            id="run"
            cb={() => dispatch({ type: "RUN" })}
            title="Create 1,000 rows"
          />
        </div>
        <div className="col-sm-6 smallpad">
          <Button
            id="runlots"
            cb={() => dispatch({ type: "RUN_LOTS" })}
            title="Create 10,000 rows"
          />
        </div>
        <div className="col-sm-6 smallpad">
          <Button
            id="add"
            cb={() => dispatch({ type: "ADD" })}
            title="Append 1,000 rows"
          />
        </div>
        <div className="col-sm-6 smallpad">
          <Button
            id="update"
            cb={() => dispatch({ type: "UPDATE" })}
            title="Update every 10th row"
          />
        </div>
        <div className="col-sm-6 smallpad">
          <Button
            id="clear"
            cb={() => dispatch({ type: "CLEAR" })}
            title="Clear"
          />
        </div>
        <div className="col-sm-6 smallpad">
          <Button
            id="swaprows"
            cb={() => dispatch({ type: "SWAP_ROWS" })}
            title="Swap Rows"
          />
        </div>
      </div>
    </div>
  </div>
), () => true);

const Main = () => {
  const [state, d] = useReducer(listReducer, initialState);
  dispatch = d;

  return (
    <div className="container">
      <div className="jumbotron">
        <Jumbotron dispatch={dispatch} />
      </div>
      <table className="table table-hover table-striped test-data">
        <tbody>
          {state.data.map((item: any) => (
            <Row
              key={item.id}
              selected={state.selected}
              item={item}
              dispatch={dispatch}
            />
          ))}
        </tbody>
      </table>
      <span
        className="preloadicon glyphicon glyphicon-remove"
        aria-hidden="true"
      >
      </span>
    </div>
  );
};

// --- Actions ---
export function actionRun() {
  flushSync(() => dispatch({ type: "RUN" }));
}

export function actionRunLots() {
  flushSync(() => dispatch({ type: "RUN_LOTS" }));
}

export function actionAdd() {
  flushSync(() => dispatch({ type: "ADD" }));
}

export function actionUpdate() {
  flushSync(() => dispatch({ type: "UPDATE" }));
}

export function actionClear() {
  flushSync(() => dispatch({ type: "CLEAR" }));
}

export function actionSwapRows() {
  flushSync(() => dispatch({ type: "SWAP_ROWS" }));
  // Force a layout read to avoid React batching/microtask coalescing affecting timing
  document.body.offsetHeight;
}

export let reactRoot: any = null;

export function setupReact(container: HTMLElement) {
  container.innerHTML = '<div id="react-root"></div>';
  const mountPoint = document.getElementById("react-root")!;
  reactRoot = createRoot(mountPoint);
  reactRoot.render(<Main />);
}

export function cleanupReact() {
  reactRoot?.unmount();
  reactRoot = null;
}
