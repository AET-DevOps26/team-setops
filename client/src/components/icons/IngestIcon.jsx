export default function IngestIcon({ className = "ghost-icon", ...props }) {
	return (
		<svg
			className={className}
			viewBox="0 0 24 24"
			aria-hidden="true"
			{...props}
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
	);
}
