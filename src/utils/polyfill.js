// 为SockJS提供Node.js全局变量的polyfill
window.global = window;
window.process = window.process || {};
window.process.env = window.process.env || {}; 