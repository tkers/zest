.PHONY: all core template plugins embed

all: core template plugins embed

core: dist/zest.min.js
template: assets/mjs/bundlerTemplate.js
plugins: assets/mjs/bundlerPlugins.js
embed: embed/index.html

CORE_SRC := $(wildcard core/*.js)
TEMPLATE_SRC := $(wildcard bundler_template/*)
PLUGINS_SRC := $(wildcard plugins/*.js)

dist/zest.min.js: $(CORE_SRC)
	npx terser core/zest.js core/audio.js core/font.js -c drop_console -m -o dist/zest.min.js

# dist/%.min.js: plugins/%.js
# 	npx terser $< -c drop_console -m -o $@

assets/mjs/bundlerTemplate.js: $(TEMPLATE_SRC) $(CORE_SRC) build/make_template.js
	node build/make_template.js

assets/mjs/bundlerPlugins.js: $(PLUGINS_SRC) build/make_plugins.js
	node build/make_plugins.js

embed/index.html: $(CORE_SRC) $(TEMPLATE_SRC) $(PLUGINS_SRC) cli/zest zest.conf.json _demo/paco-lily.json
	node cli/zest bundle -o embed/index.html _demo/paco-lily.json