/* 工具栏弹窗：读写 chrome.storage.local，与页面内面板实时同步 */
(() => {
  'use strict';

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
  const DEFAULT_DOCK = { show: true, x: null, y: null, opacity: 0.92 };

  const hasStorage = !!(window.chrome && chrome.storage && chrome.storage.local);
  const memory = {};

  function normalize(raw) {
    const s = raw && typeof raw === 'object' ? raw : {};
    const hide = Object.assign({}, DEFAULT_HIDE, s.hide && typeof s.hide === 'object' ? s.hide : {});
    const d = s.dock && typeof s.dock === 'object' ? s.dock : {};
    const opacity = Number(d.opacity);
    return {
      on: !!s.on,
      wide: s.wide === true,
      hide,
      custom: Array.isArray(s.custom) ? s.custom.filter((x) => typeof x === 'string') : [],
      dock: {
        show: d.show !== false,
        x: Number.isFinite(Number(d.x)) && d.x !== null ? Math.round(Number(d.x)) : null,
        y: Number.isFinite(Number(d.y)) && d.y !== null ? Math.round(Number(d.y)) : null,
        opacity: Number.isFinite(opacity) ? Math.min(1, Math.max(0.1, opacity)) : DEFAULT_DOCK.opacity,
      },
    };
  }

  let state = normalize(null);

  function read() {
    if (!hasStorage) {
      return Promise.resolve(normalize(memory[KEY]));
    }
    return chrome.storage.local.get(KEY).then((res) => normalize(res && res[KEY]));
  }

  function write() {
    if (!hasStorage) {
      memory[KEY] = JSON.parse(JSON.stringify(state));
      return;
    }
    chrome.storage.local.set({ [KEY]: state });
  }

  const $ = (id) => document.getElementById(id);
  const optionsBox = $('options');
  const rulesBox = $('rules');
  const ruleCount = $('ruleCount');
  const master = $('master');
  const dockShow = $('dockShow');
  const opacity = $('opacity');
  const opacityVal = $('opacityVal');

  for (const [key, text] of OPTIONS) {
    const lab = document.createElement('label');
    lab.className = 'row';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.key = key;
    cb.addEventListener('change', () => {
      state.hide[key] = cb.checked;
      write();
    });
    const span = document.createElement('span');
    span.textContent = text;
    lab.append(cb, span);
    optionsBox.appendChild(lab);
  }

  const wideBox = document.querySelector('input[data-key="wide"]');
  wideBox.addEventListener('change', () => {
    state.wide = wideBox.checked;
    write();
  });

  master.addEventListener('change', () => {
    state.on = master.checked;
    write();
  });

  dockShow.addEventListener('change', () => {
    state.dock.show = dockShow.checked;
    write();
  });

  let writeTimer = 0;
  opacity.addEventListener('input', () => {
    const v = Math.min(100, Math.max(10, Number(opacity.value) || 92));
    state.dock.opacity = v / 100;
    opacityVal.textContent = v + '%';
    // 拖动过程中就写回，页面里的按钮实时变淡/变实
    clearTimeout(writeTimer);
    writeTimer = setTimeout(write, 50);
  });
  opacity.addEventListener('change', () => {
    clearTimeout(writeTimer);
    state.dock.opacity = Math.min(100, Math.max(10, Number(opacity.value) || 92)) / 100;
    write();
  });

  $('resetPos').addEventListener('click', () => {
    state.dock.x = null;
    state.dock.y = null;
    write();
    flash('位置已重置，下次打开页面回到右下角');
  });

  $('resetAll').addEventListener('click', () => {
    state = normalize(null);
    write();
    render();
    flash('已恢复默认设置');
  });

  function renderRules() {
    rulesBox.textContent = '';
    ruleCount.textContent = state.custom.length ? state.custom.length + ' 条' : '';
    if (!state.custom.length) {
      const p = document.createElement('div');
      p.className = 'empty';
      p.textContent = '在页面里点「点选删除页面元素」即可添加。';
      rulesBox.appendChild(p);
      return;
    }
    state.custom.forEach((sel) => {
      const row = document.createElement('div');
      row.className = 'rule';
      const code = document.createElement('code');
      code.textContent = sel;
      code.title = sel;
      const del = document.createElement('button');
      del.type = 'button';
      del.title = '取消隐藏';
      del.textContent = '×';
      del.addEventListener('click', () => {
        state.custom = state.custom.filter((s) => s !== sel);
        write();
        renderRules();
      });
      row.append(code, del);
      rulesBox.appendChild(row);
    });
  }

  function render() {
    master.checked = state.on;
    dockShow.checked = state.dock.show;
    wideBox.checked = state.wide;
    document.querySelectorAll('input[data-key]:not([data-key="wide"])').forEach((cb) => {
      cb.checked = !!state.hide[cb.dataset.key];
    });
    syncDock();
    renderRules();
  }

  // 只同步悬浮按钮相关控件，避免拖动滑条时整页重建
  function syncDock() {
    const pct = Math.round(state.dock.opacity * 100);
    opacity.value = String(pct);
    opacityVal.textContent = pct + '%';
    dockShow.checked = state.dock.show;
  }

  let flashTimer = 0;
  function flash(msg) {
    let el = document.getElementById('__flash');
    if (!el) {
      el = document.createElement('div');
      el.id = '__flash';
      el.style.cssText =
        'position:fixed;left:12px;right:12px;bottom:10px;padding:7px 10px;border-radius:8px;' +
        'background:#00aeec;color:#fff;font-size:12px;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.4);';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      el.style.opacity = '0';
    }, 1800);
  }

  read().then((next) => {
    state = next;
    render();
  });

  function sameFocus(a, b) {
    return (
      a.on === b.on &&
      a.wide === b.wide &&
      JSON.stringify(a.hide) === JSON.stringify(b.hide) &&
      JSON.stringify(a.custom) === JSON.stringify(b.custom)
    );
  }

  if (hasStorage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local' || !changes[KEY]) return;
      const next = normalize(changes[KEY].newValue);
      const onlyDock = sameFocus(next, state);
      state = next;
      // 只改了位置/透明度时不动复选框，避免拖动时界面闪
      if (onlyDock) syncDock();
      else render();
    });
  }
})();
