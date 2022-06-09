
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var EOL = {},
        EOF = {},
        QUOTE = 34,
        NEWLINE = 10,
        RETURN = 13;

    function objectConverter(columns) {
      return new Function("d", "return {" + columns.map(function(name, i) {
        return JSON.stringify(name) + ": d[" + i + "] || \"\"";
      }).join(",") + "}");
    }

    function customConverter(columns, f) {
      var object = objectConverter(columns);
      return function(row, i) {
        return f(object(row), i, columns);
      };
    }

    // Compute unique columns in order of discovery.
    function inferColumns(rows) {
      var columnSet = Object.create(null),
          columns = [];

      rows.forEach(function(row) {
        for (var column in row) {
          if (!(column in columnSet)) {
            columns.push(columnSet[column] = column);
          }
        }
      });

      return columns;
    }

    function pad(value, width) {
      var s = value + "", length = s.length;
      return length < width ? new Array(width - length + 1).join(0) + s : s;
    }

    function formatYear(year) {
      return year < 0 ? "-" + pad(-year, 6)
        : year > 9999 ? "+" + pad(year, 6)
        : pad(year, 4);
    }

    function formatDate(date) {
      var hours = date.getUTCHours(),
          minutes = date.getUTCMinutes(),
          seconds = date.getUTCSeconds(),
          milliseconds = date.getUTCMilliseconds();
      return isNaN(date) ? "Invalid Date"
          : formatYear(date.getUTCFullYear()) + "-" + pad(date.getUTCMonth() + 1, 2) + "-" + pad(date.getUTCDate(), 2)
          + (milliseconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "." + pad(milliseconds, 3) + "Z"
          : seconds ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2) + "Z"
          : minutes || hours ? "T" + pad(hours, 2) + ":" + pad(minutes, 2) + "Z"
          : "");
    }

    function dsv(delimiter) {
      var reFormat = new RegExp("[\"" + delimiter + "\n\r]"),
          DELIMITER = delimiter.charCodeAt(0);

      function parse(text, f) {
        var convert, columns, rows = parseRows(text, function(row, i) {
          if (convert) return convert(row, i - 1);
          columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
        });
        rows.columns = columns || [];
        return rows;
      }

      function parseRows(text, f) {
        var rows = [], // output rows
            N = text.length,
            I = 0, // current character index
            n = 0, // current line number
            t, // current token
            eof = N <= 0, // current token followed by EOF?
            eol = false; // current token followed by EOL?

        // Strip the trailing newline.
        if (text.charCodeAt(N - 1) === NEWLINE) --N;
        if (text.charCodeAt(N - 1) === RETURN) --N;

        function token() {
          if (eof) return EOF;
          if (eol) return eol = false, EOL;

          // Unescape quotes.
          var i, j = I, c;
          if (text.charCodeAt(j) === QUOTE) {
            while (I++ < N && text.charCodeAt(I) !== QUOTE || text.charCodeAt(++I) === QUOTE);
            if ((i = I) >= N) eof = true;
            else if ((c = text.charCodeAt(I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            return text.slice(j + 1, i - 1).replace(/""/g, "\"");
          }

          // Find next delimiter or newline.
          while (I < N) {
            if ((c = text.charCodeAt(i = I++)) === NEWLINE) eol = true;
            else if (c === RETURN) { eol = true; if (text.charCodeAt(I) === NEWLINE) ++I; }
            else if (c !== DELIMITER) continue;
            return text.slice(j, i);
          }

          // Return last token before EOF.
          return eof = true, text.slice(j, N);
        }

        while ((t = token()) !== EOF) {
          var row = [];
          while (t !== EOL && t !== EOF) row.push(t), t = token();
          if (f && (row = f(row, n++)) == null) continue;
          rows.push(row);
        }

        return rows;
      }

      function preformatBody(rows, columns) {
        return rows.map(function(row) {
          return columns.map(function(column) {
            return formatValue(row[column]);
          }).join(delimiter);
        });
      }

      function format(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return [columns.map(formatValue).join(delimiter)].concat(preformatBody(rows, columns)).join("\n");
      }

      function formatBody(rows, columns) {
        if (columns == null) columns = inferColumns(rows);
        return preformatBody(rows, columns).join("\n");
      }

      function formatRows(rows) {
        return rows.map(formatRow).join("\n");
      }

      function formatRow(row) {
        return row.map(formatValue).join(delimiter);
      }

      function formatValue(value) {
        return value == null ? ""
            : value instanceof Date ? formatDate(value)
            : reFormat.test(value += "") ? "\"" + value.replace(/"/g, "\"\"") + "\""
            : value;
      }

      return {
        parse: parse,
        parseRows: parseRows,
        format: format,
        formatBody: formatBody,
        formatRows: formatRows,
        formatRow: formatRow,
        formatValue: formatValue
      };
    }

    var csv = dsv(",");

    var csvParse = csv.parse;

    /* src/Spreadsheet.svelte generated by Svelte v3.48.0 */

    const { console: console_1$1 } = globals;
    const file = "src/Spreadsheet.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[41] = list[i];
    	return child_ctx;
    }

    // (126:4) {:else}
    function create_else_block_1(ctx) {
    	let tr;
    	let td;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td = element("td");
    			td.textContent = "No items found";
    			attr_dev(td, "colspan", "7");
    			attr_dev(td, "class", "svelte-79gxr7");
    			add_location(td, file, 126, 10, 3187);
    			add_location(tr, file, 126, 6, 3183);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(126:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (113:4) {#each filteredItems as item}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*item*/ ctx[41].ranking + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*item*/ ctx[41].object + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*item*/ ctx[41].description + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = /*item*/ ctx[41].width + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*item*/ ctx[41].x + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = /*item*/ ctx[41].height + "";
    	let t10;
    	let t11;
    	let td6;
    	let t12;
    	let t13_value = /*item*/ ctx[41].price + "";
    	let t13;
    	let t14;
    	let tr_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			td6 = element("td");
    			t12 = text("€ ");
    			t13 = text(t13_value);
    			t14 = space();
    			attr_dev(td0, "class", "svelte-79gxr7");
    			add_location(td0, file, 117, 8, 2942);
    			attr_dev(td1, "class", "svelte-79gxr7");
    			add_location(td1, file, 118, 8, 2974);
    			attr_dev(td2, "class", "svelte-79gxr7");
    			add_location(td2, file, 119, 8, 3005);
    			attr_dev(td3, "class", "svelte-79gxr7");
    			add_location(td3, file, 120, 8, 3041);
    			attr_dev(td4, "class", "svelte-79gxr7");
    			add_location(td4, file, 121, 8, 3071);
    			attr_dev(td5, "class", "svelte-79gxr7");
    			add_location(td5, file, 122, 8, 3097);
    			attr_dev(td6, "class", "svelte-79gxr7");
    			add_location(td6, file, 123, 8, 3128);

    			attr_dev(tr, "class", tr_class_value = "" + (null_to_empty(/*item*/ ctx[41] === /*activeItem*/ ctx[5]
    			? "active"
    			: "") + " svelte-79gxr7"));

    			add_location(tr, file, 113, 6, 2834);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    			append_dev(tr, td6);
    			append_dev(td6, t12);
    			append_dev(td6, t13);
    			append_dev(tr, t14);

    			if (!mounted) {
    				dispose = listen_dev(
    					tr,
    					"click",
    					function () {
    						if (is_function(/*makeActive*/ ctx[6](/*item*/ ctx[41]))) /*makeActive*/ ctx[6](/*item*/ ctx[41]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*filteredItems*/ 4 && t0_value !== (t0_value = /*item*/ ctx[41].ranking + "")) set_data_dev(t0, t0_value);
    			if (dirty[0] & /*filteredItems*/ 4 && t2_value !== (t2_value = /*item*/ ctx[41].object + "")) set_data_dev(t2, t2_value);
    			if (dirty[0] & /*filteredItems*/ 4 && t4_value !== (t4_value = /*item*/ ctx[41].description + "")) set_data_dev(t4, t4_value);
    			if (dirty[0] & /*filteredItems*/ 4 && t6_value !== (t6_value = /*item*/ ctx[41].width + "")) set_data_dev(t6, t6_value);
    			if (dirty[0] & /*filteredItems*/ 4 && t8_value !== (t8_value = /*item*/ ctx[41].x + "")) set_data_dev(t8, t8_value);
    			if (dirty[0] & /*filteredItems*/ 4 && t10_value !== (t10_value = /*item*/ ctx[41].height + "")) set_data_dev(t10, t10_value);
    			if (dirty[0] & /*filteredItems*/ 4 && t13_value !== (t13_value = /*item*/ ctx[41].price + "")) set_data_dev(t13, t13_value);

    			if (dirty[0] & /*filteredItems, activeItem*/ 36 && tr_class_value !== (tr_class_value = "" + (null_to_empty(/*item*/ ctx[41] === /*activeItem*/ ctx[5]
    			? "active"
    			: "") + " svelte-79gxr7"))) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(113:4) {#each filteredItems as item}",
    		ctx
    	});

    	return block;
    }

    // (133:4) {:else}
    function create_else_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/image/empty.jpg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-79gxr7");
    			add_location(img, file, 133, 6, 3366);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(133:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (131:4) {#if activeItem}
    function create_if_block_2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (!src_url_equal(img.src, img_src_value = "/image/" + /*activeItem*/ ctx[5].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-79gxr7");
    			add_location(img, file, 131, 6, 3301);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*activeItem*/ 32 && !src_url_equal(img.src, img_src_value = "/image/" + /*activeItem*/ ctx[5].image)) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(131:4) {#if activeItem}",
    		ctx
    	});

    	return block;
    }

    // (141:6) {#if coloursExpanded}
    function create_if_block_1(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let t7;
    	let button4;
    	let t9;
    	let button5;
    	let t11;
    	let button6;
    	let t13;
    	let button7;
    	let t15;
    	let button8;
    	let t17;
    	let button9;
    	let t19;
    	let button10;
    	let t21;
    	let button11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "black";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "blue";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "gold";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "green";
    			t7 = space();
    			button4 = element("button");
    			button4.textContent = "grey";
    			t9 = space();
    			button5 = element("button");
    			button5.textContent = "multi";
    			t11 = space();
    			button6 = element("button");
    			button6.textContent = "orange";
    			t13 = space();
    			button7 = element("button");
    			button7.textContent = "pink";
    			t15 = space();
    			button8 = element("button");
    			button8.textContent = "red";
    			t17 = space();
    			button9 = element("button");
    			button9.textContent = "silver";
    			t19 = space();
    			button10 = element("button");
    			button10.textContent = "white";
    			t21 = space();
    			button11 = element("button");
    			button11.textContent = "yellow";
    			attr_dev(button0, "class", "svelte-79gxr7");
    			toggle_class(button0, "selected", /*colourFilter*/ ctx[0] === "black");
    			add_location(button0, file, 142, 10, 3630);
    			attr_dev(button1, "class", "svelte-79gxr7");
    			toggle_class(button1, "selected", /*colourFilter*/ ctx[0] === "blue");
    			add_location(button1, file, 146, 10, 3781);
    			attr_dev(button2, "class", "svelte-79gxr7");
    			toggle_class(button2, "selected", /*colourFilter*/ ctx[0] === "gold");
    			add_location(button2, file, 150, 10, 3929);
    			attr_dev(button3, "class", "svelte-79gxr7");
    			toggle_class(button3, "selected", /*colourFilter*/ ctx[0] === "green");
    			add_location(button3, file, 154, 10, 4077);
    			attr_dev(button4, "class", "svelte-79gxr7");
    			toggle_class(button4, "selected", /*colourFilter*/ ctx[0] === "grey");
    			add_location(button4, file, 158, 10, 4228);
    			attr_dev(button5, "class", "svelte-79gxr7");
    			toggle_class(button5, "selected", /*colourFilter*/ ctx[0] === "multi");
    			add_location(button5, file, 162, 10, 4376);
    			attr_dev(button6, "class", "svelte-79gxr7");
    			toggle_class(button6, "selected", /*colourFilter*/ ctx[0] === "orange");
    			add_location(button6, file, 166, 10, 4527);
    			attr_dev(button7, "class", "svelte-79gxr7");
    			toggle_class(button7, "selected", /*colourFilter*/ ctx[0] === "pink");
    			add_location(button7, file, 170, 10, 4681);
    			attr_dev(button8, "class", "svelte-79gxr7");
    			toggle_class(button8, "selected", /*colourFilter*/ ctx[0] === "red");
    			add_location(button8, file, 174, 10, 4829);
    			attr_dev(button9, "class", "svelte-79gxr7");
    			toggle_class(button9, "selected", /*colourFilter*/ ctx[0] === "silver");
    			add_location(button9, file, 178, 10, 4974);
    			attr_dev(button10, "class", "svelte-79gxr7");
    			toggle_class(button10, "selected", /*colourFilter*/ ctx[0] === "white");
    			add_location(button10, file, 182, 10, 5128);
    			attr_dev(button11, "class", "svelte-79gxr7");
    			toggle_class(button11, "selected", /*colourFilter*/ ctx[0] === "yellow");
    			add_location(button11, file, 186, 10, 5279);
    			attr_dev(div, "class", "colours svelte-79gxr7");
    			add_location(div, file, 141, 8, 3598);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			append_dev(div, t5);
    			append_dev(div, button3);
    			append_dev(div, t7);
    			append_dev(div, button4);
    			append_dev(div, t9);
    			append_dev(div, button5);
    			append_dev(div, t11);
    			append_dev(div, button6);
    			append_dev(div, t13);
    			append_dev(div, button7);
    			append_dev(div, t15);
    			append_dev(div, button8);
    			append_dev(div, t17);
    			append_dev(div, button9);
    			append_dev(div, t19);
    			append_dev(div, button10);
    			append_dev(div, t21);
    			append_dev(div, button11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_7*/ ctx[23], false, false, false),
    					listen_dev(button1, "click", /*click_handler_8*/ ctx[24], false, false, false),
    					listen_dev(button2, "click", /*click_handler_9*/ ctx[25], false, false, false),
    					listen_dev(button3, "click", /*click_handler_10*/ ctx[26], false, false, false),
    					listen_dev(button4, "click", /*click_handler_11*/ ctx[27], false, false, false),
    					listen_dev(button5, "click", /*click_handler_12*/ ctx[28], false, false, false),
    					listen_dev(button6, "click", /*click_handler_13*/ ctx[29], false, false, false),
    					listen_dev(button7, "click", /*click_handler_14*/ ctx[30], false, false, false),
    					listen_dev(button8, "click", /*click_handler_15*/ ctx[31], false, false, false),
    					listen_dev(button9, "click", /*click_handler_16*/ ctx[32], false, false, false),
    					listen_dev(button10, "click", /*click_handler_17*/ ctx[33], false, false, false),
    					listen_dev(button11, "click", /*click_handler_18*/ ctx[34], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button0, "selected", /*colourFilter*/ ctx[0] === "black");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button1, "selected", /*colourFilter*/ ctx[0] === "blue");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button2, "selected", /*colourFilter*/ ctx[0] === "gold");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button3, "selected", /*colourFilter*/ ctx[0] === "green");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button4, "selected", /*colourFilter*/ ctx[0] === "grey");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button5, "selected", /*colourFilter*/ ctx[0] === "multi");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button6, "selected", /*colourFilter*/ ctx[0] === "orange");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button7, "selected", /*colourFilter*/ ctx[0] === "pink");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button8, "selected", /*colourFilter*/ ctx[0] === "red");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button9, "selected", /*colourFilter*/ ctx[0] === "silver");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button10, "selected", /*colourFilter*/ ctx[0] === "white");
    			}

    			if (dirty[0] & /*colourFilter*/ 1) {
    				toggle_class(button11, "selected", /*colourFilter*/ ctx[0] === "yellow");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(141:6) {#if coloursExpanded}",
    		ctx
    	});

    	return block;
    }

    // (196:6) {#if priceRangeExpanded}
    function create_if_block(ctx) {
    	let div;
    	let button0;
    	let t1;
    	let button1;
    	let t3;
    	let button2;
    	let t5;
    	let button3;
    	let t7;
    	let button4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			button0.textContent = "up to 10€";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "up to 50€";
    			t3 = space();
    			button2 = element("button");
    			button2.textContent = "up to 100€";
    			t5 = space();
    			button3 = element("button");
    			button3.textContent = "up to 500€";
    			t7 = space();
    			button4 = element("button");
    			button4.textContent = "up to 2500€";
    			attr_dev(button0, "class", "svelte-79gxr7");
    			toggle_class(button0, "selected", /*priceFilter*/ ctx[1] === 10);
    			add_location(button0, file, 197, 10, 5637);
    			attr_dev(button1, "class", "svelte-79gxr7");
    			toggle_class(button1, "selected", /*priceFilter*/ ctx[1] === 50);
    			add_location(button1, file, 202, 10, 5781);
    			attr_dev(button2, "class", "svelte-79gxr7");
    			toggle_class(button2, "selected", /*priceFilter*/ ctx[1] === 100);
    			add_location(button2, file, 207, 10, 5925);
    			attr_dev(button3, "class", "svelte-79gxr7");
    			toggle_class(button3, "selected", /*priceFilter*/ ctx[1] === 500);
    			add_location(button3, file, 212, 10, 6072);
    			attr_dev(button4, "class", "svelte-79gxr7");
    			toggle_class(button4, "selected", /*priceFilter*/ ctx[1] === 2500);
    			add_location(button4, file, 217, 10, 6219);
    			attr_dev(div, "class", "price-range svelte-79gxr7");
    			add_location(div, file, 196, 8, 5601);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, button2);
    			append_dev(div, t5);
    			append_dev(div, button3);
    			append_dev(div, t7);
    			append_dev(div, button4);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_19*/ ctx[35], false, false, false),
    					listen_dev(button1, "click", /*click_handler_20*/ ctx[36], false, false, false),
    					listen_dev(button2, "click", /*click_handler_21*/ ctx[37], false, false, false),
    					listen_dev(button3, "click", /*click_handler_22*/ ctx[38], false, false, false),
    					listen_dev(button4, "click", /*click_handler_23*/ ctx[39], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*priceFilter*/ 2) {
    				toggle_class(button0, "selected", /*priceFilter*/ ctx[1] === 10);
    			}

    			if (dirty[0] & /*priceFilter*/ 2) {
    				toggle_class(button1, "selected", /*priceFilter*/ ctx[1] === 50);
    			}

    			if (dirty[0] & /*priceFilter*/ 2) {
    				toggle_class(button2, "selected", /*priceFilter*/ ctx[1] === 100);
    			}

    			if (dirty[0] & /*priceFilter*/ 2) {
    				toggle_class(button3, "selected", /*priceFilter*/ ctx[1] === 500);
    			}

    			if (dirty[0] & /*priceFilter*/ 2) {
    				toggle_class(button4, "selected", /*priceFilter*/ ctx[1] === 2500);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(196:6) {#if priceRangeExpanded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let a0;
    	let t1;
    	let a1;
    	let t3;
    	let div3;
    	let table;
    	let tr;
    	let th0;
    	let t5;
    	let th1;
    	let t7;
    	let th2;
    	let t9;
    	let th3;
    	let t11;
    	let th4;
    	let t13;
    	let th5;
    	let t15;
    	let th6;
    	let t17;
    	let t18;
    	let div2;
    	let t19;
    	let div1;
    	let p;
    	let t21;
    	let button0;
    	let t22;
    	let t23_value = (/*coloursExpanded*/ ctx[3] ? "-" : "+") + "";
    	let t23;
    	let t24;
    	let t25;
    	let button1;
    	let t26;
    	let t27_value = (/*priceRangeExpanded*/ ctx[4] ? "-" : "+") + "";
    	let t27;
    	let t28;
    	let mounted;
    	let dispose;
    	let each_value = /*filteredItems*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	let each_1_else = null;

    	if (!each_value.length) {
    		each_1_else = create_else_block_1(ctx);
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*activeItem*/ ctx[5]) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*coloursExpanded*/ ctx[3] && create_if_block_1(ctx);
    	let if_block2 = /*priceRangeExpanded*/ ctx[4] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			a0 = element("a");
    			a0.textContent = "Everyday Data";
    			t1 = space();
    			a1 = element("a");
    			a1.textContent = "Thomas Boni - Lier";
    			t3 = space();
    			div3 = element("div");
    			table = element("table");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "nr";
    			t5 = space();
    			th1 = element("th");
    			th1.textContent = "object";
    			t7 = space();
    			th2 = element("th");
    			th2.textContent = "description";
    			t9 = space();
    			th3 = element("th");
    			th3.textContent = "height";
    			t11 = space();
    			th4 = element("th");
    			th4.textContent = "x";
    			t13 = space();
    			th5 = element("th");
    			th5.textContent = "width";
    			t15 = space();
    			th6 = element("th");
    			th6.textContent = "price";
    			t17 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (each_1_else) {
    				each_1_else.c();
    			}

    			t18 = space();
    			div2 = element("div");
    			if_block0.c();
    			t19 = space();
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "filter";
    			t21 = space();
    			button0 = element("button");
    			t22 = text("colours ");
    			t23 = text(t23_value);
    			t24 = space();
    			if (if_block1) if_block1.c();
    			t25 = space();
    			button1 = element("button");
    			t26 = text("price range ");
    			t27 = text(t27_value);
    			t28 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(a0, "href", "/thomas-spreadsheet");
    			attr_dev(a0, "class", "header-button svelte-79gxr7");
    			add_location(a0, file, 97, 2, 2198);
    			attr_dev(a1, "href", "/index");
    			attr_dev(a1, "class", "header-button svelte-79gxr7");
    			add_location(a1, file, 98, 2, 2270);
    			attr_dev(div0, "class", "header svelte-79gxr7");
    			add_location(div0, file, 96, 0, 2175);
    			attr_dev(th0, "class", "svelte-79gxr7");
    			add_location(th0, file, 104, 7, 2405);
    			attr_dev(th1, "class", "svelte-79gxr7");
    			add_location(th1, file, 105, 6, 2458);
    			attr_dev(th2, "class", "svelte-79gxr7");
    			add_location(th2, file, 106, 6, 2514);
    			attr_dev(th3, "class", "svelte-79gxr7");
    			add_location(th3, file, 107, 6, 2580);
    			attr_dev(th4, "class", "svelte-79gxr7");
    			add_location(th4, file, 108, 6, 2634);
    			attr_dev(th5, "class", "svelte-79gxr7");
    			add_location(th5, file, 109, 6, 2683);
    			attr_dev(th6, "class", "svelte-79gxr7");
    			add_location(th6, file, 110, 6, 2736);
    			add_location(tr, file, 103, 4, 2394);
    			attr_dev(table, "class", "svelte-79gxr7");
    			add_location(table, file, 102, 2, 2382);
    			add_location(p, file, 136, 6, 3446);
    			attr_dev(button0, "class", "svelte-79gxr7");
    			add_location(button0, file, 137, 6, 3466);
    			attr_dev(button1, "class", "svelte-79gxr7");
    			add_location(button1, file, 192, 6, 5456);
    			attr_dev(div1, "class", "filters svelte-79gxr7");
    			add_location(div1, file, 135, 4, 3418);
    			attr_dev(div2, "class", "sticky svelte-79gxr7");
    			add_location(div2, file, 129, 2, 3253);
    			attr_dev(div3, "class", "side-by-side svelte-79gxr7");
    			attr_dev(div3, "width", "100%");
    			add_location(div3, file, 101, 0, 2340);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, a0);
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, table);
    			append_dev(table, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t5);
    			append_dev(tr, th1);
    			append_dev(tr, t7);
    			append_dev(tr, th2);
    			append_dev(tr, t9);
    			append_dev(tr, th3);
    			append_dev(tr, t11);
    			append_dev(tr, th4);
    			append_dev(tr, t13);
    			append_dev(tr, th5);
    			append_dev(tr, t15);
    			append_dev(tr, th6);
    			append_dev(table, t17);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			if (each_1_else) {
    				each_1_else.m(table, null);
    			}

    			append_dev(div3, t18);
    			append_dev(div3, div2);
    			if_block0.m(div2, null);
    			append_dev(div2, t19);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(div1, t21);
    			append_dev(div1, button0);
    			append_dev(button0, t22);
    			append_dev(button0, t23);
    			append_dev(div1, t24);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t25);
    			append_dev(div1, button1);
    			append_dev(button1, t26);
    			append_dev(button1, t27);
    			append_dev(div1, t28);
    			if (if_block2) if_block2.m(div1, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(th0, "click", /*click_handler*/ ctx[16], false, false, false),
    					listen_dev(th1, "click", /*click_handler_1*/ ctx[17], false, false, false),
    					listen_dev(th2, "click", /*click_handler_2*/ ctx[18], false, false, false),
    					listen_dev(th3, "click", /*click_handler_3*/ ctx[19], false, false, false),
    					listen_dev(th4, "click", /*click_handler_4*/ ctx[20], false, false, false),
    					listen_dev(th5, "click", /*click_handler_5*/ ctx[21], false, false, false),
    					listen_dev(th6, "click", /*click_handler_6*/ ctx[22], false, false, false),
    					listen_dev(button0, "click", /*toggleColours*/ ctx[7], false, false, false),
    					listen_dev(button1, "click", /*togglePriceRange*/ ctx[8], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*filteredItems, activeItem, makeActive*/ 100) {
    				each_value = /*filteredItems*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;

    				if (!each_value.length && each_1_else) {
    					each_1_else.p(ctx, dirty);
    				} else if (!each_value.length) {
    					each_1_else = create_else_block_1(ctx);
    					each_1_else.c();
    					each_1_else.m(table, null);
    				} else if (each_1_else) {
    					each_1_else.d(1);
    					each_1_else = null;
    				}
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div2, t19);
    				}
    			}

    			if (dirty[0] & /*coloursExpanded*/ 8 && t23_value !== (t23_value = (/*coloursExpanded*/ ctx[3] ? "-" : "+") + "")) set_data_dev(t23, t23_value);

    			if (/*coloursExpanded*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div1, t25);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty[0] & /*priceRangeExpanded*/ 16 && t27_value !== (t27_value = (/*priceRangeExpanded*/ ctx[4] ? "-" : "+") + "")) set_data_dev(t27, t27_value);

    			if (/*priceRangeExpanded*/ ctx[4]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			if (each_1_else) each_1_else.d();
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let filteredItems;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Spreadsheet', slots, []);
    	let { name } = $$props;
    	let coloursExpanded = false;
    	let priceRangeExpanded = false;
    	let colourFilter = null;
    	let priceFilter = null;
    	let sortKey = "ranking";
    	let sortOrder = "ascending";
    	let items = [];
    	let activeItem = null;

    	async function loadSpreadsheet() {
    		const res = await fetch(`/data/${name}.csv`);
    		const text = await res.text();
    		$$invalidate(15, items = csvParse(text));

    		// items.forEach((item) => (item.price = parseFloat(item.price)));
    		console.log(items);

    		$$invalidate(5, activeItem = items[0]);
    	}

    	function makeActive(item) {
    		$$invalidate(5, activeItem = item);
    	} // console.log(e);

    	function toggleColours() {
    		$$invalidate(3, coloursExpanded = !coloursExpanded);
    	}

    	function togglePriceRange() {
    		$$invalidate(4, priceRangeExpanded = !priceRangeExpanded);
    	}

    	function filterByColour(colour) {
    		if (colourFilter === colour) {
    			$$invalidate(0, colourFilter = null);
    		} else {
    			$$invalidate(0, colourFilter = colour);
    		}

    		$$invalidate(5, activeItem = null);
    	}

    	function filterByPrice(price) {
    		if (priceFilter === price) {
    			$$invalidate(1, priceFilter = null);
    		} else {
    			$$invalidate(1, priceFilter = price);
    		}

    		$$invalidate(5, activeItem = null);
    	}

    	function sortBy(key) {
    		if (sortKey === key) {
    			// Change sort order
    			if (sortOrder === "ascending") {
    				$$invalidate(14, sortOrder = "descending");
    			} else {
    				$$invalidate(14, sortOrder = "ascending");
    			}
    		} else {
    			$$invalidate(14, sortOrder = "ascending");
    			$$invalidate(13, sortKey = key);
    		}
    	}

    	loadSpreadsheet();
    	const writable_props = ['name'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Spreadsheet> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => sortBy("ranking");
    	const click_handler_1 = () => sortBy("object");
    	const click_handler_2 = () => sortBy("description");
    	const click_handler_3 = () => sortBy("area");
    	const click_handler_4 = () => sortBy("area");
    	const click_handler_5 = () => sortBy("area");
    	const click_handler_6 = () => sortBy("price");
    	const click_handler_7 = () => filterByColour("black");
    	const click_handler_8 = () => filterByColour("blue");
    	const click_handler_9 = () => filterByColour("gold");
    	const click_handler_10 = () => filterByColour("green");
    	const click_handler_11 = () => filterByColour("grey");
    	const click_handler_12 = () => filterByColour("multi");
    	const click_handler_13 = () => filterByColour("orange");
    	const click_handler_14 = () => filterByColour("pink");
    	const click_handler_15 = () => filterByColour("red");
    	const click_handler_16 = () => filterByColour("silver");
    	const click_handler_17 = () => filterByColour("white");
    	const click_handler_18 = () => filterByColour("yellow");
    	const click_handler_19 = () => filterByPrice(10);
    	const click_handler_20 = () => filterByPrice(50);
    	const click_handler_21 = () => filterByPrice(100);
    	const click_handler_22 = () => filterByPrice(500);
    	const click_handler_23 = () => filterByPrice(2500);

    	$$self.$$set = $$props => {
    		if ('name' in $$props) $$invalidate(12, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({
    		csvParse,
    		name,
    		coloursExpanded,
    		priceRangeExpanded,
    		colourFilter,
    		priceFilter,
    		sortKey,
    		sortOrder,
    		items,
    		activeItem,
    		loadSpreadsheet,
    		makeActive,
    		toggleColours,
    		togglePriceRange,
    		filterByColour,
    		filterByPrice,
    		sortBy,
    		filteredItems
    	});

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(12, name = $$props.name);
    		if ('coloursExpanded' in $$props) $$invalidate(3, coloursExpanded = $$props.coloursExpanded);
    		if ('priceRangeExpanded' in $$props) $$invalidate(4, priceRangeExpanded = $$props.priceRangeExpanded);
    		if ('colourFilter' in $$props) $$invalidate(0, colourFilter = $$props.colourFilter);
    		if ('priceFilter' in $$props) $$invalidate(1, priceFilter = $$props.priceFilter);
    		if ('sortKey' in $$props) $$invalidate(13, sortKey = $$props.sortKey);
    		if ('sortOrder' in $$props) $$invalidate(14, sortOrder = $$props.sortOrder);
    		if ('items' in $$props) $$invalidate(15, items = $$props.items);
    		if ('activeItem' in $$props) $$invalidate(5, activeItem = $$props.activeItem);
    		if ('filteredItems' in $$props) $$invalidate(2, filteredItems = $$props.filteredItems);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*items, colourFilter, priceFilter, sortOrder, sortKey*/ 57347) {
    			$$invalidate(2, filteredItems = items.filter(item => !colourFilter || item.colour === colourFilter).filter(item => !priceFilter || item.price <= priceFilter).sort((itemA, itemB) => {
    				if (sortOrder === "descending") {
    					[itemB, itemA] = [itemA, itemB];
    				}

    				if (sortKey === "object" || sortKey === "description") {
    					return itemA[sortKey].localeCompare(itemB[sortKey]);
    				} else if (sortKey === "area") {
    					return parseInt(itemA.width) * parseInt(itemA.height) - parseInt(itemB.width) * parseInt(itemB.height);
    				} else {
    					return itemA[sortKey] - itemB[sortKey];
    				}
    			}));
    		}

    		if ($$self.$$.dirty[0] & /*filteredItems*/ 4) {
    			{
    				$$invalidate(5, activeItem = filteredItems[0]);
    			}
    		}
    	};

    	return [
    		colourFilter,
    		priceFilter,
    		filteredItems,
    		coloursExpanded,
    		priceRangeExpanded,
    		activeItem,
    		makeActive,
    		toggleColours,
    		togglePriceRange,
    		filterByColour,
    		filterByPrice,
    		sortBy,
    		name,
    		sortKey,
    		sortOrder,
    		items,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10,
    		click_handler_11,
    		click_handler_12,
    		click_handler_13,
    		click_handler_14,
    		click_handler_15,
    		click_handler_16,
    		click_handler_17,
    		click_handler_18,
    		click_handler_19,
    		click_handler_20,
    		click_handler_21,
    		click_handler_22,
    		click_handler_23
    	];
    }

    class Spreadsheet extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { name: 12 }, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Spreadsheet",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[12] === undefined && !('name' in props)) {
    			console_1$1.warn("<Spreadsheet> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Spreadsheet>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Spreadsheet>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */

    const { console: console_1 } = globals;

    function create_fragment(ctx) {
    	let spreadsheet;
    	let current;

    	spreadsheet = new Spreadsheet({
    			props: { name: /*name*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(spreadsheet.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(spreadsheet, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(spreadsheet.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(spreadsheet.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(spreadsheet, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let name = document.location.pathname.substring(1);
    	console.log(name);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Spreadsheet, name });

    	$$self.$inject_state = $$props => {
    		if ('name' in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {},
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
