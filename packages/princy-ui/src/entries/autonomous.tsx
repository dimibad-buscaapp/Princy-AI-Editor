import { mountApp } from "../mount.js";
import App from "../apps/AutonomousApp.js";
import "../styles/premium.css";
import { animationCss } from "../animations/index.js";
const s = document.createElement("style"); s.textContent = animationCss; document.head.appendChild(s);
mountApp(App);
