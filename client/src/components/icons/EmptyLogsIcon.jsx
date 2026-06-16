export default function EmptyLogsIcon({ className = "empty-icon", ...props }) {
	return (
		<svg
			className={className}
			viewBox="0 0 64 64"
			aria-hidden="true"
			{...props}
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
	);
}
