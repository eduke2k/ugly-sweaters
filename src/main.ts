import { createApp } from "vue";
import { createPinia } from 'pinia';
import '@fontsource/margarine';
import PrimeVue from 'primevue/config';
import App from './App.vue';
import 'primevue/resources/themes/md-dark-indigo/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';

const pinia = createPinia();
const app = createApp(App);

app.use(PrimeVue);
app.use(pinia);
app.mount("#app");
