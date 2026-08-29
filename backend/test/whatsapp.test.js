const test = require("node:test");
const assert = require("node:assert/strict");

const {
  sanitiseParam,
  toWhatsAppNumber,
  buildParameters,
  MAX_PARAM_LENGTH,
} = require("../src/services/whatsapp");

// Exactly what Meta rejects in a template parameter.
const ILLEGAL = /[\n\t]|\s{5,}/;

test("sanitiseParam collapses newlines, tabs and long space runs", () => {
  assert.equal(sanitiseParam("Saturday 7pm\n\t4 players      please", "x"), "Saturday 7pm 4 players please");
});

test("sanitiseParam strips C0/C1 control characters that \s misses", () => {
  assert.equal(sanitiseParam("a\u0000b\u0007c\u009Fd", "x"), "a b c d");
});

test("sanitiseParam falls back on empty and whitespace-only input", () => {
  assert.equal(sanitiseParam("", "not specified"), "not specified");
  assert.equal(sanitiseParam("   \n\t  ", "not specified"), "not specified");
  assert.equal(sanitiseParam(null, "there"), "there");
  assert.equal(sanitiseParam(undefined, "there"), "there");
});

test("sanitiseParam truncates past the cap and never ends on a space", () => {
  const out = sanitiseParam("x".repeat(500), "f");
  assert.equal(out.length, MAX_PARAM_LENGTH);
  assert.ok(out.endsWith("..."));
  assert.ok(!/\s$/.test(out.slice(0, -3)));
});

test("sanitiseParam collapses before truncating, so newline-heavy text is not cut", () => {
  // 404 characters of mostly newlines that collapse to just "ab cd".
  const out = sanitiseParam(`ab${String.fromCharCode(10).repeat(400)}cd`, "f");
  assert.equal(out, "ab cd");
  assert.ok(!out.endsWith("..."), "collapsing should have removed the need to truncate");
});

test("toWhatsAppNumber prefixes the country code, with no leading +", () => {
  assert.equal(toWhatsAppNumber("9876543210"), "919876543210");
  assert.equal(toWhatsAppNumber("98765 43210"), "919876543210");
});

test("toWhatsAppNumber does not double a country code already present", () => {
  assert.equal(toWhatsAppNumber("919876543210"), "919876543210");
});

test("toWhatsAppNumber returns empty for no digits", () => {
  assert.equal(toWhatsAppNumber(""), "");
  assert.equal(toWhatsAppNumber(null), "");
});

test("buildParameters maps the four placeholders in order", () => {
  const params = buildParameters({
    name: "Gowtham",
    platform: "Squad",
    message: "Saturday 7pm, 4 players",
    status: "pending",
  });
  assert.deepEqual(
    params.map((p) => p.text),
    ["Gowtham", "Squad pack (4 seats)", "Saturday 7pm, 4 players", "Pending confirmation"]
  );
});

test("buildParameters never emits an empty parameter, even for a blank booking", () => {
  for (const booking of [{}, { name: "", platform: "", message: "", status: "" }]) {
    for (const p of buildParameters(booking)) {
      assert.notEqual(p.text, "", `empty parameter for ${JSON.stringify(booking)}`);
      assert.equal(p.type, "text");
    }
  }
});

// The contract Meta enforces server-side, and the one thing that cannot be
// checked against the real API for free. Fuzz it.
test("fuzz: no parameter is ever empty or illegal, over 500 random messages", () => {
  const alphabet = "ab \n\t\u0000\u001F\u00A0     xyz.,!";
  for (let i = 0; i < 500; i++) {
    let msg = "";
    const len = Math.floor(Math.random() * 500);
    for (let j = 0; j < len; j++) {
      msg += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const params = buildParameters({ name: msg, platform: "PS5", message: msg, status: "pending" });
    for (const p of params) {
      assert.notEqual(p.text, "", `empty parameter for input ${JSON.stringify(msg)}`);
      assert.ok(!ILLEGAL.test(p.text), `illegal parameter ${JSON.stringify(p.text)}`);
      assert.ok(p.text.length <= MAX_PARAM_LENGTH, `over cap: ${p.text.length}`);
    }
  }
});
