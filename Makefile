.PHONY: all core template plugins embed

all: core template themes plugins embed

core: dist/zest.min.js
template: assets/mjs/bundlerTemplate.js
themes: assets/mjs/bundlerThemes.js
plugins: assets/mjs/bundlerPlugins.js
embed: embed/index.html

CORE_SRC := $(wildcard core/*.js)
TEMPLATE_SRC := $(wildcard bundler_template/*)
THEMES_SRC := $(wildcard bundler_themes/*)
PLUGINS_SRC := $(wildcard plugins/*.js)
TEST_SRC := $(wildcard test/*.js)

test: test/.pass
test/.pass: $(CORE_SRC) $(TEST_SRC)
	@for file in test/*.js; do node "$$file" || exit 1; done
	@touch $@

dist/zest.min.js: $(CORE_SRC)
	npx terser core/zest.js core/audio.js core/font.js -c drop_console -m -o dist/zest.min.js

# dist/%.min.js: plugins/%.js
# 	npx terser $< -c drop_console -m -o $@

assets/mjs/bundlerTemplate.js: $(TEMPLATE_SRC) $(CORE_SRC) build/make_template.js
	node build/make_template.js

assets/mjs/bundlerThemes.js: $(THEMES_SRC) build/make_themes.js
	node build/make_themes.js

assets/mjs/bundlerPlugins.js: $(PLUGINS_SRC) build/make_plugins.js
	node build/make_plugins.js

embed/index.html: $(CORE_SRC) $(TEMPLATE_SRC) $(PLUGINS_SRC) cli/zest zest.conf.json _demo/paco-lily.json
	node cli/zest bundle -o embed/index.html _demo/paco-lily.json
