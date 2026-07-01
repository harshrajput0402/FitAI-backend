
const app = require("./src/app");
const { PORT } = require("./src/config/config");


app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});