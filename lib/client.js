window.__ModuleLoader__.load({
	id: "dsh-usage-panel",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		const React = require("react");

		const h = React.createElement;

		/* ────────────────────────────── copy ────────────────────────────── */

		const en = {
			nav: "Usage",
			title: "Token usage",
			subtitle: "Every Session on this machine, folded from its durable log.",
			loading: "Reading Session logs…",
			empty: "No usage recorded yet. Send a message and this page fills in.",
			errorTitle: "Could not read usage",
			errorHint: "The host route answered with an error. Retry, or check that the plugin is enabled.",
			retry: "Retry",
			refresh: "Refresh",
			refreshing: "Refreshing…",
			updated: "Updated",
			totalTokens: "Total tokens",
			input: "Input",
			output: "Output",
			cacheRead: "Cache read",
			cacheHit: "Cache hit rate",
			sessions: "Sessions",
			messages: "Messages",
			activeDays: "Active days",
			streak: "Day streak",
			lastActive: "Last active",
			avg: "Avg / active day",
			peak: "Peak day",
			heatmap: "Activity",
			heatmapSub: "Token volume per day over the last 26 weeks",
			less: "Less",
			more: "More",
			byModel: "Tokens by model",
			byModelSub: "Daily total, stacked by model",
			share: "Model share",
			shareSub: "Share of all tokens",
			providers: "Providers",
			providersSub: "Where the tokens were spent",
			topSessions: "Busiest Sessions",
			topSessionsSub: "Ranked by total tokens",
			noData: "No data",
			days: "days",
			tokens: "tokens",
			range7: "7D",
			range30: "30D",
			range90: "90D",
			other: "Other",
			unknownModel: "unknown",
			sessionFallback: "Untitled Session",
		};

		const zh = {
			nav: "用量",
			title: "Token 用量",
			subtitle: "本机全部会话的持久日志汇总。",
			loading: "正在读取会话日志…",
			empty: "还没有用量记录。发一条消息，这里就会有数据。",
			errorTitle: "读取用量失败",
			errorHint: "宿主路由返回了错误。可以重试，或确认插件已启用。",
			retry: "重试",
			refresh: "刷新",
			refreshing: "刷新中…",
			updated: "更新于",
			totalTokens: "总 Token",
			input: "输入",
			output: "输出",
			cacheRead: "缓存读取",
			cacheHit: "缓存命中率",
			sessions: "会话数",
			messages: "消息数",
			activeDays: "活跃天数",
			streak: "连续活跃",
			lastActive: "最近活跃",
			avg: "活跃日均",
			peak: "峰值日",
			heatmap: "活跃热力图",
			heatmapSub: "最近 26 周每天的 Token 消耗",
			less: "少",
			more: "多",
			byModel: "按模型的 Token",
			byModelSub: "每日总量，按模型堆叠",
			share: "模型占比",
			shareSub: "各模型占总消耗的比例",
			providers: "供应商",
			providersSub: "Token 花在了哪里",
			topSessions: "最忙的会话",
			topSessionsSub: "按累计 Token 排名",
			noData: "暂无数据",
			days: "天",
			tokens: "tokens",
			range7: "7 天",
			range30: "30 天",
			range90: "90 天",
			other: "其他",
			unknownModel: "未知模型",
			sessionFallback: "未命名会话",
			exportLabel: "导出",
			exportDaily: "CSV · 每日用量",
			exportModels: "CSV · 按模型",
			exportJson: "JSON · 完整汇总",
		};

		/* ───────────────────────────── style ───────────────────────────── */

		const PALETTE = ["#4D6BFE", "#12B5A0", "#F5A524", "#A46BFF", "#FF6B8A", "#39C07A", "#E8C547", "#7F8EA3"];
		const OTHER_COLOR = "#8C93A5";
		const HEAT_STEPS = [0, 0.16, 0.34, 0.54, 0.76, 1];

		const css = `
.up-root{display:flex;flex-direction:column;gap:16px;padding:20px 0 8px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px}
.up-hero{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap}
.up-title{margin:0;font-size:17px;line-height:24px;font-weight:600;letter-spacing:-.01em}
.up-sub{margin:2px 0 0;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px}
.up-tools{display:flex;align-items:center;gap:8px}
.up-seg{display:inline-flex;padding:2px;border-radius:9px;background:var(--dsw-alias-bg-skeleton);border:1px solid var(--dsw-alias-border-l2)}
.up-seg button{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:12px;line-height:18px;padding:3px 9px;border-radius:7px;cursor:pointer}
.up-seg button[data-active="true"]{background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base));color:var(--dsw-alias-label-primary);box-shadow:0 1px 2px rgba(0,0,0,.12)}
.up-btn{appearance:none;font:inherit;font-size:12px;line-height:18px;padding:4px 12px;border-radius:9px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary)}
.up-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.up-btn[disabled]{opacity:.55;cursor:default}
.up-menu{position:relative}
.up-menu-pop{position:absolute;right:0;top:calc(100% + 4px);z-index:8;min-width:170px;display:flex;flex-direction:column;padding:4px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1,#fff);box-shadow:0 10px 28px rgba(0,0,0,.16)}
.up-menu-pop button{appearance:none;border:0;background:transparent;font:inherit;font-size:12px;line-height:18px;text-align:left;padding:6px 8px;border-radius:7px;cursor:pointer;color:var(--dsw-alias-label-primary)}
.up-menu-pop button:hover{background:var(--dsw-alias-interactive-bg-hover)}
.up-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.up-kpi{border:1px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-1));border-radius:12px;padding:12px 14px;display:flex;flex-direction:column;gap:2px;min-width:0}
.up-kpi-label{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;display:flex;align-items:center;gap:6px}
.up-kpi-value{font-size:22px;line-height:30px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.up-kpi-hint{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.up-card{border:1px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-1));border-radius:14px;padding:14px 16px 16px;min-width:0}
.up-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}
.up-card-title{font-size:13px;font-weight:600}
.up-card-sub{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}
.up-row{display:grid;gap:12px}
.up-row-2{grid-template-columns:minmax(0,1.85fr) minmax(0,1fr)}
.up-row-2b{grid-template-columns:minmax(0,1fr) minmax(0,1.6fr)}
.up-legend{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}
.up-legend-item{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--dsw-alias-label-secondary);line-height:16px}
.up-dot{width:8px;height:8px;border-radius:3px;flex:none}
.up-heat-months{display:grid;grid-auto-flow:column;grid-auto-columns:15px;gap:4px;margin:0 0 5px 22px;font-size:10px;line-height:14px;color:var(--dsw-alias-label-tertiary);overflow:hidden}
.up-heat-months span{white-space:nowrap;overflow:visible}
.up-heat-wrap{display:flex;gap:6px;align-items:flex-start}
.up-heat-weekdays{display:grid;grid-template-rows:repeat(7,15px);gap:4px;font-size:9px;line-height:15px;color:var(--dsw-alias-label-tertiary);text-align:right;flex:none;width:16px}
.up-heat{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,15px);grid-auto-columns:15px;gap:4px;overflow:hidden}
.up-cell{border-radius:3px;background:var(--dsw-alias-bg-skeleton);cursor:default;transition:transform .08s ease}
.up-cell[data-level="0"]{background:var(--dsw-alias-bg-skeleton)}
.up-cell:hover{transform:scale(1.18);outline:1px solid var(--dsw-alias-border-l3)}
.up-heat-foot{display:flex;align-items:center;justify-content:flex-end;gap:4px;font-size:10px;color:var(--dsw-alias-label-tertiary)}
.up-heat-foot .up-cell{width:10px;height:10px;flex:none;border-radius:2px}
.up-bars{display:flex;align-items:flex-end;gap:3px;height:148px;padding-top:4px}
.up-bar{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:flex-end;height:100%;border-radius:3px;overflow:hidden;cursor:default}
.up-bar:hover{background:var(--dsw-alias-interactive-bg-hover)}
.up-bar-seg{width:100%;flex:none}
.up-axis{display:flex;gap:3px;margin-top:6px;font-size:9px;line-height:14px;color:var(--dsw-alias-label-tertiary)}
.up-axis span{flex:1;min-width:0;text-align:center;overflow:visible;white-space:nowrap}
.up-donut{display:flex;flex-direction:column;align-items:center;gap:12px}
.up-donut-legend{display:flex;flex-direction:column;gap:6px;min-width:0;width:100%}
.up-donut-row{display:flex;align-items:center;gap:6px;font-size:11px;line-height:16px;min-width:0}
.up-donut-name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary)}
.up-donut-val{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}
.up-rows{display:flex;flex-direction:column}
.up-rowitem{display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid var(--dsw-alias-border-l2);min-width:0}
.up-rowitem:first-child{border-top:0;padding-top:0}
.up-rowitem-main{flex:1;min-width:0}
.up-rowitem-title{font-size:12px;line-height:18px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.up-rowitem-sub{font-size:10px;line-height:15px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.up-rowitem-val{font-variant-numeric:tabular-nums;font-size:12px;line-height:18px;flex:none}
.up-track{height:5px;border-radius:3px;background:var(--dsw-alias-bg-skeleton);overflow:hidden;margin-top:5px}
.up-track span{display:block;height:100%;border-radius:3px}
.up-tooltip{position:fixed;z-index:2147483000;pointer-events:none;background:var(--dsw-alias-tooltip-bg,#1c1c1e);color:var(--dsw-alias-label-primary-inverted,#fff);font-size:11px;line-height:16px;padding:5px 8px;border-radius:8px;box-shadow:0 6px 20px rgba(0,0,0,.28);white-space:pre;transform:translate(-50%,-100%);max-width:260px}
.up-state{border:1px dashed var(--dsw-alias-border-l3);border-radius:14px;padding:32px 20px;text-align:center;color:var(--dsw-alias-label-secondary)}
.up-state-title{font-weight:600;margin-bottom:4px;color:var(--dsw-alias-label-primary)}
.up-skel{height:12px;border-radius:6px;background:var(--dsw-alias-bg-skeleton,var(--dsw-alias-bg-skeleton));animation:up-pulse 1.2s ease-in-out infinite}
@keyframes up-pulse{0%,100%{opacity:.55}50%{opacity:1}}
@media (max-width:820px){.up-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.up-row-2,.up-row-2b{grid-template-columns:minmax(0,1fr)}}
`;

		if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="dsh-usage-panel/panel.css"]') === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-usage-panel";
			tag.dataset.pluginCss = "dsh-usage-panel/panel.css";
			tag.textContent = css;
			document.head.appendChild(tag);
		}

		/* ───────────────────────────── utils ───────────────────────────── */

		const API = "/usage-panel/api/summary";

		/** Compact number for the active language. */
		function formatNumber(value, chinese) {
			const number = typeof value === "number" && Number.isFinite(value) ? value : 0;
			if (chinese) {
				if (number >= 1e8) return (number / 1e8).toFixed(number >= 1e9 ? 1 : 2) + "亿";
				if (number >= 1e4) return (number / 1e4).toFixed(number >= 1e6 ? 0 : 1) + "万";
				return String(Math.round(number));
			}
			if (number >= 1e9) return (number / 1e9).toFixed(2) + "B";
			if (number >= 1e6) return (number / 1e6).toFixed(2) + "M";
			if (number >= 1e3) return (number / 1e3).toFixed(1) + "K";
			return String(Math.round(number));
		}

		/** `MM-DD` from a `YYYY-MM-DD` key. */
		function shortDate(key) {
			return typeof key === "string" && key.length >= 10 ? key.slice(5) : String(key ?? "");
		}

		/** `HH:mm` of an epoch timestamp. */
		function clock(ms) {
			const date = new Date(ms);
			return String(date.getHours()).padStart(2, "0") + ":" + String(date.getMinutes()).padStart(2, "0");
		}

		/** Local `YYYY-MM-DD` of an epoch timestamp. */
		function dateOf(ms) {
			if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return "—";
			const date = new Date(ms);
			return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
		}

		const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

		/** The color of one model's series. */
		function colorOf(models, name) {
			const position = models.indexOf(name);
			return position >= 0 ? PALETTE[position % PALETTE.length] : OTHER_COLOR;
		}

		/** Fetch the summary. */
		async function loadUsage(days, force) {
			const response = await fetch(API + "?days=" + days + (force ? "&refresh=1" : ""), { headers: { accept: "application/json" } });
			const body = await response.json().catch(() => null);
			if (!response.ok || body === null || body.ok !== true) throw new Error(body && body.error ? body.error : "HTTP " + response.status);
			return body;
		}

		/** Emit rows as RFC 4180 CSV. */
		function csv(rows) {
			return rows.map((row) => row.map((cell) => {
				const text = cell === null || cell === undefined ? "" : String(cell);
				return /[",\n]/.test(text) ? "\"" + text.replace(/"/g, "\"\"") + "\"" : text;
			}).join(",")).join("\n") + "\n";
		}

		/** Hand a generated file to the browser's download path. */
		function saveFile(name, text, type) {
			const url = URL.createObjectURL(new Blob([text], { type: type }));
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = name;
			document.body.appendChild(anchor);
			anchor.click();
			anchor.remove();
			setTimeout(() => URL.revokeObjectURL(url), 1000);
		}

		/* ─────────────────────────── primitives ─────────────────────────── */

		function Kpi(props) {
			return h("div", { className: "up-kpi" },
				h("div", { className: "up-kpi-label" }, props.label),
				h("div", { className: "up-kpi-value", title: String(props.value) }, props.value),
				props.hint === undefined ? null : h("div", { className: "up-kpi-hint", title: props.hint }, props.hint)
			);
		}

		function Legend(props) {
			if (props.items.length === 0) return null;
			return h("div", { className: "up-legend" }, props.items.map((item) =>
				h("span", { className: "up-legend-item", key: item.label },
					h("span", { className: "up-dot", style: { background: item.color } }),
					item.label
				)
			));
		}

		function Tooltip(props) {
			if (!props.tip) return null;
			return h("div", { className: "up-tooltip", style: { left: props.tip.x + "px", top: props.tip.y - 10 + "px" } }, props.tip.text);
		}

		/** Download the folded summary as CSV or JSON. */
		function ExportMenu(props) {
			const summary = props.summary;
			const t = props.t;
			const [open, setOpen] = React.useState(false);
			const stamp = dateOf(summary.generatedAt);

			const choose = (kind) => {
				setOpen(false);
				if (kind === "json") {
					saveFile("dsh-usage-" + stamp + ".json", JSON.stringify(summary, null, 2), "application/json;charset=utf-8");
					return;
				}
				if (kind === "models") {
					const rows = [["model", "provider", "total", "input", "output", "cacheRead", "cacheWrite", "messages", "sessions", "share"]];
					for (const row of summary.models) {
						rows.push([row.model, row.provider || "", row.total, row.input, row.output, row.cacheRead, row.cacheWrite, row.messages, row.sessions, row.share.toFixed(4)]);
					}
					saveFile("dsh-usage-models-" + stamp + ".csv", csv(rows), "text/csv;charset=utf-8");
					return;
				}
				const models = summary.models.map((row) => row.model);
				const rows = [["date", "tokens", "messages"].concat(models)];
				for (const day of summary.series) {
					rows.push([day.date, day.tokens, day.messages].concat(models.map((model) => day.byModel[model] || 0)));
				}
				saveFile("dsh-usage-daily-" + stamp + ".csv", csv(rows), "text/csv;charset=utf-8");
			};

			return h("div", { className: "up-menu", onMouseLeave: () => setOpen(false) },
				h("button", {
					type: "button",
					className: "up-btn",
					"aria-expanded": open ? "true" : "false",
					onClick: () => setOpen(!open),
				}, t("exportLabel")),
				open
					? h("div", { className: "up-menu-pop" },
						h("button", { type: "button", onClick: () => choose("daily") }, t("exportDaily")),
						h("button", { type: "button", onClick: () => choose("models") }, t("exportModels")),
						h("button", { type: "button", onClick: () => choose("json") }, t("exportJson"))
					)
					: null
			);
		}

		/* ─────────────────────────── charts ─────────────────────────── */

		function Heatmap(props) {
			const days = props.days;
			const chinese = props.chinese;
			const t = props.t;
			const [tip, setTip] = React.useState(null);

			const weeks = [];
			if (days.length > 0) {
				const first = new Date(days[0].date + "T00:00:00");
				const offset = (first.getDay() + 6) % 7;
				let column = [];
				for (let pad = 0; pad < offset; pad += 1) column.push(null);
				for (const day of days) {
					column.push(day);
					if (column.length === 7) { weeks.push(column); column = []; }
				}
				if (column.length > 0) {
					while (column.length < 7) column.push(null);
					weeks.push(column);
				}
			}

			const max = days.reduce((best, day) => Math.max(best, day.tokens), 0);
			const levelOf = (tokens) => {
				if (tokens <= 0 || max <= 0) return 0;
				const ratio = tokens / max;
				let level = 1;
				for (const threshold of [0.06, 0.22, 0.45, 0.72]) if (ratio >= threshold) level += 1;
				return Math.min(level, 5);
			};

			const months = [];
			let previousMonth = null;
			for (const column of weeks) {
				const anchor = column.find((day) => day !== null);
				const month = anchor === undefined ? null : anchor.date.slice(0, 7);
				if (month !== null && month !== previousMonth) {
					const number = Number(month.slice(5, 7));
					months.push(chinese ? number + "月" : MONTHS_EN[number - 1]);
					previousMonth = month;
				} else {
					months.push("");
				}
			}

			const show = (event, day) => {
				const rect = event.currentTarget.getBoundingClientRect();
				setTip({
					x: rect.left + rect.width / 2,
					y: rect.top,
					text: day.date + "\n" + t("tokens") + " " + formatNumber(day.tokens, chinese) + "  ·  " + t("messages") + " " + day.messages,
				});
			};

			const swatches = [0, 1, 2, 3, 4, 5].map((level) => h("span", {
				key: level,
				className: "up-cell",
				"data-level": String(level),
				style: level === 0 ? undefined : { background: "rgba(77,107,254," + HEAT_STEPS[level] + ")" },
			}));

			return h("section", { className: "up-card" },
				h(Tooltip, { tip }),
				h("div", { className: "up-card-head" },
					h("div", null,
						h("div", { className: "up-card-title" }, t("heatmap")),
						h("div", { className: "up-card-sub" }, t("heatmapSub"))
					),
					h("div", { className: "up-heat-foot" }, t("less"), swatches, t("more"))
				),
				h("div", { className: "up-heat-months", "aria-hidden": "true" }, months.map((text, index) => h("span", { key: index }, text))),
				h("div", { className: "up-heat-wrap" },
					h("div", { className: "up-heat-weekdays", "aria-hidden": "true" },
						chinese
							? [h("span", { key: 0 }, "一"), h("span", { key: 1 }, ""), h("span", { key: 2 }, "三"), h("span", { key: 3 }, ""), h("span", { key: 4 }, "五"), h("span", { key: 5 }, ""), h("span", { key: 6 }, "")]
							: [h("span", { key: 0 }, "M"), h("span", { key: 1 }, ""), h("span", { key: 2 }, "W"), h("span", { key: 3 }, ""), h("span", { key: 4 }, "F"), h("span", { key: 5 }, ""), h("span", { key: 6 }, "")]
					),
					h("div", { className: "up-heat", onMouseLeave: () => setTip(null) },
						weeks.flatMap((column, columnIndex) => column.map((day, dayIndex) => {
							if (day === null) return h("span", { key: columnIndex + "-" + dayIndex, className: "up-cell", "data-level": "0", style: { visibility: "hidden" } });
							const level = levelOf(day.tokens);
							return h("span", {
								key: columnIndex + "-" + dayIndex,
								className: "up-cell",
								"data-level": String(level),
								style: level === 0 ? undefined : { background: "rgba(77,107,254," + HEAT_STEPS[level] + ")" },
								onMouseEnter: (event) => show(event, day),
							});
						}))
					)
				)
			);
		}

		function StackedBars(props) {
			const series = props.series;
			const models = props.models;
			const chinese = props.chinese;
			const t = props.t;
			const [tip, setTip] = React.useState(null);

			const top = models.slice(0, 5).map((row) => row.model);
			const extra = models.slice(5).map((row) => row.model);
			const max = series.reduce((best, day) => Math.max(best, day.tokens), 0) || 1;
			const step = Math.max(1, Math.ceil(series.length / 7));

			const label = (model) => (model === null ? t("other") : model || t("unknownModel"));

			const stacks = series.map((day) => {
				const segments = top
					.map((model) => ({ model, tokens: day.byModel[model] || 0 }))
					.filter((segment) => segment.tokens > 0);
				const otherTotal = extra.reduce((sum, model) => sum + (day.byModel[model] || 0), 0);
				if (otherTotal > 0) segments.push({ model: null, tokens: otherTotal });
				return { day, segments };
			});

			const legendItems = top.map((model) => ({ label: model, color: colorOf(top, model) }));
			if (extra.length > 0) legendItems.push({ label: t("other"), color: OTHER_COLOR });

			return h("section", { className: "up-card" },
				h(Tooltip, { tip }),
				h("div", { className: "up-card-head" },
					h("div", null,
						h("div", { className: "up-card-title" }, t("byModel")),
						h("div", { className: "up-card-sub" }, t("byModelSub"))
					)
				),
				h("div", { className: "up-bars", onMouseLeave: () => setTip(null) },
					stacks.map((entry) => {
						const day = entry.day;
						const segments = entry.segments;
						return h("div", {
							key: day.date,
							className: "up-bar",
							onMouseEnter: (event) => {
								const rect = event.currentTarget.getBoundingClientRect();
								const lines = [day.date, formatNumber(day.tokens, chinese) + " " + t("tokens")];
								for (const segment of segments.slice().sort((a, b) => b.tokens - a.tokens)) {
									lines.push(label(segment.model) + "  " + formatNumber(segment.tokens, chinese));
								}
								setTip({ x: rect.left + rect.width / 2, y: rect.top - 4, text: lines.join("\n") });
							},
						}, segments.map((segment, index) => h("span", {
							key: index,
							className: "up-bar-seg",
							style: {
								height: (segment.tokens / max) * 100 + "%",
								minHeight: segment.tokens > 0 ? "2px" : "0",
								background: segment.model === null ? OTHER_COLOR : colorOf(top, segment.model),
							},
						})));
					})
				),
				h("div", { className: "up-axis" }, series.map((day, index) =>
					h("span", { key: day.date }, index % step === 0 ? shortDate(day.date) : ""))),
				h(Legend, { items: legendItems })
			);
		}

		function Donut(props) {
			const models = props.models;
			const totals = props.totals;
			const chinese = props.chinese;
			const t = props.t;

			const rows = models.slice(0, 9);
			const rest = models.slice(9).reduce((sum, row) => sum + row.total, 0);
			const slices = rows.map((row, index) => ({ label: row.model, value: row.total, color: PALETTE[index % PALETTE.length] }));
			if (rest > 0) slices.push({ label: t("other"), value: rest, color: OTHER_COLOR });
			const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;

			const radius = 54;
			const circumference = 2 * Math.PI * radius;
			let offset = 0;
			const rings = slices.map((slice) => {
				const length = (slice.value / total) * circumference;
				const ring = { label: slice.label, color: slice.color, value: slice.value, length: length, offset: offset };
				offset += length;
				return ring;
			});

			return h("section", { className: "up-card" },
				h("div", { className: "up-card-head" },
					h("div", null,
						h("div", { className: "up-card-title" }, t("share")),
						h("div", { className: "up-card-sub" }, t("shareSub"))
					)
				),
				h("div", { className: "up-donut" },
					h("svg", { width: 148, height: 148, viewBox: "0 0 148 148", role: "img", "aria-label": t("share") },
						h("g", { transform: "rotate(-90 74 74)" },
							h("circle", { cx: 74, cy: 74, r: radius, fill: "none", stroke: "var(--dsw-alias-bg-skeleton)", strokeWidth: 18 }),
							rings.filter((ring) => ring.length > 0).map((ring, index) => h("circle", {
								key: index,
								cx: 74,
								cy: 74,
								r: radius,
								fill: "none",
								stroke: ring.color,
								strokeWidth: 18,
								strokeDasharray: Math.max(ring.length - 1.5, 0) + " " + circumference,
								strokeDashoffset: -ring.offset,
							}))
						),
						h("text", { x: 74, y: 70, textAnchor: "middle", fill: "var(--dsw-alias-label-primary)", fontSize: 17, fontWeight: 600 }, formatNumber(totals.total, chinese)),
						h("text", { x: 74, y: 87, textAnchor: "middle", fill: "var(--dsw-alias-label-tertiary)", fontSize: 9 }, t("tokens"))
					),
					h("div", { className: "up-donut-legend" }, rings.map((ring) => h("div", { className: "up-donut-row", key: ring.label },
						h("span", { className: "up-dot", style: { background: ring.color } }),
						h("span", { className: "up-donut-name", title: ring.label }, ring.label),
						h("span", { className: "up-donut-val" }, ((ring.value / total) * 100).toFixed(1) + "%")
					)))
				)
			);
		}

		function ProviderList(props) {
			const providers = props.providers;
			const totals = props.totals;
			const chinese = props.chinese;
			const t = props.t;
			const total = Math.max(totals.total, 1);

			return h("section", { className: "up-card" },
				h("div", { className: "up-card-head" },
					h("div", null,
						h("div", { className: "up-card-title" }, t("providers")),
						h("div", { className: "up-card-sub" }, t("providersSub"))
					)
				),
				providers.length === 0
					? h("div", { className: "up-card-sub" }, t("noData"))
					: h("div", { className: "up-rows" }, providers.map((provider, index) => h("div", { className: "up-rowitem", key: provider.provider },
						h("div", { className: "up-rowitem-main" },
							h("div", { className: "up-rowitem-title" }, provider.provider),
							h("div", { className: "up-rowitem-sub", title: provider.models.join(", ") }, provider.models.join(" · ")),
							h("div", { className: "up-track" }, h("span", {
								style: { width: Math.max((provider.total / total) * 100, 1.5) + "%", background: PALETTE[index % PALETTE.length] },
							}))
						),
						h("div", { className: "up-rowitem-val" }, formatNumber(provider.total, chinese))
					)))
			);
		}

		function SessionList(props) {
			const sessions = props.sessions;
			const chinese = props.chinese;
			const t = props.t;
			const max = sessions.reduce((best, session) => Math.max(best, session.total), 0) || 1;

			return h("section", { className: "up-card" },
				h("div", { className: "up-card-head" },
					h("div", null,
						h("div", { className: "up-card-title" }, t("topSessions")),
						h("div", { className: "up-card-sub" }, t("topSessionsSub"))
					)
				),
				h("div", { className: "up-rows" }, sessions.map((session, index) => h("div", { className: "up-rowitem", key: session.id },
					h("div", { className: "up-rowitem-main" },
						h("div", { className: "up-rowitem-title", title: session.title || session.id }, session.title || t("sessionFallback")),
						h("div", { className: "up-rowitem-sub", title: session.cwd || "" },
							[t("messages") + " " + session.messages].concat(session.models.slice(0, 2)).join("  ·  ")),
						h("div", { className: "up-track" }, h("span", {
							style: { width: Math.max((session.total / max) * 100, 1.5) + "%", background: PALETTE[index % PALETTE.length] },
						}))
					),
					h("div", { className: "up-rowitem-val" }, formatNumber(session.total, chinese))
				)))
			);
		}

		/* ─────────────────────────── section ─────────────────────────── */

		function Loading() {
			return h("div", { style: { display: "flex", flexDirection: "column", gap: 10 } },
				h("div", { className: "up-skel", style: { width: "30%" } }),
				h("div", { className: "up-skel", style: { width: "100%", height: 64 } }),
				h("div", { className: "up-skel", style: { width: "100%", height: 120 } }),
				h("div", { className: "up-skel", style: { width: "60%" } })
			);
		}

		/**
		 * The Usage settings section: one summary fetch, then the KPI strip, the
		 * activity heatmap, the stacked daily chart, the model donut, the provider
		 * split and the busiest Sessions.
		 * @param props - section props: the localized reader and the shell's close.
		 * @returns the section element tree.
		 */
		function UsageSection(props) {
			const t = props.t;
			const chinese = t("nav") === zh.nav;
			const [range, setRange] = React.useState(30);
			const [status, setStatus] = React.useState("loading");
			const [data, setData] = React.useState(null);
			const [error, setError] = React.useState(null);
			const [busy, setBusy] = React.useState(false);
			const [nonce, setNonce] = React.useState(0);

			React.useEffect(() => {
				let alive = true;
				setStatus((current) => (current === "ready" ? "refreshing" : "loading"));
				loadUsage(range, nonce > 0).then(
					(payload) => {
						if (!alive) return;
						setData(payload);
						setError(null);
						setStatus("ready");
					},
					(reason) => {
						if (!alive) return;
						setError(reason instanceof Error ? reason.message : String(reason));
						setStatus("error");
					}
				).finally(() => {
					if (alive) setBusy(false);
				});
				return () => { alive = false; };
			}, [range, nonce]);

			const refresh = () => {
				setBusy(true);
				setNonce((value) => value + 1);
			};

			const tools = h("div", { className: "up-tools" },
				h("div", { className: "up-seg" }, [7, 30, 90].map((option) => h("button", {
					key: option,
					type: "button",
					"data-active": String(option === range),
					onClick: () => setRange(option),
				}, t("range" + option)))),
				h("button", { type: "button", className: "up-btn", onClick: refresh, disabled: busy || status === "loading" },
					busy ? t("refreshing") : t("refresh")),
				data === null ? null : h(ExportMenu, { summary: data, t: t })
			);

			const hero = (subtitle) => h("div", { className: "up-hero" },
				h("div", null,
					h("h2", { className: "up-title" }, t("title")),
					h("p", { className: "up-sub" }, subtitle)
				),
				tools
			);

			if (status === "loading" && data === null) {
				return h("div", { className: "up-root" }, hero(t("loading")), h(Loading, {}));
			}

			if (status === "error" && data === null) {
				return h("div", { className: "up-root" },
					hero(t("subtitle")),
					h("div", { className: "up-state" },
						h("div", { className: "up-state-title" }, t("errorTitle")),
						h("div", null, error || t("errorHint")),
						h("div", { style: { marginTop: 12 } }, h("button", { type: "button", className: "up-btn", onClick: refresh }, t("retry")))
					)
				);
			}

			const summary = data;
			const totals = summary.totals;

			if (totals.total === 0) {
				return h("div", { className: "up-root" }, hero(t("subtitle")), h("div", { className: "up-state" }, t("empty")));
			}

			return h("div", { className: "up-root" },
				hero(t("subtitle") + "  " + t("updated") + " " + clock(summary.generatedAt)),

				h("div", { className: "up-kpis" },
					h(Kpi, {
						label: t("totalTokens"),
						value: formatNumber(totals.total, chinese),
						hint: t("peak") + " " + (totals.peak && totals.peak.date ? totals.peak.date : "—") + " · " + formatNumber(totals.peak ? totals.peak.tokens : 0, chinese),
					}),
					h(Kpi, {
						label: t("input"),
						value: formatNumber(totals.input, chinese),
						hint: t("output") + " " + formatNumber(totals.output, chinese),
					}),
					h(Kpi, {
						label: t("cacheRead"),
						value: formatNumber(totals.cacheRead, chinese),
						hint: t("cacheHit") + " " + (totals.cacheHitRate * 100).toFixed(1) + "%",
					}),
					h(Kpi, {
						label: t("sessions"),
						value: formatNumber(summary.sessions.active, chinese),
						hint: t("messages") + " " + formatNumber(totals.messages, chinese),
					}),
					h(Kpi, {
						label: t("activeDays"),
						value: totals.activeDays + " " + t("days"),
						hint: t("avg") + " " + formatNumber(totals.avgPerActiveDay, chinese),
					}),
					h(Kpi, {
						label: t("streak"),
						value: totals.streak + " " + t("days"),
						hint: t("lastActive") + " " + dateOf(summary.window.lastAt),
					})
				),

				h(Heatmap, { days: summary.heatmap.days, chinese: chinese, t: t }),

				h("div", { className: "up-row up-row-2" },
					h(StackedBars, { series: summary.series, models: summary.models, chinese: chinese, t: t }),
					h(Donut, { models: summary.models, totals: totals, chinese: chinese, t: t })
				),

				h("div", { className: "up-row up-row-2b" },
					h(ProviderList, { providers: summary.providers, totals: totals, chinese: chinese, t: t }),
					h(SessionList, { sessions: summary.topSessions, chinese: chinese, t: t })
				)
			);
		}

		/* ─────────────────────────── plugin ─────────────────────────── */

		const NS = "usagePanel";

		const inject = ["slots", "locale"];

		/**
		 * Register the Usage section on the Settings navigation.
		 * @param ctx - the browser plugin context.
		 */
		function apply(ctx) {
			const t = ctx.locale.bind(NS);
			ctx.effect(() => ctx.locale.register(NS, { en, zh }), "usage-panel: dictionaries");
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "usage-panel",
				order: 18,
				label: () => t("nav"),
				locale: NS,
				inject: () => ({}),
			}, UsageSection));
		}

		exports.apply = apply;
		exports.inject = inject;
		exports.UsageSection = UsageSection;
		return module.exports;
	}
});