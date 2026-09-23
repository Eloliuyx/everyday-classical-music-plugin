const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildSync } = require('esbuild');
const moment = require('moment');
const path = require('node:path');

// Exercise the actual plugin with an in-memory vault; no personal notes are opened.
const source = buildSync({
    entryPoints: [path.join(__dirname, '..', 'main.ts')],
    bundle: true,
    format: 'cjs',
    external: ['obsidian'],
    write: false,
    target: 'es2018',
}).outputFiles[0].text;
const evaluate = new Function('require', 'module', 'exports', 'console', 'window', source);
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    return { promise, resolve };
};
const music = '> [!tip] Daily Classical Music\n> [Symphonic Études, op. 13 by Schumann](https://www.youtube.com/watch?v=CIWBd7-AP4Q)\n\n';

function harness({ notes = {}, saved = {}, loadError = null, loadPromise = null, declarative = false } = {}) {
    const state = {
        notices: [], errors: [], tabs: [], reads: [], writes: [], saves: [],
        contents: new Map(Object.entries(notes)), listeners: new Set(), readyCallbacks: [],
        files: [], enumerations: 0, failRead: new Set(), failWrite: new Set(),
        ready: false, readHook: null, enumerateError: null, saveError: null,
        indexedDefinitions: [], elements: [], openedUrls: [],
    };
    class TFile {
        constructor(filePath, ctime = Date.now() + 10000) {
            this.path = filePath;
            this.extension = path.extname(filePath).slice(1);
            this.basename = path.basename(filePath, path.extname(filePath));
            this.stat = { ctime };
        }
    }
    state.files = Object.keys(notes).map(filePath => new TFile(filePath));
    class Button {
        setButtonText(text) { this.label = text; return this; }
        setDisabled(disabled) { this.disabled = disabled; return this; }
        setCta() { return this; }
        onClick(callback) { this.callback = callback; return this; }
        click() { if (!this.disabled) return this.callback(); }
    }
    class Text {
        setPlaceholder() { return this; }
        setValue(value) { this.value = value; return this; }
        onChange(callback) { this.callback = callback; return this; }
    }
    function createContainer(options = {}, parentElement = null) {
        return {
            ...options, parentElement, rows: [], children: [],
            contains(element) {
                return this === element || this.children.some(child => child === element || child.contains?.(element));
            },
            empty() { this.rows = []; this.children = []; },
            createDiv(options) {
                const child = createContainer(options, this);
                this.children.push(child);
                return child;
            },
            createEl(tag, options) {
                const element = { tag, ...options, parentElement: this };
                this.children.push(element);
                state.elements.push(element);
                return element;
            },
        };
    }
    class Setting {
        constructor(container) {
            container.rows.push(this);
            this.settingEl = container.createDiv({ cls: 'setting-item' });
            this.controlEl = this.settingEl.createDiv({ cls: 'setting-item-control' });
        }
        setClass(name) { this.className = name; this.settingEl.cls += ` ${name}`; return this; }
        setName(name) { this.name = name; return this; }
        setDesc(description) { this.description = description; return this; }
        addButton(callback) { this.button = new Button(); callback(this.button); return this; }
        addText(callback) { this.text = new Text(); callback(this.text); return this; }
    }
    class PluginSettingTab {
        constructor(app) {
            this.app = app;
            this.containerEl = createContainer();
        }
    }
    class Plugin {
        constructor(app) { this.app = app; this.events = []; }
        async loadData() {
            if (loadPromise) return loadPromise;
            if (loadError) throw loadError;
            return structuredClone(saved);
        }
        async saveData(value) {
            if (state.saveError) throw state.saveError;
            state.saves.push(structuredClone(value));
        }
        addSettingTab(tab) {
            if (declarative) state.indexedDefinitions = tab.getSettingDefinitions();
            state.tabs.push(tab);
        }
        registerEvent(event) { this.events.push(event); }
        unload() {
            this.onunload();
            this.events.forEach(event => state.listeners.delete(event));
        }
    }
    class Notice {
        constructor(message) { state.notices.push(message); }
    }
    const app = {
        vault: {
            on(name, callback) {
                assert.equal(name, 'create');
                state.listeners.add(callback);
                return callback;
            },
            getMarkdownFiles() {
                state.enumerations++;
                if (state.enumerateError) throw state.enumerateError;
                return state.files.filter(file => file.extension === 'md');
            },
            async read(file) {
                state.reads.push(file.path);
                if (state.readHook) await state.readHook(file);
                if (state.failRead.has(file.path)) throw new Error('Simulated read failure');
                return state.contents.get(file.path);
            },
            async modify(file, content) {
                if (state.failWrite.has(file.path)) throw new Error('Simulated write failure');
                state.writes.push(file.path);
                state.contents.set(file.path, content);
            },
        },
        workspace: {
            onLayoutReady(callback) {
                if (state.ready) callback();
                else state.readyCallbacks.push(callback);
            },
        },
    };
    const obsidian = { Plugin, PluginSettingTab, Setting, TFile, Notice, ButtonComponent: Button, moment };
    const module = { exports: {} };
    evaluate(name => {
        assert.equal(name, 'obsidian');
        return obsidian;
    }, module, module.exports, { error: (...args) => state.errors.push(args) }, {
        open: (...args) => state.openedUrls.push(args),
    });
    const plugin = new module.exports.default(app);
    const emit = file => state.listeners.forEach(callback => callback(file));
    const ready = () => {
        state.ready = true;
        state.readyCallbacks.splice(0).forEach(callback => callback());
    };
    return {
        state, plugin, emit, ready, TFile,
        showSettings(tab = state.tabs[0]) {
            if (declarative) {
                // Model the documented 1.13+ host: definitions bypass display().
                tab.containerEl.empty();
                const rows = [];
                for (const groupDefinition of tab.getSettingDefinitions()) {
                    const groupEl = tab.containerEl.createDiv({ cls: `setting-group ${groupDefinition.cls || ''}` });
                    const listEl = groupEl.createDiv({ cls: 'setting-items' });
                    for (const definition of groupDefinition.items) {
                        const row = new Setting(listEl)
                            .setName(definition.name).setDesc(definition.desc);
                        definition.render(row, { listEl });
                        rows.push(row);
                    }
                }
                return rows;
            } else {
                // The legacy host exposes no new settings APIs.
                tab.display();
            }
            return tab.containerEl.rows;
        },
        async start(layoutReady = true) {
            assert.equal(plugin.onload(), undefined);
            await flush();
            if (layoutReady) ready();
            await flush();
            return state.tabs[0];
        },
    };
}

test('startup ignores a previously enabled backfill flag and preserves the saved cutoff date', async () => {
    const env = harness({
        saved: { backfillExistingNotes: true, removeLinksBeforeDate: '2020-01-01' },
        notes: { '2026-01-01.md': 'Existing note' },
    });
    await env.start(false);
    env.emit(env.state.files[0]); // Vault startup emits create for existing files.
    env.ready();
    await flush();
    assert.deepEqual(env.state.reads, []);
    assert.deepEqual(env.state.writes, []);
    assert.deepEqual(env.state.saves, []);
    assert.equal(env.state.enumerations, 0);
    assert.deepEqual(env.plugin.settings, { removeLinksBeforeDate: '2020-01-01' });
    assert.equal(env.state.contents.get('2026-01-01.md'), 'Existing note');
});

test('new Markdown daily notes still receive music after layout readiness', async () => {
    const env = harness({ notes: { '2026-01-01.md': 'My note\n' } });
    await env.start(false);
    env.emit(env.state.files[0]);
    await flush();
    assert.equal(env.state.writes.length, 0);
    env.ready();
    env.emit(env.state.files[0]);
    await flush();
    assert.equal(env.state.contents.get('2026-01-01.md'), music + 'My note\n');
});

test('old files, folders, non-Markdown files, and invalid dates are ignored by automatic insertion', async () => {
    const env = harness({ notes: { '2020-01-01.md': 'Old', '2026-01-01.txt': 'Text', '2026-02-30.md': 'Invalid' } });
    env.state.files[0].stat.ctime = 0;
    await env.start();
    env.state.files.forEach(env.emit);
    env.emit({ path: '2026-01-01', basename: '2026-01-01' });
    await flush();
    assert.deepEqual(env.state.reads, []);
});

test('settings-load failure is reported without registering callbacks or writing notes', async () => {
    const env = harness({ loadError: new Error('Cannot load') });
    await env.start();
    assert.equal(env.state.tabs.length, 0);
    assert.equal(env.state.listeners.size, 0);
    assert.match(env.state.notices[0], /Could not load settings/);
    assert.deepEqual(env.state.writes, []);
});

test('unloading during initialization or before layout readiness cancels late registration', async () => {
    const pending = deferred();
    const loading = harness({ loadPromise: pending.promise });
    loading.plugin.onload();
    loading.plugin.unload();
    pending.resolve({ backfillExistingNotes: true });
    await flush();
    loading.ready();
    assert.equal(loading.state.tabs.length, 0);
    assert.equal(loading.state.listeners.size, 0);
    const waiting = harness();
    await waiting.start(false);
    waiting.plugin.unload();
    waiting.ready();
    assert.equal(waiting.state.listeners.size, 0);
});

for (const [name, before, after] of [
    ['plain note and trailing spaces', '  Body\n\n  ', music + '  Body\n\n  '],
    ['empty note', '', music],
    ['frontmatter', '---\ntags: [music]\n---\n\nBody  \n', '---\ntags: [music]\n---\n\n' + music + '\nBody  \n'],
    ['empty frontmatter', '---\n---\nBody', '---\n---\n\n' + music + 'Body'],
    ['frontmatter ending at EOF', '---\ntags: []\n---', '---\ntags: []\n---\n\n' + music],
    ['horizontal rule inside body', 'Intro\n---\nBody\n---\n', music + 'Intro\n---\nBody\n---\n'],
    ['CRLF', '---\r\ntags: []\r\n---\r\nBody\r\n', '---\r\ntags: []\r\n---\r\n\r\n' + music.replaceAll('\n', '\r\n') + 'Body\r\n'],
    ['Unicode BOM', '\uFEFFBody\n', '\uFEFF' + music + 'Body\n'],
]) {
    test(`manual backfill preserves existing content: ${name}`, async () => {
        const env = harness({ notes: { '2026-01-01.md': before } });
        await env.start();
        await env.plugin.backfillExistingNotes();
        assert.equal(env.state.contents.get('2026-01-01.md'), after);
        await env.plugin.backfillExistingNotes();
        assert.deepEqual(env.state.writes, ['2026-01-01.md']);
        assert.equal(env.state.contents.get('2026-01-01.md'), after);
    });
}

test('all three legacy callout styles and their existing URLs remain byte-for-byte unchanged', async () => {
    const notes = Object.fromEntries(['tip', 'info', 'quote'].map((type, i) => [
        `2026-01-0${i + 1}.md`, `Title\n> [!${type}] Daily Classical Music\n> [Old recording](https://example.com/old)\n\n  `,
    ]));
    const env = harness({ notes });
    await env.start();
    await env.plugin.backfillExistingNotes();
    assert.deepEqual(Object.fromEntries(env.state.contents), notes);
    assert.deepEqual(env.state.writes, []);
    assert.match(env.state.notices.at(-1), /0 added, 3 skipped, 0 failed/);
});

test('individual read/write failures do not stop other notes, and retry does not duplicate successful writes', async () => {
    const env = harness({ notes: { '2026-01-01.md': 'First', '2026-01-02.md': 'Second', '2026-01-03.md': 'Third' } });
    env.state.failRead.add('2026-01-01.md');
    env.state.failWrite.add('2026-01-02.md');
    await env.start();
    await env.plugin.backfillExistingNotes();
    assert.deepEqual(env.state.writes, ['2026-01-03.md']);
    assert.match(env.state.notices.at(-1), /1 added, 0 skipped, 2 failed/);
    env.state.failRead.clear();
    env.state.failWrite.clear();
    await env.plugin.backfillExistingNotes();
    assert.deepEqual(env.state.writes, ['2026-01-03.md', '2026-01-01.md', '2026-01-02.md']);
    assert.match(env.state.notices.at(-1), /2 added, 1 skipped, 0 failed/);
});

test('unclosed frontmatter stays unchanged and is reported as a failure', async () => {
    const before = '---\ntags: [unfinished]\nBody';
    const env = harness({ notes: { '2026-01-01.md': before } });
    await env.start();
    await env.plugin.backfillExistingNotes();
    assert.equal(env.state.contents.get('2026-01-01.md'), before);
    assert.deepEqual(env.state.writes, []);
    assert.match(env.state.notices.at(-1), /0 added, 0 skipped, 1 failed/);
});

test('overlapping backfill attempts are rejected and the lock is released on completion', async () => {
    const env = harness({ notes: { '2026-01-01.md': 'Body' } });
    await env.start();
    const pending = deferred();
    env.state.readHook = () => pending.promise;
    const first = env.plugin.backfillExistingNotes();
    await env.plugin.backfillExistingNotes();
    assert.equal(env.state.enumerations, 1);
    assert.match(env.state.notices.at(-1), /already running/);
    pending.resolve();
    await first;
    assert.deepEqual(env.state.writes, ['2026-01-01.md']);
    assert.equal(env.plugin.backfillInProgress, false);
});

test('automatic insertion and manual backfill cannot write the same note concurrently', async () => {
    const env = harness({ notes: { '2026-01-01.md': 'Body' } });
    await env.start();
    const pending = deferred();
    env.state.readHook = () => pending.promise;
    const automatic = env.plugin.onFileCreate(env.state.files[0]);
    await env.plugin.backfillExistingNotes();
    pending.resolve();
    await automatic;
    assert.deepEqual(env.state.reads, ['2026-01-01.md']);
    assert.deepEqual(env.state.writes, ['2026-01-01.md']);
});

test('unloading during a pending read prevents that write and stops the remaining backfill', async () => {
    const env = harness({ notes: { '2026-01-01.md': 'First', '2026-01-02.md': 'Second' } });
    await env.start();
    const pending = deferred();
    env.state.readHook = () => pending.promise;
    const running = env.plugin.backfillExistingNotes();
    env.plugin.unload();
    pending.resolve();
    await running;
    assert.deepEqual(env.state.writes, []);
    assert.deepEqual(env.state.reads, ['2026-01-01.md']);
    assert.equal(env.plugin.backfillInProgress, false);
});

test('the manual button runs once, stays disabled while busy, and recovers if the settings page is reopened', async () => {
    const env = harness({ notes: { '2026-01-01.md': 'Body' }, saved: { backfillExistingNotes: true } });
    const tab = await env.start();
    tab.display();
    const button = tab.containerEl.rows[0].button;
    assert.equal(button.label, 'Backfill now');
    const pending = deferred();
    env.state.readHook = () => pending.promise;
    button.click();
    button.click();
    assert.equal(button.disabled, true);
    tab.display();
    const reopenedButton = tab.containerEl.rows[0].button;
    assert.equal(reopenedButton.disabled, true);
    pending.resolve();
    await flush();
    assert.equal(reopenedButton.disabled, false);
    assert.equal(reopenedButton.label, 'Backfill now');
    assert.equal(env.state.enumerations, 1);
    assert.deepEqual(env.state.writes, ['2026-01-01.md']);
    assert.deepEqual(env.state.saves, []);
});

test('an unexpected backfill failure is caught by the button and allows retry', async () => {
    const env = harness({ notes: { '2026-01-01.md': 'Body' } });
    const tab = await env.start();
    tab.display();
    env.state.enumerateError = new Error('Cannot enumerate');
    const button = tab.containerEl.rows[0].button;
    button.click();
    await flush();
    assert.equal(button.disabled, false);
    assert.equal(env.plugin.backfillInProgress, false);
    assert.match(env.state.notices.at(-1), /Backfill stopped unexpectedly/);
    env.state.enumerateError = null;
    button.click();
    await flush();
    assert.deepEqual(env.state.writes, ['2026-01-01.md']);
});

test('event, setting-save, and removal errors produce notices instead of unhandled rejections', async () => {
    const env = harness({ notes: { '2026-01-01.md': 'Body' }, saved: { removeLinksBeforeDate: '2027-01-01' } });
    const tab = await env.start();
    tab.display();
    env.state.failWrite.add('2026-01-01.md');
    env.emit(env.state.files[0]);
    await flush();
    assert.match(env.state.notices.at(-1), /Could not add music/);
    env.state.saveError = new Error('Cannot save');
    tab.containerEl.rows[1].text.callback('2027-02-01');
    await flush();
    assert.match(env.state.notices.at(-1), /Could not save the date/);
    await tab.containerEl.rows[2].button.click();
    assert.match(env.state.notices.at(-1), /Could not finish removing links/);
    assert.equal(tab.containerEl.rows[2].button.disabled, false);
});

test('music intentionally removed from an old note stays removed across restart until explicit backfill', async () => {
    const env = harness({ notes: { '2026-01-01.md': music + 'Personal note\n' } });
    await env.start();
    env.state.contents.set('2026-01-01.md', 'Personal note\n');
    env.plugin.unload();
    const restarted = harness({
        notes: Object.fromEntries(env.state.contents),
        saved: { backfillExistingNotes: true },
    });
    const tab = await restarted.start(false);
    restarted.emit(restarted.state.files[0]);
    restarted.ready();
    await flush();
    assert.equal(restarted.state.contents.get('2026-01-01.md'), 'Personal note\n');
    assert.deepEqual(restarted.state.writes, []);
    tab.display();
    tab.containerEl.rows[0].button.click();
    await flush();
    assert.equal(restarted.state.contents.get('2026-01-01.md'), music + 'Personal note\n');
    assert.deepEqual(restarted.state.writes, ['2026-01-01.md']);
});

for (const [label, before] of [['LF', 'Body\n\n'], ['CRLF', 'Body\r\n\r\n']]) {
    test(`the existing removal action can remove newly inserted ${label} music blocks`, async () => {
        const env = harness({ notes: { '2026-01-01.md': before }, saved: { removeLinksBeforeDate: '2027-01-01' } });
        const tab = await env.start();
        await env.plugin.backfillExistingNotes();
        assert.match(env.state.contents.get('2026-01-01.md'), /Daily Classical Music/);
        tab.display();
        await tab.containerEl.rows[2].button.click();
        assert.equal(env.state.contents.get('2026-01-01.md'), before);
    });
}

test('modern search indexing exposes useful English/Chinese terms without rendering or modifying notes', async () => {
    const env = harness({
        declarative: true,
        notes: { '2026-01-01.md': 'Private note' },
        saved: { backfillExistingNotes: true, removeLinksBeforeDate: '2027-01-01' },
    });
    const tab = await env.start();
    const definitions = env.state.indexedDefinitions.flatMap(group => group.items);
    assert.ok(definitions.find(row => row.name === 'Backfill existing notes' && row.aliases.includes('补填')));
    assert.ok(definitions.find(row => row.name === 'Remove music links' && row.aliases.includes('删除音乐')));
    assert.ok(definitions.find(row => row.name === 'Remove links before date' && row.aliases.includes('截止日期')));
    assert.ok(definitions.find(row => row.name === 'Support development' && row.aliases.includes('赞助')));
    assert.equal(new Set(definitions.map(row => row.name)).size, definitions.length);
    tab.getSettingDefinitions();
    tab.getSettingDefinitions();
    assert.equal(tab.containerEl.rows.length, 0);
    assert.equal(env.state.elements.length, 0);
    assert.equal(env.state.enumerations, 0);
    assert.deepEqual(env.state.reads, []);
    assert.deepEqual(env.state.writes, []);
    assert.deepEqual(env.state.saves, []);
    assert.deepEqual(env.state.openedUrls, []);
});

test('modern settings bypass display and still save dates, manually backfill, and remove music correctly', async () => {
    const env = harness({ declarative: true, notes: { '2026-01-01.md': 'My note\n' } });
    const tab = await env.start();
    tab.display = () => assert.fail('Modern settings must render through definitions');
    const rows = env.showSettings();
    assert.deepEqual(env.state.writes, []);
    assert.deepEqual(env.state.reads, []);
    assert.deepEqual(env.state.openedUrls, []);
    const date = rows.find(row => row.name === 'Remove links before date').text;
    date.callback('2027-01-01');
    await flush();
    assert.deepEqual(env.state.saves.at(-1), { removeLinksBeforeDate: '2027-01-01' });
    rows.find(row => row.name === 'Backfill existing notes').button.click();
    await flush();
    assert.equal(env.state.contents.get('2026-01-01.md'), music + 'My note\n');
    await rows.find(row => row.name === 'Remove music links').button.click();
    assert.equal(env.state.contents.get('2026-01-01.md'), 'My note\n');
    const reloaded = harness({ declarative: true, saved: env.state.saves.at(-1) });
    await reloaded.start();
    assert.equal(reloaded.showSettings().find(row => row.name === 'Remove links before date').text.value, '2027-01-01');
});

test('modern settings retain error notices and restore a failed backfill button for retry', async () => {
    const env = harness({ declarative: true, notes: { '2026-01-01.md': 'Body' } });
    await env.start();
    const rows = env.showSettings();
    const backfill = rows.find(row => row.name === 'Backfill existing notes').button;
    env.state.enumerateError = new Error('Simulated enumeration failure');
    backfill.click();
    await flush();
    assert.match(env.state.notices.at(-1), /Backfill stopped unexpectedly/);
    assert.equal(backfill.disabled, false);
    env.state.enumerateError = null;
    backfill.click();
    await flush();
    assert.deepEqual(env.state.writes, ['2026-01-01.md']);
    env.state.saveError = new Error('Simulated save failure');
    rows.find(row => row.name === 'Remove links before date').text.callback('invalid date');
    await flush();
    assert.match(env.state.notices.at(-1), /Could not save the date/);
    await rows.find(row => row.name === 'Remove music links').button.click();
    assert.match(env.state.notices.at(-1), /valid date/);
    assert.deepEqual(env.state.writes, ['2026-01-01.md']);
});

for (const declarative of [false, true]) {
    test(`support link opens only on click in ${declarative ? 'modern' : 'legacy'} settings`, async () => {
        const env = harness({ declarative });
        await env.start();
        env.showSettings();
        assert.deepEqual(env.state.openedUrls, []);
        const button = env.state.elements.find(element => element.text === 'Feed the Markhor 🦌🪽');
        assert.ok(button);
        button.onclick();
        assert.deepEqual(env.state.openedUrls, [['https://ko-fi.com/flyingmarkhor', '_blank']]);
    });
}

// Check containment, not just row styles: a transparent row inside the notes
// group still inherits the gray card behind it (the reported regression).
for (const declarative of [false, true]) {
    test(`support footer stays outside note controls on reopening ${declarative ? 'modern' : 'legacy'} settings`, async () => {
        const env = harness({ declarative });
        const tab = await env.start();
        for (let opening = 0; opening < 2; opening++) {
            const rows = env.showSettings();
            const page = tab.containerEl;
            const footer = page.children.at(-1);
            const visibleButtons = env.state.elements.filter(element =>
                element.text === 'Feed the Markhor 🦌🪽' && page.contains(element));
            assert.equal(visibleButtons.length, 1);
            assert.ok(footer.contains(visibleButtons[0]));
            for (const row of rows.filter(row => row.name !== 'Support development')) {
                assert.ok(page.contains(row.settingEl));
                assert.equal(footer.contains(row.settingEl), false);
                assert.equal(row.settingEl.contains(visibleButtons[0]), false);
            }
            if (declarative) {
                assert.equal(page.children.length, 2);
                assert.equal(page.children[0].contains(visibleButtons[0]), false);
                assert.match(footer.cls, /everyday-classical-music-support-group/);
            } else {
                assert.equal(footer.cls, 'everyday-classical-music-support');
            }
            assert.deepEqual(env.state.writes, []);
            assert.deepEqual(env.state.openedUrls, []);
        }
    });
}
