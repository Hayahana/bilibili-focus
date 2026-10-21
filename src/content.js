/* =====================================================================
   B站专注模式 · 页面内 UI
   - 右下角悬浮按钮：一键开关
   - 齿轮：逐项选择要隐藏的模块 / 点选删除任意元素
   - 状态写在 localStorage，刷新后保留，且能在首屏前生效（见 early.js）
   ===================================================================== */
(() => {
  'use strict';
  if (window.__BFM_LOADED__) return;
  window.__BFM_LOADED__ = true;

  const KEY = '__bfm_state_v1__';
  const DEFAULT_HIDE = {
    header: true,
    right: true,
    ads: true,
    comments: true,
    tags: true,
    sidenav: true,
    desc: false,
    danmaku: false,
    pod: false,
    toolbar: false,
  };
  const OPTIONS = [
    ['header', '顶部导航'],
    ['right', '右侧推荐栏'],
    ['ads', '广告位'],
    ['comments', '评论区'],
    ['tags', '视频标签'],
    ['sidenav', '悬浮按钮'],
    ['desc', '视频简介'],
    ['danmaku', '弹幕框'],
    ['pod', '视频选集'],
    ['toolbar', '点赞收藏栏'],
  ];
  // 这些元素一旦被隐藏，页面基本就废了，直接拒绝
  const PROTECTED = 'html, body, #app, #mirror-vdcon, #playerWrap, #bilibili-player, video';

  function loadState() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    } catch (e) {
      raw = null;
    }
    const s = raw && typeof raw === 'object' ? raw : {};
    return {
      on: !!s.on,
      wide: s.wide === true,
      hide: Object.assign({}, DEFAULT_HIDE, s.hide && typeof s.hide === 'object' ? s.hide : {}),
      custom: Array.isArray(s.custom) ? s.custom.filter((x) => typeof x === 'string') : [],
    };
  }

  const state = loadState();

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      /* 隐私模式下可能写不进去，功能仍可用，只是不记忆 */
    }
  }

  /* ------------------------------------------------------------------ */
  /* 样式应用                                                            */
  /* ------------------------------------------------------------------ */

  function applyCustom() {
    let el = document.getElementById('bfm-custom-style');
    if (!el) {
      el = document.createElement('style');
      el.id = 'bfm-custom-style';
      (document.head || document.documentElement).appendChild(el);
    }
    el.textContent = state.on
      ? state.custom.map((s) => s + '{display:none !important;}').join('\n')
      : '';
  }

  function apply() {
    const h = document.documentElement;
    h.classList.toggle('bfm-on', state.on);
    for (const k of Object.keys(DEFAULT_HIDE)) {
      h.classList.toggle('bfm-h-' + k, !!state.hide[k]);
    }
    h.classList.toggle('bfm-wide', state.on && state.wide);
    applyCustom();
    syncUI();
  }

  function nudgeLayout() {
    try {
      window.dispatchEvent(new Event('resize'));
    } catch (e) {
      /* ignore */
    }
  }

  /* ------------------------------------------------------------------ */
  /* 点选删除                                                            */
  /* ------------------------------------------------------------------ */

  let picking = false;
  let overlay = null;
  let label = null;

  function cssEscape(s) {
    if (window.CSS && typeof CSS.escape === 'function') return CSS.escape(s);
    return String(s).replace(/[^a-zA-Z0-9_\u00a0-\uffff-]/g, '\\$&');
  }

  function isStableClass(c) {
    if (!c) return false;
    if (/^data-v-/.test(c)) return false;
    if (/^v-/.test(c)) return false;
    if (/[a-f0-9]{8,}/i.test(c)) return false;
    return true;
  }

  function isUnique(sel) {
    try {
      return document.querySelectorAll(sel).length === 1;
    } catch (e) {
      return false;
    }
  }

  // 从被点元素往上拼一条稳定、且当下唯一的 CSS 选择器
  function selectorFor(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.id && isUnique('#' + cssEscape(el.id))) return '#' + cssEscape(el.id);

    const parts = [];
    let node = el;
    let depth = 0;
    while (node && node.nodeType === 1 && depth < 6) {
      const tag = node.tagName.toLowerCase();
      if (node.id && isUnique('#' + cssEscape(node.id))) {
        parts.unshift('#' + cssEscape(node.id));
        const withId = parts.join(' > ');
        if (isUnique(withId)) return withId;
      }
      const classes = [...node.classList].filter(isStableClass).slice(0, 2);
      let sel = tag + (classes.length ? '.' + classes.map(cssEscape).join('.') : '');
      const parent = node.parentElement;
      if (parent) {
        let same = [];
        try {
          same = [...parent.children].filter((c) => c.matches(sel));
        } catch (e) {
          same = [];
        }
        if (same.length > 1) {
          const sameTag = [...parent.children].filter((c) => c.tagName === node.tagName);
          sel += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
        }
      }
      parts.unshift(sel);
      const full = parts.join(' > ');
      // 纯标签路径（div > div > span）太容易误伤，继续往上找带 class / id 的层级
      if (isUnique(full) && /[.#]/.test(full)) return full;
      node = parent;
      depth += 1;
    }
    return null;
  }

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'bfm-pick-overlay';
    overlay.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:0',
      'height:0',
      'display:none',
      'pointer-events:none',
      'z-index:2147483645',
      'border:2px solid #00aeec',
      'border-radius:4px',
      'background:rgba(0,174,236,.14)',
      'box-shadow:0 0 0 1px rgba(0,0,0,.25)',
      'box-sizing:border-box',
    ].join(';');
    label = document.createElement('span');
    label.style.cssText = [
      'position:absolute',
      'left:-2px',
      'top:-22px',
      'max-width:100%',
      'padding:2px 7px',
      'border-radius:4px',
      'background:#00aeec',
      'color:#fff',
      'font:12px/1.5 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif',
      'white-space:nowrap',
      'overflow:hidden',
      'text-overflow:ellipsis',
      'box-sizing:border-box',
    ].join(';');
    overlay.appendChild(label);
    document.documentElement.appendChild(overlay);
  }

  function showOverlay(el) {
    ensureOverlay();
    const r = el.getBoundingClientRect();
    overlay.style.display = 'block';
    overlay.style.left = r.left + 'px';
    overlay.style.top = r.top + 'px';
    overlay.style.width = r.width + 'px';
    overlay.style.height = r.height + 'px';
    label.textContent =
      el.tagName.toLowerCase() +
      (el.id ? '#' + el.id : '') +
      (el.classList.length ? '.' + [...el.classList].slice(0, 2).join('.') : '');
  }

  function hideOverlay() {
    if (overlay) overlay.style.display = 'none';
  }

  function enterPick() {
    picking = true;
    document.documentElement.classList.add('bfm-picking');
    const style = document.getElementById('bfm-pick-css') || document.createElement('style');
    style.id = 'bfm-pick-css';
    style.textContent =
      'html.bfm-picking, html.bfm-picking *{cursor:crosshair !important;}' +
      'html.bfm-picking a, html.bfm-picking button{pointer-events:auto;}';
    (document.head || document.documentElement).appendChild(style);
    syncUI();
  }

  function exitPick() {
    picking = false;
    document.documentElement.classList.remove('bfm-picking');
    hideOverlay();
    syncUI();
  }

  function onMove(e) {
    if (!picking) return;
    const path = e.composedPath ? e.composedPath() : [];
    if (path.indexOf(host) !== -1) {
      hideOverlay();
      return;
    }
    const el = e.target;
    if (!el || el.nodeType !== 1) return;
    showOverlay(el);
  }

  function onClickPick(e) {
    if (!picking) return;
    const path = e.composedPath ? e.composedPath() : [];
    if (path.indexOf(host) !== -1) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    if (!el || el.nodeType !== 1) return;
    // 只拦「本身」就是关键节点、或者把播放器一起包进去的大容器；
    // 不能拦祖先（#app 是所有内容的祖先，拦了就什么都不能删）
    if (el.matches(PROTECTED) || el.querySelector('#bilibili-player, video')) {
      toast('这个元素不能隐藏（会影响播放器 / 页面）');
      return;
    }
    const sel = selectorFor(el);
    exitPick();
    if (!sel) {
      toast('没找到稳定的选择器，换一个更具体的元素试试');
      return;
    }
    addCustom(sel);
  }

  function addCustom(sel) {
    if (state.custom.indexOf(sel) !== -1) {
      toast('这个元素已经隐藏过了');
      return;
    }
    state.custom.push(sel);
    if (!state.on) state.on = true;
    save();
    apply();
    nudgeLayout();
    toast('已隐藏：' + sel);
  }

  /* ------------------------------------------------------------------ */
  /* 悬浮按钮 + 面板                                                      */
  /* ------------------------------------------------------------------ */

  const host = document.createElement('div');
  host.id = 'bfm-host';
  host.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;z-index:2147483646;pointer-events:none;';
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; }
      .dock {
        position: fixed; right: 18px; bottom: 92px;
        display: flex; gap: 8px; align-items: center;
        pointer-events: auto;
        font: 13px/1.4 -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
      }
      button { font: inherit; cursor: pointer; border: 0; }
      .main {
        display: flex; align-items: center; gap: 7px;
        height: 38px; padding: 0 15px; border-radius: 19px;
        color: #fff; background: rgba(28, 29, 32, .9);
        border: 1px solid rgba(255, 255, 255, .16);
        box-shadow: 0 6px 18px rgba(0, 0, 0, .28);
        backdrop-filter: blur(8px);
        transition: background .18s ease, transform .18s ease;
      }
      .main:hover { transform: translateY(-1px); }
      .main .dot {
        width: 8px; height: 8px; border-radius: 50%;
        background: #8a8f99; transition: background .18s ease, box-shadow .18s ease;
      }
      .dock.on .main { background: #00aeec; border-color: #00aeec; }
      .dock.on .main .dot { background: #fff; box-shadow: 0 0 0 4px rgba(255, 255, 255, .22); }
      .cog {
        width: 32px; height: 32px; border-radius: 50%;
        display: grid; place-items: center;
        color: #dfe3e8; background: rgba(28, 29, 32, .9);
        border: 1px solid rgba(255, 255, 255, .14);
        box-shadow: 0 6px 18px rgba(0, 0, 0, .28);
      }
      .cog:hover { background: rgba(52, 55, 62, .95); }
      .panel {
        position: fixed; right: 18px; bottom: 140px; width: 308px;
        max-height: min(72vh, 640px); overflow: auto;
        padding: 14px; border-radius: 14px;
        color: #e8eaed; background: rgba(24, 25, 28, .97);
        border: 1px solid rgba(255, 255, 255, .12);
        box-shadow: 0 16px 40px rgba(0, 0, 0, .45);
        pointer-events: auto;
        backdrop-filter: blur(10px);
      }
      .panel[hidden] { display: none; }
      .panel h3 { margin: 0 0 3px; font-size: 14px; font-weight: 600; }
      .sub { color: #9aa0a8; font-size: 12px; margin-bottom: 9px; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 6px; }
      .row {
        display: flex; align-items: center; gap: 7px;
        padding: 5px 6px; border-radius: 8px; cursor: pointer;
        user-select: none;
      }
      .row:hover { background: rgba(255, 255, 255, .06); }
      .row input { accent-color: #00aeec; width: 15px; height: 15px; margin: 0; }
      .wide-row { margin-top: 1px; }
      .hr { height: 1px; background: rgba(255, 255, 255, .1); margin: 11px 0; }
      .pick {
        width: 100%; height: 34px; border-radius: 9px;
        color: #fff; background: #2c2f36;
        border: 1px solid rgba(255, 255, 255, .12);
      }
      .pick:hover { background: #3a3e47; }
      .pick.active { background: #00aeec; border-color: #00aeec; }
      .rules { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
      .rule {
        display: flex; align-items: center; gap: 6px;
        padding: 4px 6px; border-radius: 7px; background: rgba(255, 255, 255, .05);
      }
      .rule .sel {
        flex: 1; min-width: 0; overflow: hidden;
        text-overflow: ellipsis; white-space: nowrap;
        font-family: ui-monospace, Consolas, monospace;
        font-size: 11px; color: #b9c0c8;
      }
      .rule .del {
        width: 20px; height: 20px; border-radius: 50%;
        background: transparent; color: #9aa0a8; font-size: 14px; line-height: 1;
      }
      .rule .del:hover { background: rgba(255, 80, 80, .2); color: #ff6b6b; }
      .empty { color: #767d86; font-size: 12px; padding: 3px 0; }
      .foot { margin-top: 10px; color: #767d86; font-size: 11px; line-height: 1.7; }
      .reset {
        background: transparent; color: #9aa0a8; font-size: 12px;
        text-decoration: underline; padding: 0; margin-left: 4px;
      }
      .reset:hover { color: #e8eaed; }
      .toast {
        position: fixed; left: 50%; bottom: 150px; transform: translateX(-50%);
        max-width: 70vw; padding: 8px 14px; border-radius: 9px;
        background: rgba(20, 21, 24, .96); color: #fff;
        border: 1px solid rgba(255, 255, 255, .12);
        font: 12px/1.5 -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
        box-shadow: 0 10px 30px rgba(0, 0, 0, .4);
        opacity: 0; transition: opacity .18s ease;
        pointer-events: none; word-break: break-all;
      }
      .toast.show { opacity: 1; }
    </style>
    <div class="dock" id="dock">
      <button class="main" id="main" type="button" aria-pressed="false">
        <span class="dot"></span><span id="mainLabel">专注模式</span>
      </button>
      <button class="cog" id="cog" type="button" title="设置" aria-label="设置">⚙</button>
    </div>
    <div class="panel" id="panel" hidden>
      <h3>专注模式</h3>
      <div class="sub">清掉推荐、广告、评论，只留课程和播放器。</div>
      <div class="grid" id="options"></div>
      <label class="row wide-row">
        <input type="checkbox" data-key="wide"><span>宽屏播放器（收起右侧选集栏）</span>
      </label>
      <div class="hr"></div>
      <button class="pick" id="pick" type="button">点选删除页面元素</button>
      <div class="rules" id="rules"></div>
      <div class="hr"></div>
      <div class="foot">
        快捷键 Alt + Z；点选模式下点哪删哪，Esc 退出。
        <button class="reset" id="reset" type="button">恢复默认</button>
      </div>
    </div>
    <div class="toast" id="toast"></div>
  `;

  const $ = (sel) => shadow.getElementById(sel);
  const dock = $('dock');
  const mainBtn = $('main');
  const mainLabel = $('mainLabel');
  const panel = $('panel');
  const optionsBox = $('options');
  const rulesBox = $('rules');
  const pickBtn = $('pick');
  const toastEl = $('toast');
  let toastTimer = 0;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }

  // 复选框只建一次
  for (const [key, text] of OPTIONS) {
    const lab = document.createElement('label');
    lab.className = 'row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.key = key;
    cb.addEventListener('change', () => {
      state.hide[key] = cb.checked;
      save();
      apply();
      nudgeLayout();
    });
    const span = document.createElement('span');
    span.textContent = text;
    lab.append(cb, span);
    optionsBox.appendChild(lab);
  }
  const wideBox = shadow.querySelector('input[data-key="wide"]');
  wideBox.addEventListener('change', () => {
    state.wide = wideBox.checked;
    save();
    apply();
    nudgeLayout();
  });

  function renderRules() {
    rulesBox.textContent = '';
    if (!state.custom.length) {
      const p = document.createElement('div');
      p.className = 'empty';
      p.textContent = '还没有自定义隐藏的元素。';
      rulesBox.appendChild(p);
      return;
    }
    state.custom.forEach((sel) => {
      const row = document.createElement('div');
      row.className = 'rule';
      const code = document.createElement('span');
      code.className = 'sel';
      code.textContent = sel;
      code.title = sel;
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'del';
      del.title = '取消隐藏';
      del.textContent = '×';
      del.addEventListener('click', () => {
        state.custom = state.custom.filter((s) => s !== sel);
        save();
        apply();
        nudgeLayout();
        toast('已恢复：' + sel);
      });
      row.append(code, del);
      rulesBox.appendChild(row);
    });
  }

  function syncUI() {
    dock.classList.toggle('on', state.on);
    mainBtn.setAttribute('aria-pressed', String(state.on));
    mainLabel.textContent = state.on ? '专注中' : '专注模式';
    mainBtn.title = state.on ? '点击关闭专注模式（Alt+Z）' : '点击开启专注模式（Alt+Z）';

    shadow.querySelectorAll('input[data-key]').forEach((cb) => {
      const k = cb.dataset.key;
      cb.checked = k === 'wide' ? state.wide : !!state.hide[k];
    });

    pickBtn.classList.toggle('active', picking);
    pickBtn.textContent = picking ? '点选模式：点一下要删除的东西' : '点选删除页面元素';
    renderRules();
  }

  function toggleFocus(force) {
    state.on = typeof force === 'boolean' ? force : !state.on;
    save();
    apply();
    if (!picking) nudgeLayout();
  }

  mainBtn.addEventListener('click', () => {
    if (picking) exitPick();
    toggleFocus();
    toast(state.on ? '专注模式已开启' : '已恢复页面');
  });

  $('cog').addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });

  pickBtn.addEventListener('click', () => {
    if (picking) {
      exitPick();
      return;
    }
    panel.hidden = true;
    if (!state.on) {
      state.on = true;
      save();
      apply();
      nudgeLayout();
      toast('专注模式已开启，现在可以点选元素了');
    }
    enterPick();
  });

  $('reset').addEventListener('click', () => {
    if (picking) exitPick();
    state.on = false;
    state.wide = false;
    state.hide = Object.assign({}, DEFAULT_HIDE);
    state.custom = [];
    save();
    apply();
    nudgeLayout();
    toast('已恢复默认设置');
  });

  // 点击面板外部时收起
  document.addEventListener(
    'click',
    (e) => {
      if (panel.hidden) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (path.indexOf(host) === -1) panel.hidden = true;
    },
    true
  );

  document.addEventListener('keydown', (e) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey && (e.code === 'KeyZ' || e.key === 'z' || e.key === 'Z')) {
      e.preventDefault();
      if (picking) exitPick();
      toggleFocus();
      toast(state.on ? '专注模式已开启' : '已恢复页面');
      return;
    }
    if (e.key === 'Escape') {
      if (picking) {
        exitPick();
        return;
      }
      if (!panel.hidden) panel.hidden = true;
    }
  });

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClickPick, true);
  document.addEventListener(
    'mousedown',
    (e) => {
      if (!picking) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (path.indexOf(host) !== -1) return;
      e.preventDefault();
      e.stopPropagation();
    },
    true
  );

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'bfm:toggle') {
      if (picking) exitPick();
      toggleFocus();
      toast(state.on ? '专注模式已开启' : '已恢复页面');
    }
  });

  // 其它标签页改了设置就同步过来
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    const next = loadState();
    state.on = next.on;
    state.wide = next.wide;
    state.hide = next.hide;
    state.custom = next.custom;
    apply();
    nudgeLayout();
  });

  apply();
  // B 站是 SPA，首屏之后还会挂载播放器/推荐；等一会儿再修一次布局
  window.addEventListener('load', () => {
    if (state.on) setTimeout(nudgeLayout, 800);
  });
})();
