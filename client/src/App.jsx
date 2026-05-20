import "./App.css";

function App() {
	return (
		<div className="page">
			<div className="scanlines" aria-hidden="true"></div>
			<div className="frame">
				<header className="topbar">
					<div className="brand">
						<div className="brand-mark">&gt;_</div>
						<div>
							<h1 className="brand-title">DevPulse</h1>
							<p className="brand-sub">Intelligent Logbook v1.0.0</p>
						</div>
					</div>
					<div className="actions">
						<button type="button" className="ghost-btn">
							<svg
								className="ghost-icon"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<path
									d="M12 4v9"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								/>
								<path
									d="M8.5 7.5L12 4l3.5 3.5"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								/>
								<rect
									x="5"
									y="13"
									width="14"
									height="7"
									rx="1"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
								/>
							</svg>
							Ingest Logs
						</button>
						<button type="button" className="ghost-btn cloud-btn">
							<svg
								className="ghost-icon cloud-icon"
								viewBox="0 0 24 24"
								aria-hidden="true"
							>
								<rect
									x="6"
									y="11"
									width="12"
									height="9"
									rx="1"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
								/>
								<path
									d="M8 11V8a4 4 0 0 1 8 0v3"
									fill="none"
									stroke="currentColor"
									strokeWidth="1.5"
								/>
							</svg>
							Cloud Expert
						</button>
					</div>
				</header>

				<main className="content">
					<section className="panel">
						<div className="panel-tag">System Logs</div>
						<div className="panel-body empty">
							<svg
								className="empty-icon"
								viewBox="0 0 64 64"
								aria-hidden="true"
							>
								<path
									d="M18 8h20l10 10v30a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8z"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
								/>
								<path
									d="M38 8v12h12"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
								/>
								<path
									d="M20 34h24M20 42h18"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
								/>
							</svg>
							<p className="empty-title">No Logs Ingested</p>
							<button type="button" className="ghost-btn compact">
								Ingest Your First Logs
							</button>
						</div>
					</section>

					<section className="panel">
						<div className="panel-tag">AI Insights</div>
						<div className="panel-body empty">
							<svg
								className="empty-icon"
								viewBox="0 0 64 64"
								aria-hidden="true"
							>
								<path
									d="M22 26a10 10 0 0 1 20 0c0 7-6 8-6 14H28c0-6-6-7-6-14z"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
								/>
								<path
									d="M26 44h12M24 50h16"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
								/>
								<path
									d="M14 28h6M44 28h6M32 12v6"
									fill="none"
									stroke="currentColor"
									strokeWidth="3"
								/>
							</svg>
							<p className="empty-title">
								Select a log entry and click
								<br />
								<span className="accent">Analyze</span> to view insights
							</p>
							<div className="empty-dots" aria-hidden="true">
								<span className="dot"></span>
								<span className="dot"></span>
								<span className="dot"></span>
								<span className="dot"></span>
							</div>
						</div>
					</section>
				</main>

				<footer className="statusbar">
					<div className="status-left">
						<span className="status-dot"></span>
						System Online
						<span className="divider"></span>0 Logs Ingested
					</div>
					<div className="status-right">05/20/2026, 19:04:18</div>
				</footer>
			</div>
		</div>
	);
}

export default App;
