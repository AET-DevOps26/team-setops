export default function CloudIcon({ className = "toggle-icon", ...props }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
			{...props}
		>
			<path
				d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 1 0 0-10z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
