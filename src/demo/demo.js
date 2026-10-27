(() => {
	'use strict';

	/** Page copy for both UI languages; keys match the data-i18n attributes. */
	const messages = {
		en: {
			'meta.title': 'Bazaar Graph — SiYuan package chart builder',
			'meta.description': 'Build an embeddable SVG trend chart for any SiYuan bazaar package.',
			'skip': 'Skip to chart builder',
			'brand.tag': 'SiYuan chart builder',
			'aria.site': 'Site',
			'aria.pageTheme': 'Page theme',
			'aria.pageLanguage': 'Page language',
			'pageTheme.auto': 'Follow system',
			'pageTheme.light': 'Light',
			'pageTheme.dark': 'Dark',
			'aria.copyUrl': 'Copy chart URL',
			'aria.copyHtml': 'Copy HTML image tag',
			'aria.copyMarkdown': 'Copy Markdown for README',
			'nav.source': 'Source',
			'hero.eyebrow': 'SVG chart builder',
			'hero.title1': 'Package history,',
			'hero.title2': 'ready to embed.',
			'hero.lede': 'Turn any SiYuan bazaar package into a live trend chart. Choose the metrics, range, and finish, then copy the code into your README.',
			'hero.note': 'Every chart is one static SVG you can paste straight into a README, with no scripts or keys.',
			'builder.title': 'Build the chart',
			'builder.note': 'The sample parameters are a good starting point.',
			'field.repo': 'Repository',
			'field.repoHint': 'owner/repo or a full GitHub URL',
			'field.repoError': 'Use a GitHub repository in owner/repo format.',
			'field.metrics': 'Metrics',
			'field.metricsHint': 'Choose one or more. Downloads use the left axis; ratings use the right.',
			'metric.downloads': 'Downloads',
			'metric.rating': 'Rating',
			'metric.ratings': 'Ratings',
			'metrics.required': 'Keep at least one metric selected.',
			'field.range': 'Time range',
			'field.rangeHint': 'UTC dates. Use Custom to set exact boundaries.',
			'range.30d': '30 days',
			'range.90d': '90 days',
			'range.1y': '1 year',
			'range.all': 'All time',
			'range.custom': 'Custom',
			'field.start': 'Start',
			'field.end': 'End',
			'field.dateError': 'Start date must be on or before end date.',
			'field.appearance': 'Appearance',
			'field.appearanceHint': 'Chart theme, language, and output size.',
			'field.theme': 'Theme',
			'theme.auto': 'Auto',
			'theme.light': 'Light',
			'theme.dark': 'Dark',
			'field.language': 'Chart language',
			'lang.auto': 'Auto (browser)',
			'lang.en': 'English',
			'lang.zh': '中文',
			'field.size': 'Size',
			'field.width': 'Width',
			'field.height': 'Height',
			'field.details': 'Details',
			'field.detailsHint': 'Optional labels and chart marks. Area fill applies to downloads.',
			'toggle.title': 'Title',
			'toggle.legend': 'Legend',
			'toggle.grid': 'Grid',
			'toggle.area': 'Area fill',
			'preview.title': 'Live preview',
			'preview.rendering': 'Rendering',
			'preview.ready': 'Ready',
			'preview.waitingState': 'Waiting',
			'preview.errorState': 'Failed',
			'preview.staleState': 'Stale data',
			'preview.open': 'Open SVG',
			'preview.waiting': 'Complete the repository to render a chart.',
			'preview.dates': 'Fix the dates to render a chart.',
			'preview.error': 'The chart could not be loaded.',
			'preview.caption': "The preview and snippets use this site's chart endpoint.",
			'embed.title': 'Embed code',
			'embed.note': 'Copy the chart URL or use a snippet. Chart style follows your choice in the builder.',
			'snippet.url': 'Link',
			'snippet.html': 'HTML',
			'snippet.markdown': 'Markdown',
			'action.copied': 'Copied',
			'action.copyFailed': 'Copy failed',
			'alt.chart': 'SiYuan bazaar package trends for {repo}',
			'footer.note': "Charts are cached for 30 minutes and refresh behind GitHub's image proxy.",
			'footer.data': 'Data from',
			'footer.source': 'GitHub repository',
		},
		zh: {
			'meta.title': 'Bazaar Graph — 思源集市包图表生成器',
			'meta.description': '为任意思源集市包生成可嵌入的 SVG 趋势图。',
			'skip': '跳到图表生成器',
			'brand.tag': '思源图表生成器',
			'aria.site': '站点导航',
			'aria.pageTheme': '页面主题',
			'aria.pageLanguage': '页面语言',
			'pageTheme.auto': '跟随系统',
			'pageTheme.light': '浅色',
			'pageTheme.dark': '深色',
			'aria.copyUrl': '复制图表链接',
			'aria.copyHtml': '复制 HTML 图片标签',
			'aria.copyMarkdown': '复制 README Markdown',
			'nav.source': '源码',
			'hero.eyebrow': 'SVG 图表生成器',
			'hero.title1': '把集市包的历史，',
			'hero.title2': '做成可嵌入的图。',
			'hero.lede': '为任意思源集市包生成实时趋势图。选择指标、时间范围和样式，再把代码复制到 README。',
			'hero.note': '每张图就是一份静态 SVG，粘进 README 即可显示，无需脚本或密钥。',
			'builder.title': '生成图表',
			'builder.note': '默认参数是一个不错的起点。',
			'field.repo': '仓库',
			'field.repoHint': 'owner/repo 或完整 GitHub 链接',
			'field.repoError': '请使用 owner/repo 格式的 GitHub 仓库。',
			'field.metrics': '指标',
			'field.metricsHint': '可多选。下载量使用左轴，评分使用右轴。',
			'metric.downloads': '下载量',
			'metric.rating': '评分',
			'metric.ratings': '评分数',
			'metrics.required': '请至少保留一个指标。',
			'field.range': '时间范围',
			'field.rangeHint': '按 UTC 日期计算，可选自定义起止时间。',
			'range.30d': '30 天',
			'range.90d': '90 天',
			'range.1y': '1 年',
			'range.all': '全部',
			'range.custom': '自定义',
			'field.start': '开始',
			'field.end': '结束',
			'field.dateError': '开始日期不能晚于结束日期。',
			'field.appearance': '外观',
			'field.appearanceHint': '设置图表主题、语言和输出尺寸。',
			'field.theme': '主题',
			'theme.auto': '跟随系统',
			'theme.light': '浅色',
			'theme.dark': '深色',
			'field.language': '图表语言',
			'lang.auto': '跟随浏览器',
			'lang.en': 'English',
			'lang.zh': '中文',
			'field.size': '尺寸',
			'field.width': '宽度',
			'field.height': '高度',
			'field.details': '细节',
			'field.detailsHint': '可选标题、图例与图表标记。面积填充仅作用于下载量。',
			'toggle.title': '标题',
			'toggle.legend': '图例',
			'toggle.grid': '网格',
			'toggle.area': '面积填充',
			'preview.title': '实时预览',
			'preview.rendering': '渲染中',
			'preview.ready': '已就绪',
			'preview.waitingState': '等待输入',
			'preview.errorState': '加载失败',
			'preview.staleState': '陈旧数据',
			'preview.open': '打开 SVG',
			'preview.waiting': '填写仓库后即可渲染图表。',
			'preview.dates': '请先修正日期范围。',
			'preview.error': '图表加载失败。',
			'preview.caption': '预览与代码使用本站的图表接口。',
			'embed.title': '嵌入代码',
			'embed.note': '可以直接复制图表链接，或使用下方片段。图表样式跟随上方的设置。',
			'snippet.url': 'Link',
			'snippet.html': 'HTML',
			'snippet.markdown': 'Markdown',
			'action.copied': '已复制',
			'action.copyFailed': '复制失败',
			'alt.chart': '{repo} 的思源集市包趋势',
			'footer.note': '图表缓存 30 分钟，并通过 GitHub 图片代理自动刷新。',
			'footer.data': '数据来自',
			'footer.source': 'GitHub 仓库',
		},
	};

	/** Page theme and language, resolved before the first paint where possible. */
	const THEME_STORAGE_KEY = 'siyuan-bazaar-page-theme';
	const PAGE_THEME_MODES = ['auto', 'light', 'dark'];
	const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
	const form = document.querySelector('#chart-form');
	// The script is inlined into every page build; leave early if the form is absent.
	if (!form) return;

	/** Element handles are resolved once; the builder markup is static. */
	const repoInput = document.querySelector('#repo');
	const repoError = document.querySelector('#repo-error');
	const dateError = document.querySelector('#date-error');
	const startInput = document.querySelector('#start');
	const endInput = document.querySelector('#end');
	const customDates = document.querySelector('#custom-dates');
	const langSelect = document.querySelector('#lang');
	const widthInput = document.querySelector('#width');
	const heightInput = document.querySelector('#height');
	const chartPreview = document.querySelector('#chart-preview');
	const previewEmpty = document.querySelector('#preview-empty');
	const plotStage = document.querySelector('#plot-stage');
	const plotEndpoint = document.querySelector('#plot-endpoint');
	const openChart = document.querySelector('#open-chart');
	const renderState = document.querySelector('#render-state');
	const renderLabel = document.querySelector('#render-label');
	const liveStatus = document.querySelector('#live-status');
	const pageLanguageButtons = [...document.querySelectorAll('[data-page-lang]')];
	const pageThemeButtons = [...document.querySelectorAll('button[data-page-theme-mode]')];
	const pageThemeMeta = document.querySelector('meta[name="theme-color"]');
	const metricInputs = [...form.querySelectorAll('input[name="metrics"]')];
	const rangeInputs = [...form.querySelectorAll('input[name="range"]')];
	const themeInputs = [...form.querySelectorAll('input[name="theme"]')];
	const copyButtons = [...document.querySelectorAll('[data-copy-key]')];
	const codeElements = {
		url: document.querySelector('#code-url'),
		html: document.querySelector('#code-html'),
		markdown: document.querySelector('#code-markdown'),
	};
	const metricOrder = ['downloads', 'rating', 'ratings'];
	const defaults = { width: 800, height: 400 };
	const urlDefaults = { width: 800, height: 400 };

	/** Mutable UI state: language, theme, debounce timer and the in-flight preview request. */
	let pageLang = detectPageLanguage();
	let pageThemeMode = PAGE_THEME_MODES.includes(document.documentElement.dataset.pageThemeMode) ? document.documentElement.dataset.pageThemeMode : 'auto';
	let repoTouched = false;
	let updateTimer;
	let previewController;
	let previewObjectUrl;
	let previewRequest = 0;
	let metricsNoticeShown = false;

	/** Sliding-thumb switch groups; refreshed whenever a selection or layout changes. */
	const slidables = [];

	/** Re-align every thumb; safe to call before any group is set up. */
	function refreshSlidables() {
		for (const slidable of slidables) {
			try {
				slidable?.refresh();
			} catch {}
		}
	}

	/** The radio inside a segmented label, or null when the markup is incomplete. */
	function segmentInput(label) {
		try {
			return typeof label?.querySelector === 'function' ? label.querySelector('input') : null;
		} catch {
			return null;
		}
	}

	/**
	 * Give one switch group a sliding thumb and drag-to-switch behaviour.
	 *
	 * All four groups share this helper: CSS paints the thumb, this code only
	 * measures the selected item and positions the thumb over it. Dragging moves
	 * the thumb with the pointer (transition disabled); releasing snaps to the
	 * nearest item and activates it through the group's own callback, so click,
	 * keyboard and radio/button semantics stay exactly as they were. Every DOM
	 * access is guarded because the script also runs against minimal test stubs.
	 */
	function makeSlidable(group, items, { isSelected, activate }) {
		if (!group || typeof group.addEventListener !== 'function' || !Array.isArray(items) || items.length < 2) return null;
		if (typeof document.createElement !== 'function') return null;
		let thumb;
		try {
			thumb = document.createElement('span');
		} catch {
			return null;
		}
		if (!thumb) return null;
		thumb.className = 'slidable-thumb';
		try {
			thumb.setAttribute('aria-hidden', 'true');
		} catch {}
		if (!thumb.style) thumb.style = {};
		try {
			if (typeof group.append === 'function') group.append(thumb);
			else if (typeof group.appendChild === 'function') group.appendChild(thumb);
			else return null;
		} catch {
			return null;
		}
		try {
			group.classList?.add('has-slidable');
		} catch {}

		const selectedIndex = () => items.findIndex((item) => {
			try {
				return Boolean(isSelected(item));
			} catch {
				return false;
			}
		});

		function refresh() {
			const index = selectedIndex();
			const item = index >= 0 ? items[index] : null;
			const width = item?.offsetWidth || 0;
			const height = item?.offsetHeight || 0;
			if (!item || !width || !height) {
				thumb.style.opacity = '0';
				return;
			}
			thumb.style.opacity = '1';
			thumb.style.width = `${width}px`;
			thumb.style.height = `${height}px`;
			thumb.style.transform = `translate(${item.offsetLeft || 0}px, ${item.offsetTop || 0}px)`;
		}

		/** Index of the item whose centre is closest to a group-relative x. */
		function nearestIndex(x) {
			let best = 0;
			let bestDistance = Infinity;
			items.forEach((item, index) => {
				const centre = (item.offsetLeft || 0) + (item.offsetWidth || 0) / 2;
				const distance = Math.abs(centre - x);
				if (distance < bestDistance) {
					bestDistance = distance;
					best = index;
				}
			});
			return best;
		}

		/** Pointer x relative to the group's padding box (the offsetLeft origin). */
		function pointerX(event) {
			if (typeof event.clientX !== 'number' || typeof group.getBoundingClientRect !== 'function') return null;
			const rect = group.getBoundingClientRect();
			if (!rect) return null;
			return event.clientX - rect.left - (group.clientLeft || 0);
		}

		let drag = null;
		let suppressClick = false;
		let suppressTimer;

		group.addEventListener('pointerdown', (event) => {
			if (event.isPrimary === false) return;
			if (event.pointerType === 'mouse' && typeof event.button === 'number' && event.button !== 0) return;
			const x = pointerX(event);
			const index = selectedIndex();
			if (x === null || index < 0) return;
			const item = items[index];
			drag = {
				id: event.pointerId,
				startX: x,
				grab: x - (item.offsetLeft || 0),
				top: item.offsetTop || 0,
				width: item.offsetWidth || 0,
				candidate: index,
				moved: false,
			};
			try {
				group.setPointerCapture?.(event.pointerId);
			} catch {}
		});

		group.addEventListener('pointermove', (event) => {
			if (!drag || (drag.id !== undefined && event.pointerId !== drag.id)) return;
			const x = pointerX(event);
			if (x === null) return;
			if (Math.abs(x - drag.startX) > 3) drag.moved = true;
			if (!drag.moved) return;
			try {
				group.classList?.add('is-dragging');
			} catch {}
			const first = items[0];
			const last = items[items.length - 1];
			const min = first.offsetLeft || 0;
			const max = (last.offsetLeft || 0) + (last.offsetWidth || 0) - drag.width;
			const left = Math.min(max, Math.max(min, x - drag.grab));
			thumb.style.transform = `translate(${left}px, ${drag.top}px)`;
			drag.candidate = nearestIndex(x);
		});

		const endDrag = (event) => {
			if (!drag || (drag.id !== undefined && event.pointerId !== drag.id)) return;
			const { candidate, moved } = drag;
			drag = null;
			try {
				group.classList?.remove('is-dragging');
			} catch {}
			if (moved) {
				// The release may still produce a native click on the item under the
				// pointer; swallow that one trusted click (the programmatic
				// activation below is untrusted and passes through), and clear the
				// flag again shortly in case no native click follows.
				suppressClick = true;
				clearTimeout(suppressTimer);
				suppressTimer = setTimeout(() => {
					suppressClick = false;
				}, 350);
				try {
					activate(items[candidate], candidate);
				} catch {}
			}
			refresh();
		};
		group.addEventListener('pointerup', endDrag);
		group.addEventListener('pointercancel', endDrag);

		// Capture phase so a swallowed click never reaches the item handlers.
		group.addEventListener('click', (event) => {
			if (suppressClick && event.isTrusted) {
				suppressClick = false;
				clearTimeout(suppressTimer);
				event.preventDefault();
				event.stopPropagation();
			}
		}, true);

		// Plain clicks and keyboard-driven changes re-align the thumb as well.
		group.addEventListener('click', () => refresh());
		group.addEventListener('change', () => refresh());

		refresh();
		return { refresh };
	}

	/** Activate a segmented label: check its radio and let the form logic run. */
	function activateSegment(label) {
		const input = segmentInput(label);
		if (!input || input.checked) return;
		input.checked = true;
		let event = null;
		try {
			event = new Event('change', { bubbles: true });
		} catch {}
		try {
			if (event && typeof input.dispatchEvent === 'function') input.dispatchEvent(event);
			else if (event && form && typeof form.dispatchEvent === 'function') form.dispatchEvent(event);
		} catch {}
	}

	/** Wire the four switch groups (top-bar theme/language, range/theme segments). */
	function setupSlidables() {
		const groupFor = (buttons, selector) => {
			if (buttons[0]?.parentElement) return buttons[0].parentElement;
			try {
				return typeof document.querySelector === 'function' ? document.querySelector(selector) : null;
			} catch {
				return null;
			}
		};
		const themeGroup = groupFor(pageThemeButtons, '.page-theme-switch');
		const languageGroup = groupFor(pageLanguageButtons, '.language-switch');
		const themeSlidable = makeSlidable(themeGroup, pageThemeButtons, {
			isSelected: (button) => button.getAttribute?.('aria-pressed') === 'true' || button.dataset?.pageThemeMode === pageThemeMode,
			activate: (button) => {
				if (typeof button.click === 'function') button.click();
				else applyPageTheme(button.dataset?.pageThemeMode, true);
			},
		});
		if (themeSlidable) slidables.push(themeSlidable);
		const languageSlidable = makeSlidable(languageGroup, pageLanguageButtons, {
			isSelected: (button) => button.getAttribute?.('aria-pressed') === 'true' || button.dataset?.pageLang === pageLang,
			activate: (button) => {
				if (typeof button.click === 'function') button.click();
				else if (button.dataset?.pageLang && button.dataset.pageLang !== pageLang) applyLanguage(button.dataset.pageLang);
			},
		});
		if (languageSlidable) slidables.push(languageSlidable);

		let segmentedGroups = [];
		try {
			if (typeof document.querySelectorAll === 'function') segmentedGroups = [...document.querySelectorAll('.segmented')];
		} catch {}
		for (const group of segmentedGroups) {
			let labels = [];
			try {
				labels = typeof group.querySelectorAll === 'function' ? [...group.querySelectorAll('.segment')] : [];
			} catch {}
			const slidable = makeSlidable(group, labels, {
				isSelected: (label) => Boolean(segmentInput(label)?.checked),
				activate: (label) => {
					// Clear the rest of the group explicitly instead of relying on
					// the browser's radio-group bookkeeping alone.
					for (const other of labels) {
						if (other === label) continue;
						const otherInput = segmentInput(other);
						if (otherInput) otherInput.checked = false;
					}
					activateSegment(label);
				},
			});
			if (slidable) slidables.push(slidable);
		}
		refreshSlidables();
	}

	/** Pick Chinese when the browser's first language preference is Chinese. */
	function detectPageLanguage() {
		const preferred = navigator.languages?.[0] || navigator.language || 'en';
		return /^zh\b/i.test(preferred) ? 'zh' : 'en';
	}

	/** Apply a theme to the document and optionally persist the choice. */
	function applyPageTheme(mode, persist = false) {
		pageThemeMode = PAGE_THEME_MODES.includes(mode) ? mode : 'auto';
		const resolved = pageThemeMode === 'auto' ? (systemDark.matches ? 'dark' : 'light') : pageThemeMode;
		document.documentElement.dataset.pageThemeMode = pageThemeMode;
		document.documentElement.dataset.colorMode = resolved;
		pageThemeMeta?.setAttribute('content', resolved === 'dark' ? '#080808' : '#edf2ee');
		for (const button of pageThemeButtons) {
			button.setAttribute('aria-pressed', String(button.dataset.pageThemeMode === pageThemeMode));
		}
		if (persist) {
			try {
				localStorage.setItem(THEME_STORAGE_KEY, pageThemeMode);
			} catch {}
		}
		refreshSlidables();
	}

	/** Look up a message and substitute its {placeholders}. */
	function t(key, values) {
		let message = messages[pageLang][key] ?? messages.en[key] ?? key;
		if (values) {
			for (const [name, value] of Object.entries(values)) {
				message = message.replaceAll(`{${name}}`, String(value));
			}
		}
		return message;
	}

	/** Accept owner/repo, a GitHub URL or an ssh remote and normalise it. */
	function normalizeRepo(raw) {
		let value = raw.trim();
		if (!value) return null;
		value = value.replace(/^git@github\.com:/i, '');
		value = value.replace(/^https?:\/\/(?:www\.)?github\.com\//i, '');
		value = value.replace(/^github\.com\//i, '');
		value = value.split(/[?#]/, 1)[0].replace(/\/+$/, '').replace(/\.git$/i, '');
		const match = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9_.-]{1,100})$/.exec(value);
		return match ? `${match[1]}/${match[2]}` : null;
	}

	/** Return the checked metrics in a fixed order so the legend never jumps. */
	function selectedMetrics() {
		const selected = new Set(metricInputs.filter((input) => input.checked).map((input) => input.value));
		return metricOrder.filter((metric) => selected.has(metric));
	}

	/** Read the checked value of a radio group. */
	function selectedValue(inputs) {
		return inputs.find((input) => input.checked)?.value;
	}

	/** Round and clamp a number input into its allowed range. */
	function clampInteger(input, fallback, min, max) {
		const value = Number(input.value);
		if (!Number.isFinite(value)) return fallback;
		return Math.min(max, Math.max(min, Math.round(value)));
	}

	/** ISO date N days ago in UTC, used to seed the custom range. */
	function utcDate(daysAgo = 0) {
		const date = new Date();
		date.setUTCDate(date.getUTCDate() - daysAgo);
		return date.toISOString().slice(0, 10);
	}

	/** Show the date fields only for the custom range and seed them once. */
	function syncCustomDates() {
		const custom = selectedValue(rangeInputs) === 'custom';
		customDates.hidden = !custom;
		if (custom && !startInput.value && !endInput.value) {
			startInput.value = utcDate(90);
			endInput.value = utcDate();
		}
		if (!custom) {
			dateError.hidden = true;
			dateError.textContent = '';
		}
	}

	/** Reflect the preview state in the status pill and its label. */
	function setRenderState(kind) {
		renderState.classList.toggle('is-ready', kind === 'ready');
		renderState.classList.toggle('is-error', kind === 'error');
		renderState.classList.toggle('is-loading', kind === 'loading');
		const labels = {
			loading: 'preview.rendering',
			ready: 'preview.ready',
			waiting: 'preview.waitingState',
			error: 'preview.errorState',
			stale: 'preview.staleState',
		};
		renderLabel.textContent = t(labels[kind]);
	}

	/** Mark the preview as busy while a chart request is in flight. */
	function setLoading() {
		plotStage.classList.add('is-loading');
		plotStage.setAttribute('aria-busy', 'true');
		setRenderState('loading');
	}

	/** Drop the preview and its object URL, then show the error state. */
	function setPreviewError() {
		previewController?.abort();
		if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
		previewObjectUrl = undefined;
		plotStage.classList.remove('is-loading');
		plotStage.setAttribute('aria-busy', 'false');
		chartPreview.hidden = true;
		chartPreview.removeAttribute('src');
		previewEmpty.textContent = t('preview.error');
		previewEmpty.hidden = false;
		setRenderState('error');
	}

	/** Clear the preview and the snippets until the form yields a valid URL. */
	function setEmpty(message) {
		previewController?.abort();
		if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
		previewObjectUrl = undefined;
		plotStage.classList.remove('is-loading');
		plotStage.setAttribute('aria-busy', 'false');
		chartPreview.hidden = true;
		chartPreview.removeAttribute('src');
		previewEmpty.textContent = message;
		previewEmpty.hidden = false;
		openChart.removeAttribute('href');
		openChart.setAttribute('aria-disabled', 'true');
		plotEndpoint.textContent = '/api/chart/{owner}/{repo}';
		setRenderState('waiting');
		setSnippets('', '', defaults.width, defaults.height);
	}

	/** Fill the three copyable snippets, keeping the markup highlighted. */
	function setSnippets(url, alt, width, height) {
		if (!url) {
			for (const code of Object.values(codeElements)) code.textContent = '';
			for (const button of copyButtons) button.disabled = true;
			return;
		}
		codeElements.url.textContent = url;
		// Raw values: paintTokens() escapes every non-token slice exactly once, so an
		// ampersand in the query string stays a single "&" in the copied snippet.
		codeElements.html.innerHTML = highlightHtml(`<img\n  src="${url}"\n  alt="${alt}"\n  width="${width}"\n  height="${height}"\n>`);
		codeElements.markdown.innerHTML = highlightMarkdown(`![${alt}](${url})`);
		for (const button of copyButtons) button.disabled = false;
	}

	/** Minimal tokenisers: only the parts that matter for these two snippets. */
	const HTML_TOKENS = /(<\/?)([A-Za-z][\w:-]*)|([A-Za-z_:][\w:.-]*)(\s*=\s*)("[^"]*"|'[^']*')|(\/?>)/g;
	const MARKDOWN_TOKENS = /(!?\[)([^\]]*)(\]\()([^)]*)(\))/g;

	/** Walk the pattern and escape everything that is not a token. */
	function paintTokens(source, pattern, render) {
		let html = '';
		let index = 0;
		for (const match of source.matchAll(pattern)) {
			html += escapeHtml(source.slice(index, match.index)) + render(match);
			index = match.index + match[0].length;
		}
		return html + escapeHtml(source.slice(index));
	}

	/** Wrap one token in its highlight span. */
	function token(name, text) {
		return `<span class="tok-${name}">${escapeHtml(text)}</span>`;
	}

	/** Highlight tags, attribute names and quoted values. */
	function highlightHtml(source) {
		return paintTokens(source, HTML_TOKENS, (match) => {
			if (match[2] !== undefined) return token('punct', match[1]) + token('tag', match[2]);
			if (match[3] !== undefined) return token('attr', match[3]) + token('punct', match[4]) + token('string', match[5]);
			return token('punct', match[6]);
		});
	}

	/** Highlight the image syntax used by a README snippet. */
	function highlightMarkdown(source) {
		return paintTokens(source, MARKDOWN_TOKENS, (match) => token('punct', match[1]) + escapeHtml(match[2]) + token('punct', match[3]) + token('url', match[4]) + token('punct', match[5]));
	}

	/** Escape text before it is written through innerHTML. */
	function escapeHtml(value) {
		return String(value)
			.replaceAll('&', '&amp;')
			.replaceAll('"', '&quot;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;');
	}

	/**
	 * Build the chart URL from the form.
	 *
	 * Parameters that equal the endpoint defaults are dropped to keep shared links
	 * short; the language is always written because the chart cannot infer it.
	 */
	function buildUrl(repo) {
		const metrics = selectedMetrics();
		const range = selectedValue(rangeInputs);
		const theme = selectedValue(themeInputs);
		const width = clampInteger(widthInput, urlDefaults.width, 320, 1600);
		const height = clampInteger(heightInput, urlDefaults.height, 200, 1000);
		const params = new URLSearchParams();
		params.set('metrics', metrics.join(','));
		if (range === 'custom') {
			if (startInput.value) params.set('start', startInput.value);
			if (endInput.value) params.set('end', endInput.value);
		} else {
			params.set('range', range);
		}
		if (form.elements.area.checked) params.set('area', 'true');
		if (theme !== 'auto') params.set('theme', theme);
		if (width !== urlDefaults.width) params.set('width', String(width));
		if (height !== urlDefaults.height) params.set('height', String(height));
		if (!form.elements.title.checked) params.set('title', 'false');
		if (!form.elements.legend.checked) params.set('legend', 'false');
		if (!form.elements.grid.checked) params.set('grid', 'false');
		params.set('lang', langSelect.value);
		const path = repo.split('/').map(encodeURIComponent).join('/');
		return `${location.origin}/api/chart/${path}?${params.toString().replaceAll('%2C', ',')}`;
	}

	/** Point the preview at a URL and start loading it. */
	function updatePreview(url, alt, width, height) {
		plotEndpoint.textContent = `/api/chart/${normalizeRepo(repoInput.value) || '{owner}/{repo}'}`;
		openChart.href = url;
		openChart.removeAttribute('aria-disabled');
		previewEmpty.hidden = true;
		chartPreview.hidden = false;
		chartPreview.alt = alt;
		chartPreview.width = width;
		chartPreview.height = height;
		setLoading();
		loadPreview(url);
	}

	/**
	 * Fetch the preview SVG.
	 *
	 * Object URLs are revoked on every new request, and responses arriving after a
	 * newer request has started are ignored so the preview never flickers backwards.
	 */
	async function loadPreview(url) {
		const request = ++previewRequest;
		previewController?.abort();
		previewController = new AbortController();
		if (previewObjectUrl) URL.revokeObjectURL(previewObjectUrl);
		previewObjectUrl = undefined;
		try {
			const response = await fetch(url, { signal: previewController.signal });
			const status = response.headers.get('X-Chart-Status');
			const body = await response.blob();
			if (request !== previewRequest) return;
			if (!response.ok || !['ok', 'error', 'stale'].includes(status) || !body.type.includes('image/svg+xml')) {
				setPreviewError();
				return;
			}
			previewObjectUrl = URL.createObjectURL(body);
			chartPreview.dataset.chartStatus = status;
			chartPreview.src = previewObjectUrl;
		} catch (error) {
			if (error.name !== 'AbortError' && request === previewRequest) setPreviewError();
		}
	}

	/**
	 * Recompute the URL and the snippets after a change.
	 *
	 * Invalid input short-circuits to an empty state instead of requesting a chart:
	 * an unparseable repository or inverted dates would only produce an error SVG.
	 */
	function update() {
		clearTimeout(updateTimer);
		const repo = normalizeRepo(repoInput.value);
		const repoInvalid = repoTouched && !repo;
		repoError.hidden = !repoInvalid;
		repoError.textContent = repoInvalid ? t('field.repoError') : '';
		repoInput.setAttribute('aria-invalid', String(repoInvalid));

		const custom = selectedValue(rangeInputs) === 'custom';
		const datesInverted = custom && startInput.value && endInput.value && startInput.value > endInput.value;
		dateError.hidden = !datesInverted;
		dateError.textContent = datesInverted ? t('field.dateError') : '';
		startInput.setAttribute('aria-invalid', String(datesInverted));
		endInput.setAttribute('aria-invalid', String(datesInverted));

		if (datesInverted) {
			setEmpty(t('preview.dates'));
			return;
		}
		if (!repo) {
			setEmpty(t('preview.waiting'));
			return;
		}

		const width = clampInteger(widthInput, urlDefaults.width, 320, 1600);
		const height = clampInteger(heightInput, urlDefaults.height, 200, 1000);
		const url = buildUrl(repo);
		const alt = t('alt.chart', { repo });
		setSnippets(url, alt, width, height);
		updatePreview(url, alt, width, height);
	}

	/**
	 * Debounce form input. Typing a repository would otherwise fire one request per
	 * keystroke, and every miss costs an upstream fetch.
	 */
	function scheduleUpdate() {
		clearTimeout(updateTimer);
		updateTimer = setTimeout(update, 220);
	}

	/** Clamp a number input in place on blur. */
	function clampNumberInput(input, fallback, min, max) {
		const value = Number(input.value);
		if (!Number.isFinite(value)) {
			input.value = String(fallback);
		} else {
			input.value = String(Math.min(max, Math.max(min, Math.round(value))));
		}
	}

	/** Clipboard API, with a textarea fallback for non-secure contexts. */
	async function writeClipboard(text) {
		if (navigator.clipboard && window.isSecureContext) {
			await navigator.clipboard.writeText(text);
			return;
		}
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		document.body.append(textarea);
		textarea.select();
		const copied = document.execCommand('copy');
		textarea.remove();
		if (!copied) throw new Error('Clipboard write failed');
	}

	/** Restore a copy button's label after the confirmation state. */
	function resetCopyButton(button) {
		clearTimeout(button.copyTimer);
		button.classList.remove('is-copied');
		const label = t(button.dataset.i18nAriaLabel);
		button.setAttribute('aria-label', label);
		button.setAttribute('title', label);
	}

	/** Show the copied or failed state on a copy button. */
	function flashCopyButton(button, key) {
		clearTimeout(button.copyTimer);
		button.classList.toggle('is-copied', key === 'action.copied');
		button.setAttribute('aria-label', t(key));
		button.setAttribute('title', t(key));
		if (key === 'action.copied') {
			button.copyTimer = setTimeout(() => resetCopyButton(button), 1700);
		}
	}

	/** Swap every translated string, then re-render the snippets. */
	function applyLanguage(language) {
		pageLang = language;
		document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
		document.title = t('meta.title');
		document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'));

		for (const element of document.querySelectorAll('[data-i18n]')) {
			element.textContent = t(element.dataset.i18n);
		}
		for (const element of document.querySelectorAll('[data-i18n-placeholder]')) {
			element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
		}
		for (const element of document.querySelectorAll('[data-i18n-aria-label]')) {
			element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
		}
		for (const element of document.querySelectorAll('[data-i18n-title]')) {
			element.setAttribute('title', t(element.dataset.i18nTitle));
		}
		for (const button of pageLanguageButtons) {
			button.setAttribute('aria-pressed', String(button.dataset.pageLang === language));
		}
		for (const button of copyButtons) resetCopyButton(button);
		if (repoTouched) {
			repoError.textContent = normalizeRepo(repoInput.value) ? '' : t('field.repoError');
		}
		if (!dateError.hidden) dateError.textContent = t('field.dateError');
		// Translated labels change item widths, so re-measure before painting.
		refreshSlidables();
		update();
	}

	for (const button of pageLanguageButtons) {
		button.addEventListener('click', () => {
			if (button.dataset.pageLang !== pageLang) applyLanguage(button.dataset.pageLang);
		});
	}

	for (const button of pageThemeButtons) {
		button.addEventListener('click', () => applyPageTheme(button.dataset.pageThemeMode, true));
	}

	systemDark.addEventListener('change', () => {
		if (pageThemeMode === 'auto') applyPageTheme('auto');
	});

	repoInput.addEventListener('blur', () => {
		repoTouched = true;
		const repo = normalizeRepo(repoInput.value);
		if (repo) repoInput.value = repo;
		update();
	});

	startInput.addEventListener('blur', () => {
		if (startInput.value && endInput.value && startInput.value > endInput.value) update();
	});

	for (const input of [widthInput, heightInput]) {
		input.addEventListener('blur', () => {
			clampNumberInput(input, input === widthInput ? defaults.width : defaults.height, input === widthInput ? 320 : 200, input === widthInput ? 1600 : 1000);
			update();
		});
	}

	form.addEventListener('input', (event) => {
		if (event.target.name === 'metrics' && !metricInputs.some((input) => input.checked)) {
			event.target.checked = true;
			if (!metricsNoticeShown) {
				metricsNoticeShown = true;
				liveStatus.textContent = t('metrics.required');
			}
		}
		if (event.target.name === 'range') syncCustomDates();
		if (event.target.name === 'repo') {
			if (repoTouched) repoError.hidden = Boolean(normalizeRepo(repoInput.value));
		}
		scheduleUpdate();
	});

	form.addEventListener('change', (event) => {
		if (event.target.name === 'range') syncCustomDates();
		scheduleUpdate();
	});

	form.addEventListener('submit', (event) => {
		event.preventDefault();
		repoInput.blur();
		update();
	});

	chartPreview.addEventListener('load', () => {
		plotStage.classList.remove('is-loading');
		plotStage.setAttribute('aria-busy', 'false');
		previewEmpty.hidden = true;
		chartPreview.hidden = false;
		setRenderState(chartPreview.dataset.chartStatus === 'stale' ? 'stale' : chartPreview.dataset.chartStatus === 'error' ? 'error' : 'ready');
	});

	chartPreview.addEventListener('error', setPreviewError);

	openChart.addEventListener('click', (event) => {
		if (openChart.getAttribute('aria-disabled') === 'true' || !openChart.getAttribute('href')) {
			event.preventDefault();
		}
	});

	for (const button of copyButtons) {
		button.addEventListener('click', async () => {
			const text = codeElements[button.dataset.copyKey]?.textContent || '';
			if (!text) return;
			try {
				await writeClipboard(text);
				flashCopyButton(button, 'action.copied');
				liveStatus.textContent = t('action.copied');
			} catch {
				flashCopyButton(button, 'action.copyFailed');
				liveStatus.textContent = t('action.copyFailed');
			}
		});
	}

	if (typeof window.addEventListener === 'function') {
		window.addEventListener('resize', refreshSlidables);
		window.addEventListener('load', refreshSlidables);
	}

	setupSlidables();
	syncCustomDates();
	applyPageTheme(pageThemeMode);
	applyLanguage(pageLang);
	refreshSlidables();
})();
