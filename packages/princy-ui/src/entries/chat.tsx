import { mountApp } from "../mount.js";
import ChatApp from "../apps/ChatApp.js";
import "../styles/premium.css";
import { animationCss } from "../animations/index.js";

const style = document.createElement("style");
style.textContent = animationCss;
document.head.appendChild(style);

mountApp(ChatApp);
