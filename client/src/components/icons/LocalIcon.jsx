export default function LocalIcon({ className = "toggle-icon", ...props }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			{...props}
		>
			<path
				d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2C20 17.5 12 22 12 22z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<path
				d="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
				stroke="currentColor"
				strokeWidth="1.5"
			/>
			<path
				d="M12 10v0"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}
