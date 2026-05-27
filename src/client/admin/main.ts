import { createApp } from "vue";
import "../styles/base.css";
import { useAuth } from "../composables/useAuth";
import App from "./App.vue";

// Read the token injected by the server via <meta name="x-api-token"> and persist
// it to localStorage so subsequent reloads stay authenticated without re-visiting
// the secret URL. This code only runs in the admin bundle — not the viewer bundle.
const metaToken = document
	.querySelector('meta[name="x-api-token"]')
	?.getAttribute("content");
if (metaToken) {
	useAuth().setToken(metaToken);
}

createApp(App).mount("#app");
