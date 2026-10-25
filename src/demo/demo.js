(() => {
	'use strict';

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
			'hero.note': 'No API key. No runtime scripts. One self-contained SVG.',
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
			'embed.note': 'Copy the chart URL or use a snippet. Language follows your choice in the builder.',
			'snippet.url': 'Chart URL',
			'snippet.html': 'HTML img tag',
			'snippet.markdown': 'Markdown for README',
			'action.copied': 'Copied',
			'action.copyFailed': 'Copy failed',
			'alt.chart': 'SiYuan bazaar package trends for {repo}',
			'footer.note': "Charts are cached for 30 minutes and refresh behind GitHub's image proxy.",
			'footer.data': 'Data from',
			'footer.source': 'Source code',
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
			'hero.note': '无需 API Key，只要一份自包含的 SVG。',
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
			'embed.note': '可以直接复制图表链接，或使用下方片段。图表语言跟随上方的设置。',
			'snippet.url': '图表链接',
			'snippet.html': 'HTML img 标签',
			'snippet.markdown': 'README Markdown',
			'action.copied': '已复制',
			'action.copyFailed': '复制失败',
			'alt.chart': '{repo} 的思源集市包趋势',
			'footer.note': '图表缓存 30 分钟，并通过 GitHub 图片代理自动刷新。',
			'footer.data': '数据来自',
			'footer.source': '源码',
		},
	};

	const THEME_STORAGE_KEY = 'siyuan-bazaar-page-theme';
	const PAGE_THEME_MODES = ['auto', 'light', 'dark'];
	const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
	const form = document.querySelector('#chart-form');
	if (!form) return;

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

	let pageLang = detectPageLanguage();
	let pageThemeMode = PAGE_THEME_MODES.includes(document.documentElement.dataset.pageThemeMode) ? document.documentElement.dataset.pageThemeMode : 'auto';
	let repoTouched = false;
	let updateTimer;
	let previewController;
	let previewObjectUrl;
	let previewRequest = 0;
	let metricsNoticeShown = false;

	function detectPageLanguage() {
		const preferred = navigator.languages?.[0] || navigator.language || 'en';
		return /^zh\b/i.test(preferred) ? 'zh' : 'en';
	}

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
	}

	function t(key, values) {
		let message = messages[pageLang][key] ?? messages.en[key] ?? key;
		if (values) {
			for (const [name, value] of Object.entries(values)) {
				message = message.replaceAll(`{${name}}`, String(value));
			}
		}
		return message;
	}

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

	function selectedMetrics() {
		const selected = new Set(metricInputs.filter((input) => input.checked).map((input) => input.value));
		return metricOrder.filter((metric) => selected.has(metric));
	}

	function selectedValue(inputs) {
		return inputs.find((input) => input.checked)?.value;
	}

	function clampInteger(input, fallback, min, max) {
		const value = Number(input.value);
		if (!Number.isFinite(value)) return fallback;
		return Math.min(max, Math.max(min, Math.round(value)));
	}

	function utcDate(daysAgo = 0) {
		const date = new Date();
		date.setUTCDate(date.getUTCDate() - daysAgo);
		return date.toISOString().slice(0, 10);
	}

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

	function setLoading() {
		plotStage.classList.add('is-loading');
		plotStage.setAttribute('aria-busy', 'true');
		setRenderState('loading');
	}

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

	function setSnippets(url, alt, width, height) {
		if (!url) {
			for (const code of Object.values(codeElements)) code.textContent = '';
			for (const button of copyButtons) button.disabled = true;
			return;
		}
		const htmlUrl = escapeHtml(url);
		const htmlAlt = escapeHtml(alt);
		codeElements.url.textContent = url;
		codeElements.html.innerHTML = highlightHtml(`<img\n  src="${htmlUrl}"\n  alt="${htmlAlt}"\n  width="${width}"\n  height="${height}"\n>`);
		codeElements.markdown.innerHTML = highlightMarkdown(`![${alt}](${url})`);
		for (const button of copyButtons) button.disabled = false;
	}

	const HTML_TOKENS = /(<\/?)([A-Za-z][\w:-]*)|([A-Za-z_:][\w:.-]*)(\s*=\s*)("[^"]*"|'[^']*')|(\/?>)/g;
	const MARKDOWN_TOKENS = /(!?\[)([^\]]*)(\]\()([^)]*)(\))/g;

	function paintTokens(source, pattern, render) {
		let html = '';
		let index = 0;
		for (const match of source.matchAll(pattern)) {
			html += escapeHtml(source.slice(index, match.index)) + render(match);
			index = match.index + match[0].length;
		}
		return html + escapeHtml(source.slice(index));
	}

	function token(name, text) {
		return `<span class="tok-${name}">${escapeHtml(text)}</span>`;
	}

	function highlightHtml(source) {
		return paintTokens(source, HTML_TOKENS, (match) => {
			if (match[2] !== undefined) return token('punct', match[1]) + token('tag', match[2]);
			if (match[3] !== undefined) return token('attr', match[3]) + token('punct', match[4]) + token('string', match[5]);
			return token('punct', match[6]);
		});
	}

	function highlightMarkdown(source) {
		return paintTokens(source, MARKDOWN_TOKENS, (match) => token('punct', match[1]) + escapeHtml(match[2]) + token('punct', match[3]) + token('url', match[4]) + token('punct', match[5]));
	}

	function escapeHtml(value) {
		return String(value)
			.replaceAll('&', '&amp;')
			.replaceAll('"', '&quot;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;');
	}

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

	function scheduleUpdate() {
		clearTimeout(updateTimer);
		updateTimer = setTimeout(update, 220);
	}

	function clampNumberInput(input, fallback, min, max) {
		const value = Number(input.value);
		if (!Number.isFinite(value)) {
			input.value = String(fallback);
		} else {
			input.value = String(Math.min(max, Math.max(min, Math.round(value))));
		}
	}

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

	function resetCopyButton(button) {
		clearTimeout(button.copyTimer);
		button.classList.remove('is-copied');
		const label = t(button.dataset.i18nAriaLabel);
		button.setAttribute('aria-label', label);
		button.setAttribute('title', label);
	}

	function flashCopyButton(button, key) {
		clearTimeout(button.copyTimer);
		button.classList.toggle('is-copied', key === 'action.copied');
		button.setAttribute('aria-label', t(key));
		button.setAttribute('title', t(key));
		if (key === 'action.copied') {
			button.copyTimer = setTimeout(() => resetCopyButton(button), 1700);
		}
	}

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

	syncCustomDates();
	applyPageTheme(pageThemeMode);
	applyLanguage(pageLang);
})();
