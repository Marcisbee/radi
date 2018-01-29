(function () { 'use strict';
  if (typeof radi === 'undefined') { console.warn('[Radi.js DEV] Err: Radi.js package not found'); return false; }

  const LOGO = 'data:image/png;base64,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';

  const { r, l, list, component, mount } = radi;

  mount(
    r('style',
      `.raddebug-wrap {
        position: fixed;
        top: 10px;
        right: 10px;
        bottom: 10px;
        width: 260px;
        max-width: 100%;
        z-index: 10000;
        background-color: rgba(72, 59, 106, 0.97);
        color: #fff;
        border-radius: 6px;
        padding: 14px 16px;
        box-sizing: border-box;
        overflow-x: hidden;
        overflow-y: auto;
        font-family: Tahoma;
        font-size: 16px;
      }
      .raddebug-body {
        width: 100%;
      }
      .raddebug-logo {
        display: block;
        margin: 8px 0 14px 0;
        text-align: center;
      }
      .raddebug-component {
        display: block;
        margin-top: 10px;
        background-color: rgba(44, 37, 64, 0.7);
        border-radius: 6px;
        line-height: 130%;
      }
      .raddebug-component > strong {
        display: block;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: inherit;
        font-size: 14px;
        font-weight: normal;
      }
      .raddebug-component > strong > i {
        opacity: 0.2;
      }
      .raddebug-component > strong:hover {
        background-color: #2d273e;
      }
      .raddebug-component > ul {
        display: block;
        margin: 0;
        padding: 0 10px 10px 10px;
        font-size: 14px;
        list-style: none;
      }
      .raddebug-component ul li {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #ae94c5;
      }
      .raddebug-component ul li > strong {
        display: inline;
        padding-left: 6px;
        color: #e2d7ff;
        font-weight: normal;
      }
      .raddebug-state-actor {
        display: block;
        margin-bottom: 10px;
      }
      .raddebug-state-actor button {
        display: block;
        width: 100%;
        margin-top: 10px;
        cursor: pointer;
      }`
    ),
    document.head
  );

  var stateActor = component({
    view: function() {
      return r('div.raddebug-state-actor',
        'State Actor: ',
        cond(
          l(!this.paused),
          r('button', { onclick: function () { this.paused = true; radi.freeze() } }, '■ Pause state')
        ).else(
          r('button', { onclick: function () { radi.unfreeze(); this.paused = false } }, '► Resume state')
        )
      )
    },
    state: {
      _radi_dvtls: true,
      paused: false
    },
    actions: {
      pause() {
        this.paused = true
        radi.freeze()
      },
      resume() {
        radi.unfreeze()
        this.paused = false
      }
    }
  });

  var data = component({
    view: function() {
      return r('div',
        'Components: ',
        list(l(this.list), (component) => {
        // l(this.list).loop((component) => {
          return r('div.raddebug-component',
            r('strong',
              { onclick: this.toggle.props(component.id) },
              l((component.name) ? component.name : 'unnamed-' + component.id)
            ),
            cond(l(this.show === component.id),
              r('ul',
                cond(l((component.vars.state).length), r('strong', 'State')),
                list(l(component.vars.state), (item) => {
                  return r('li',
                    l(item.key),
                    ': ',
                    cond(
                      l(Array.isArray(item.value)),
                      r('strong', 'Array of ', l((item.value).length), ' items')
                    ).else(
                      r('strong', l(item.value))
                    )
                  );
                }),
                cond(l((component.vars.props).length), r('strong', 'Props')),
                list(l(component.vars.props), (item) => {
                  return r('li',
                    l(item.key),
                    ': ',
                    cond(
                      l(Array.isArray(item.value)),
                      r('strong', 'Array of ', l((item.value).length), ' items')
                    ).else(
                      r('strong', l(item.value))
                    )
                  );
                }),
                cond(l((component.vars.actions).length), r('strong', 'Actions')),
                list(l(component.vars.actions), (item) => {
                  return r('li',
                    l(item.key),
                    ': ',
                    r('button', {
                      style: {
                        cursor: 'pointer'
                      },
                      onclick: () => { item.value() }
                    }, 'trigger')
                  );
                })
              )
            )
          );
        })
      );
    },
    state: {
      _radi_dvtls: true,
      show: null,
      list: []
    },
    actions: {
      onMount() {
        this.loadList(radi.activeComponents)
      },
      loadList(cp) {
        var comp = []
        for (var ii = 0; ii < cp.length; ii++) {
          // Do not debug the debugger
          if (!cp[ii].$this._radi_dvtls) {
            var arr = {
              id: cp[ii].$this.$id,
              name: cp[ii].$this.$name,
              vars: {
                state: [],
                props: [],
                actions: []
              }
            }
            for (var nn in cp[ii].$this.$state) {
              arr.vars.state.push({key: nn, value: cp[ii].$this[nn]})
            }
            for (var nn in cp[ii].$this.$props) {
              arr.vars.props.push({key: nn, value: cp[ii].$this[nn]})
            }
            for (var nn in cp[ii].$this.$actions) {
              arr.vars.actions.push({key: nn, value: cp[ii].$this[nn]})
            }
            comp.push(arr)
          }
        }
        this.list = comp
        setTimeout(() => {
          this.loadList(radi.activeComponents)
        }, 10)
      },
      toggle(id) {
        this.show = (this.show === id) ? null : id
      }
    }
  });

  mount(
    r('div.raddebug-wrap',
    r('div.raddebug-body',
      r('div.raddebug-logo',
        r('img', {
          src: LOGO,
          width: 107
        }),
      ),
      r('div', new stateActor()),
      r('div', new data())
    ),
    ),
    document.body
  );

})();
