This skill merges three sources. Each one is under the MIT License, and `LICENSE` holds the license text with all three copyright lines.

The base is the [`source-driven-development`](https://github.com/addyosmani/agent-skills/tree/main/skills/source-driven-development) skill by Addy Osmani, at revision `301b02b12bff98e4688e6984af6556802322bbde`. It gives the version detection, the docs fetching, the source ranking, the untrusted content rules, and the citation rules. The rationalizations table, the verification checklist, and the link to `security-and-hardening` were removed. The advice to cite sources in code comments was removed too. The text was rewritten to the plugin's style.

The evidence rules and the final report come from the [`research`](https://github.com/taecontrol/skills/tree/main/skills/engineering/research) skill by Taecontrol, at revision `3f079b0eca9f4adc0707fdfce2ee1c8803226a93`. Its two-researcher and judge process was left out. The method note now covers searches and single-source claims instead of agent roles.

The delegation pattern comes from the [`research`](https://github.com/mattpocock/skills/tree/main/skills/engineering/research) skill by Matt Pocock, at revision `4ae2317ddb22b046e26455e4f9c9b3aaaf62212d`. A report file is written only when the user asks for one, as the plugin's coding instructions require.

The `queries_and_cross_checks` section is original to this plugin.
