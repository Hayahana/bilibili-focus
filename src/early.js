/* 在 document_start 尽早把「专注模式」的 class 打到 <html> 上，
   避免 B 站首屏把导航条 / 推荐栏闪一下再消失。
   状态存在 localStorage 里，读取是同步的，所以不会拖到首屏之后。 */
(function () {
  'use strict';
  var KEY = '__bfm_state_v1__';
  try {
    var s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!s || !s.on) return;
    var h = document.documentElement;
    h.classList.add('bfm-on');
    var hide = s.hide || {};
    for (var k in hide) {
      if (Object.prototype.hasOwnProperty.call(hide, k) && hide[k]) {
        h.classList.add('bfm-h-' + k);
      }
    }
    if (s.wide) h.classList.add('bfm-wide');
  } catch (e) {
    /* localStorage 被禁用时静默失败，页面照常显示 */
  }
})();
