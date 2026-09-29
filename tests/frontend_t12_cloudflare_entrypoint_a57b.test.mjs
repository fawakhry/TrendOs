import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const config=fs.readFileSync('config.js','utf8');
assert.match(html,/location\.hostname === 'fawakhry\.github\.io'/);
assert.match(html,/https:\/\/trendos-ui\.trendmall-contact\.workers\.dev/);
assert.match(html,/location\.replace\(target\)/);
assert.match(config,/MATBAGY_ROTET_URL = "https:\/\/trendos-ui\.trendmall-contact\.workers\.dev\/\?rotet=matbagy"/);
console.log('T12 A57B Cloudflare entrypoint contract: PASS');
