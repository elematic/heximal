import {App, serve} from 'zipadee';
import process from 'node:process';

const {PORT} = process.env;
const port = PORT === undefined ? 8080 : parseInt(PORT, 10);

const app = new App();

app.use(serve('out'));

await app.listen(port);
console.log(`Listening on port ${port}`);
console.log(`Current working directory: ${process.cwd()}`);
