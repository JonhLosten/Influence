import test from "node:test";
import assert from "node:assert";
import { languageRuntime, t } from "../src/i18n";

test("translates with replacements", () => {
  const translation = t("modal.account.followers", { count: 1234 });
  assert.ok(translation.includes("1234"));
});

test("notifies subscribers on language change", () => {
  const seen: string[] = [];
  const unsubscribe = languageRuntime.subscribe(() => {
    seen.push(languageRuntime.getLang());
  });

  languageRuntime.setLang("en");
  languageRuntime.setLang("fr");

  unsubscribe();

  assert.ok(seen.includes("en"));
  assert.strictEqual(languageRuntime.getLang(), "fr");
});
