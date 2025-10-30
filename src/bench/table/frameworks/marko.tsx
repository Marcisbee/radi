export const title = "Marko";

export function mount() {
  // src/common/attr-tag.ts
  function forOf(list, cb) {
    if (list) {
      let i = 0;
      for (const item of list) {
        cb(item, i++);
      }
    }
  }

  // src/common/helpers.ts
  function classValue(classValue2) {
    return toDelimitedString(classValue2, " ", stringifyClassObject);
  }
  function stringifyClassObject(name, value) {
    return value ? name : "";
  }
  function toDelimitedString(val, delimiter, stringify) {
    let str = "";
    let sep = "";
    let part;
    if (val) {
      if (typeof val !== "object") {
        str += val;
      } else if (Array.isArray(val)) {
        for (const v of val) {
          part = toDelimitedString(v, delimiter, stringify);
          if (part) {
            str += sep + part;
            sep = delimiter;
          }
        }
      } else {
        for (const name in val) {
          part = stringify(name, val[name]);
          if (part) {
            str += sep + part;
            sep = delimiter;
          }
        }
      }
    }
    return str;
  }

  // src/dom/event.ts
  var defaultDelegator = createDelegator();
  function _on(element, type, handler) {
    if (element["$" + type] === void 0) {
      defaultDelegator(element, type, handleDelegated);
    }
    element["$" + type] = handler || null;
  }
  function createDelegator() {
    const kEvents = Symbol();
    return function ensureDelegated(node, type, handler) {
      ((node = node.getRootNode())[kEvents] ||= {})[type] ||=
        (node.addEventListener(type, handler, true), 1);
    };
  }
  function handleDelegated(ev) {
    let target = !rendering && ev.target;
    {
      Object.defineProperty(ev, "currentTarget", {
        configurable: true,
        get() {
          console.error(
            "Event.currentTarget is not supported in Marko's delegated events. Instead use an element reference or the second parameter of the event handler.",
          );
          return null;
        },
      });
    }
    while (target) {
      target["$" + ev.type]?.(ev, target);
      target = ev.bubbles && !ev.cancelBubble && target.parentNode;
    }
    {
      delete ev.currentTarget;
    }
  }

  // src/common/meta.ts
  var DEFAULT_RUNTIME_ID = "M";

  // src/dom/scope.ts
  var nextScopeId = 1e6;
  function createScope($global, closestBranch) {
    const scope = {
      ___id: nextScopeId++,
      ___creating: 1,
      ___closestBranch: closestBranch,
      $global,
    };
    pendingScopes.push(scope);
    return scope;
  }
  function skipScope() {
    return nextScopeId++;
  }
  function destroyBranch(branch) {
    branch.___parentBranch?.___branchScopes?.delete(branch);
    destroyNestedBranches(branch);
  }
  function destroyNestedBranches(branch) {
    branch.___destroyed = 1;
    branch.___branchScopes?.forEach(destroyNestedBranches);
    branch.___abortScopes?.forEach((scope) => {
      for (const id in scope.___abortControllers) {
        $signalReset(scope, id);
      }
    });
  }
  function removeAndDestroyBranch(branch) {
    destroyBranch(branch);
    removeChildNodes(branch.___startNode, branch.___endNode);
  }
  function insertBranchBefore(branch, parentNode, nextSibling) {
    insertChildNodes(
      parentNode,
      nextSibling,
      branch.___startNode,
      branch.___endNode,
    );
  }

  // src/dom/walker.ts
  var walker = /* @__PURE__ */ document.createTreeWalker(document);
  function walk(startNode, walkCodes, branch) {
    walker.currentNode = startNode;
    walkInternal(0, walkCodes, branch);
  }
  function walkInternal(currentWalkIndex, walkCodes, scope) {
    let value;
    let storedMultiplier = 0;
    let currentMultiplier = 0;
    let currentScopeIndex = 0;
    for (; currentWalkIndex < walkCodes.length; ) {
      value = walkCodes.charCodeAt(currentWalkIndex++);
      currentMultiplier = storedMultiplier;
      storedMultiplier = 0;
      if (value === 32 /* Get */) {
        const node = walker.currentNode;
        scope[getDebugKey(currentScopeIndex, walker.currentNode)] = node;
        scope[
          "Getter:" /* Getter */ +
            getDebugKey(currentScopeIndex++, walker.currentNode)
        ] = () => node;
      } else if (
        value === 37 /* Replace */ ||
        value === 49 /* DynamicTagWithVar */
      ) {
        walker.currentNode.replaceWith(
          (walker.currentNode = scope[getDebugKey(currentScopeIndex++, "#text")] =
            new Text()),
        );
        if (value === 49 /* DynamicTagWithVar */) {
          scope[getDebugKey(currentScopeIndex++, "#scopeOffset")] = skipScope();
        }
      } else if (value === 38 /* EndChild */) {
        return currentWalkIndex;
      } else if (
        value === 47 /* BeginChild */ ||
        value === 48 /* BeginChildWithVar */
      ) {
        currentWalkIndex = walkInternal(
          currentWalkIndex,
          walkCodes,
          (scope[getDebugKey(currentScopeIndex++, "#childScope")] = createScope(
            scope.$global,
            scope.___closestBranch,
          )),
        );
        if (value === 48 /* BeginChildWithVar */) {
          scope[getDebugKey(currentScopeIndex++, "#scopeOffset")] = skipScope();
        }
      } else if (value < 91 /* NextEnd */ + 1) {
        value = 20 /* Next */ * currentMultiplier + value - 67 /* Next */;
        while (value--) {
          walker.nextNode();
        }
      } else if (value < 106 /* OverEnd */ + 1) {
        value = 10 /* Over */ * currentMultiplier + value - 97 /* Over */;
        while (value--) {
          walker.nextSibling();
        }
      } else if (value < 116 /* OutEnd */ + 1) {
        value = 10 /* Out */ * currentMultiplier + value - 107 /* Out */;
        while (value--) {
          walker.parentNode();
        }
        walker.nextSibling();
      } else {
        if (value < 117 /* Multiplier */ || value > 126 /* MultiplierEnd */) {
          throw new Error(`Unknown walk code: ${value}`);
        }
        storedMultiplier =
          currentMultiplier * 10 /* Multiplier */ + value - 117 /* Multiplier */;
      }
    }
  }
  function getDebugKey(index, node) {
    if (typeof node === "string") {
      return `${node}/${index}`;
    } else if (node.nodeType === 3 /* Text */) {
      return `#text/${index}`;
    } else if (node.nodeType === 8 /* Comment */) {
      return `#comment/${index}`;
    } else if (node.nodeType === 1 /* Element */) {
      return `#${node.tagName.toLowerCase()}/${index}`;
    }
    return index;
  }

  // src/dom/resume.ts
  var registeredValues = {};
  var branchesEnabled;
  function enableBranches() {
    branchesEnabled = 1;
  }
  function init(runtimeId = DEFAULT_RUNTIME_ID) {
    {
      const descriptor = Object.getOwnPropertyDescriptor(self, runtimeId);
      if (descriptor && (descriptor.set || descriptor.configurable === false)) {
        throw new Error(
          `Marko initialized multiple times with the same $global.runtimeId of ${JSON.stringify(runtimeId)}. It could be that there are multiple copies of Marko running on the page.`,
        );
      }
    }
    const renders = self[runtimeId];
    const defineRuntime = (desc) => Object.defineProperty(self, runtimeId, desc);
    let resumeRender;
    const initRuntime = (renders2) => {
      defineRuntime({
        value: (resumeRender = (renderId) => {
          const render = (resumeRender[renderId] =
            renders2[renderId] || renders2(renderId));
          const walk2 = render.w;
          const scopeLookup = (render.s = {});
          const serializeContext = {
            _: registeredValues,
          };
          const branches =
            branchesEnabled &&
            /* @__PURE__ */ (() => {
              const branchParents = /* @__PURE__ */ new Map();
              const branchStarts = [];
              const orphanBranches = [];
              const endBranch = (singleNode) => {
                const parent = visit.parentNode;
                let startVisit = visit;
                let i = orphanBranches.length;
                let claimed = 0;
                let branchId;
                let branch;
                while ((branchId = +lastToken)) {
                  branch = scopeLookup[branchId] ||= {};
                  if (singleNode) {
                    while (
                      startVisit.previousSibling &&
                      ~visits.indexOf((startVisit = startVisit.previousSibling))
                    );
                    branch.___endNode = branch.___startNode = startVisit;
                    if (visitType === "'" /* BranchEndNativeTag */) {
                      branch[getDebugKey(0, startVisit)] = startVisit;
                    }
                  } else {
                    startVisit = branchStarts.pop();
                    if (parent !== startVisit.parentNode) {
                      parent.prepend(startVisit);
                    }
                    branch.___startNode = startVisit;
                    branch.___endNode =
                      visit.previousSibling === startVisit
                        ? startVisit
                        : parent.insertBefore(new Text(), visit);
                  }
                  while (i-- && orphanBranches[i] > branchId) {
                    branchParents.set(orphanBranches[i], branchId);
                    claimed++;
                  }
                  orphanBranches.push(branchId);
                  branchParents.set(branchId, 0);
                  nextToken();
                }
                orphanBranches.splice(i, claimed);
              };
              return {
                ___visit() {
                  if (visitType === "[" /* BranchStart */) {
                    endBranch();
                    branchStarts.push(visit);
                  } else {
                    visitScope[
                      "Getter:" /* Getter */ + nextToken()
                      /* read accessor */
                    ] = /* @__PURE__ */ (
                      (node) => () =>
                        node
                    )(
                      (visitScope[lastToken] =
                        visitType === ")" /* BranchEndOnlyChildInParent */ ||
                        visitType ===
                          "}" /* BranchEndSingleNodeOnlyChildInParent */
                          ? visit.parentNode
                          : visit),
                    );
                    nextToken();
                    endBranch(
                      visitType !== "]" /* BranchEnd */ &&
                        visitType !== ")" /* BranchEndOnlyChildInParent */,
                    );
                  }
                },
                ___scope(scope) {
                  scope.___closestBranch =
                    scopeLookup[
                      scope["#ClosestBranchId" /* ClosestBranchId */] ||
                        branchParents.get(scopeId)
                    ];
                  if (branchParents.has(scopeId)) {
                    if (scope.___closestBranch) {
                      ((scope.___parentBranch =
                        scope.___closestBranch).___branchScopes ||=
                        /* @__PURE__ */ new Set()).add(scope);
                    }
                    scope.___closestBranch = scope;
                  }
                },
              };
            })();
          let $global;
          let lastScopeId = 0;
          let lastEffect;
          let visits;
          let resumes;
          let scopeId;
          let visit;
          let visitText;
          let visitType;
          let visitScope;
          let lastToken;
          let lastTokenIndex;
          const nextToken = () =>
            (lastToken = visitText.slice(
              lastTokenIndex,
              // eslint-disable-next-line no-cond-assign
              (lastTokenIndex = visitText.indexOf(" ", lastTokenIndex) + 1)
                ? lastTokenIndex - 1
                : visitText.length,
            ));
          render.w = () => {
            try {
              walk2();
              isResuming = 1;
              for (visit of (visits = render.v)) {
                lastTokenIndex = render.i.length;
                visitText = visit.data;
                visitType = visitText[lastTokenIndex++];
                if ((scopeId = +nextToken())) {
                  visitScope = scopeLookup[scopeId] ||= {
                    ___id: scopeId,
                  };
                }
                if (visitType === "*" /* Node */) {
                  visitScope["Getter:" /* Getter */ + nextToken()] =
                    /* @__PURE__ */ (
                      (node) => () =>
                        node
                    )((visitScope[lastToken] = visit.previousSibling));
                } else if (branchesEnabled) {
                  branches.___visit();
                }
              }
              for (const serialized of (resumes = render.r || [])) {
                if (typeof serialized === "string") {
                  lastEffect = serialized;
                } else if (typeof serialized === "number") {
                  registeredValues[lastEffect](
                    (scopeLookup[serialized] ||= {
                      ___id: scopeId,
                    }),
                    scopeLookup[serialized],
                  );
                } else {
                  for (const scope of serialized(serializeContext)) {
                    if (!$global) {
                      $global = scope || {};
                      $global.runtimeId = runtimeId;
                      $global.renderId = renderId;
                    } else if (typeof scope === "number") {
                      lastScopeId += scope;
                    } else {
                      scopeId = ++lastScopeId;
                      scope.$global = $global;
                      scope.___id = scopeId;
                      if (scopeLookup[scopeId] !== scope) {
                        scopeLookup[scopeId] = Object.assign(
                          scope,
                          scopeLookup[scopeId],
                        );
                      }
                      if (branchesEnabled) {
                        branches.___scope(scope);
                      }
                      if (true) {
                        scope.___debugId = "server-" + scopeId;
                      }
                    }
                  }
                }
              }
            } finally {
              isResuming = visits.length = resumes.length = 0;
            }
          };
          return render;
        }),
      });
    };
    if (renders) {
      initRuntime(renders);
      for (const renderId in renders) {
        resumeRender(renderId).w();
      }
    } else {
      defineRuntime({
        configurable: true,
        set: initRuntime,
      });
    }
  }
  var isResuming;
  function _resume(id, obj) {
    registeredValues[id] = obj;
    return obj;
  }

  // src/dom/parse-html.ts
  var parsers = {};
  function parseHTML(html, ns) {
    const parser = (parsers[ns] ||= document.createElementNS(ns, "template"));
    parser.innerHTML = html;
    return parser.content || parser;
  }

  // src/dom/schedule.ts
  var runTask;
  var isScheduled;
  var channel;
  function schedule() {
    if (!isScheduled) {
      {
        if (console.createTask) {
          const task = console.createTask("queue");
          runTask = () => task.run(run);
        } else {
          runTask = run;
        }
      }
      isScheduled = 1;
      queueMicrotask(flushAndWaitFrame);
    }
  }
  function flushAndWaitFrame() {
    {
      runTask();
    }
    requestAnimationFrame(triggerMacroTask);
  }
  function triggerMacroTask() {
    if (!channel) {
      channel = new MessageChannel();
      channel.port1.onmessage = () => {
        isScheduled = 0;
        {
          const run2 = runTask;
          runTask = void 0;
          run2();
        }
      };
    }
    channel.port2.postMessage(0);
  }

  // src/dom/signals.ts
  function _let(valueAccessor, fn) {
    {
      var id = +valueAccessor.slice(valueAccessor.lastIndexOf("/") + 1);
      valueAccessor = valueAccessor.slice(0, valueAccessor.lastIndexOf("/"));
    }
    const valueChangeAccessor =
      "TagVariableChange:" /* TagVariableChange */ + valueAccessor;
    const update = (scope, value) => {
      if (scope[valueAccessor] !== value) {
        scope[valueAccessor] = value;
        fn && fn(scope, value);
      }
    };
    return (scope, value, valueChange) => {
      if (rendering) {
        if (
          ((scope[valueChangeAccessor] = valueChange) &&
            scope[valueAccessor] !== value) ||
          scope.___creating
        ) {
          scope[valueAccessor] = value;
          fn && fn(scope, value);
        }
      } else if (scope[valueChangeAccessor]) {
        scope[valueChangeAccessor](value);
      } else {
        schedule();
        queueRender(scope, update, id, value);
      }
      return value;
    };
  }
  function _const(valueAccessor, fn = () => {}) {
    return (scope, value) => {
      if (!(valueAccessor in scope) || scope[valueAccessor] !== value) {
        scope[valueAccessor] = value;
        fn(scope, value);
      }
    };
  }
  function _or(
    id,
    fn,
    defaultPending = 1,
    scopeIdAccessor = /* @__KEY__ */ "___id",
  ) {
    return (scope) => {
      if (scope.___creating) {
        if (scope[id] === void 0) {
          scope[id] = defaultPending;
        } else if (!--scope[id]) {
          fn(scope);
        }
      } else {
        queueRender(scope, fn, id, 0, scope[scopeIdAccessor]);
      }
    };
  }
  function _for_closure(valueAccessor, ownerLoopNodeAccessor, fn) {
    const childSignal = closure(valueAccessor, fn);
    const loopScopeAccessor =
      "LoopScopeArray:" /* LoopScopeArray */ + ownerLoopNodeAccessor;
    const loopScopeMapAccessor =
      "LoopScopeMap:" /* LoopScopeMap */ + ownerLoopNodeAccessor;
    const ownerSignal = (ownerScope) => {
      const scopes = (ownerScope[loopScopeAccessor] ||= ownerScope[
        loopScopeMapAccessor
      ]
        ? [...ownerScope[loopScopeMapAccessor].values()]
        : []);
      const [firstScope] = scopes;
      if (firstScope) {
        queueRender(
          ownerScope,
          () => {
            for (const scope of scopes) {
              if (!scope.___creating && !scope.___destroyed) {
                childSignal(scope);
              }
            }
          },
          -1,
          0,
          firstScope.___id,
        );
      }
    };
    ownerSignal._ = childSignal;
    return ownerSignal;
  }
  function closure(valueAccessor, fn, getOwnerScope) {
    return (scope) => {
      fn(scope, scope["_" /* Owner */][valueAccessor]);
    };
  }
  function _script(id, fn) {
    _resume(id, fn);
    return (scope) => {
      queueEffect(scope, fn);
    };
  }

  // src/dom/renderer.ts
  function createBranch($global, renderer, parentScope, parentNode) {
    const branch = createScope($global);
    const parentBranch = parentScope?.___closestBranch;
    branch["_" /* Owner */] = renderer.___owner || parentScope;
    branch.___closestBranch = branch;
    if (parentBranch) {
      branch.___parentBranch = parentBranch;
      (parentBranch.___branchScopes ||= /* @__PURE__ */ new Set()).add(branch);
    }
    {
      branch.___renderer = renderer;
    }
    renderer.___clone?.(branch, parentNode.namespaceURI);
    return branch;
  }
  function createAndSetupBranch($global, renderer, parentScope, parentNode) {
    return setupBranch(
      renderer,
      createBranch($global, renderer, parentScope, parentNode),
    );
  }
  function setupBranch(renderer, branch) {
    if (renderer.___setup) {
      queueRender(branch, renderer.___setup, -1);
    }
    return branch;
  }
  function _content(id, template, walks, setup, params, dynamicScopesAccessor) {
    walks = walks ? walks.replace(/[^\0-1]+$/, "") : "";
    setup = setup ? setup._ || setup : void 0;
    params ||= void 0;
    const clone = template
      ? (branch, ns) => {
          ((cloneCache[ns] ||= {})[template] ||= createCloneableHTML(
            template,
            ns,
          ))(branch, walks);
        }
      : (branch) => {
          walk(
            (branch.___startNode = branch.___endNode = new Text()),
            walks,
            branch,
          );
        };
    return (owner) => {
      return {
        ___id: id,
        ___clone: clone,
        ___owner: owner,
        ___setup: setup,
        ___params: params,
        ___accessor: dynamicScopesAccessor,
      };
    };
  }
  function _content_branch(template, walks, setup, params) {
    return _content("", template, walks, setup, params)();
  }
  var cloneCache = {};
  function createCloneableHTML(html, ns) {
    const { firstChild, lastChild } = parseHTML(html, ns);
    const parent = document.createElementNS(ns, "t");
    insertChildNodes(parent, null, firstChild, lastChild);
    return firstChild === lastChild && firstChild.nodeType < 8 /* Comment */
      ? (branch, walks) => {
          walk(
            (branch.___startNode = branch.___endNode =
              firstChild.cloneNode(true)),
            walks,
            branch,
          );
        }
      : (branch, walks) => {
          const clone = parent.cloneNode(true);
          walk(clone.firstChild, walks, branch);
          branch.___startNode = clone.firstChild;
          branch.___endNode = clone.lastChild;
        };
  }
  function setAttribute(element, name, value) {
    if (element.getAttribute(name) != value) {
      if (value === void 0) {
        element.removeAttribute(name);
      } else {
        element.setAttribute(name, value);
      }
    }
  }
  function _attr_class(element, value) {
    setAttribute(element, "class", classValue(value) || void 0);
  }
  function _text(node, value) {
    const normalizedValue = normalizeString(value);
    if (node.data !== normalizedValue) {
      node.data = normalizedValue;
    }
  }
  function normalizeString(value) {
    return value || value === 0 ? value + "" : "\u200D";
  }
  function removeChildNodes(startNode, endNode) {
    const stop = endNode.nextSibling;
    let current = startNode;
    while (current !== stop) {
      const next = current.nextSibling;
      current.remove();
      current = next;
    }
  }
  function insertChildNodes(parentNode, referenceNode, startNode, endNode) {
    parentNode.insertBefore(toInsertNode(startNode, endNode), referenceNode);
  }
  function toInsertNode(startNode, endNode) {
    if (startNode === endNode) return startNode;
    const parent = new DocumentFragment();
    const stop = endNode.nextSibling;
    let current = startNode;
    while (current !== stop) {
      const next = current.nextSibling;
      parent.appendChild(current);
      current = next;
    }
    return parent;
  }

  // src/dom/reconcile.ts
  var WRONG_POS = 2147483647;
  function reconcile(parent, oldBranches, newBranches, afterReference) {
    let oldStart = 0;
    let newStart = 0;
    let oldEnd = oldBranches.length - 1;
    let newEnd = newBranches.length - 1;
    let oldStartBranch = oldBranches[oldStart];
    let newStartBranch = newBranches[newStart];
    let oldEndBranch = oldBranches[oldEnd];
    let newEndBranch = newBranches[newEnd];
    let i;
    let j;
    let k;
    let nextSibling;
    let oldBranch;
    let newBranch;
    outer: {
      while (oldStartBranch === newStartBranch) {
        ++oldStart;
        ++newStart;
        if (oldStart > oldEnd || newStart > newEnd) {
          break outer;
        }
        oldStartBranch = oldBranches[oldStart];
        newStartBranch = newBranches[newStart];
      }
      while (oldEndBranch === newEndBranch) {
        --oldEnd;
        --newEnd;
        if (oldStart > oldEnd || newStart > newEnd) {
          break outer;
        }
        oldEndBranch = oldBranches[oldEnd];
        newEndBranch = newBranches[newEnd];
      }
    }
    if (oldStart > oldEnd) {
      if (newStart <= newEnd) {
        k = newEnd + 1;
        nextSibling =
          k < newBranches.length ? newBranches[k].___startNode : afterReference;
        do {
          insertBranchBefore(newBranches[newStart++], parent, nextSibling);
        } while (newStart <= newEnd);
      }
    } else if (newStart > newEnd) {
      do {
        removeAndDestroyBranch(oldBranches[oldStart++]);
      } while (oldStart <= oldEnd);
    } else {
      const oldLength = oldEnd - oldStart + 1;
      const newLength = newEnd - newStart + 1;
      const aNullable = oldBranches;
      const sources = new Array(newLength);
      for (i = 0; i < newLength; ++i) {
        sources[i] = -1;
      }
      let pos = 0;
      let synced = 0;
      const keyIndex = /* @__PURE__ */ new Map();
      for (j = newStart; j <= newEnd; ++j) {
        keyIndex.set(newBranches[j], j);
      }
      for (i = oldStart; i <= oldEnd && synced < newLength; ++i) {
        oldBranch = oldBranches[i];
        j = keyIndex.get(oldBranch);
        if (j !== void 0) {
          pos = pos > j ? WRONG_POS : j;
          ++synced;
          newBranch = newBranches[j];
          sources[j - newStart] = i;
          aNullable[i] = null;
        }
      }
      if (oldLength === oldBranches.length && synced === 0) {
        for (; newStart < newLength; ++newStart) {
          insertBranchBefore(newBranches[newStart], parent, afterReference);
        }
        for (; oldStart < oldLength; ++oldStart) {
          removeAndDestroyBranch(oldBranches[oldStart]);
        }
      } else {
        i = oldLength - synced;
        while (i > 0) {
          oldBranch = aNullable[oldStart++];
          if (oldBranch !== null) {
            removeAndDestroyBranch(oldBranch);
            i--;
          }
        }
        if (pos === WRONG_POS) {
          const seq = longestIncreasingSubsequence(sources);
          j = seq.length - 1;
          k = newBranches.length;
          for (i = newLength - 1; i >= 0; --i) {
            if (sources[i] === -1) {
              pos = i + newStart;
              newBranch = newBranches[pos++];
              nextSibling =
                pos < k ? newBranches[pos].___startNode : afterReference;
              insertBranchBefore(newBranch, parent, nextSibling);
            } else {
              if (j < 0 || i !== seq[j]) {
                pos = i + newStart;
                newBranch = newBranches[pos++];
                nextSibling =
                  pos < k ? newBranches[pos].___startNode : afterReference;
                insertBranchBefore(newBranch, parent, nextSibling);
              } else {
                --j;
              }
            }
          }
        } else if (synced !== newLength) {
          k = newBranches.length;
          for (i = newLength - 1; i >= 0; --i) {
            if (sources[i] === -1) {
              pos = i + newStart;
              newBranch = newBranches[pos++];
              nextSibling =
                pos < k ? newBranches[pos].___startNode : afterReference;
              insertBranchBefore(newBranch, parent, nextSibling);
            }
          }
        }
      }
    }
  }
  function longestIncreasingSubsequence(a) {
    const p = a.slice();
    const result = [0];
    let u;
    let v;
    for (let i = 0, il = a.length; i < il; ++i) {
      if (a[i] === -1) {
        continue;
      }
      const j = result[result.length - 1];
      if (a[j] < a[i]) {
        p[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        const c = ((u + v) / 2) | 0;
        if (a[result[c]] < a[i]) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (a[i] < a[result[u]]) {
        if (u > 0) {
          p[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
      result[u] = v;
      v = p[v];
    }
    return result;
  }
  function _for_of(nodeAccessor, renderer) {
    return loop(nodeAccessor, renderer, ([all, by = bySecondArg], cb) => {
      if (typeof by === "string") {
        forOf(all, (item, i) => cb(item[by], [item, i]));
      } else {
        forOf(all, (item, i) => cb(by(item, i), [item, i]));
      }
    });
  }
  function loop(nodeAccessor, renderer, forEach) {
    const params = renderer.___params;
    enableBranches();
    return (scope, value) => {
      const referenceNode = scope[nodeAccessor];
      const oldMap = scope["LoopScopeMap:" /* LoopScopeMap */ + nodeAccessor];
      const oldArray = oldMap
        ? scope["LoopScopeArray:" /* LoopScopeArray */ + nodeAccessor] || [
            ...oldMap.values(),
          ]
        : [];
      const parentNode =
        referenceNode.nodeType > 1 /* Element */
          ? referenceNode.parentNode || oldArray[0].___startNode.parentNode
          : referenceNode;
      const newMap = (scope["LoopScopeMap:" /* LoopScopeMap */ + nodeAccessor] =
        /* @__PURE__ */ new Map());
      const newArray = (scope[
        "LoopScopeArray:" /* LoopScopeArray */ + nodeAccessor
      ] = []);
      forEach(value, (key, args) => {
        {
          if (newMap.has(key)) {
            console.error(
              `A <for> tag's \`by\` attribute must return a unique value for each item, but a duplicate was found matching:`,
              key,
            );
          }
        }
        const branch =
          oldMap?.get(key) ||
          createAndSetupBranch(scope.$global, renderer, scope, parentNode);
        params?.(branch, args);
        newMap.set(key, branch);
        newArray.push(branch);
      });
      let afterReference = null;
      if (referenceNode !== parentNode) {
        if (oldArray.length) {
          afterReference = oldArray[oldArray.length - 1].___endNode.nextSibling;
          if (!newArray.length) {
            parentNode.insertBefore(referenceNode, afterReference);
          }
        } else if (newArray.length) {
          afterReference = referenceNode.nextSibling;
          referenceNode.remove();
        }
      }
      reconcile(parentNode, oldArray, newArray, afterReference);
    };
  }
  function bySecondArg(_item, index) {
    return index;
  }

  // src/dom/queue.ts
  var pendingRenders = [];
  var pendingRendersLookup = /* @__PURE__ */ new Map();
  var pendingEffects = [];
  var pendingScopes = [];
  var rendering;
  var scopeKeyOffset = 1e3;
  function queueRender(scope, signal, signalKey, value, scopeKey = scope.___id) {
    const key = scopeKey * scopeKeyOffset + signalKey;
    const existingRender = signalKey >= 0 && pendingRendersLookup.get(key);
    if (existingRender) {
      existingRender.___value = value;
    } else {
      const render = {
        ___key: key,
        ___scope: scope,
        ___signal: signal,
        ___value: value,
      };
      let i = pendingRenders.push(render) - 1;
      while (i) {
        const parentIndex = (i - 1) >> 1;
        const parent = pendingRenders[parentIndex];
        if (key - parent.___key >= 0) break;
        pendingRenders[i] = parent;
        i = parentIndex;
      }
      signalKey >= 0 && pendingRendersLookup.set(key, render);
      pendingRenders[i] = render;
    }
  }
  function queueEffect(scope, fn) {
    pendingEffects.push(fn, scope);
  }
  function run() {
    const effects = pendingEffects;
    try {
      rendering = 1;
      runRenders();
    } finally {
      pendingRenders = [];
      pendingRendersLookup = /* @__PURE__ */ new Map();
      pendingEffects = [];
      rendering = 0;
    }
    runEffects(effects);
  }
  var runEffects = (effects) => {
    for (let i = 0, scope; i < effects.length; ) {
      effects[i++]((scope = effects[i++]), scope);
    }
  };
  function runRenders() {
    while (pendingRenders.length) {
      const render = pendingRenders[0];
      const item = pendingRenders.pop();
      if (render !== item) {
        let i = 0;
        const mid = pendingRenders.length >> 1;
        const key = (pendingRenders[0] = item).___key;
        while (i < mid) {
          let bestChild = (i << 1) + 1;
          const right = bestChild + 1;
          if (
            right < pendingRenders.length &&
            pendingRenders[right].___key - pendingRenders[bestChild].___key < 0
          ) {
            bestChild = right;
          }
          if (pendingRenders[bestChild].___key - key >= 0) {
            break;
          } else {
            pendingRenders[i] = pendingRenders[bestChild];
            i = bestChild;
          }
        }
        pendingRenders[i] = item;
      }
      if (!render.___scope.___closestBranch?.___destroyed) {
        runRender(render);
      }
    }
    for (const scope of pendingScopes) {
      scope.___creating = 0;
    }
    pendingScopes = [];
  }
  var runRender = (render) => render.___signal(render.___scope, render.___value);

  // src/dom/abort-signal.ts
  function $signalReset(scope, id) {
    const ctrl = scope.___abortControllers?.[id];
    if (ctrl) {
      queueEffect(ctrl, abort);
      scope.___abortControllers[id] = void 0;
    }
  }
  function abort(ctrl) {
    ctrl.abort();
  }

  function _random(max) {
    return Math.round(Math.random() * 1000) % max;
  }

  const adjectives = [
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

  const colours = [
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

  const nouns = [
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

  let id = 1;

  function buildData(count) {
    const data = Array.from({ length: count }, () => ({
      id: id++,
      label:
        adjectives[_random(adjectives.length)] +
        " " +
        colours[_random(colours.length)] +
        " " +
        nouns[_random(nouns.length)],
    }));
    return data;
  }

  const $for_content__selected__OR__row_id = /* @__PURE__ */ _or(9, ($scope) => {
    let {
      _: { selected },
      row_id,
    } = $scope;
    _attr_class($scope["#tr/0"], selected === row_id && "danger");
  });
  const $for_content__selected = /* @__PURE__ */ _for_closure(
    "selected",
    "#tbody/6",
    $for_content__selected__OR__row_id,
  );
  const $for_content__row_id__script = _script(
    "tags/index.marko_1_row_id",
    ($scope, { row_id }) =>
      _on($scope["#a/2"], "click", function () {
        $selected($scope._, row_id);
      }),
  );
  const $for_content__row_id = /* @__PURE__ */ _const(
    "row_id",
    ($scope, row_id) => {
      _text($scope["#text/1"], row_id);
      $for_content__selected__OR__row_id($scope);
      $for_content__row_id__script($scope);
    },
  );
  const $for_content__row_label = /* @__PURE__ */ _const(
    "row_label",
    ($scope, row_label) => _text($scope["#text/3"], row_label),
  );
  const $for_content__rows__OR__row__script = _script(
    "tags/index.marko_1_rows_row",
    ($scope, { _: { rows }, row }) =>
      _on($scope["#a/4"], "click", function () {
        const clone = rows.slice();
        clone.splice(clone.indexOf(row), 1);
        $rows($scope._, (rows = clone));
      }),
  );
  const $for_content__rows__OR__row = /* @__PURE__ */ _or(
    7,
    $for_content__rows__OR__row__script,
  );
  const $for_content__rows = /* @__PURE__ */ _for_closure(
    "rows",
    "#tbody/6",
    $for_content__rows__OR__row,
  );
  const $for_content__row = /* @__PURE__ */ _const("row", ($scope, row) => {
    $for_content__row_id($scope, row?.id);
    $for_content__row_label($scope, row?.label);
    $for_content__rows__OR__row($scope);
  });
  const $for_content__setup = ($scope) => {
    $for_content__rows._($scope);
    $for_content__selected._($scope);
  };
  const $for_content__$params = /* @__PURE__ */ _const(
    "$params2",
    ($scope, $params2) => $for_content__row($scope, $params2[0]),
  );
  const $for_content = /* @__PURE__ */ _content_branch(
    '<tr><td class=col-md-1> </td><td class=col-md-4><a> </a></td><td class=col-md-1><a><span class="glyphicon glyphicon-remove" aria-hidden=true></span></a></td><td class=col-md-6></td></tr>',
    /* get, next(2), get, out(1), next(1), get, next(1), get, out(2), next(1), get, out(2) */ " E lD D mD m",
    $for_content__setup,
    $for_content__$params,
  );
  const $for = /* @__PURE__ */ _for_of("#tbody/6", $for_content);
  const $rows__script = _script("tags/index.marko_0_rows", ($scope, { rows }) => {
    _on($scope["#button/2"], "click", function () {
      $rows($scope, (rows = rows.concat(buildData(1000))));
    });
    _on($scope["#button/3"], "click", function () {
      let clone = rows.slice();
      for (let i = 0; i < clone.length; i += 10) {
        const row = clone[i];
        clone[i] = {
          id: row.id,
          label: row.label + " !!!",
        };
      }
      $rows($scope, (rows = clone));
    });
    _on($scope["#button/5"], "click", function () {
      if (rows.length > 998) {
        const clone = rows.slice();
        const tmp = clone[1];
        clone[1] = clone[998];
        clone[998] = tmp;
        $rows($scope, (rows = clone));
      }
    });
  });
  const $rows = /* @__PURE__ */ _let("rows/7", ($scope, rows) => {
    $for($scope, [rows, "id"]);
    $for_content__rows($scope);
    $rows__script($scope);
  });
  const $selected = /* @__PURE__ */ _let("selected/8", $for_content__selected);
  _script("tags/index.marko_0", ($scope) => {
    _on($scope["#button/0"], "click", function () {
      $rows($scope, buildData(1000));
    });
    _on($scope["#button/1"], "click", function () {
      $rows($scope, buildData(10000));
    });
    _on($scope["#button/4"], "click", function () {
      $rows($scope, []);
    });
  });

  init();
  debugger
}

export function unmount() {
  document.body.innerHTML = "";
}
